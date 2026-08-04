<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import debounce from 'lodash.debounce'
import AppButton from '@/components/app-button.vue'
import StockAdjustmentRow from './modal/adjustment/stock-adjusment-row.vue'
import StockAdjustmentHistory from './modal/adjustment/stock-adjusment-history.vue'
import StockAdjustmentDetail from './modal/adjustment/stock-adjustment-detail.vue'
import AppTableFilter from '@/components/app-table-filter.vue'
import { useStockTransactionCreate, useStockTransactionList } from '@/models/stock'
import { useProductList } from '@/models/product'
import { useProductLocationList } from '@/models/product-location'
import { useRackList } from '@/models/rack'
import { useApi } from '@/functions/api'

const route = useRoute()
const router = useRouter()

const { submitting } = useStockTransactionCreate('ADJUSTMENT')
const {
  transactions,
  loading: historyLoading,
  getData: fetchHistory,
  cancelTransaction,
} = useStockTransactionList()
const { racks, getData: fetchRacks } = useRackList()
const { products, getData: fetchProducts } = useProductList()
const { productLocations, getData: fetchLocations } = useProductLocationList()
const api = useApi()

const LOCAL_STORAGE_KEY = 'draft_stock_adjustment'
const tableFilters = ref({ start: '', end: '' })

const isAdding = ref(false)
const searchSku = ref('')
const showDropdown = ref(false)
const adjustmentMode = ref<'IN' | 'OUT'>('OUT')

const form = reactive({
  type: 'ADJUSTMENT',
  date: new Date().toISOString().split('T')[0],
  items: [] as any[],
})

const headers = computed(() => {
  return [
    { text: 'No. Transaksi' },
    { text: 'Tanggal Dibuat' },
    { text: 'Jenis' },
    { text: 'User' },
    { text: 'Total Qty' },
  ]
})

const toggleAddForm = () => {
  if (isAdding.value) {
    // Jika sedang terbuka dan user mengklik 'Batal'
    if (form.items.length > 0) {
      const confirmCancel = confirm(
        'Apakah Anda yakin ingin membatalkan transaksi ini?\nData yang sudah diisi di form ini akan direset.',
      )
      if (!confirmCancel) return // Jika klik cancel pada konfirmasi, tidak jadi batal
    }
    // Reset dan tutup form
    resetFormManual()
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    isAdding.value = false
  } else {
    isAdding.value = true
  }
}

const checkDuplicateStatus = (currentIndex: number) => {
  const currentItem = form.items[currentIndex]
  if (!currentItem || !currentItem.product_sku || !currentItem.rack_id) return null

  // Format safe expired_at
  const currentExp = (currentItem.expired_at || '').split('T')[0].split(' ')[0]

  for (let i = 0; i < form.items.length; i++) {
    if (i === currentIndex) continue
    const other = form.items[i]
    if (!other || !other.product_sku || !other.rack_id) continue

    const otherExp = (other.expired_at || '').split('T')[0].split(' ')[0]

    const sameSku = String(other.product_sku) === String(currentItem.product_sku)
    const sameRack = String(other.rack_id) === String(currentItem.rack_id)
    const sameExp = currentExp === otherExp

    if (sameSku && sameRack && sameExp) {
      const sameQty = Number(other.qty) === Number(currentItem.qty)
      if (sameQty) {
        return 'exact' // Duplikat persis SKU + Rack + Exp + Qty
      }
      return 'partial' // Duplikat SKU + Rack + Exp
    }
  }
  return null
}

const loadHistoryData = async () => {
  await fetchHistory({
    type: 'ADJUSTMENT',
    status: 'active',
    per_page: 10,
    start_date: tableFilters.value.start || undefined,
    end_date: tableFilters.value.end || undefined,
  })
}

const debouncedLoadHistoryData = debounce(() => loadHistoryData(), 250)

const resetFormManual = () => {
  form.items = []
  searchSku.value = ''
}

const clearFormAll = () => {
  const konfirmasi = confirm('Apakah Anda yakin ingin menghapus semua item di form ini?')
  if (konfirmasi) {
    resetFormManual()
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  }
}

watch(
  () => [form.items, adjustmentMode.value],
  () => {
    if (form.items.length > 0) {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          items: form.items,
          mode: adjustmentMode.value,
        }),
      )
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    }
  },
  { deep: true },
)

const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault() // Mencegah browser membuka menu Save Page
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ items: form.items, mode: adjustmentMode.value }),
    )
    alert('Draft penyesuaian berhasil disimpan di komputer ini!')
  }
}

onMounted(async () => {
  await Promise.all([fetchProducts(), fetchRacks(), fetchLocations(), loadHistoryData()])

  const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (savedDraft) {
    try {
      const parsed = JSON.parse(savedDraft)

      // Cek apakah di dalam draft objek tersebut terdapat array items dan isinya > 0
      if (parsed && parsed.items && parsed.items.length > 0) {
        const mauRestore = confirm(
          'Sistem mendeteksi adanya data inputan Stock Adjustment sebelumnya yang belum disimpan ke database.\n\nApakah Anda ingin melanjutkan pengisian data tersebut?',
        )

        if (mauRestore) {
          // Kembalikan mode adjustment (IN / OUT) sesuai draft
          adjustmentMode.value = parsed.mode || 'OUT'
          // Masukkan kembali data item ke form reaktif
          form.items.splice(0, form.items.length, ...parsed.items)
          // Buka form inputan agar langsung terlihat oleh user
          isAdding.value = true
        } else {
          // Jika user menolak (Cancel), bersihkan draft komputer
          localStorage.removeItem(LOCAL_STORAGE_KEY)
        }
      }
    } catch (e) {
      console.error('Gagal memuat draft local storage', e)
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

const selectedTrx = computed(() => {
  const trxNoFromUrl = route.query.no
  if (!trxNoFromUrl || transactions.value.length === 0) return null
  return transactions.value.find((t: any) => t.transaction_no === trxNoFromUrl) || null
})

const openDetail = (trx: any) => {
  router.push({ query: { ...route.query, no: trx.transaction_no } })
  isAdding.value = false // Tutup form input jika sedang terbuka
}

const closeDetail = () => {
  router.push({ query: { ...route.query, no: undefined } })
}

watch(
  () => [tableFilters.value.start, tableFilters.value.end],
  ([newStart, newEnd]) => {
    if ((newStart && newEnd) || (!newStart && !newEnd)) {
      debouncedLoadHistoryData()
    }
  },
)

const searchResults = computed(() => {
  if (!searchSku.value) return []
  const needle = searchSku.value.toLowerCase()
  return products.value
    .filter(
      (p: any) =>
        p.sku.toLowerCase().includes(needle) || p.product_name.toLowerCase().includes(needle),
    )
    .slice(0, 5)
})

const selectProduct = (product: any) => {
  form.items.push({
    product_sku: product.sku,
    qty: 1,
    rack_id: null,
    expired_at: '',
    notes: '',
    isValid: true,
    namaProduk: product.product_name,
    type: adjustmentMode.value,
  })
  searchSku.value = ''
  showDropdown.value = false
}

const submitAdjustment = async () => {
  if (form.items.length === 0) return alert('Pilih produk terlebih dahulu')

  if (!form.date) {
    form.date = new Date().toISOString().split('T')[0] ?? ''
  }

  const isInvalid = form.items.some((i) => !i.rack_id)
  if (isInvalid) return alert('Semua item harus memiliki lokasi rak & expired date!')

  try {
    submitting.value = true
    const payload = {
      type: 'ADJUSTMENT',
      jenis: adjustmentMode.value === 'IN' ? 'MASUK' : 'KELUAR',
      date: form.date,
      items: form.items.map((item) => {
        // Safe cleaning untuk expired_at
        let cleanExpired = item.expired_at || ''
        if (cleanExpired.includes('T')) cleanExpired = cleanExpired.split('T')[0]
        if (cleanExpired.includes(' ')) cleanExpired = cleanExpired.split(' ')[0]

        return {
          product_sku: item.product_sku,
          qty: Math.abs(item.qty),
          type: adjustmentMode.value,
          rack_id: item.rack_id,
          expired_at: cleanExpired, // DIJAMIN "2028-06-26"
          notes: item.notes,
        }
      }),
    }

    await api.POST('admin/stock-transactions', payload)

    alert('Penyesuaian stok berhasil disimpan!')
    isAdding.value = false
    resetFormManual()
    await Promise.all([loadHistoryData(), fetchLocations(), fetchProducts()])
  } catch (error) {
    console.error('Gagal simpan:', error)
  } finally {
    submitting.value = false
  }
}

const filteredHistory = computed(() => {
  return transactions.value
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="px-6 py-4">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <svg
                class="w-7 h-7 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Penyesuaian Stok
            </h1>
            <p class="text-sm text-gray-500 mt-1">Kelola penyesuaian stok barang</p>
          </div>

          <AppButton
            v-if="!route.query.no"
            @click="toggleAddForm"
            :variant="isAdding ? 'outline' : 'primary'"
            class="shadow-md hover:shadow-lg transition-all"
          >
            <template v-if="!isAdding">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Buat Penyesuaian
            </template>
            <template v-else>
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Batal
            </template>
          </AppButton>
        </div>
      </div>
    </div>

    <div class="p-6">
      <div v-if="route.query.no" class="animate-fade-in">
        <StockAdjustmentDetail v-if="selectedTrx" :trx="selectedTrx" @close="closeDetail" />
        <div
          v-else
          class="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm text-gray-400 italic"
        >
          Memuat data atau nomor transaksi tidak valid...
        </div>
      </div>

      <div v-else class="space-y-6">
        <div v-if="isAdding" class="animate-fade-in">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                @click="adjustmentMode = 'OUT'"
                class="group relative px-8 py-4 rounded-xl font-bold transition-all duration-200 overflow-hidden"
                :class="
                  adjustmentMode === 'OUT'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                "
              >
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 12H4"
                    />
                  </svg>
                  Pengurangan (-)
                </div>
              </button>
              <button
                @click="adjustmentMode = 'IN'"
                class="group relative px-8 py-4 rounded-xl font-bold transition-all duration-200 overflow-hidden"
                :class="
                  adjustmentMode === 'IN'
                    ? 'bg-green-500 text-white shadow-lg shadow-green-200 scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                "
              >
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Penambahan (+)
                </div>
              </button>
            </div>
            <p class="text-center text-xs text-gray-500 mt-4">
              Mode:
              <span
                class="font-bold"
                :class="adjustmentMode === 'IN' ? 'text-green-600' : 'text-red-600'"
                >{{ adjustmentMode === 'IN' ? 'Menambah stok' : 'Mengurangi stok' }}</span
              >
            </p>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <label class="block text-sm font-bold text-gray-700 mb-3"> Cari Produk </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  class="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                v-model="searchSku"
                @focus="showDropdown = true"
                type="text"
                class="w-full pl-10 pr-4 py-3 border-2 border-indigo-200 rounded-xl shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                placeholder="Scan SKU atau cari nama produk..."
              />
            </div>

            <div
              v-if="showDropdown && searchResults.length"
              class="z-20 w-full mt-2 bg-white border shadow-xl rounded-xl overflow-hidden animate-slide-down"
            >
              <div
                v-for="p in searchResults"
                :key="p.sku"
                @click="selectProduct(p)"
                class="px-6 py-3 hover:bg-indigo-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center transition-colors"
              >
                <div>
                  <div class="font-bold text-indigo-900">{{ p.sku }}</div>
                  <div class="text-xs text-gray-500">{{ p.product_name }}</div>
                </div>
                <span class="text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full"
                  >+ Pilih</span
                >
              </div>
            </div>
          </div>

          <div v-if="form.items.length > 0" class="space-y-3 mb-6">
            <div class="flex justify-between items-center mb-3">
              <h3 class="font-semibold text-gray-700">Daftar Item</h3>
              <div class="flex gap-2">
                <button
                  @click="clearFormAll"
                  class="text-xs text-red-500 hover:text-red-700 font-semibold bg-red-50 px-3 py-1 rounded-lg transition-colors"
                >
                  🗑️ Bersihkan Semua Form
                </button>
                <span class="text-sm text-gray-500">{{ form.items.length }} item</span>
              </div>
            </div>
            <StockAdjustmentRow
              v-for="(item, index) in form.items"
              :key="index"
              v-model="form.items[index]"
              :product-locations="productLocations"
              :all-racks="racks"
              :duplicate-status="checkDuplicateStatus(index)"
              @remove="form.items.splice(index, 1)"
              :show-delete="true"
            />
          </div>

          <div
            v-if="form.items.length > 0"
            class="flex justify-end pt-4 border-t border-gray-200 mb-6"
          >
            <AppButton
              variant="primary"
              @click="submitAdjustment"
              :loading="submitting"
              class="px-8 py-3 text-lg shadow-lg"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Simpan Penyesuaian
            </AppButton>
          </div>
        </div>

        <div class="pt-4">
          <div class="flex border-b border-gray-200 mb-4 gap-6">
            <span class="border-blue-600 text-blue-600 font-bold pb-3 text-sm border-b-2 px-1">
              Riwayat Penyesuaian Stok
            </span>
          </div>

          <AppTableFilter v-model="tableFilters" />

          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <StockAdjustmentHistory
              :data="filteredHistory"
              :headers="headers"
              :loading="historyLoading"
              @view-detail="openDetail"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

.animate-slide-down {
  animation: slide-down 0.2s ease-out;
}
</style>
