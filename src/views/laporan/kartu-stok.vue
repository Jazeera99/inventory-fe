<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import KartuStokStat from './modal/kartu-stok-stat.vue'
import KartuStokRow from './modal/kartu-stok-row.vue'
import AppButton from '@/components/app-button.vue'
import { useProductList } from '@/models/product'
import { useStockLedger } from '@/models/stock-ledger'
import fmtDate from '@/functions/fmt/date'

const route = useRoute()
const router = useRouter()
const { products, getData: fetchProducts } = useProductList()
const {
  ledgerData,
  metaData,
  expiredOptions,
  loading: ledgerLoading,
  fetchLedger,
  fetchExpiredOptions,
} = useStockLedger()
const showDateModal = ref(false)
const searchSku = ref('')
const showDropdown = ref(false)
const selectedProduct = ref<any>(null)
const initialExpired = route.query.expired_at as string
const cleanInitialExpired = initialExpired ? initialExpired.split('T')[0] : ''

const filter = ref({
  sku: (route.query.sku as string) || '',
  expired_at: cleanInitialExpired,
  start: (route.query.start as string) || '',
  end: (route.query.end as string) || '',
})

const headers = [
  { text: 'Waktu' },
  { text: 'No. Trans' },
  { text: 'Jenis' },
  { text: 'Lokasi & Expired' },
  { text: 'Masuk' },
  { text: 'Keluar' },
  { text: 'Saldo' },
  { text: 'User' },
]

onMounted(async () => {
  await fetchProducts()

  if (filter.value.sku && products.value.length > 0) {
    const foundProduct = products.value.find(
      (p: any) => p.sku.toLowerCase() === filter.value.sku.toLowerCase(),
    )
    if (foundProduct) {
      selectedProduct.value = foundProduct
      searchSku.value = foundProduct.sku
      await fetchExpiredOptions(foundProduct.sku)
      triggerFetch()
    }
  }
})

// Logika Search
const searchResults = computed(() => {
  if (!searchSku.value.trim()) return []
  const needle = searchSku.value.toLowerCase().trim()
  return products.value
    .filter(
      (p: any) =>
        p.sku.toLowerCase().includes(needle) || p.product_name.toLowerCase().includes(needle),
    )
    .slice(0, 5)
})

// ✅ Dihandle saat user mulai mengetik di input box
const handleInput = () => {
  showDropdown.value = true
  // Reset produk aktif sementara user mengetik produk baru
  if (selectedProduct.value) {
    selectedProduct.value = null
    filter.value.sku = ''
    filter.value.expired_at = ''
  }
}

const selectProduct = (p: any) => {
  selectedProduct.value = p
  filter.value.sku = p.sku
  filter.value.expired_at = ''
  searchSku.value = p.sku
  showDropdown.value = false
  router.push({ query: { ...route.query, sku: p.sku, expired_at: undefined } })
  fetchExpiredOptions(p.sku)
  triggerFetch()
}

const resetSearch = () => {
  selectedProduct.value = null
  filter.value.sku = ''
  filter.value.expired_at = ''
  searchSku.value = ''
  ledgerData.value = []
  showDropdown.value = false

  router.push({ path: '/kartu-stok', query: {} })
}

const triggerFetch = () => {
  if (filter.value.sku) {
    let cleanExpiredAt = null

    // Jika expired_at dipilih, konversi format ISO menjadi format standard murni 'yyyy-MM-dd'
    if (filter.value.expired_at) {
      cleanExpiredAt = fmtDate.date(new Date(filter.value.expired_at), 'yyyy-MM-dd')
    }

    fetchLedger({
      sku: filter.value.sku,
      expired_at: cleanExpiredAt,
      start_date: filter.value.start,
      end_date: filter.value.end,
    })
  }
}

watch(
  [() => filter.value.expired_at, () => filter.value.start, () => filter.value.end],
  ([newExpired, newStart, newEnd]) => {
    const cleanUrlExpired = newExpired ? newExpired.split('T')[0] : undefined
    router.push({
      query: {
        ...route.query,
        expired_at: cleanUrlExpired,
        start: newStart || undefined,
        end: newEnd || undefined,
      },
    })
    triggerFetch()
  },
)

const summaryStats = computed(() => {
  if (!metaData.value)
    return [
      // { label: 'Stok Awal', value: '0', color: 'text-gray-400' },
      { label: 'Total Masuk', value: '0', color: 'text-blue-600' },
      { label: 'Total Keluar', value: '0', color: 'text-red-600' },
      { label: 'Sisa Akhir', value: '0', color: 'text-indigo-600' },
    ]

  // Hitung total masuk/keluar dari array data
  const totalIn = ledgerData.value.reduce((acc, curr) => {
    const type = curr.type ? curr.type.toUpperCase() : ''
    return type !== 'MOVE' ? acc + curr.masuk : acc
  }, 0)

  const totalOut = ledgerData.value.reduce((acc, curr) => {
    const type = curr.type ? curr.type.toUpperCase() : ''
    return type !== 'MOVE' ? acc + curr.keluar : acc
  }, 0)

  const initialBalance = Number(metaData.value.initial_balance) || 0
  const finalBalance = Number(metaData.value.final_balance) || 0

  const displayOut = totalOut > 0 ? `-${totalOut}` : '0'

  return [
    // { label: 'Stok Awal', value: initialBalance, color: 'text-gray-400' },
    { label: 'Total Masuk', value: `+${totalIn}`, color: 'text-blue-600' },
    { label: 'Total Keluar', value: displayOut, color: 'text-red-600' },
    {
      label: 'Sisa Akhir',
      value: finalBalance,
      color: 'text-indigo-600 font-black',
    },
  ]
})
</script>

<template>
  <div class="p-6 space-y-6 bg-gray-50 min-h-screen">
    <header class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">
          Kartu Stok
        </h1>
        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">
          Movement Ledger Report
        </p>
      </div>
      <!-- <AppButton
        variant="secondary"
        @click="showDateModal = true"
        class="!rounded-2xl shadow-sm border-gray-200 text-xs font-bold"
      >
        📅 {{ filter.start || 'Semua' }} s/d {{ filter.end || 'Hari Ini' }}
      </AppButton> -->
    </header>

    <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 relative">
      <div class="grid md:grid-cols-2 gap-6">
        <div class="relative">
          <label
            class="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest"
            >Pilih Produk</label
          >
          <div class="relative flex items-center">
            <input
              v-model="searchSku"
              @input="handleInput"
              @focus="showDropdown = true"
              type="text"
              placeholder="Ketik SKU / Nama..."
              class="w-full pl-5 pr-10 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
            />
            <!-- Tombol Hapus/Clear (X) jika inputan terisi -->
            <button
              v-if="searchSku"
              type="button"
              @click="resetSearch"
              class="absolute right-3.5 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 text-xs font-bold transition"
            >
              ✕
            </button>
          </div>
          <div
            v-if="showDropdown && searchResults.length > 0 && !selectedProduct"
            class="absolute z-50 w-full mt-2 bg-white border shadow-2xl rounded-2xl overflow-hidden"
          >
            <div
              v-for="p in searchResults"
              :key="p.sku"
              @click="selectProduct(p)"
              class="p-4 hover:bg-indigo-50 cursor-pointer border-b last:border-0 transition-colors"
            >
              <p class="font-black text-indigo-600 text-xs">{{ p.sku }}</p>
              <p class="text-[13px] font-bold text-gray-700">{{ p.product_name }}</p>
            </div>
          </div>
          <div
            v-if="
              showDropdown && searchSku.trim() && searchResults.length === 0 && !selectedProduct
            "
            class="absolute z-50 w-full mt-2 bg-white border border-gray-100 shadow-2xl rounded-2xl p-4 text-center text-xs font-bold text-gray-400"
          >
            ❌ Produk / SKU tidak ditemukan.
          </div>
        </div>

        <div :class="{ 'opacity-30 pointer-events-none': !selectedProduct }">
          <label
            class="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest"
            >Filter Expired</label
          >
          <select
            v-model="filter.expired_at"
            class="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 appearance-none"
          >
            <option value="">Semua Tanggal Expired</option>
            <option v-for="date in expiredOptions" :key="date" :value="date">
              {{
                date ? 'Expired: ' + fmtDate.date(new Date(date), 'dd MMM yyyy') : 'Tanpa Expired'
              }}
            </option>
          </select>
        </div>
      </div>

      <div
        v-if="selectedProduct"
        class="mt-4 p-4 bg-indigo-600 rounded-2xl flex items-center justify-between text-white shadow-lg shadow-indigo-100"
      >
        <div>
          <p class="text-[10px] font-bold opacity-80 uppercase tracking-tighter">Monitoring SKU:</p>
          <h2 class="font-black text-lg">
            {{ selectedProduct.sku }} - {{ selectedProduct.product_name }}
          </h2>
        </div>
        <button
          @click="resetSearch"
          class="bg-white/20 hover:bg-white/30 p-2 rounded-xl text-xs font-bold transition-all"
        >
          GANTI PRODUK
        </button>
      </div>
    </div>

    <div v-if="selectedProduct" class="mt-6">
      <KartuStokStat :stats="summaryStats" />
    </div>

    <div v-if="ledgerLoading" class="py-20 text-center">
      <div
        class="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"
      ></div>
      <p class="mt-2 text-xs font-bold text-gray-500 uppercase">Mengambil Data...</p>
    </div>

    <div class="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
      <div v-if="!filter.sku" class="py-24 text-center">
        <div
          class="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"
        >
          📦
        </div>
        <h3 class="font-black text-gray-800 text-lg uppercase">Data Belum Dimuat</h3>
        <p class="text-gray-400 text-xs font-bold max-w-xs mx-auto mt-2">
          Silakan cari dan pilih SKU produk untuk melihat riwayat keluar-masuk barang.
        </p>
      </div>

      <template v-else>
        <div class="overflow-x-auto px-2">
          <table class="w-full border-separate border-spacing-y-2">
            <thead>
              <tr class="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                <th v-for="h in headers" :key="h.text" class="px-6 py-4 text-left">{{ h.text }}</th>
              </tr>
            </thead>
            <tbody>
              <KartuStokRow v-for="(item, index) in ledgerData" :key="index" :item="item" />
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>
