type StockSummaryItem = {
  sku: string
  produkNama: string
  stokAwal: number
  totalMasuk: number
  totalKeluar: number
  totalAdj: number
  stokAkhir: number
  expiredTerdekat: string | null
  lastUpdate: string | null
}

type StockSummaryResponse = {
  data: StockSummaryItem[]
}
