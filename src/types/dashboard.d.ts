type DashboardSummary = {
  cards: {
    totalProduk: number
    totalRak: number
    totalStok: number
    transaksiHariIni: number
  }
  stokPerProduk: DashboardStokProduk[]
  transaksiTerbaru: DashboardTransaksi[]
  stokMenipis: DashboardStokMenipis[]
}

type DashboardStokProduk = {
  sku: string
  nama: string
  stok: number
  sebaran: {
    id: number
    kodeLokasi: string
    qty: number
  }[]
}

type DashboardTransaksi = {
  id: number
  tanggal: string
  tipe: 'IN' | 'OUT' | 'MOVE' | 'ADJUSTMENT'
  sku: string
  namaProduk: string
  qty: number
  keterangan: string
}

type DashboardStokMenipis = {
  id: number
  produkSku: string
  produkNama: string
  kodeLokasi: string
  quantity: number
}
