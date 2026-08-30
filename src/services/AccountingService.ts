import Big from 'big.js';
import { supabase } from '../lib/supabaseClient';

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
}

class AccountingService {

  async processOperation(op: CryptoOp) {
    const totalBs = new Big(op.qty).times(op.priceBs).plus(op.feeBs);

    // 1. Insert Operation
    const { data: operation, error: opError } = await supabase
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
        date: op.date
      }])
      .select()
      .single();

    if (opError) throw opError;

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

    await supabase.from('ledger_entries').insert(entries);
  }

  private async updateInventory(op: any) {
    // Get last movement to calculate WAC
    const { data: lastMove } = await supabase
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

    await supabase.from('inventory_movements').insert([{
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
