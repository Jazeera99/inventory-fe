export interface Rak {
  id: string
  kode: string
  kolom: number
  tingkat: number
  createdAt: Date
}

export interface Lokasi {
  id: string
  rakId: string
  rakKode: string
  kolom: number
  tingkat: number
  kodeLokasi: string // Contoh: A1-1
}

export interface Produk {
  id: string
  sku: string
  nama: string
  createdAt: Date
  updatedAt: Date
}

export interface StokLokasi {
  id: string
  produkId: string
  produkSku: string
  lokasiId: string
  kodeLokasi: string
  quantity: number
}

export interface TransaksiItem {
  produkId: string
  produkSku: string
  quantity: number
  fromLokasi?: string // untuk pindah/keluar
  toLokasi?: string // untuk masuk/pindah
}

export interface Transaksi {
  id: string
  noTransaksi: string
  tipe: 'MASUK' | 'KELUAR' | 'PINDAH' | 'ADJUSTMENT'
  tanggal: Date
  userId: string
  userName: string
  keterangan?: string
  items: TransaksiItem[]
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED'
}

export interface StockLedger {
  id: string
  produkId: string
  produkSku: string
  tanggal: Date
  tipe: 'MASUK' | 'KELUAR' | 'PINDAH' | 'ADJUSTMENT'
  noTransaksi: string
  quantity: number // positif untuk masuk, negatif untuk keluar
  balanceBefore: number
  balanceAfter: number
  lokasi?: string
  keterangan?: string
  user: string
}

export interface StokAwalPeriode {
  sku: string
  produkNama: string
  stokAwal: number
}

export interface StokRekap {
  sku: string
  produkNama: string
  stokAwal: number
  totalMasuk: number
  totalKeluar: number
  stokAkhir: number
}
