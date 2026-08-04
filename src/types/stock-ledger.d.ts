type StockLedgerItem = {
  date: string
  transaction_no: string
  type: 'IN' | 'OUT' | 'MOVE' | 'ADJUSTMENT'
  lokasi: string
  expired_at: string | null
  masuk: number
  keluar: number
  saldo: number
  keterangan: string | null
  user: string
}

// Tipe untuk metadata (stok awal, akhir, dll)
type StockLedgerMeta = {
  sku: string
  initial_balance: number
  final_balance: number
  period: {
    start: string
    end: string
  }
}

// Tipe respons lengkap dari API
type StockLedgerResponse = {
  data: StockLedgerItem[]
  meta: StockLedgerMeta
}
