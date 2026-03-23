// src/data/dummyData.ts

import type { Rak, Lokasi, Produk, StokLokasi, Transaksi, StockLedger } from '@/types'

// Generate Rak
export const rakData: Rak[] = [
  { id: '1', kode: 'A', kolom: 10, tingkat: 5, createdAt: new Date('2024-01-01') },
  { id: '2', kode: 'B', kolom: 10, tingkat: 5, createdAt: new Date('2024-01-01') },
  { id: '3', kode: 'C', kolom: 10, tingkat: 5, createdAt: new Date('2024-01-01') },
  { id: '4', kode: 'D', kolom: 10, tingkat: 5, createdAt: new Date('2024-01-01') },
  { id: '5', kode: 'E', kolom: 10, tingkat: 5, createdAt: new Date('2024-01-01') },
]

// Generate Lokasi untuk setiap rak
export const generateLokasi = (): Lokasi[] => {
  const lokasi: Lokasi[] = []
  rakData.forEach((rak) => {
    for (let kolom = 1; kolom <= rak.kolom; kolom++) {
      for (let tingkat = 1; tingkat <= rak.tingkat; tingkat++) {
        lokasi.push({
          id: `${rak.kode}${kolom}-${tingkat}`,
          rakId: rak.id,
          rakKode: rak.kode,
          kolom,
          tingkat,
          kodeLokasi: `${rak.kode}${kolom}-${tingkat}`,
        })
      }
    }
  })
  return lokasi
}

export const lokasiData = generateLokasi()

// Produk
export const produkData: Produk[] = [
  {
    id: '1',
    sku: 'A1000',
    nama: 'Laptop Gaming',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    sku: 'A1001',
    nama: 'Mouse Wireless',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    sku: 'A1002',
    nama: 'Keyboard Mechanical',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    sku: 'A1003',
    nama: 'Monitor 24 Inch',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    sku: 'A1004',
    nama: 'SSD 512GB',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

// Stok per lokasi
export const stokLokasiData: StokLokasi[] = [
  // A1000
  {
    id: '1',
    produkId: '1',
    produkSku: 'A1000',
    lokasiId: 'A1-1',
    kodeLokasi: 'A1-1',
    quantity: 50,
  },
  {
    id: '2',
    produkId: '1',
    produkSku: 'A1000',
    lokasiId: 'A1-2',
    kodeLokasi: 'A1-2',
    quantity: 50,
  },
  {
    id: '3',
    produkId: '1',
    produkSku: 'A1000',
    lokasiId: 'A1-3',
    kodeLokasi: 'A1-3',
    quantity: 30,
  },
  // A1001
  {
    id: '4',
    produkId: '2',
    produkSku: 'A1001',
    lokasiId: 'B1-1',
    kodeLokasi: 'B1-1',
    quantity: 10,
  },
  // A1002
  {
    id: '5',
    produkId: '3',
    produkSku: 'A1002',
    lokasiId: 'C1-1',
    kodeLokasi: 'C1-1',
    quantity: 25,
  },
  {
    id: '6',
    produkId: '3',
    produkSku: 'A1002',
    lokasiId: 'C1-2',
    kodeLokasi: 'C1-2',
    quantity: 30,
  },
  // A1003
  {
    id: '7',
    produkId: '4',
    produkSku: 'A1003',
    lokasiId: 'D1-1',
    kodeLokasi: 'D1-1',
    quantity: 15,
  },
  // A1004
  {
    id: '8',
    produkId: '5',
    produkSku: 'A1004',
    lokasiId: 'E1-1',
    kodeLokasi: 'E1-1',
    quantity: 100,
  },
  {
    id: '9',
    produkId: '5',
    produkSku: 'A1004',
    lokasiId: 'E1-2',
    kodeLokasi: 'E1-2',
    quantity: 50,
  },
]

// Stock Ledger
export const stockLedgerData: StockLedger[] = [
  // A1000
  {
    id: '1',
    produkId: '1',
    produkSku: 'A1000',
    tanggal: new Date('2024-03-10T09:00:00'),
    tipe: 'MASUK',
    noTransaksi: 'TRX-20240310-001',
    quantity: 100,
    balanceBefore: 0,
    balanceAfter: 100,
    lokasi: 'Loading Dock',
    user: 'Admin',
    keterangan: 'Produk Masuk',
  },
  {
    id: '2',
    produkId: '1',
    produkSku: 'A1000',
    tanggal: new Date('2024-03-15T10:00:00'),
    tipe: 'KELUAR',
    noTransaksi: 'TRX-20240315-001',
    quantity: -75,
    balanceBefore: 100,
    balanceAfter: 25,
    lokasi: 'Loading Dock',
    user: 'Admin',
    keterangan: 'Produk Keluar',
  },
  {
    id: '3',
    produkId: '1',
    produkSku: 'A1000',
    tanggal: new Date('2024-03-20T16:00:00'),
    tipe: 'MASUK',
    noTransaksi: 'TRX-20240320-002',
    quantity: 150,
    balanceBefore: 25,
    balanceAfter: 175,
    lokasi: 'Loading Dock',
    user: 'Admin',
    keterangan: 'Produk Masuk',
  },
  {
    id: '4',
    produkId: '1',
    produkSku: 'A1000',
    tanggal: new Date('2024-03-27T11:00:00'),
    tipe: 'KELUAR',
    noTransaksi: 'TRX-20240327-003',
    quantity: -70,
    balanceBefore: 175,
    balanceAfter: 105,
    lokasi: 'Loading Dock',
    user: 'Admin',
    keterangan: 'Produk Keluar',
  },
  {
    id: '5',
    produkId: '1',
    produkSku: 'A1000',
    tanggal: new Date('2024-03-28T08:00:00'),
    tipe: 'ADJUSTMENT',
    noTransaksi: 'ADJ-20240328-001',
    quantity: -5,
    balanceBefore: 105,
    balanceAfter: 100,
    lokasi: 'A1-1',
    user: 'Admin',
    keterangan: 'Stock Opname',
  },

  // A1001
  {
    id: '6',
    produkId: '2',
    produkSku: 'A1001',
    tanggal: new Date('2024-03-01T09:00:00'),
    tipe: 'MASUK',
    noTransaksi: 'TRX-20240301-001',
    quantity: 10,
    balanceBefore: 0,
    balanceAfter: 10,
    lokasi: 'Loading Dock',
    user: 'Admin',
    keterangan: 'Stok Awal',
  },
]

// Transaksi
export const transaksiData: Transaksi[] = [
  {
    id: '1',
    noTransaksi: 'TRX-20240310-001',
    tipe: 'MASUK',
    tanggal: new Date('2024-03-10T09:00:00'),
    userId: '1',
    userName: 'Admin',
    items: [{ produkId: '1', produkSku: 'A1000', quantity: 100, toLokasi: 'Loading Dock' }],
    status: 'COMPLETED',
  },
  {
    id: '2',
    noTransaksi: 'TRX-20240315-001',
    tipe: 'KELUAR',
    tanggal: new Date('2024-03-15T10:00:00'),
    userId: '1',
    userName: 'Admin',
    items: [{ produkId: '1', produkSku: 'A1000', quantity: 75, fromLokasi: 'A1-1' }],
    status: 'COMPLETED',
  },
  {
    id: '3',
    noTransaksi: 'TRX-20240320-002',
    tipe: 'MASUK',
    tanggal: new Date('2024-03-20T16:00:00'),
    userId: '1',
    userName: 'Admin',
    items: [{ produkId: '1', produkSku: 'A1000', quantity: 150, toLokasi: 'Loading Dock' }],
    status: 'COMPLETED',
  },
  {
    id: '4',
    noTransaksi: 'TRX-20240327-003',
    tipe: 'KELUAR',
    tanggal: new Date('2024-03-27T11:00:00'),
    userId: '1',
    userName: 'Admin',
    items: [{ produkId: '1', produkSku: 'A1000', quantity: 70, fromLokasi: 'A1-2' }],
    status: 'COMPLETED',
  },
  {
    id: '5',
    noTransaksi: 'PIN-20240327-001',
    tipe: 'PINDAH',
    tanggal: new Date('2024-03-27T14:00:00'),
    userId: '1',
    userName: 'Admin',
    items: [
      {
        produkId: '1',
        produkSku: 'A1000',
        quantity: 30,
        fromLokasi: 'Loading Dock',
        toLokasi: 'A1-3',
      },
    ],
    status: 'COMPLETED',
  },
  {
    id: '6',
    noTransaksi: 'ADJ-20240328-001',
    tipe: 'ADJUSTMENT',
    tanggal: new Date('2024-03-28T08:00:00'),
    userId: '1',
    userName: 'Admin',
    items: [{ produkId: '1', produkSku: 'A1000', quantity: -5, fromLokasi: 'A1-1' }],
    status: 'COMPLETED',
  },
]
