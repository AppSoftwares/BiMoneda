import Big from 'big.js';
import { supabase } from '../../../data/db/supabase';
import { ACCOUNTS, LEDGER_SOURCE } from './AccountingAccounts';

// Helper para obtener CapacitorHttp dinámicamente solo cuando se necesite
const getCapacitorHttp = async () => {
    try {
        const { CapacitorHttp } = await import('@capacitor/core');
        return CapacitorHttp;
    } catch (e) {
        return null;
    }
};

const isNative = () => {
    try {
        // @ts-ignore
        return window.Capacitor?.isNativePlatform();
    } catch (e) {
        return false;
    }
};

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

  async syncWithBinance(month: number, year: number) {
    const { data: { user } } = await supabase.auth.getUser();
    const apiKey = user?.user_metadata?.binance_key;
    const apiSecret = user?.user_metadata?.binance_secret;

    if (!apiKey || !apiSecret) {
        throw new Error('Configura tu API Key y Secret en el Perfil primero.');
    }

    // NOTA: la tasa BCV histórica no la expone la API de Binance. Se usa la
    // tasa BCV vigente al momento de la sincronización como aproximación.
    const { bcv } = await import('../../../data/repository/BcvService');
    let rate = 36.00;
    try { rate = await bcv.getLatestRate(); } catch (e) { /* usa default */ }

    // Rango del mes solicitado
    const startTime = new Date(year, month - 1, 1, 0, 0, 0).getTime();
    const endTime = new Date(year, month, 0, 23, 59, 59).getTime();

    let importedCount = 0;

    // Binance limita las consultas a rangos de 30 días. Para meses de 31
    // días, partimos la consulta en dos ventanas.
    const windowSize = 30 * 24 * 60 * 60 * 1000;
    let currentStart = startTime;

    while (currentStart < endTime) {
        const currentEnd = Math.min(currentStart + windowSize, endTime);

        for (const tradeType of ['BUY', 'SELL'] as const) {
            let page = 1;
            let hasMore = true;

            while (hasMore && page <= 10) { // Límite de seguridad de 10 páginas
                const orders = await this.fetchBinanceC2COrders(apiKey, apiSecret, tradeType, currentStart, currentEnd, page);

                if (orders.length === 0) {
                    hasMore = false;
                    continue;
                }

                for (const order of orders) {
                    // Solo órdenes completadas
                    if (order.orderStatus !== 'COMPLETED') continue;

                    // Verificar si ya existe por número de orden Binance
                    const { data: exists } = await (supabase as any)
                        .from('crypto_operations')
                        .select('id')
                        .eq('order_number_binance', order.orderNumber)
                        .maybeSingle();

                    if (exists) continue;

                    await this.processOperation({
                        type: order.tradeType === 'BUY' ? 'COMPRA' : 'VENTA',
                        asset: order.asset,
                        qty: Number(order.amount),
                        priceBs: Number(order.unitPrice),
                        bcvRate: rate,
                        platform: 'Binance P2P',
                        reference: order.orderNumber,
                        feeBs: Number(order.commission) || 0,
                        date: new Date(order.createTime).toISOString(),
                        binanceOrder: order.orderNumber,
                        orderStatus: 'COMPLETADO',
                        qtyNet: Number(order.amount),
                        counterpartyNickname: order.counterPartNickName,
                        exchangeDatetime: new Date(order.createTime).toISOString()
                    });
                    importedCount++;
                }

                if (orders.length < 100) hasMore = false;
                else page++;
            }
        }
        currentStart = currentEnd + 1;
    }

    return importedCount;
  }

  private async fetchBinanceC2COrders(
    apiKey: string,
    apiSecret: string,
    tradeType: 'BUY' | 'SELL',
    startTimestamp: number,
    endTimestamp: number,
    page: number = 1
  ) {
    const timestamp = Date.now();
    const params = `tradeType=${tradeType}&startTimestamp=${startTimestamp}&endTimestamp=${endTimestamp}&page=${page}&rows=100&timestamp=${timestamp}`;
    const signature = await this.generateSignature(params, apiSecret);
    const url = `https://api.binance.com/sapi/v1/c2c/orderMatch/listUserOrderHistory?${params}&signature=${signature}`;

    let result: any;

    if (isNative()) {
        const capHttp = await getCapacitorHttp();
        if (capHttp) {
            const response = await capHttp.get({
                url,
                headers: { 'X-MBX-APIKEY': apiKey }
            });
            result = response.data;
        } else {
            throw new Error('Plugin de Capacitor no disponible.');
        }
    } else {
        try {
            const response = await fetch(url, {
                headers: { 'X-MBX-APIKEY': apiKey }
            });
            result = await response.json();
        } catch (e) {
            throw new Error('Error de CORS: Binance no permite peticiones desde navegadores.');
        }
    }

    if (!result || !Array.isArray(result.data)) {
        throw new Error(result?.msg || result?.message || 'Respuesta inesperada de Binance.');
    }

    return result.data;
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
    const status = op.orderStatus || 'COMPLETADO';

    // 1. Insert Operation (siempre se guarda, para no perder trazabilidad
    //    de órdenes en espera o canceladas)
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
        order_status: status,
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

    // 2 y 3. SOLO se contabiliza (libros + inventario) si la orden está
    // COMPLETADA. Una orden CANCELADO o ESPERANDO_PAGO no debe mover
    // inventario ni generar asientos, o el saldo de inventario/caja
    // quedaría descuadrado con la realidad.
    if (status === 'COMPLETADO') {
      // 2. Update Inventory & WAC primero, porque el asiento de VENTA
      //    necesita el costo promedio (WAC) y la ganancia/pérdida
      //    realizada calculados aquí.
      const inventoryResult = await this.updateInventory(operation);

      // 3. Generate Ledger Entries (Partida Doble), ya con costo y
      //    ganancia/pérdida reales, no con el precio de venta completo.
      await this.generateLedgerEntries(operation, inventoryResult);
    }

    return operation;
  }

  private async generateLedgerEntries(
    op: any,
    inventoryResult: { costOfGoodsSold: number; profit: number }
  ) {
    const entries: any[] = [];
    const totalBs = new Big(op.total_amount_bs);

    if (op.type === 'COMPRA') {
      // Debe: Inventario Criptoactivos (a costo de adquisición)
      // Haber: Banco/Efectivo Bs
      entries.push({
        operation_id: op.id,
        source: LEDGER_SOURCE.CRYPTO,
        date: op.date,
        debit_account: ACCOUNTS.INVENTARIO_CRIPTOACTIVOS,
        credit_account: ACCOUNTS.BANCO_EFECTIVO_BS,
        amount_bs: totalBs.toNumber(),
        description: `Compra P2P ${op.asset} Ref: ${op.reference}`
      });
    } else {
      // VENTA — el inventario sale a su COSTO PROMEDIO (WAC), no al precio
      // de venta. La diferencia entre lo cobrado y el costo es la ganancia
      // (o pérdida) realizada del ciclo de arbitraje, y debe verse como su
      // propia cuenta de resultado para que el contador pueda calcular la
      // renta neta del período.
      const cogs = new Big(inventoryResult.costOfGoodsSold);
      const profit = new Big(inventoryResult.profit);

      // Debe: Banco/Efectivo Bs (todo lo cobrado en la venta)
      // Haber: Inventario Criptoactivos (solo el costo de lo vendido)
      // Haber/Debe: Ganancia o Pérdida en Arbitraje P2P (la diferencia)
      entries.push({
        operation_id: op.id,
        source: LEDGER_SOURCE.CRYPTO,
        date: op.date,
        debit_account: ACCOUNTS.BANCO_EFECTIVO_BS,
        credit_account: ACCOUNTS.INVENTARIO_CRIPTOACTIVOS,
        amount_bs: cogs.toNumber(),
        description: `Venta P2P ${op.asset} Ref: ${op.reference} (costo)`
      });

      if (profit.gt(0)) {
        entries.push({
          operation_id: op.id,
          source: LEDGER_SOURCE.CRYPTO,
          date: op.date,
          debit_account: ACCOUNTS.BANCO_EFECTIVO_BS,
          credit_account: ACCOUNTS.GANANCIA_ARBITRAJE_P2P,
          amount_bs: profit.toNumber(),
          description: `Ganancia realizada Venta P2P ${op.asset} Ref: ${op.reference}`
        });
      } else if (profit.lt(0)) {
        entries.push({
          operation_id: op.id,
          source: LEDGER_SOURCE.CRYPTO,
          date: op.date,
          debit_account: ACCOUNTS.PERDIDA_ARBITRAJE_P2P,
          credit_account: ACCOUNTS.BANCO_EFECTIVO_BS,
          amount_bs: profit.abs().toNumber(),
          description: `Pérdida realizada Venta P2P ${op.asset} Ref: ${op.reference}`
        });
      }
      // Si profit === 0 no hace falta un tercer asiento: Debe Banco = Haber Inventario.
    }

    const { error } = await (supabase as any).from('ledger_entries').insert(entries);
    if (error) {
        console.error('Error al insertar en ledger_entries:', error);
        throw error;
    }
  }

  /**
   * Actualiza inventory_movements con el método de Costo Promedio Ponderado (WAC).
   * Devuelve el costo de lo vendido y la ganancia/pérdida realizada para que
   * generateLedgerEntries pueda usar los mismos números en el Diario.
   */
  private async updateInventory(op: any): Promise<{ costOfGoodsSold: number; profit: number }> {
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

    let newQty: Big, newValue: Big, newWac: Big;
    let costOfGoodsSold = new Big(0);
    let profit = new Big(0);

    if (op.type === 'COMPRA') {
      newQty = prevQty.plus(op.amount_crypto);
      newValue = prevValue.plus(op.total_amount_bs);
      newWac = newQty.gt(0) ? newValue.div(newQty) : new Big(0);
    } else {
      // VENTA
      newQty = prevQty.minus(op.amount_crypto);
      costOfGoodsSold = prevWac.times(op.amount_crypto);
      newValue = prevValue.minus(costOfGoodsSold);
      newWac = prevQty.gt(0) ? prevWac : new Big(0);

      // Ganancia/pérdida realizada: (Precio de Venta - Costo Promedio) * Cantidad
      profit = new Big(op.total_amount_bs).minus(costOfGoodsSold);

      if (newQty.lt(0)) {
        console.warn(
          `Inventario negativo tras venta de ${op.amount_crypto} ${op.asset}. ` +
          `Verifica que todas las compras previas estén registradas.`
        );
      }
    }

    await (supabase as any).from('inventory_movements').insert([{
      operation_id: op.id,
      in_qty: op.type === 'COMPRA' ? op.amount_crypto : null,
      out_qty: op.type === 'VENTA' ? op.amount_crypto : null,
      avg_cost: newWac.toNumber(),
      balance_qty: newQty.toNumber(),
      balance_value_bs: newValue.toNumber(),
      realized_profit_bs: op.type === 'VENTA' ? profit.toNumber() : null
    }]);

    return {
      costOfGoodsSold: costOfGoodsSold.toNumber(),
      profit: profit.toNumber()
    };
  }
}

export const accounting = new AccountingService();
