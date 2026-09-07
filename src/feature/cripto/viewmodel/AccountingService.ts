import Big from 'big.js';
import { supabase } from '../../../data/db/supabase';

// Intentar importar CapacitorHttp para evitar CORS en móviles
let CapacitorHttp: any = null;
try {
    import('@capacitor/core').then(m => {
        CapacitorHttp = (m as any).CapacitorHttp;
    });
} catch (e) {}

export interface CryptoOp {
  type: 'COMPRA' | 'VENTA';
  asset: string;
  qty: number;
  priceBs: number;
  bcvRate: number;
  platform: string;
  reference: string;
  feeBs: number;
  date: string;
  // Nuevos campos Binance
  binanceOrder?: string;
  orderStatus?: 'COMPLETADO' | 'ESPERANDO_PAGO' | 'CANCELADO';
  qtyNet?: number;
  feeCrypto?: number;
  paymentMethod?: string;
  counterpartyNickname?: string;
  counterpartyFullName?: string;
  exchangeDatetime?: string;
  // Comprobante bancario (opcional)
  bankReceipt?: {
    bank: string;
    opNumber: string;
    holder: string;
    sourceMasked: string;
    destMasked: string;
    concept?: string;
    amountBs: number;
    date: string;
  };
}

class AccountingService {

  async syncWithBinance() {
    const { data: { user } } = await supabase.auth.getUser();
    const apiKey = user?.user_metadata?.binance_key;
    const apiSecret = user?.user_metadata?.binance_secret;

    if (!apiKey || !apiSecret) {
        throw new Error('Configura tu API Key y Secret en el Perfil primero.');
    }

    const timestamp = Date.now();
    const params = `timestamp=${timestamp}`;
    const signature = await this.generateSignature(params, apiSecret);
    const url = `https://api.binance.com/sapi/v1/p2p/userTradeHistory?${params}&signature=${signature}`;

    let result: any;

    // Si estamos en entorno Capacitor (móvil), usamos CapacitorHttp para saltar CORS
    if (CapacitorHttp) {
        const response = await CapacitorHttp.get({
            url,
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        result = response.data;
    } else {
        // En navegador (localhost), esto suele dar error "Failed to fetch" por CORS
        try {
            const response = await fetch(url, {
                headers: { 'X-MBX-APIKEY': apiKey }
            });
            result = await response.json();
        } catch (e) {
            throw new Error('Error de CORS: Binance no permite peticiones desde navegadores. Esta función solo trabajará en la App Móvil o mediante un Proxy/Edge Function.');
        }
    }

    if (result.code && result.code !== 0) throw new Error(result.msg || 'Error de Binance');

    const orders = result.data || [];
    let importedCount = 0;

    for (const order of orders) {
        // Solo órdenes completadas
        if (order.orderStatus !== 'COMPLETED') continue;

        // Verificar si ya existe
        const { data: exists } = await (supabase as any)
            .from('crypto_operations')
            .select('id')
            .eq('order_number_binance', order.orderNumber)
            .maybeSingle();

        if (exists) continue;

        // Registrar operación
        await this.processOperation({
            type: order.tradeType === 'BUY' ? 'COMPRA' : 'VENTA',
            asset: order.asset,
            qty: Number(order.amount),
            priceBs: Number(order.price),
            bcvRate: 36.00, // TODO: Obtener tasa histórica si es posible, por ahora default
            platform: 'Binance P2P',
            reference: order.orderNumber,
            feeBs: 0,
            date: new Date(order.createTime).toISOString(),
            binanceOrder: order.orderNumber,
            orderStatus: 'COMPLETADO',
            qtyNet: Number(order.amount),
            counterpartyNickname: order.counterpartyNickname,
            exchangeDatetime: new Date(order.createTime).toISOString()
        });
        importedCount++;
    }

    return importedCount;
  }

  private async generateSignature(queryString: string, secret: string) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(queryString);

    const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await window.crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        messageData
    );

    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
  }

  async processOperation(op: CryptoOp) {
    const totalBs = new Big(op.qty).times(op.priceBs).plus(op.feeBs);

    // 1. Insert Operation
    const { data: operation, error: opError } = await (supabase as any)
      .from('crypto_operations')
      .insert([{
        type: op.type,
        asset: op.asset,
        amount_crypto: op.qty,
        unit_price_bs: op.priceBs,
        total_amount_bs: totalBs.toNumber(),
        bcv_rate: op.bcvRate,
        platform: op.platform,
        reference: op.reference,
        fee_bs: op.feeBs,
        date: op.date,
        order_number_binance: op.binanceOrder,
        order_status: op.orderStatus || 'COMPLETADO',
        qty_net_crypto: op.qtyNet,
        fee_crypto: op.feeCrypto,
        payment_method: op.paymentMethod,
        counterparty_nickname: op.counterpartyNickname,
        counterparty_full_name: op.counterpartyFullName,
        exchange_datetime: op.exchangeDatetime
      }])
      .select()
      .single();

    if (opError) throw opError;

    // 1.1 Insert Bank Receipt if provided
    if (op.bankReceipt) {
      const { error: receiptError } = await (supabase as any)
        .from('bank_transfer_receipts')
        .insert([{
          operation_id: operation.id,
          bank_origin: op.bankReceipt.bank,
          bank_operation_number: op.bankReceipt.opNumber,
          account_holder_name: op.bankReceipt.holder,
          source_account_masked: op.bankReceipt.sourceMasked,
          dest_account_masked: op.bankReceipt.destMasked,
          concept: op.bankReceipt.concept,
          amount_bs: op.bankReceipt.amountBs,
          operation_date: op.bankReceipt.date
        }]);
      if (receiptError) console.error('Error saving bank receipt:', receiptError);
    }

    // 2. Generate Ledger Entries (Partida Doble)
    await this.generateLedgerEntries(operation);

    // 3. Update Inventory & WAC
    await this.updateInventory(operation);

    return operation;
  }

  private async generateLedgerEntries(op: any) {
    const entries = [];
    const amount = new Big(op.total_amount_bs);

    if (op.type === 'COMPRA') {
      // Debe: Inventario Criptoactivos
      // Haber: Banco/Efectivo Bs
      entries.push({
        operation_id: op.id,
        date: op.date,
        debit_account: 'Inventario Criptoactivos',
        credit_account: 'Banco/Efectivo Bs',
        amount_bs: amount.toNumber(),
        description: `Compra P2P ${op.asset} Ref: ${op.reference}`
      });
    } else {
      // VENTA
      // Debe: Banco/Efectivo Bs
      // Haber: Inventario Criptoactivos
      entries.push({
        operation_id: op.id,
        date: op.date,
        debit_account: 'Banco/Efectivo Bs',
        credit_account: 'Inventario Criptoactivos',
        amount_bs: amount.toNumber(),
        description: `Venta P2P ${op.asset} Ref: ${op.reference}`
      });
    }

    const { error } = await (supabase as any).from('ledger_entries').insert(entries);
    if (error) {
        console.error('Error al insertar en ledger_entries:', error);
        throw error;
    }
  }

  private async updateInventory(op: any) {
    // Get last movement to calculate WAC
    const { data: lastMove } = await (supabase as any)
      .from('inventory_movements')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    const prevQty = new Big(lastMove?.balance_qty || 0);
    const prevValue = new Big(lastMove?.balance_value_bs || 0);
    const prevWac = lastMove ? new Big(lastMove.avg_cost) : new Big(0);

    let newQty, newValue, newWac, profit = 0;

    if (op.type === 'COMPRA') {
      newQty = prevQty.plus(op.amount_crypto);
      newValue = prevValue.plus(op.total_amount_bs);
      newWac = newValue.div(newQty);
    } else {
      // VENTA
      newQty = prevQty.minus(op.amount_crypto);
      const costOfGoodsSold = prevWac.times(op.amount_crypto);
      newValue = prevValue.minus(costOfGoodsSold);
      newWac = prevQty.gt(0) ? prevWac : new Big(0);

      // Realized profit: (Selling Price - WAC) * Qty
      profit = new Big(op.total_amount_bs).minus(costOfGoodsSold).toNumber();
    }

    await (supabase as any).from('inventory_movements').insert([{
      operation_id: op.id,
      in_qty: op.type === 'COMPRA' ? op.amount_crypto : null,
      out_qty: op.type === 'VENTA' ? op.amount_crypto : null,
      avg_cost: newWac.toNumber(),
      balance_qty: newQty.toNumber(),
      balance_value_bs: newValue.toNumber(),
      realized_profit_bs: op.type === 'VENTA' ? profit : null
    }]);
  }
}

export const accounting = new AccountingService();
