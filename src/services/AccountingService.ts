import Big from 'big.js';
import { supabase } from '../lib/db';

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

    await (supabase as any).from('ledger_entries').insert(entries);
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
