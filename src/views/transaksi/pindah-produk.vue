<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import debounce from 'lodash.debounce'
import AppButton from '@/components/app-button.vue'
import AppTableFilter from '@/components/app-table-filter.vue'
import PindahProdukRow from './modal/move/pindah-produk-row.vue'
import PindahProdukHistory from './modal/move/pindah-produk-history.vue'
import PindahProdukDetail from './modal/move/pindah-produk-detail.vue'
import { useStockTransactionCreate, useStockTransactionList } from '@/models/stock'
import { useProductLocationList } from '@/models/product-location'
import { useRackList, useRackEvacuation } from '@/models/rack'
import { useProductList } from '@/models/product'

const route = useRoute()
const router = useRouter()

const normalizeExpiredAt = (value: any): string => {
  if (value === null || value === undefined || value === '') return ''
  const raw = String(value).trim()
  const date = new Date(raw)
  if (!Number.isNaN(date.getTime())) {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
  return raw.includes('T') ? raw.split('T')[0] || '' : raw
}

const { form, errors, submitting, submitForm, addItem, removeItem, resetForm } =
  useStockTransactionCreate('MOVE')
const {
  transactions,
  loading: historyLoading,
  getData: fetchHistory,
  cancelTransaction,
} = useStockTransactionList()
const { racks, getData: fetchRacks } = useRackList()
const { products, getData: fetchProducts } = useProductList()
const { productLocations, getData: fetchLocations } = useProductLocationList()
const { fetchEvacuationContents } = useRackEvacuation()

const moveMode = ref<'FEFO' | 'OPTIMASI'>('FEFO')
const currentTab = ref<'active' | 'trash'>('active')
const tableFilters = ref({ start: '', end: '' })
const showFefoModal = ref(false)
const fefoSuggestionsData = ref<any[]>([])
const LOCAL_STORAGE_KEY_MOVE = 'draft_pindah_produk'

const openFefoWarning = (suggestions: any[]) => {
  fefoSuggestionsData.value = suggestions
  showFefoModal.value = true
}

defineExpose({ openFefoWarning })

// CARI ID RAK LOADING DOCK SECARA DINAMIS DARI DATA MASTER RACKS
const loadingDockRackId = computed(() => {
  const rawData = racks.value as any
  const rackList = Array.isArray(rawData) ? rawData : rawData?.data || []
  // Asumsi kode rak loading dock kamu adalah 'LD-01' atau mengandung kata 'LOADING'
  const found = rackList.find(
    (r: any) =>
      String(r.location_code).toUpperCase() === 'LD-01' ||
      String(r.rack_name).toUpperCase().includes('LOADING'),
  )
  return found ? found.id : null
})

const headers = computed(() => {
  if (currentTab.value === 'trash') {
    return [
      { text: 'No. Transaksi' },
      { text: 'Tanggal Pindah' },
      { text: 'User Input' },
      { text: 'Dibatalkan Oleh' },
      { text: 'Total Qty' },
    ]
  }
  return [
    { text: 'No. Transaksi' },
    { text: 'Tanggal Pindah' },
    { text: 'User' },
    { text: 'Total Qty' },
    { text: '' },
  ]
})

const loadHistoryData = async () => {
  await fetchHistory({
    type: 'MOVE',
    status: currentTab.value === 'trash' ? 'trash' : 'active',
    per_page: 10,
    start_date: tableFilters.value.start || undefined,
    end_date: tableFilters.value.end || undefined,
  })
}

const debouncedLoadHistoryData = debounce(() => loadHistoryData(), 250)

// Fungsi membersihkan seluruh inputan secara instan (sekali klik)
const clearAllMoveItems = () => {
  const konfirmasi = confirm('Apakah Anda yakin ingin mengosongkan seluruh baris perpindahan ini?')
  if (konfirmasi) {
    resetForm()
    localStorage.removeItem(LOCAL_STORAGE_KEY_MOVE)
    // Kembalikan ke 1 baris kosong bawaan
    addItem()
  }
}

// Menangkap Shortcut Keyboard (Ctrl + S) untuk simpan lokal manual sebagai cadangan
const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault() // Mencegah browser membuka menu save bawaan
    localStorage.setItem(LOCAL_STORAGE_KEY_MOVE, JSON.stringify(form.items))
    alert('Draft perpindahan barang berhasil disimpan secara lokal di browser Anda! 💾')
  }
}

watch(
  () => form.items,
  (newItems) => {
    // Jangan simpan jika form dalam kondisi kosong bawaan awal
    if (newItems.length === 1 && !newItems[0]?.product_sku && !newItems[0]?.rack_id) {
      return
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_MOVE, JSON.stringify(form.items))
  },
  { deep: true },
)

// --- LOGIKA HITUNG STOK KUMULATIF REAL-TIME ---
const getAvailableStockForLine = (index: number) => {
  const currentItem = form.items[index]
  if (!currentItem || !currentItem.product_sku || !currentItem.rack_id || !currentItem.expired_at)
    return 0

  // 1. Ambil list lokasi produk dari master data
  const locationList = Array.isArray(productLocations.value)
    ? productLocations.value
    : (productLocations.value as any)?.data || []

  // 2. Cari kapasitas stok asli untuk kombinasi SKU + Rak + Expired ini
  const matchedLocation = locationList.find(
    (loc: any) =>
      loc.product_sku === currentItem.product_sku &&
      Number(loc.rack_id) === Number(currentItem.rack_id) &&
      loc.expired_at === currentItem.expired_at,
  )

  const totalStockInRack = matchedLocation ? matchedLocation.qty : 0

  // 3. Hitung berapa qty yang sudah dipakai oleh baris LAIN SEBELUM baris ini
  const usedQtyByOthers = form.items.reduce((acc: number, item: any, idx: number) => {
    if (
      idx < index &&
      item.product_sku === currentItem.product_sku &&
      Number(item.rack_id) === Number(currentItem.rack_id) &&
      item.expired_at === currentItem.expired_at
    ) {
      return acc + Number(item.qty || 0)
    }
    return acc
  }, 0)

  // Sisa stok riil yang boleh diambil oleh baris ke-'index'
  return Math.max(0, totalStockInRack - usedQtyByOthers)
}

const getVirtualCapacityForLine = (index: number) => {
  const currentItem = form.items[index]
  if (!currentItem || !currentItem.qty || !currentItem.target_rack_id) return 0

  // 1. Ambil list master rak untuk tahu kapasitas asli dari DB
  const rackList = Array.isArray(racks.value) ? racks.value : (racks.value as any)?.data || []

  const matchedRack = rackList.find((r: any) => Number(r.id) === Number(currentItem.target_rack_id))
  // Asumsi field kapasitas di DB Anda bernama 'capacity' atau 'available_slots' (sesuaikan jika berbeda)
  const originalCapacity = matchedRack
    ? Number(matchedRack.available_slots || matchedRack.capacity || 0)
    : 0

  // 2. Hitung total Qty yang sudah dipesan oleh baris LAIN untuk rak target yang sama
  const usedByOthers = form.items.reduce((acc: number, item: any, idx: number) => {
    if (
      idx !== index && // Memeriksa baris lain
      item.target_rack_id &&
      Number(item.target_rack_id) === Number(currentItem.target_rack_id)
    ) {
      return acc + Number(item.qty || 0)
    }
    return acc
  }, 0)

  // Sisa kapasitas virtual untuk rak ini
  return Math.max(0, originalCapacity - usedByOthers)
}

onMounted(async () => {
  const stockOrderIdFromQuery = route.query.stock_order_id
  if (stockOrderIdFromQuery) {
    localStorage.setItem('active_stock_order_id', String(stockOrderIdFromQuery))
  }

  await fetchProducts()
  await fetchRacks()
  await fetchLocations()
  await loadHistoryData()
  handleSkuFromQuery()

  window.addEventListener('keydown', handleKeyDown)

  // Cek apakah ada draft lama yang tertinggal di browser
  const savedMoveDraft = localStorage.getItem(LOCAL_STORAGE_KEY_MOVE)
  if (savedMoveDraft && !route.query.evacuate_source_id && route.query.from_trigger !== 'OUT') {
    try {
      const parsedDraft = JSON.parse(savedMoveDraft)
      if (parsedDraft && parsedDraft.length > 0) {
        const mauRestore = confirm(
          'Sistem mendeteksi adanya data input perpindahan sebelumnya yang belum disimpan ke server.\n\nApakah Anda ingin melanjutkan pengisian data tersebut?',
        )
        if (mauRestore) {
          form.items = parsedDraft
          form.items.forEach((_, idx) => validateSku(idx))
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY_MOVE)
        }
      }
    } catch (err) {
      console.error('Gagal restore draft move:', err)
    }
  }

  const pendingEvacuation = localStorage.getItem('pending_evacuation_items')
  if (pendingEvacuation && route.query.from_trigger === 'OUT') {
    try {
      const items = JSON.parse(pendingEvacuation)
      if (Array.isArray(items) && items.length > 0) {
        // Paksa mode perpindahan langsung ke FEFO karena direkomendasikan sistem
        moveMode.value = 'FEFO'

        // Map data dari localStorage ke dalam form.items
        form.items = items.map((item: any) => {
          // Ambil tanggal murni (YYYY-MM-DD) jika berupa ISO string atau timestamp lengkap
          const cleanExpired: string = normalizeExpiredAt(item.expired_at) || ''

          const rawData = products.value as any
          const productList = Array.isArray(rawData) ? rawData : rawData?.data || []
          const foundProd = productList.find(
            (p: any) => String(p.sku).toUpperCase() === String(item.product_sku).toUpperCase(),
          )

          return {
            product_sku: item.product_sku,
            qty: Number(item.qty),
            expired_at: cleanExpired,
            rack_id: Number(item.from_rack_id), // Rak asal yang direkomendasikan
            target_rack_id: loadingDockRackId.value ? Number(loadingDockRackId.value) : null, // Mengunci otomatis ke LD-01
            notes: 'Persiapan FEFO Keluar (Auto Relokasi)',
            isValid: foundProd ? !!foundProd.is_active : false,
            isEvacuation: true,
            namaProduk: foundProd ? foundProd.product_name : '',
          }
        })

        // Trigger pencarian nama produk untuk visualisasi checkmark hijau
        // form.items.forEach((_, idx) => {
        //   validateSku(idx)
        // })

        // Hapus sampah data agar tidak ter-load ulang saat halaman di-refresh manual
        localStorage.removeItem('pending_evacuation_items')
        alert(
          'Sistem berhasil memuat item rekomendasi FEFO/Evakuasi ke dalam tabel perpindahan! Silakan periksa kembali lalu klik Simpan.',
        )
      }
    } catch (e) {
      console.error('Gagal memuat item relokasi FEFO:', e)
    }
  }

  const evacuateSourceId = route.query.evacuate_source_id
  if (evacuateSourceId) {
    // Paksa mode perpindahan langsung ke OPTIMASI
    moveMode.value = 'OPTIMASI'

    // Ambil semua isi produk yang ada di dalam rak tersebut dari backend
    const res = (await fetchEvacuationContents(Number(evacuateSourceId))) as any
    const responseData = res?.data ? res.data : res

    if (responseData && responseData.items && responseData.items.length > 0) {
      const sourceRackId = Number(evacuateSourceId)

      // let singleTargetRackId = responseData.recommended_target_rack_id
      //   ? Number(responseData.recommended_target_rack_id)
      //   : null

      // if (singleTargetRackId === sourceRackId) {
      //   singleTargetRackId = null
      // }
      const singleTargetRackId = responseData.recommended_target_rack_id
        ? Number(responseData.recommended_target_rack_id)
        : null

      // Masukkan datanya langsung ke form utama agar membuat baris item baru
      form.items = responseData.items.map((item: any) => {
        const cleanExpired: string = normalizeExpiredAt(item.expired_at) || ''

        return {
          product_sku: item.product_sku,
          qty: Number(item.qty),
          expired_at: cleanExpired,
          rack_id: Number(sourceRackId), // Terkunci di rak asal
          target_rack_id: singleTargetRackId, // Kosongkan agar drop-down memicu rekomendasi otomatis
          notes: `Evakuasi otomatis dari rak ${responseData.source_rack_code}`,
          isValid: true, // Bypass validasi manual karena data valid dari DB
          isEvacuation: true,
          namaProduk: '',
        }
      })

      // Jalankan validasi nama produk untuk tiap item yang berhasil di-load
      setTimeout(() => {
        form.items.forEach((_, idx) => {
          validateSku(idx)
        })
      }, 100)

      alert(
        `Sistem berhasil mendeteksi ${responseData.items.length} item dari rak asal ${responseData.source_rack_code}! Qty, Expired, dan Lokasi Asal telah terisi otomatis.`,
      )

      if (!singleTargetRackId) {
        alert(
          'Sistem tidak menemukan satu rak tunggal yang ruangnya cukup muat. Silakan pilih target lokasi secara manual.',
        )
      }
    } else {
      alert('Rak tujuan evakuasi sudah bersih atau tidak ditemukan produk aktif di dalamnya.')
    }
  }
})

// Fungsi untuk memetakan otomatis data FEFO dari backend ke form items
const handleAutoFillFefo = (suggestions: any[]) => {
  if (!suggestions || suggestions.length === 0) return

  // Paksa mode perpindahan ke FEFO
  moveMode.value = 'FEFO'

  // Map data rekomendasi langsung ke struktur form items
  form.items = suggestions.map((item: any) => {
    // Cari internal rack ID dari master racks berdasarkan rack code dari backend
    const rawRacks = racks.value as any
    const rackList = Array.isArray(rawRacks) ? rawRacks : rawRacks?.data || []
    const matchedRack = rackList.find(
      (r: any) =>
        String(r.location_code).toUpperCase() === String(item.current_rack_code).toUpperCase(),
    )

    const rawExpired = item.expired_at_raw || item.expired_at
    const cleanExpired: string = normalizeExpiredAt(rawExpired) || ''

    return {
      product_sku: item.product_sku,
      qty: Number(item.recommended_move_qty),
      // Jika backend sudah mengembalikan teks tanggal jadi seperti "16 Jan 2028",
      // pastikan formatnya dibaca string murni atau di-parse sesuai kebutuhan form input Anda
      expired_at: cleanExpired,
      rack_id: matchedRack ? Number(matchedRack.id) : Number(item.current_rack_id),
      target_rack_id: loadingDockRackId.value ? Number(loadingDockRackId.value) : null,
      notes: 'Persiapan FEFO Keluar (Auto)',
      isValid: true, // Auto bypass karena disuplai sistem
      isEvacuation: true,
      namaProduk: item.product_name || '',
    }
  })

  // Trigger validasi nama produk agar visual checkmark hijau menyala
  form.items.forEach((_, idx) => {
    validateSku(idx)
  })
}

watch(currentTab, async () => {
  await loadHistoryData()
})

const validateSku = async (index: number, manualSku?: string) => {
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
      item.namaProduk = `[PRODUK NON-AKTIF] ${found.product_name}`
      // Opsi tambahan: kamu bisa langsung mentrigger error spesifik di sini jika dibutuhkan
      return
    }
    item.isValid = true
    item.namaProduk = found.product_name

    try {
      if (typeof fetchLocations === 'function') {
        await fetchLocations()
      }
    } catch (err) {
      console.error(`Gagal memuat lokasi stok untuk SKU ${finalSku}:`, err)
    }
  } else {
    // Jika belum ketemu persis (mungkin masih ngetik), jangan langsung salahkan
    item.isValid = false
    item.namaProduk = ''
  }
}

const checkIfDuplicate = (currentItem: any, currentIndex: number) => {
  const currentSku = String(currentItem.product_sku || currentItem.produkSku || '')
    .toUpperCase()
    .trim()
  const currentQty = Number(currentItem.qty || 0)
  const currentExp = currentItem.expired_at || ''
  const currentSrcRack = currentItem.rack_id ? Number(currentItem.rack_id) : null
  const currentTargetRack = currentItem.target_rack_id ? Number(currentItem.target_rack_id) : null

  // Jangan validasi jika SKU belum terisi penuh atau belum valid
  if (!currentSku) return false

  return form.items.some((item: any, idx: number) => {
    if (idx === currentIndex) return false // Abaikan baris dirinya sendiri

    const otherSku = String(item.product_sku || item.produkSku || '')
      .toUpperCase()
      .trim()
    const otherQty = Number(item.qty || 0)
    const otherExp = item.expired_at || ''
    const otherSrcRack = item.rack_id ? Number(item.rack_id) : null
    const otherTargetRack = item.target_rack_id ? Number(item.target_rack_id) : null

    if (moveMode.value === 'FEFO') {
      // PERSIAPAN KELUAR (FEFO)
      // Kondisi 1: SKU, Qty, Expired, Rak Asal sama persis
      const isExactAll =
        otherSku === currentSku &&
        otherQty === currentQty &&
        otherExp === currentExp &&
        otherSrcRack === currentSrcRack
      // Kondisi 2: SKU, Expired, Rak Asal sama persis (walau qty beda)
      const isSameConfig =
        otherSku === currentSku && otherExp === currentExp && otherSrcRack === currentSrcRack

      return isExactAll || isSameConfig
    } else {
      // OPTIMASI RUANG (OPTIMASI)
      // Kondisi 1: SKU, Qty, Expired, Rak Asal, dan Rak Tujuan sama persis
      const isExactAll =
        otherSku === currentSku &&
        otherQty === currentQty &&
        otherExp === currentExp &&
        otherSrcRack === currentSrcRack &&
        otherTargetRack === currentTargetRack
      // Kondisi 2: SKU, Expired, Rak Asal, dan Rak Tujuan sama persis (walau qty beda)
      const isSameConfig =
        otherSku === currentSku &&
        otherExp === currentExp &&
        otherSrcRack === currentSrcRack &&
        otherTargetRack === currentTargetRack

      return isExactAll || isSameConfig
    }
  })
}

const submitPindahProduk = async () => {
  // Isi notes tiap item otomatis berdasarkan mode yang dipilih sebelum dikirim ke backend
  form.items.forEach((item) => {
    if (moveMode.value === 'FEFO') {
      item.notes = 'Persiapan FEFO Keluar'
      if (loadingDockRackId.value) {
        item.target_rack_id = Number(loadingDockRackId.value)
      }
    } else {
      // item.notes?.includes('Optimasi Ruang') || (item.notes = 'Optimasi Ruang')
    }
  })

  const isInvalid = form.items.some(
    (i) =>
      !i.isValid ||
      !i.rack_id ||
      !i.target_rack_id ||
      Number(i.rack_id) === Number(i.target_rack_id),
  )

  if (isInvalid) {
    return alert(
      'Cek kembali data! SKU harus valid, rak asal/tujuan harus diisi, dan tidak boleh rak yang sama.',
    )
  }

  if (!form.date) {
    form.date = new Date().toISOString().split('T')[0] ?? ''
  }

  // Pastikan semua expired_at sebelum submit berformat YYYY-MM-DD
  form.items = form.items.map((item: any) => ({
    ...item,
    expired_at: normalizeExpiredAt(item.expired_at),
  }))

  try {
    await submitForm()
    localStorage.removeItem(LOCAL_STORAGE_KEY_MOVE)
    alert('Perpindahan stok berhasil disimpan!')
    if (fetchLocations) {
      await fetchLocations()
    }
    resetForm()

    const fromTrigger = route.query.from_trigger
    const stockOrderId = route.query.stock_order_id

    if (fromTrigger === 'OUT') {
      // Redirect kembali ke Halaman Produk Keluar beserta ID Order-nya
      router.push({
        path: '/produk-keluar', // Sesuaikan path rute produk keluar kamu
        query: stockOrderId ? { stock_order_id: String(stockOrderId) } : {},
      })
      return
    }

    currentTab.value = 'active'
    await loadHistoryData()
  } catch (error: any) {
    console.error('Gagal pindah stok:', error)
    const responseData = error?.response?.data
    if (responseData && responseData.message) {
      // Simpan ke reactive state errors bawaan composable/form Anda
      errors.value = {
        ...errors.value,
        global: responseData.message,
      }
    } else {
      alert('Gagal menyimpan transaksi. Periksa kembali jaringan atau log sistem.')
    }
  }
}

const handleCancelTransaction = async (transactionNo: string) => {
  const konfirmasi = confirm(
    `Apakah Anda yakin ingin membatalkan transaksi ${transactionNo}?\nTindakan ini akan mengembalikan stok barang ke lokasi semula.`,
  )

  if (!konfirmasi) return

  try {
    await cancelTransaction(transactionNo)
    alert('Transaksi perpindahan berhasil dibatalkan!')
    await loadHistoryData() // Refresh list tabel otomatis
  } catch (error: any) {
    alert(
      error?.response?.data?.message || 'Gagal membatalkan transaksi, periksa stok gudang Anda.',
    )
  }
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

// 4. NAVIGASI URL (Mengubah URL tanpa reload halaman)
const openDetail = (trx: any) => {
  router.push({ query: { ...route.query, trx: trx.transaction_no } })
}

const closeDetail = () => {
  router.push({ query: { ...route.query, trx: undefined } })
}

const handleSkuFromQuery = () => {
  const skuFromUrl = route.query.sku
  if (skuFromUrl) {
    // 1. Amankan array: Jika items belum terdefinisi atau kosong, buatkan 1 baris default
    if (!form.items || form.items.length === 0) {
      addItem()
    }

    // 2. Gunakan penanda Opsional Chaining (?.) atau assertions agar TS tahu ini aman
    const firstItem = form.items[0]
    if (firstItem) {
      firstItem.product_sku = String(skuFromUrl)

      // Mengisi nilai default agar tidak parsial/undefined di mata TypeScript
      firstItem.isValid = false
      firstItem.namaProduk = ''

      // Picu fungsi validasi database lokal agar centang hijau otomatis menyala
      validateSku(0, String(skuFromUrl))
    }
  }
}

// Pantau URL jika suatu saat ada perubahan query SKU tanpa reload halaman komponen
watch(
  () => route.query.sku,
  () => {
    handleSkuFromQuery()
  },
)

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="space-y-6 p-1">
    <PindahProdukDetail
      v-if="route.query.trx"
      :trx="selectedTrx"
      :trx-no="route.query.trx"
      :loading="historyLoading"
      :racks="racks"
      @close="closeDetail"
    />

    <div v-else class="space-y-6">
      <header>
        <h1 class="text-2xl font-bold text-gray-900">Pindah Produk</h1>
        <p class="text-gray-500 text-sm italic">Relokasi stok antar rak atau area gudang.</p>
      </header>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-6">
          <h3 class="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">
            Perpindahan Produk
          </h3>
          <div
            class="mb-6 p-4 bg-orange-50/50 rounded-xl border border-orange-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <h4 class="text-xs font-bold text-orange-800 uppercase tracking-wider">
                Tujuan Perpindahan
              </h4>
              <p class="text-xs text-gray-500">Tentukan perlakuan alur rak otomatis oleh sistem.</p>
            </div>
            <div class="flex bg-gray-200/80 p-1 rounded-lg self-start sm:self-center">
              <button
                type="button"
                @click="moveMode = 'FEFO'"
                class="px-4 py-1.5 text-xs font-bold rounded-md transition-all"
                :class="
                  moveMode === 'FEFO'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                "
              >
                🚚 Persiapan Keluar
              </button>
              <button
                type="button"
                @click="moveMode = 'OPTIMASI'"
                class="px-4 py-1.5 text-xs font-bold rounded-md transition-all"
                :class="
                  moveMode === 'OPTIMASI'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                "
              >
                🧱 Optimasi Ruang
              </button>
            </div>
          </div>
          <div class="space-y-4">
            <PindahProdukRow
              v-for="(item, index) in form.items"
              :key="index"
              v-model="form.items[index]"
              :index="index"
              :errors="errors"
              :move-mode="moveMode"
              :loading-dock-id="loadingDockRackId"
              :all-products="products"
              :all-racks="racks"
              :product-locations="productLocations"
              :show-delete="form.items.length > 1"
              :form-items="form.items"
              :is-exact-duplicate="checkIfDuplicate(item, index)"
              :available-stock="getAvailableStockForLine(index)"
              :virtual-capacity="getVirtualCapacityForLine(index)"
              @remove="removeItem(index)"
              @validate="(val) => validateSku(index, val)"
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
              class="text-sm font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1"
            >
              <span>+ Tambah Item Pindah</span>
            </button>

            <button
              type="button"
              @click="clearAllMoveItems"
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
          <AppButton variant="outline" @click="resetForm">Batal</AppButton>
          <AppButton
            variant="primary"
            @click="submitPindahProduk"
            :loading="submitting"
            class="!bg-orange-600 hover:!bg-orange-700"
          >
            Simpan Perpindahan
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

        <AppTableFilter v-model="tableFilters">
          <template #title
            ><h2 class="text-lg font-bold text-gray-800">Riwayat Pindah</h2></template
          >
        </AppTableFilter>
        <PindahProdukHistory
          :data="filteredHistory"
          :headers="headers"
          :loading="historyLoading"
          :current-tab="currentTab"
          @view-detail="openDetail"
          @cancel="handleCancelTransaction"
        />
      </div>
    </div>
    <FefoCustomModal
      :show="showFefoModal"
      :recommendations="fefoSuggestionsData"
      @close="showFefoModal = false"
      @evacuate="
        (suggestions: any[]) => {
          handleAutoFillFefo(suggestions)
          showFefoModal = false
        }
      "
    />
  </div>
</template>
