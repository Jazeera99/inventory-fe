<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  stokPerProduk: any[]
  //item: StockLedgerItem
}>()

const searchInput = ref('')
const isDropdownOpen = ref(false)
const selectedProduct = ref<any | null>(null)
const searchContainer = ref<HTMLElement | null>(null)
const expiryFilterDate = ref('')

const filteredProducts = computed(() => {
  const query = searchInput.value.toLowerCase().trim()
  if (!query) return []
  return props.stokPerProduk
    .filter((p) => p.sku.toLowerCase().includes(query) || p.nama.toLowerCase().includes(query))
    .slice(0, 5) // Batasi 5 rekomendasi teratas agar rapi
})

// Memfilter data berdasarkan inputan user (Bisa ketik nama produk atau SKU)
const filteredSebaran = computed(() => {
  if (!selectedProduct.value || !selectedProduct.value.sebaran) return []

  // Jika user tidak memilih tanggal filter, tampilkan semua sebaran rak
  if (!expiryFilterDate.value) return selectedProduct.value.sebaran

  //const filterTime = new Date(expiryFilterDate.value).getTime()

  return selectedProduct.value.sebaran.filter((loc: any) => {
    if (!loc.expiredAt) return false // Jika rak tersebut tidak ada tanggal expired, sembunyikan saat filter aktif
    return loc.expiredAt === expiryFilterDate.value
  })
})

const selectProduct = (prod: any) => {
  selectedProduct.value = prod
  searchInput.value = prod.sku // Tampilkan SKU terpilih di input box
  isDropdownOpen.value = false
  expiryFilterDate.value = ''
}

const clearSearch = () => {
  searchInput.value = ''
  selectedProduct.value = null
  isDropdownOpen.value = false
  expiryFilterDate.value = ''
}

const formatExpiryLabel = (dateStr: string | null) => {
  if (!dateStr) return 'Tanpa Expired'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// const availableExpiryOptions = computed(() => {
//   if (!selectedProduct.value || !selectedProduct.value.sebaran) return []

//   const dates = selectedProduct.value.sebaran
//     .map((loc: any) => loc.expiredAt)
//     .filter((date: any): date is string => Boolean(date))

//   // Hilangkan duplikasi tanggal
//   return Array.from(new Set(dates))
// })

const availableExpiryOptions = computed<string[]>(() => {
  if (!selectedProduct.value || !selectedProduct.value.sebaran) return []

  const dates = selectedProduct.value.sebaran
    .map((loc: any) => loc.expiredAt)
    .filter((date: any): date is string => Boolean(date))

  return Array.from(new Set(dates))
})

// Cek status kedekatan expired (untuk indikator warna)
const getExpiryStatusClass = (dateStr: string | null) => {
  if (!dateStr) return 'text-slate-400 bg-slate-50'
  const diffTime = new Date(dateStr).getTime() - new Date().getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'text-red-600 bg-red-50 border-red-100' // Lewat expired
  if (diffDays <= 30) return 'text-amber-600 bg-amber-50 border-amber-100' // Menipis < 30 hari
  return 'text-emerald-600 bg-emerald-50 border-emerald-100'
}

// Menutup dropdown otomatis jika user klik di luar area search container
const handleClickOutside = (event: MouseEvent) => {
  if (searchContainer.value && !searchContainer.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div
    ref="searchContainer"
    class="base-card mb-6 relative overflow-visible border border-slate-100 shadow-sm bg-gradient-to-br from-white to-slate-50/50"
  >
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <h3 class="text-lg font-bold flex items-center gap-2 text-slate-800">
        <span class="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">🔍</span>
        Cari Sebaran & Kontrol Expired Produk
      </h3>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-20">
      <div class="relative md:col-span-2">
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
          >Nama Produk / SKU</label
        >
        <div class="relative flex items-center group">
          <span
            class="absolute left-3.5 text-slate-400 group-focus-within:text-indigo-500 transition"
          >
            📦
          </span>
          <input
            v-model="searchInput"
            type="text"
            placeholder="Masukkan SKU / ketik nama barang..."
            class="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl shadow-inner text-sm font-medium transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/80 placeholder:text-slate-400"
            @input="((isDropdownOpen = true), (selectedProduct = null))"
            @focus="isDropdownOpen = true"
          />
          <button
            v-if="searchInput"
            type="button"
            class="absolute right-3.5 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 text-xs font-bold transition"
            @click="clearSearch"
          >
            ✕
          </button>
        </div>

        <ul
          v-if="isDropdownOpen && filteredProducts.length > 0"
          class="absolute z-50 left-0 w-full bg-white border border-slate-200 mt-2 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-100 backdrop-blur-md"
        >
          <li
            v-for="prod in filteredProducts"
            :key="prod.sku"
            class="p-3 hover:bg-indigo-50/60 cursor-pointer text-left transition flex flex-col gap-0.5"
            @click="selectProduct(prod)"
          >
            <span class="font-bold text-sm text-indigo-600 tracking-wide">{{ prod.sku }}</span>
            <span class="text-xs text-slate-600 font-medium line-clamp-1">{{ prod.nama }}</span>
          </li>
        </ul>

        <div
          v-if="
            isDropdownOpen &&
            searchInput.trim() &&
            filteredProducts.length === 0 &&
            !selectedProduct
          "
          class="absolute z-50 left-0 w-full bg-white border border-slate-200 mt-2 rounded-xl shadow-2xl p-4 text-center text-sm text-slate-400 font-medium"
        >
          ❌ Produk / SKU tidak terdaftar.
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
          >Filter Stok Expired</label
        >
        <div class="relative flex items-center">
          <select
            v-model="expiryFilterDate"
            :disabled="!selectedProduct"
            class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium transition-all focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/80 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed appearance-none"
          >
            <option value="">Semua Tanggal Expired</option>
            <option v-for="dateOpt in availableExpiryOptions" :key="dateOpt" :value="dateOpt">
              Expired: {{ formatExpiryLabel(dateOpt) }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div
      v-if="selectedProduct"
      class="mt-6 border-t border-slate-100 pt-5 relative z-10 animate-fade-in"
    >
      <div
        class="mb-4 bg-white border border-slate-100 p-3 rounded-xl flex items-center justify-between shadow-sm"
      >
        <div>
          <span
            class="text-[10px] font-bold text-indigo-600 bg-indigo-50/80 border border-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wider"
          >
            SKU: {{ selectedProduct.sku }}
          </span>
          <h4 class="font-bold text-slate-800 text-sm mt-1">{{ selectedProduct.nama }}</h4>
        </div>
        <div class="text-right">
          <span class="text-xs text-slate-400 block font-medium">Total Stok Global</span>
          <span class="text-base font-black text-slate-700">{{ selectedProduct.stok }}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div
          v-for="loc in filteredSebaran"
          :key="loc.id"
          class="p-4 bg-white border border-slate-150 rounded-2xl flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all duration-200 group"
        >
          <div>
            <div class="flex justify-between items-start mb-2">
              <div>
                <span class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider"
                  >Lokasi Rak</span
                >
                <span
                  class="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition"
                  >{{ loc.kodeLokasi }}</span
                >
              </div>
              <div class="text-right">
                <span class="block text-[9px] text-slate-400 font-bold uppercase tracking-wider"
                  >Expired Date</span
                >
                <span
                  class="text-xs font-bold px-2 py-0.5 rounded border block mt-0.5"
                  :class="getExpiryStatusClass(loc.expiredAt)"
                >
                  {{ formatExpiryLabel(loc.expiredAt) }}
                </span>
              </div>
            </div>
          </div>

          <div
            class="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 text-xs"
          >
            <span class="text-slate-500 font-medium">Stok di Rak ini:</span>
            <span
              class="font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm"
            >
              {{ loc.qty }}
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="filteredSebaran.length === 0"
        class="p-8 text-center text-sm font-medium text-slate-400 bg-white border border-dashed rounded-2xl mt-2"
      >
        📭 Tidak ada stok di rak untuk filter tanggal ini.
      </div>
    </div>
  </div>
</template>
