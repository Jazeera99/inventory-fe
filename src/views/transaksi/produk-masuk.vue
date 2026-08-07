<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import debounce from 'lodash.debounce'
import AppButton from '@/components/app-button.vue'
import AppTableFilter from '@/components/app-table-filter.vue'
import ProdukMasukRow from '@/views/transaksi/modal/in/produk-masuk-row.vue'
import ProdukMasukHistory from '@/views/transaksi/modal/in/produk-masuk-history.vue'
import ProdukMasukDetail from '@/views/transaksi/modal/in/produk-masuk-detail.vue'
import { useStockTransactionCreate, useStockTransactionList } from '@/models/stock'
import { useProductList } from '@/models/product'
import { useRackList } from '@/models/rack'

const route = useRoute()
const router = useRouter()
// --- API STATES ---
const { form, errors, submitting, submitForm, addItem, removeItem, resetForm } =
  useStockTransactionCreate('IN')
const {
  transactions,
  loading: historyLoading,
  getData: fetchHistory,
  cancelTransaction,
} = useStockTransactionList()
const { products, getData: fetchProducts } = useProductList()
const { racks, getData: fetchRacks } = useRackList()
const LOCAL_STORAGE_KEY = 'draft_produk_masuk'

// --- UI STATES ---
const currentTab = ref<'active' | 'trash'>('active')
const isDuplicateError = ref(false)
const showDuplicateModal = ref(false)
const duplicateErrorMessage = ref('')
const tableFilters = ref({ start: '', end: '' })
const headers = computed(() => {
  if (currentTab.value === 'trash') {
    return [
      { text: 'No. Transaksi' },
      { text: 'Tanggal Masuk' },
      { text: 'User Input' },
      { text: 'Dibatalkan Oleh' },
      { text: 'Total Qty' },
    ]
  }
  return [
    { text: 'No. Transaksi' },
    { text: 'Tanggal Masuk' },
    { text: 'User' },
    { text: 'Total Qty' },
    { text: '' },
  ]
})

const loadHistoryData = async () => {
  await fetchHistory({
    type: 'IN',
    status: currentTab.value === 'trash' ? 'trash' : 'active',
    per_page: 10,
    start_date: tableFilters.value.start || undefined,
    end_date: tableFilters.value.end || undefined,
  })
}

watch(
  () => form.items,
  (newItems) => {
    // Jangan simpan jika form dalam kondisi kosong bawaan awal
    if (newItems.length === 1 && !newItems[0]?.product_sku && newItems[0]?.qty === 1) {
      return
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(form.items))
  },
  { deep: true },
)

const debouncedLoadHistoryData = debounce(() => loadHistoryData(), 250)

// Fungsi untuk membersihkan seluruh isi form secara instan jika user batal input
const clearAllItems = () => {
  const konfirmasi = confirm('Apakah Anda yakin ingin mengosongkan seluruh baris inputan ini?')
  if (konfirmasi) {
    resetForm() // Memanggil resetForm dari useStockTransactionCreate
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  }
}

// --- LOGIC ---
onMounted(async () => {
  await fetchProducts()
  if (fetchRacks) await fetchRacks()
  await loadHistoryData()

  const stockOrderId = route.query.stock_order_id
  if (stockOrderId) {
    try {
      const { useApi } = await import('@/functions/api')
      const api = useApi()
      const res = await api.GET<any>(`admin/stock-orders/${stockOrderId}`)
      const orderData = res.data?.data || res.data
      if (orderData && orderData.items && orderData.items.length > 0) {
        const rawRacks = racks.value as any
        const rackList = Array.isArray(rawRacks) ? rawRacks : rawRacks?.data || []
        const ldRack = rackList.find(
          (r: any) =>
            r.location_code === 'LD-01' || r.rack_name?.toLowerCase().includes('loading dock'),
        )
        const ldRackId = ldRack ? ldRack.id : null

        const mappedItems = orderData.items
          .map((item: any) => ({
            product_sku: item.product_sku,
            qty: Math.max(0, item.qty_ordered - (item.qty_fulfilled || 0)),
            isValid: true,
            namaProduk: item.product?.product_name || '',
            unit_price: item.unit_price || 0,
            expired_at: item.suggested_expired_at || '',
          }))
          .filter((item: any) => item.qty > 0)

        if (mappedItems.length > 0) {
          form.stock_order_id = Number(stockOrderId)
          form.items.splice(0, form.items.length, ...mappedItems)
          form.items.forEach((_, idx) => validateSku(idx))
        }
      }
    } catch (err) {
      console.error('Gagal memuat auto-fill dari Stock Order:', err)
    }
  } else {
    // Jika tidak ada stock_order_id, cek apakah ada draft di localStorage
    const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (savedDraft) {
      const parsedDraft = JSON.parse(savedDraft)
      if (parsedDraft && parsedDraft.length > 0) {
        const mauRestore = confirm(
          'Sistem mendeteksi adanya data inputan sebelumnya yang belum disimpan ke database.\n\nApakah Anda ingin melanjutkan pengisian data tersebut?',
        )
        if (mauRestore) {
          form.items.splice(0, form.items.length, ...parsedDraft)
          form.items.forEach((_, idx) => validateSku(idx))
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY)
        }
      }
    }
  }
})

watch(currentTab, async () => {
  await loadHistoryData()
})

const validateSku = (index: number, manualSku?: string) => {
  const item = form.items[index]
  if (!item) return

  const skuInput = manualSku || item.product_sku
  if (!skuInput) {
    item.isValid = false
    item.namaProduk = ''
    return
  }

  const finalSku = String(skuInput).toUpperCase().trim()
  // Ambil data dari proxy products (sesuai gambar network tab kamu)
  const rawData = products.value as any
  const productList = Array.isArray(rawData) ? rawData : rawData?.data || []

  // CARI PRODUK
  const found = productList.find((p: any) => String(p.sku).toUpperCase() === finalSku)

  if (found) {
    if (!found.is_active) {
      item.isValid = false
      item.namaProduk = `[TIDAK AKTIF] ${found.product_name}`
      return
    }

    item.isValid = true
    item.namaProduk = found.product_name
  } else {
    // Jika belum ketemu persis (mungkin masih ngetik), jangan langsung salahkan
    item.isValid = false
    item.namaProduk = ''
  }
}

// --- DETEKSI DUPLIKASI REAL-TIME ---
const checkedItems = computed(() => {
  return form.items.map((item: any, index: number) => {
    // Abaikan baris yang SKU-nya masih kosong agar tidak langsung dianggap duplikat
    if (!item.product_sku) {
      return { ...item, isExactDuplicate: false, isSkuExpiredDuplicate: false }
    }

    const currentSku = String(item.product_sku).toUpperCase().trim()
    const currentQty = Number(item.qty)
    const currentExpired = item.expired_at || '' // Sesuaikan nama properti expired di object Anda

    // Cari tahu apakah ada baris LAIN yang sama dengan baris ini
    const isExactDuplicate = form.items.some((otherItem: any, otherIndex: number) => {
      if (index === otherIndex) return false // Abaikan baris dirinya sendiri
      const otherSku = String(otherItem.product_sku).toUpperCase().trim()
      const otherQty = Number(otherItem.qty)
      const otherExpired = otherItem.expired_at || ''

      return currentSku === otherSku && currentQty === otherQty && currentExpired === otherExpired
    })

    const isSkuExpiredDuplicate = form.items.some((otherItem: any, otherIndex: number) => {
      if (index === otherIndex) return false
      const otherSku = String(otherItem.product_sku).toUpperCase().trim()
      const otherExpired = otherItem.expired_at || ''

      return currentSku === otherSku && currentExpired === otherExpired
    })

    return {
      ...item,
      isExactDuplicate,
      isSkuExpiredDuplicate: isExactDuplicate ? false : isSkuExpiredDuplicate, // jika sudah exact, parsialnya difalseskan saja
    }
  })
})

const submitProdukMasuk = async (isForce: boolean = false) => {
  if (form.items.some((i: any) => !i.isValid)) {
    return alert('Terdapat SKU yang tidak valid atau belum terdaftar!')
  }

  if (!form.date) {
    form.date = new Date().toISOString().split('T')[0] ?? ''
  }

  try {
    isDuplicateError.value = false
    await submitForm(isForce)
    showDuplicateModal.value = false
    resetForm()
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    currentTab.value = 'active'
    if (fetchRacks) await fetchRacks()
    await loadHistoryData()
    alert('Stok masuk berhasil disimpan!')
  } catch (error: any) {
    console.error('Gagal menyimpan:', error)
    if (
      error.response?.status === 422 &&
      error.response?.data?.status === 'error_duplicate_input'
    ) {
      isDuplicateError.value = true
      showDuplicateModal.value = true
      duplicateErrorMessage.value = `${error.response.data.message} ${error.response.data.info || ''}`
      // Masukkan pesan error dari backend ke objek errors agar ditangkap oleh <AppAlert /> bawaan Anda
      errors.value = {
        global: [duplicateErrorMessage.value],
      }
    } else if (error?.response?.data?.message) {
      alert(error.response.data.message)
    } else {
      alert('Terjadi kesalahan pada sistem server. Silakan coba lagi.')
    }
  }
}

const forceSaveStock = async () => {
  // Panggil kembali submit dengan parameter true/force sesuai standarisasi backend Anda
  await submitProdukMasuk(true)
}

const filteredHistory = computed(() => {
  return transactions.value
})

// const showDetailModal = ref(false)
// const selectedTrx = ref<any>(null)

// const openDetail = (trx: any) => {
//   selectedTrx.value = trx
//   showDetailModal.value = true
// }

// 2. DETEKSI TRANSAKSI TERPILIH BERDASARKAN URL (?trx=...)
// Tetap reaktif & aman meskipun halaman di-refresh!

watch(
  () => [tableFilters.value.start, tableFilters.value.end],
  ([newStart, newEnd]) => {
    if ((newStart && newEnd) || (!newStart && !newEnd)) {
      debouncedLoadHistoryData()
    }
  },
)

const selectedTrx = computed(() => {
  const trxNoFromUrl = route.query.trx
  if (!trxNoFromUrl) return null
  return transactions.value.find((t) => t.transaction_no === trxNoFromUrl) || null
})

// 3. FUNGSI NAVIGASI (Ubah URL tanpa refresh)
const openDetail = (trx: any) => {
  router.push({ query: { ...route.query, trx: trx.transaction_no } })
}

const closeDetail = () => {
  router.push({ query: { ...route.query, trx: undefined } })
}

const handleCancelTransaction = async (transactionNo: string) => {
  const konfirmasi = confirm(
    `Apakah Anda yakin ingin membatalkan transaksi ${transactionNo}?\nTindakan ini akan mengembalikan stok barang ke kondisi semula.`,
  )

  if (!konfirmasi) return

  try {
    await cancelTransaction(transactionNo)
    alert('Transaksi berhasil dibatalkan!')
    if (fetchRacks) await fetchRacks()
    await loadHistoryData() // Refresh list tabel otomatis
  } catch (error: any) {
    alert(
      error?.response?.data?.message || 'Gagal membatalkan transaksi, periksa stok gudang Anda.',
    )
  }
}
</script>

<template>
  <div class="space-y-6 p-1">
    <div
      v-if="showDuplicateModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div class="flex items-start gap-3 text-red-600">
          <span class="text-2xl">⚠️</span>
          <div>
            <h3 class="font-bold text-base text-gray-900">Potensi Duplikasi Terdeteksi!</h3>
            <p class="text-xs text-gray-500 mt-1">
              Sistem melihat item dengan SKU & Qty yang sama persis telah sukses dimasukkan
              baru-baru ini.
            </p>
          </div>
        </div>

        <div class="bg-gray-50 p-3 rounded-lg border text-xs text-gray-700 space-y-1">
          <p><b>Pesan Sistem:</b> {{ duplicateErrorMessage }}</p>
        </div>

        <p class="text-xs text-gray-600">
          Silakan cek menu <b>Riwayat / History</b> terlebih dahulu untuk memastikan apakah ini
          pekerjaan teman Anda yang sudah selesai.
        </p>

        <div class="grid grid-cols-2 gap-2 pt-2">
          <button
            @click="
              () => {
                clearAllItems()
                showDuplicateModal = false
              }
            "
            class="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded transition"
          >
            🗑️ Bersihkan Form Ini
          </button>
          <button
            @click="forceSaveStock"
            class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition"
          >
            ✅ Tetap Simpan (Yakin Berbeda)
          </button>
        </div>

        <button
          @click="showDuplicateModal = false"
          class="w-full text-center text-xs text-gray-400 hover:text-gray-600 pt-1"
        >
          Tutup Peringatan
        </button>
      </div>
    </div>

    <ProdukMasukDetail
      v-if="route.query.trx"
      :trx="selectedTrx"
      :trx-no="route.query.trx"
      :loading="historyLoading"
      :racks="racks"
      @close="closeDetail"
    />

    <div v-else class="space-y-6">
      <header>
        <h1 class="text-2xl font-bold text-gray-900">Produk Masuk</h1>
        <p class="text-gray-500 text-sm italic">Input stok masuk ke gudang utama (Loading Dock).</p>
      </header>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-6">
          <h3 class="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">
            Input Items
          </h3>
          <div
            v-if="(errors && Object.keys(errors).length > 0) || isDuplicateError"
            class="mb-4 space-y-3"
          >
            <AppAlert
              variant="error"
              :message="
                (errors?.global && errors.global[0]) ||
                'Gagal memproses transaksi. Silakan periksa kembali detail item merah di bawah ini.'
              "
              :show="true"
            />

            <div
              v-if="isDuplicateError"
              class="flex flex-wrap gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <button
                type="button"
                @click="clearAllItems"
                class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1"
              >
                🗑️ Bersihkan Semua Form (Cancel Input)
              </button>
              <a
                href="#"
                @click.prevent="((currentTab = 'active'), loadHistoryData())"
                class="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all text-center flex items-center gap-1"
              >
                🔄 Refresh & Cek Riwayat Berjalan
              </a>
            </div>
          </div>
          <div class="space-y-4">
            <ProdukMasukRow
              v-for="(item, index) in checkedItems"
              :key="index"
              v-model="form.items[index]"
              :index="index"
              :errors="errors"
              :all-products="products"
              :all-racks="racks"
              :show-delete="form.items.length > 1"
              :is-exact-duplicate="item.isExactDuplicate"
              :is-sku-expired-duplicate="item.isSkuExpiredDuplicate"
              @validate="(val) => validateSku(index, val)"
              @remove="removeItem(index)"
              @clear-error="
                (key) => {
                  if (errors && errors[key]) delete errors[key]
                }
              "
            />
          </div>
          <div class="mt-4 flex justify-between items-center">
            <button
              @click="addItem"
              class="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-all active:scale-95"
            >
              <span>+ Tambah Item Baru</span>
            </button>

            <button
              @click="clearAllItems"
              class="text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-all active:scale-95"
              title="Hapus semua baris input sekaligus"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>Bersihkan Semua Baris</span>
            </button>
          </div>
        </div>

        <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <AppButton variant="primary" @click="submitProdukMasuk" :loading="submitting">
            Simpan Stok Masuk
          </AppButton>
        </div>
      </div>

      <div class="pt-4">
        <div class="flex border-b border-gray-200 mb-4 gap-6">
          <button
            @click="currentTab = 'active'"
            :class="[
              currentTab === 'active'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700',
              'pb-3 text-sm border-b-2 px-1 transition-all',
            ]"
          >
            Riwayat Berjalan
          </button>
          <button
            @click="currentTab = 'trash'"
            :class="[
              currentTab === 'trash'
                ? 'border-red-600 text-red-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700',
              'pb-3 text-sm border-b-2 px-1 transition-all',
            ]"
          >
            Trash (Dibatalkan)
          </button>
        </div>

        <AppTableFilter v-model="tableFilters" />
        <ProdukMasukHistory
          :data="filteredHistory"
          :headers="headers"
          :loading="historyLoading"
          :current-tab="currentTab"
          @view-detail="openDetail"
          @cancel="handleCancelTransaction"
        />
      </div>
    </div>
  </div>
</template>
