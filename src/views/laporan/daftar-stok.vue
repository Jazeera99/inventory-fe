<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/app-button.vue'
import AppTable from '@/components/app-table.vue'
import AppInputSearch from '@/components/app-input-search.vue'
import { useProductList, useProductToggle } from '@/models/product'
import DaftarStokRow from './modal/daftar-stok-row.vue'
import DaftarStokDetail from './modal/daftar-stok-detail.vue'
import { useStockLedger } from '@/models/stock-ledger'
import { useProductLocationList } from '@/models/product-location'

const router = useRouter()
const showDetail = ref(false)
const selectedSku = ref('')
const selectedLocations = ref<any[]>([])
const selectedTotalStok = ref(0)

const { products, loading, getData } = useProductList()
const { summaryData, loading: summaryLoading, fetchSummary } = useStockLedger()
const { productLocations, getData: fetchProductLocations } = useProductLocationList()

const headers = [
  { text: 'SKU' },
  { text: 'Produk' },
  // { text: 'Stok Awal', align: 'right' },
  { text: 'Masuk', align: 'right' },
  { text: 'Keluar', align: 'right' },
  { text: 'Adj', align: 'right' },
  { text: 'Stok Akhir', align: 'right' },
  { text: 'Expired Terdekat', align: 'center' },
  { text: 'Update Terakhir', align: 'center' },
  { text: 'Aksi', align: 'center' },
]

const tableFilters = reactive({
  start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0],
  end_date: new Date().toISOString().split('T')[0],
  sku: '',
})

const loadStockSummary = () => {
  fetchSummary({ start_date: '', end_date: '' })
}

onMounted(() => {
  loadStockSummary()
  fetchProductLocations() // Load data posisi rak untuk kebutuhan modal detail
})

// Jika filter tanggal diubah user, otomatis hitung ulang mutasi ke backend
watch([() => tableFilters.start_date, () => tableFilters.end_date], () => {
  loadStockSummary()
})

const filteredStok = computed(() => {
  if (!summaryData.value) return []
  if (!tableFilters.sku) return summaryData.value

  const q = tableFilters.sku.toLowerCase()
  return summaryData.value.filter(
    (item: StockSummaryItem) =>
      item.sku.toLowerCase().includes(q) || item.produkNama.toLowerCase().includes(q),
  )
})

// Ambil data lokasi rak real-time berdasarkan SKU yang di-klik
const detailStok = computed(() => {
  return productLocations.value
    .filter((i) => i.product_sku === selectedSku.value)
    .map((loc) => ({
      id: loc.id,
      kodeLokasi: loc.rack?.rack_name || '-',
      quantity: loc.qty,
      expiredAt: loc.expired_at,
    }))
})

const totalStokSelected = computed(() => detailStok.value.reduce((sum, i) => sum + i.quantity, 0))

const openDetail = (item: any) => {
  selectedSku.value = item.sku
  selectedLocations.value = item.locations || [] // Langsung ambil data sebaran rak dari backend
  selectedTotalStok.value = item.stokAkhir
  showDetail.value = true
}

const goToKartuStok = (sku: string) => {
  router.push(`/kartu-stok?sku=${sku}`)
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Daftar Stok Barang</h1>
        <p class="text-gray-500 text-sm italic">
          Status saldo barang saat ini & ringkasan mutasi periode berjalan.
        </p>
      </div>
      <!-- <AppButton variant="outline" class="!bg-white shadow-sm border-gray-200">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            stroke-width="2"
          />
        </svg>
        Export Excel
      </AppButton> -->
    </header>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-4 bg-gray-50/50 border-b flex justify-end">
        <AppInputSearch v-model="tableFilters.sku" placeholder="Cari SKU atau Nama" />
      </div>

      <div class="overflow-x-auto">
        <AppTable :headers="headers">
          <DaftarStokRow
            v-for="item in filteredStok"
            :key="item.sku"
            :item="item"
            @detail="openDetail(item)"
            @kartu="goToKartuStok"
          />
          <tr v-if="filteredStok.length === 0">
            <td colspan="10" class="px-6 py-12 text-center text-gray-400 italic">
              Data stok tidak tersedia untuk filter ini.
            </td>
          </tr>
        </AppTable>
      </div>
    </div>

    <DaftarStokDetail
      v-if="showDetail"
      :sku="selectedSku"
      :data="selectedLocations"
      :total="selectedTotalStok"
      @close="showDetail = false"
    />
  </div>
</template>
