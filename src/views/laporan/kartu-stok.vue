<template>
  <div class="space-y-6">
    <header class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-black text-gray-900 tracking-tight leading-none">KARTU STOK</h1>
        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">
          Movement Ledger Report
        </p>
      </div>
    </header>

    <AppTableFilter v-model="filter" @open-date-filter="showDateModal = true">
      <template #title>
        <h2 class="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">
          Parameter Filter
        </h2>
      </template>
    </AppTableFilter>

    <transition name="fade">
      <KartuStokStat v-if="filter.sku" :stats="summaryStats" class="mb-6" />
    </transition>

    <div
      class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]"
    >
      <div class="p-5 border-b flex justify-between items-center bg-gray-50/30">
        <h3 class="font-bold text-gray-800 flex items-center gap-3">
          <span class="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
          {{ filter.sku ? 'DETAIL MUTASI:' : 'SEMUA TRANSAKSI' }}
          <span
            v-if="filter.sku"
            @click="openLocationDetail"
            class="text-indigo-600 font-mono cursor-pointer hover:underline underline-offset-4 decoration-2"
          >
            {{ filter.sku }} ⓘ
          </span>
        </h3>
      </div>

      <div class="overflow-x-auto">
        <AppTable :headers="headers">
          <tr
            v-for="item in filteredLedger"
            :key="item.id"
            class="hover:bg-indigo-50/30 transition-colors border-b last:border-0 group"
          >
            <td class="px-6 py-4 text-[11px] font-bold text-gray-400 italic font-mono">
              {{ formatDate(item.tanggal) }}
            </td>
            <td class="px-6 py-4 text-xs font-black text-gray-900">{{ item.noTransaksi }}</td>
            <td class="px-6 py-4">
              <span
                :class="[
                  'px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter border',
                  tipeClass(item.tipe),
                ]"
              >
                {{ item.tipe }}
              </span>
            </td>
            <td class="px-6 py-4 font-bold text-gray-700 text-xs">{{ item.lokasi }}</td>
            <td class="px-6 py-4 text-right font-black text-blue-600">
              {{ item.quantity > 0 ? '+' + item.quantity : '-' }}
            </td>
            <td class="px-6 py-4 text-right font-black text-red-500">
              {{ item.quantity < 0 ? Math.abs(item.quantity) : '-' }}
            </td>
            <td class="px-6 py-4 text-right">
              <span class="bg-gray-900 text-white px-2 py-1 rounded font-mono text-xs font-bold">{{
                item.balanceAfter
              }}</span>
            </td>
            <td class="px-6 py-4 text-[11px] text-gray-500 italic truncate max-w-[150px]">
              {{ item.keterangan || '-' }}
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <div
                  class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black"
                >
                  {{ item.user.substring(0, 2).toUpperCase() }}
                </div>
                <span class="text-xs font-bold text-gray-600">{{ item.user }}</span>
              </div>
            </td>
          </tr>
        </AppTable>
      </div>
    </div>

    <div
      v-if="showDateModal"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        class="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200"
      >
        <h3 class="text-xl font-black text-gray-900 mb-6 uppercase tracking-tighter">
          Setel Periode
        </h3>
        <div class="space-y-4">
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-black text-gray-400 uppercase ml-1">Mulai Dari</label>
            <input
              type="datetime-local"
              v-model="filter.start"
              class="p-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-black text-gray-400 uppercase ml-1"
              >Hingga Selesai</label
            >
            <input
              type="datetime-local"
              v-model="filter.end"
              class="p-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            @click="showDateModal = false"
            class="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest mt-4 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>

    <DaftarStokDetail
      v-if="showLocationModal"
      :sku="filter.sku"
      :data="locationData"
      :total="totalStok"
      @close="showLocationModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import AppTableFilter from '@/components/app-table-filter.vue'
import AppTable from '@/components/app-table.vue'
import KartuStokStat from './modal/kartu-stok-stat.vue'
import DaftarStokDetail from './modal/daftar-stok-detail.vue'
import { stockLedgerData } from '@/data/dummyData'

const showDateModal = ref(false)
const showLocationModal = ref(false)

const filter = reactive({
  start: '2024-03-01T00:00',
  end: '2024-03-31T23:59',
  sku: '',
})

const headers = [
  { text: 'Waktu' },
  { text: 'No. Trans' },
  { text: 'Jenis' },
  { text: 'Lokasi' },
  { text: 'Masuk' },
  { text: 'Keluar' },
  { text: 'T. Akhir' },
  { text: 'Keterangan' },
  { text: 'User' },
]

// Logika Buka Detail Lokasi
const locationData = ref([
  { id: 1, kodeLokasi: 'GDG-01-A', quantity: 50 },
  { id: 2, kodeLokasi: 'GDG-01-B', quantity: 25 },
])
const totalStok = computed(() => locationData.value.reduce((s, i) => s + i.quantity, 0))

const openLocationDetail = () => {
  // Disini Bos bisa panggil API berdasarkan SKU
  showLocationModal.value = true
}

const filteredLedger = computed(() => {
  const startTime = new Date(filter.start).getTime()
  const endTime = new Date(filter.end).getTime()

  return stockLedgerData
    .filter((item) => {
      const itemTime = new Date(item.tanggal).getTime()
      const matchSku = filter.sku ? item.produkSku.toLowerCase() === filter.sku.toLowerCase() : true
      return matchSku && itemTime >= startTime && itemTime <= endTime
    })
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
})

const summaryStats = computed(() => {
  if (filteredLedger.value.length === 0) return []
  const sorted = [...filteredLedger.value].sort(
    (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
  )
  const awal = sorted[0]?.balanceBefore || 0
  const masuk = filteredLedger.value.reduce((s, i) => s + (i.quantity > 0 ? i.quantity : 0), 0)
  const keluar = filteredLedger.value.reduce(
    (s, i) => s + (i.quantity < 0 ? Math.abs(i.quantity) : 0),
    0,
  )
  const akhir = filteredLedger.value[0]?.balanceAfter || awal
  return [
    { label: 'Awal', value: awal, color: 'text-gray-400' },
    { label: 'Masuk', value: '+' + masuk, color: 'text-blue-600' },
    { label: 'Keluar', value: '-' + keluar, color: 'text-red-600' },
    { label: 'Sisa', value: akhir, color: 'text-indigo-600 font-black' },
  ]
})

const tipeClass = (t: string) => {
  if (t === 'MASUK') return 'bg-blue-50 text-blue-600 border-blue-100'
  if (t === 'KELUAR') return 'bg-red-50 text-red-600 border-red-100'
  return 'bg-orange-50 text-orange-600 border-orange-100'
}

const formatDate = (d: any) =>
  new Date(d).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
</script>
