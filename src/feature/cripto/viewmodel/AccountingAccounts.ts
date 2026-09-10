/**
 * Catálogo de cuentas contables usado por toda la app.
 * Centralizar los nombres evita typos que rompan reportes (ej. "Banco/Efectivo Bs"
 * vs "Banco / Efectivo BS" contarían como cuentas distintas en el Libro Mayor).
 */
export const ACCOUNTS = {
  // Activos
  BANCO_EFECTIVO_BS: 'Banco/Efectivo Bs',
  INVENTARIO_CRIPTOACTIVOS: 'Inventario Criptoactivos',
  CUENTAS_POR_COBRAR: 'Cuentas por Cobrar',

  // Pasivos
  IVA_POR_PAGAR: 'IVA por Pagar',
  IGTF_POR_PAGAR: 'IGTF por Pagar',

  // Ingresos
  INGRESOS_POR_SERVICIOS: 'Ingresos por Servicios',
  GANANCIA_ARBITRAJE_P2P: 'Ganancia en Arbitraje P2P',

  // Gastos / Pérdidas
  PERDIDA_ARBITRAJE_P2P: 'Pérdida en Arbitraje P2P',
} as const;

export type AccountName = typeof ACCOUNTS[keyof typeof ACCOUNTS];

export const LEDGER_SOURCE = {
  CRYPTO: 'CRYPTO',
  INVOICE: 'INVOICE',
  MANUAL: 'MANUAL',
} as const;
