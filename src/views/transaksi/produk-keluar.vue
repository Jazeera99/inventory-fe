<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import debounce from 'lodash.debounce'
import AppButton from '@/components/app-button.vue'
import AppTableFilter from '@/components/app-table-filter.vue'
import ProdukKeluarRow from './modal/out/produk-keluar-row.vue'
import ProdukKeluarHistory from '@/views/transaksi/modal/out/produk-keluar-history.vue'
import ProdukKeluarDetail from '@/views/transaksi/modal/out/produk-keluar-detail.vue'
import { useStockTransactionCreate, useStockTransactionList } from '@/models/stock'
import { useProductList } from '@/models/product'
import { useRackList } from '@/models/rack'
import { useProductLocationList } from '@/models/product-location'

const route = useRoute()
const router = useRouter()
const { form, submitting, errors, submitForm, addItem, removeItem, resetForm } =
  useStockTransactionCreate('OUT')
const {
  transactions,
  loading: historyLoading,
  getData: fetchHistory,
  cancelTransaction,
} = useStockTransactionList()
const { products, getData: fetchProducts } = useProductList()
const { racks, getData: fetchRacks } = useRackList()
const { productLocations, getData: fetchLocations } = useProductLocationList()

// --- UI STATES ---
const currentTab = ref<'active' | 'trash'>('active')
const tableFilters = ref({ start: '', end: '' })
const showFefoModal = ref(false)
const fefoRecommendations = ref<any[]>([])
const isRestoring = ref(false)
const fefoModalMeta = ref({
  sku: '',
  requested: 0,
  available: 0,
  triggerReason: '',
})

const getUserId = () => {
  try {
    const authData = localStorage.getItem('auth_user') // Sesuaikan nama key session login kamu
    if (authData) {
      const user = JSON.parse(authData)
      return user.id || user.username || 'guest'
    }
  } catch (e) {
    return 'guest'
  }
  return 'guest'
}

const LOCAL_STORAGE_KEY = computed(() => `draft_produk_keluar_${getUserId()}`)

const headers = computed(() => {
  if (currentTab.value === 'trash') {
    return [
      { text: 'No. Transaksi' },
      { text: 'Tanggal Keluar' },
      { text: 'User Input' },
      { text: 'Dibatalkan Oleh' },
      { text: 'Total Qty' },
    ]
  }
  return [
    { text: 'No. Transaksi' },
    { text: 'Tanggal Keluar' },
    { text: 'User' },
    { text: 'Total Qty' },
    { text: '' },
  ]
})

// --- LOGIC ---
const loadHistoryData = async () => {
  await fetchHistory({
    type: 'OUT',
    status: currentTab.value === 'trash' ? 'trash' : 'active',
    per_page: 10,
    start_date: tableFilters.value.start || undefined,
    end_date: tableFilters.value.end || undefined,
  })
}

const debouncedLoadHistoryData = debounce(() => loadHistoryData(), 250)

const clearAllOutItems = () => {
  const konfirmasi = confirm('Apakah Anda yakin ingin mengosongkan seluruh baris pengeluaran ini?')
  if (konfirmasi) {
    resetForm()
    localStorage.removeItem(LOCAL_STORAGE_KEY.value)
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault() // Mencegah browser membuka menu save bawaan
    localStorage.setItem(LOCAL_STORAGE_KEY.value, JSON.stringify(form))
    alert('Draft produk keluar berhasil disimpan secara lokal! 💾')
  }
}

const isDraftValidAndNotEmpty = (parsedData: any) => {
  if (!parsedData || !parsedData.items || parsedData.items.length === 0) return false

  // Jika isi item lebih dari 1, atau baris pertama sudah terisi SKU/Qty, tandanya draf VALID
  const firstItem = parsedData.items[0]
  if (parsedData.items.length > 1) return true
  if (firstItem && (firstItem.product_sku || firstItem.qty > 0)) return true

  return false
}

watch(
  () => form.items,
  (newItems) => {
    if (isRestoring.value) return
    // Jangan simpan jika form dalam kondisi kosong bawaan awal
    if (newItems.length === 1 && !newItems[0]?.product_sku && !newItems[0]?.qty) {
      return
    }
    localStorage.setItem(LOCAL_STORAGE_KEY.value, JSON.stringify(form))
  },
  { deep: true },
)

onMounted(async () => {
  isRestoring.value = true
  await fetchProducts()
  if (fetchRacks) await fetchRacks()
  if (fetchLocations) await fetchLocations()
  await loadHistoryData()

  window.addEventListener('keydown', handleKeyDown)

  const stockOrderId = route.query.stock_order_id
  if (stockOrderId) {
    try {
      const { useApi } = await import('@/functions/api')
      const api = useApi()
      const res = await api.GET<any>(`admin/stock-orders/${stockOrderId}`)
      const orderData = res.data?.data || res.data
      if (orderData && orderData.items && orderData.items.length > 0) {
        const mappedItems = orderData.items
          .map((item: any) => ({
            product_sku: item.product_sku,
            qty: Math.max(0, item.qty_ordered - (item.qty_fulfilled || 0)),
            isValid: true,
            namaProduk: item.product?.product_name || '',
          }))
          .filter((item: any) => item.qty > 0)

        if (mappedItems.length > 0) {
          form.stock_order_id = Number(stockOrderId)
          form.items.splice(0, form.items.length, ...mappedItems)
          setTimeout(() => {
            form.items.forEach((_, idx) => validateSku(idx))
            isRestoring.value = false
          }, 100)
        }
      }
    } catch (err) {
      console.error('Gagal memuat auto-fill dari Stock Order:', err)
    }
  } else {
    const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY.value)
    if (savedDraft) {
      try {
        const parsedData = JSON.parse(savedDraft)

        if (isDraftValidAndNotEmpty(parsedData)) {
          const mauRestore = confirm(
            'Sistem mendeteksi adanya draft input produk keluar sebelumnya yang belum disimpan ke server.\n\nApakah Anda ingin melanjutkan pengisian data tersebut?',
          )
          if (mauRestore) {
            form.date = parsedData.date || ''
            form.type = parsedData.type || 'OUT'

            // Gunakan splice agar Vue 3 dapat melacak perubahan struktur array dengan baik
            form.items.splice(0, form.items.length, ...parsedData.items)

            // Berikan jeda microtask sebentar agar DOM selesai merender baris baru sebelum divalidasi
            setTimeout(() => {
              form.items.forEach((_, idx) => validateSku(idx))
              isRestoring.value = false
            }, 100)
          } else {
            localStorage.removeItem(LOCAL_STORAGE_KEY.value)
          }
        }
      } catch (err) {
        console.error('Gagal memuat draft:', err)
      }
    }
  }
  isRestoring.value = false
})

watch(currentTab, async () => {
  await loadHistoryData()
})

watch(
  () => router.currentRoute.value.path,
  (newPath) => {
    if (newPath.includes('pindah-produk')) {
      localStorage.setItem(LOCAL_STORAGE_KEY.value, JSON.stringify(form))
    }
  },
)

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
      // Opsi tambahan: kamu bisa langsung mentrigger error spesifik di sini jika dibutuhkan
      return
    }

    // Jika ketemu persis, berikan tanda centang hijau
    item.isValid = true
    item.namaProduk = found.product_name
  } else {
    // Jika belum ketemu persis (mungkin masih ngetik), jangan langsung salahkan
    item.isValid = false
    item.namaProduk = ''
  }
}

const alihkanKePindahProduk = () => {
  // Amankan ketikan form saat ini ke localStorage
  localStorage.setItem(LOCAL_STORAGE_KEY.value, JSON.stringify(form))

  const suggestions = fefoRecommendations.value || []

  const rawData = racks.value as any
  const rackList = Array.isArray(rawData) ? rawData : rawData?.data || []
  const ldRack = rackList.find((r: any) => {
    const code = String(r.location_code || '').toUpperCase()
    const name = String(r.rack_name || '').toUpperCase()
    return code.includes('LD') || name.includes('LOADING')
  })

  // Petakan rekomendasi dari backend agar dibaca otomatis di pindah-produk.vue
  const dataPindah = suggestions.map((item) => ({
    product_sku: item.product_sku || fefoModalMeta.value.sku,
    qty: item.recommended_move_qty || item.qty,
    expired_at: item.expired_at,
    from_rack_id: item.current_rack_id || item.rack_id,
    from_rack_code: item.current_rack_code || item.rack_code,
    target_rack_id: form.items[0]?.rack_id, // Mengarah ke Loading Dock ID yang dideteksi sebelumnya
  }))

  localStorage.setItem('pending_evacuation_items', JSON.stringify(dataPindah))
  showFefoModal.value = false

  // Arahkan ke halaman pindah produk
  router.push({
    path: 'pindah-produk',
    query: { from_trigger: 'OUT' },
  })
}

const checkIfDuplicate = (currentItem: any, currentIndex: number) => {
  const currentSku = currentItem.product_sku || currentItem.produkSku
  const currentQty = Number(currentItem.qty || 0)

  // Jangan validasi jika SKU atau QTY masih kosong
  if (!currentSku || currentQty <= 0) return false

  // Cari apakah ada baris LAIN yang memiliki SKU dan QTY sama persis
  return form.items.some((item: any, idx: number) => {
    if (idx === currentIndex) return false // Abaikan baris dirinya sendiri

    const otherSku = item.product_sku || item.produkSku
    const otherQty = Number(item.qty || 0)

    return otherSku === currentSku && otherQty === currentQty
  })
}

const submitProdukKeluar = async (forceOut = false) => {
  // Validasi SKU dasar
  if (form.items.some((i: any) => !i.isValid)) {
    alert('Terdapat SKU yang tidak valid atau belum terdaftar!')
    return
  }

  if (!form.date) {
    form.date = new Date().toISOString().split('T')[0] ?? ''
  }

  // Ambil ID Rak Loading Dock
  const rawData = racks.value as any
  const rackList = Array.isArray(rawData) ? rawData : rawData?.data || []
  const ldRack = rackList.find((r: any) => {
    const code = String(r.location_code || '').toUpperCase()
    const name = String(r.rack_name || '').toUpperCase()

    // Mencakup: 'LD-01', 'LD01', 'LD-02', atau kata 'LOADING'
    return code.includes('LD') || name.includes('LOADING')
  })

  if (!ldRack) {
    alert('Sistem gagal mendeteksi Rak Loading Dock (LD-01)!')
    return
  }

  form.force_out = forceOut
  form.items.forEach((item: any) => {
    item.rack_id = Number(ldRack.id)
  })
  try {
    await submitForm()

    // Jika sukses, bersihkan draf ketikan di localStorage
    localStorage.removeItem(LOCAL_STORAGE_KEY.value)

    alert('Transaksi Produk Keluar sukses disimpan!')
    resetForm()
    currentTab.value = 'active'
    await fetchLocations()
    await loadHistoryData()
  } catch (error: any) {
    const responseData = error?.response?.data

    // JIKA TERJADI ERROR 422 (STOK RAK LOADING DOCK TIDAK CUKUP)
    if (
      error?.response?.status === 422 &&
      (responseData?.status === 'warning_insufficient_rack_stock' ||
        responseData?.status === 'requires_evacuation')
    ) {
      fefoRecommendations.value = responseData.fefo_suggestions || responseData.data || []

      // 2. Simpan metadata text untuk dipasang di modal nanti
      fefoModalMeta.value = {
        sku: responseData.product_sku || form.items[0]?.product_sku || '',
        requested: responseData.qty_requested || form.items[0]?.qty || 0,
        available: responseData.qty_available_here || 0,
        triggerReason: responseData.trigger_reason || '',
      }

      // 3. BUKA MODAL KUSTOM ANDA (Ubah jadi true)
      showFefoModal.value = true
    } else {
      console.error('Gagal menyimpan:', error)
      alert(error?.response?.data?.message || 'Terjadi kesalahan sistem.')
    }
  }
}
// Susun HTML tabel rincian stok FEFO di rak-rak lainnya
//       let fefoHtml = `
//         <div class="text-left text-xs mt-3 bg-gray-50 p-3 rounded border">
//           <p class="font-bold mb-1.5 text-gray-700">📌 Rekomendasi Stok FEFO di Rak Lain:</p>
//           <table class="w-full text-[11px] border-collapse">
//             <thead>
//               <tr class="border-b text-gray-400">
//                 <th class="text-left pb-1">Rak</th>
//                 <th class="text-left pb-1">Exp Date</th>
//                 <th class="text-right pb-1">Sisa Stok</th>
//               </tr>
//             </thead>
//             <tbody>
//       `
//       responseData.fefo_suggestions.forEach((s: any) => {
//         fefoHtml += `
//           <tr class="border-b py-1">
//             <td class="py-1 font-bold text-gray-700">${s.rack_code} (${s.rack_name})</td>
//             <td class="py-1">${s.expired_at || 'Tanpa Exp'}</td>
//             <td class="py-1 text-right font-bold text-blue-600">${s.qty} pcs</td>
//           </tr>
//         `
//       })
//       fefoHtml += `</tbody></table></div>`

//       // Tampilkan pilihan interaktif 2 opsi utama ke user
//       Swal.fire({
//         title: 'Stok Rak Saat Ini Kurang!',
//         html:
//           `Anda meminta pengeluaran sebesar <b>${responseData.qty_requested} pcs</b>, namun di Loading Dock saat ini hanya siap <b>${responseData.qty_available_here} pcs</b>.<br/>` +
//           fefoHtml,
//         icon: 'warning',
//         showCancelButton: true,
//         showDenyButton: true,
//         confirmButtonText: '🚀 Tetap Ambil Stok LD yang Ada',
//         denyButtonText: '🚚 Pindahkan Produk Dulu',
//         cancelButtonText: 'Batal',
//         confirmButtonColor: '#3085d6',
//         denyButtonColor: '#f97316',
//         cancelButtonColor: '#6b7280',
//       }).then((result) => {
//         if (result.isConfirmed) {
//           // OPSI 1: Lanjutkan paksa pengeluaran (jalankan ulang dengan flag force_out = true)
//           submitProdukKeluar(true)
//         } else if (result.isDenied) {
//           // OPSI 2: Amankan ketikan user saat ini ke localStorage
//           localStorage.setItem('draft_produk_keluar', JSON.stringify(form))

//           const sisaKurang = responseData.qty_requested - responseData.qty_available_here

//           // Menggunakan absolute path '/' agar router mengarah dengan tepat ke komponen tujuan
//           router.push({
//             path: '/transaksi/pindah-produk',
//             query: {
//               sku: responseData.product_sku,
//               qty: sisaKurang,
//               from_trigger: 'OUT',
//             },
//           })
//         }
//       })
//     } else {
//       console.error('Gagal menyimpan:', error)
//       Swal.fire('Gagal', error?.response?.data?.message || 'Terjadi kesalahan sistem.', 'error')
//     }
//   }
// }

if (!form.date) {
  form.date = new Date().toISOString().split('T')[0] ?? ''
}

const filteredHistory = computed(() => {
  return transactions.value
})

// Pantau perubahan pada input filter tanggal
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

// FUNGSI NAVIGASI (Ubah URL tanpa refresh)
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

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="space-y-6 p-1">
    <ProdukKeluarDetail
      v-if="route.query.trx"
      :trx="selectedTrx"
      :trx-no="route.query.trx"
      :loading="historyLoading"
      :racks="racks"
      @close="closeDetail"
    />

    <div v-else class="space-y-6">
      <header>
        <h1 class="text-2xl font-bold text-gray-900">Produk Keluar</h1>
        <p class="text-gray-500 text-sm italic">
          Input stok keluar dari gudang utama (Loading Dock).
        </p>
      </header>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-6">
          <h3 class="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">
            Input Items
          </h3>
          <div class="space-y-4">
            <ProdukKeluarRow
              v-for="(item, index) in form.items"
              :key="index"
              v-model="form.items[index]"
              :index="index"
              :errors="errors"
              :all-products="products"
              :all-racks="racks"
              :product-locations="productLocations"
              :show-delete="form.items.length > 1"
              :is-exact-duplicate="checkIfDuplicate(item, index)"
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
              class="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>+ Tambah Item Baru</span>
            </button>

            <button
              type="button"
              @click="clearAllOutItems"
              class="text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
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
          <AppButton
            variant="primary"
            @click="() => submitProdukKeluar(false)"
            :loading="submitting"
          >
            Simpan Stok Keluar
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
        <ProdukKeluarHistory
          :data="filteredHistory"
          :headers="headers"
          :loading="historyLoading"
          :current-tab="currentTab"
          @view-detail="openDetail"
          @cancel="handleCancelTransaction"
        />
      </div>
    </div>
    <div
      v-if="showFefoModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    >
      <div
        class="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div class="bg-amber-500 text-white p-4 flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="text-xl">⚠️</span>
            <h3 class="font-bold text-base uppercase tracking-wider">
              Peringatan Prioritas Keluar & Stok Rak
            </h3>
          </div>
          <button
            @click="showFefoModal = false"
            class="text-white hover:text-gray-200 text-xl font-bold font-mono"
          >
            &times;
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-4 text-sm text-gray-600">
          <p>
            Sistem mendeteksi adanya ketidaksesuaian alokasi stok pada daftar produk yang akan
            dikeluarkan.
          </p>

          <div class="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 space-y-2">
            <p class="font-bold flex items-center gap-1">
              ⚠️ Peringatan Validasi Stok & FEFO Strict:
            </p>
            <p class="text-xs leading-relaxed">
              Transaksi tidak dapat diproses langsung karena sistem mendeteksi adanya
              <b>stok fisik yang tidak mencukupi</b> di rak pilihan Anda, atau terdapat produk
              sejenis di rak internal lain yang memiliki tanggal
              <b>Expired jauh lebih mendesak (Urgent)</b> untuk dikeluarkan terlebih dahulu.
            </p>
          </div>

          <p class="text-xs text-gray-500 italic font-medium">
            *Silakan ikuti instruksi daftar evakuasi produk urgent di bawah ini agar putaran umur
            stok gudang Anda tetap aman dan terjaga.
          </p>

          <div
            class="bg-amber-100 text-amber-900 p-3 rounded-lg text-xs font-semibold border border-amber-200 shadow-sm"
          >
            💡 <b>INFO EVAKUASI:</b> Silakan lakukan pemindahan barang yang mendekati expired atau
            barang di rak internal menuju ke <b>Loading Dock</b> terlebih dahulu sebelum memproses
            dokumen ini.
          </div>

          <div class="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-inner">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  class="bg-gray-100 text-gray-500 border-b border-gray-200 font-bold uppercase tracking-tight"
                >
                  <th class="p-3">Info Produk / SKU</th>
                  <th class="p-3 text-center">Posisi Rak Asal</th>
                  <th class="p-3 text-center">Tgl Expired</th>
                  <th class="p-3 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, idx) in fefoRecommendations"
                  :key="idx"
                  class="border-b border-gray-100 hover:bg-gray-50/50"
                >
                  <td class="p-3">
                    <div class="font-bold text-gray-800">
                      {{ item.product_name || 'Produk Keluar' }}
                    </div>
                    <div class="font-mono text-gray-400 text-[10px]">{{ item.product_sku }}</div>
                  </td>
                  <td class="p-3 text-center">
                    <span
                      class="bg-amber-100 text-amber-800 font-mono font-bold px-2 py-0.5 rounded text-[10px] border border-amber-300"
                    >
                      {{ item.current_rack_code }}
                    </span>
                  </td>
                  <td class="p-3 text-center font-medium font-mono text-gray-700">
                    {{ item.expired_at || 'Tanpa Exp' }}
                  </td>
                  <td class="p-3 text-right font-bold text-red-600 text-sm">
                    {{ item.recommended_move_qty }}
                    <span class="text-gray-400 font-normal text-xs">.</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          class="bg-gray-50 p-4 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-2"
        >
          <button
            @click="showFefoModal = false"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 transition-all font-bold text-xs order-last sm:order-none"
          >
            Batal
          </button>
          <!-- <button
            @click="(submitProdukKeluar(true), (showFefoModal = false))"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-black text-xs"
          >
            🚀 Tetap Paksa Ambil Stok LD yang Ada
          </button> -->
          <button
            @click="alihkanKePindahProduk"
            class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all font-black text-xs shadow-sm"
          >
            🚚 Pindahkan Produk ke LD Sesuai Qty
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
