<template>
  <div class="space-y-6">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Daftar Stok Barang</h1>
        <p class="text-gray-500 text-sm italic">
          Status saldo barang saat ini & ringkasan mutasi periode berjalan.
        </p>
      </div>
      <AppButton variant="outline" class="!bg-white shadow-sm border-gray-200">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            stroke-width="2"
          />
        </svg>
        Export Excel
      </AppButton>
    </header>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-4 bg-gray-50/50 border-b">
        <AppTableFilter v-model="tableFilters">
          <template #title>
            <div class="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-full">
              <span class="text-[10px] font-black uppercase tracking-tighter">Rekap Mutasi</span>
            </div>
          </template>
        </AppTableFilter>
      </div>

      <div class="overflow-x-auto">
        <AppTable :headers="headers">
          <DaftarStokRow
            v-for="item in filteredStok"
            :key="item.sku"
            :item="item"
            @detail="openDetail"
            @kartu="goToKartuStok"
          />
          <tr v-if="filteredStok.length === 0">
            <td colspan="9" class="px-6 py-12 text-center text-gray-400 italic">
              Data stok tidak tersedia untuk filter ini.
            </td>
          </tr>
        </AppTable>
      </div>
    </div>

    <DaftarStokDetail
      v-if="showDetail"
      :sku="selectedSku"
      :data="detailStok"
      :total="totalStokSelected"
      @close="showDetail = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/app-button.vue'
import AppTable from '@/components/app-table.vue'
import AppTableFilter from '@/components/app-table-filter.vue'
import DaftarStokRow from './modal/daftar-stok-row.vue'
import DaftarStokDetail from './modal/daftar-stok-detail.vue'

// Import data dummy (Sesuaikan pathnya)
import { produkData, stokLokasiData, stockLedgerData } from '@/data/dummyData'

const router = useRouter()
const showDetail = ref(false)
const selectedSku = ref('')

const headers = [
  { text: 'SKU' },
  { text: 'Produk' },
  { text: 'Stok Awal', align: 'right' },
  { text: 'Masuk', align: 'right' },
  { text: 'Keluar', align: 'right' },
  { text: 'Adj', align: 'right' }, // Kolom penyesuaian
  { text: 'Stok Akhir', align: 'right' },
  { text: 'Update Terakhir', align: 'center' },
  { text: 'Aksi', align: 'center' },
]

const tableFilters = reactive({
  date: '2024-03-01', // Ini tanggal Cut-off / Awal filter
  sku: '',
})

// LOGIKA UTAMA: Menghitung Rekapitulasi Stok
const stokRekap = computed(() => {
  const rekap: any = {}

  // 1. Inisialisasi semua produk
  produkData.forEach((p) => {
    rekap[p.sku] = {
      sku: p.sku,
      produkNama: p.nama,
      stokAwal: 0,
      totalMasuk: 0,
      totalKeluar: 0,
      totalAdj: 0,
      stokAkhir: 0,
      lastUpdate: '-',
    }
  })

  const filterDate = new Date(tableFilters.date)

  // 2. Olah Stock Ledger (Buku Besar Stok)
  stockLedgerData.forEach((ledger) => {
    const item = rekap[ledger.produkSku]
    if (!item) return

    const tglTransaksi = new Date(ledger.tanggal)

    if (tglTransaksi < filterDate) {
      // Masuk ke Saldo Awal jika sebelum tanggal filter
      item.stokAwal += ledger.quantity
    } else {
      // Masuk ke Mutasi Periode Ini jika sesuai/sesudah tanggal filter
      if (ledger.type === 'ADJUSTMENT') {
        item.totalAdj += ledger.quantity
      } else {
        if (ledger.quantity > 0) item.totalMasuk += ledger.quantity
        else item.totalKeluar += Math.abs(ledger.quantity)
      }

      // Update tanggal aktivitas terakhir
      if (item.lastUpdate === '-' || tglTransaksi > new Date(item.lastUpdate)) {
        item.lastUpdate = ledger.tanggal
      }
    }
  })

  // 3. Kalkulasi Akhir
  return Object.values(rekap).map((item: any) => {
    item.stokAkhir = item.stokAwal + item.totalMasuk - item.totalKeluar + item.totalAdj
    return item
  })
})

const filteredStok = computed(() => {
  return stokRekap.value.filter(
    (item: any) =>
      item.sku.toLowerCase().includes(tableFilters.sku.toLowerCase()) ||
      item.produkNama.toLowerCase().includes(tableFilters.sku.toLowerCase()),
  )
})

const detailStok = computed(() => stokLokasiData.filter((i) => i.produkSku === selectedSku.value))
const totalStokSelected = computed(() => detailStok.value.reduce((sum, i) => sum + i.quantity, 0))

const openDetail = (sku: string) => {
  selectedSku.value = sku
  showDetail.value = true
}

const goToKartuStok = (sku: string) => {
  router.push(`/kartu-stok?sku=${sku}`)
}
</script>
