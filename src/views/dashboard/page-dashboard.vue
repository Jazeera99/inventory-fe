<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/functions/api'
import { useDashboardSummary } from '@/models/dashboard'
import TransaksiTerbaru from '@/views/dashboard/modal/new-transaction.vue'
import DashboardSearch from '@/views/dashboard/modal/DashboardSearch.vue'

const api = useApi()

// Inisialisasi Composable Dashboard
const { cards, stokPerProduk, transaksiTerbaru, stokMenipis, loading, getSummary } =
  useDashboardSummary()

// State Fitur Cari Sebaran Stok Produk Fisik
// const searchSku = ref('')
// const searchResult = ref<any[] | null>(null)
// const isSearched = ref(false)
// const searching = ref(false)

// const handleSearchStok = async () => {
//   if (!searchSku.value.trim()) {
//     searchResult.value = null
//     isSearched.value = false
//     return
//   }

//   try {
//     searching.value = true
//     // Memanfaatkan parameter api lokasi yang sudah mendukung parameter 'search'
//     const res = await api.GET<any>('admin/product-locations', {
//       per_page: 'all',
//       search: searchSku.value.trim(),
//     })

//     if (res && res.data && res.data.length > 0) {
//       searchResult.value = res.data
//     } else {
//       searchResult.value = [] // Menandakan tidak ditemukan
//     }
//     isSearched.value = true
//   } catch (err) {
//     console.error('Pencarian sebaran stok gagal:', err)
//     searchResult.value = []
//     isSearched.value = true
//   } finally {
//     searching.value = false
//   }
// }

// const clearSearch = () => {
//   searchSku.value = ''
//   searchResult.value = null
//   isSearched.value = false
// }

// Konfigurasi native tooltip string text (\n memisahkan baris baru saat hover)
const tooltipStokText = computed(() => {
  if (stokPerProduk.value.length === 0) return 'Tidak ada data stok'
  return stokPerProduk.value.map((p) => `${p.sku} - ${p.nama}: ${p.stok}`).join('\n')
})

const formatDate = (date: any) =>
  new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

// Jalur klasifikasi mapping class badge tipe transaksi mutasi
const tipeClass = (tipe: string) => {
  const classes: any = {
    IN: 'badge-success',
    OUT: 'badge-danger',
    MOVE: 'badge-info',
    ADJUSTMENT: 'badge-warning',
  }
  return classes[tipe] || 'bg-gray-100'
}
const tipeIconClass = (tipe: string) => {
  const classes: any = {
    IN: 'bg-green-100',
    OUT: 'bg-red-100',
    MOVE: 'bg-blue-100',
    ADJUSTMENT: 'bg-yellow-100',
  }
  return classes[tipe] || 'bg-gray-100'
}
const tipeIconColor = (tipe: string) => {
  const colors: any = {
    IN: 'text-green-600',
    OUT: 'text-red-600',
    MOVE: 'text-blue-600',
    ADJUSTMENT: 'text-yellow-600',
  }
  return colors[tipe] || 'text-gray-600'
}
const tipeIconPath = (tipe: string) => {
  const paths: any = {
    IN: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
    OUT: 'M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14v-6a2 2 0 00-2-2h-2m-4 0H8m4 0V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2z',
    MOVE: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    ADJUSTMENT:
      'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
  }
  return paths[tipe] || ''
}

onMounted(() => {
  getSummary()
})
</script>

<template>
  <div class="p-6 text-left">
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600">Selamat datang kembali, Admin!</p>
      </div>
      <button @click="getSummary" :disabled="loading" class="btn btn-outline btn-sm">
        {{ loading ? 'Memperbarui...' : '🔄 Refresh Data' }}
      </button>
    </div>

    <div
      v-if="loading && cards.totalProduk === 0"
      class="text-center py-12 text-gray-500 font-medium"
    >
      Sedang menyinkronkan data dengan server...
    </div>

    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <AppStatcard
          title="Total Produk"
          :value="cards.totalProduk"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        >
          <template #icon>
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </template>
        </AppStatcard>

        <AppStatcard
          title="Total Lokasi (Rak)"
          :value="cards.totalRak"
          iconBg="bg-green-100"
          iconColor="text-green-600"
        >
          <template #icon>
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </template>
        </AppStatcard>

        <AppStatcard
          title="Total Stok"
          :value="cards.totalStok"
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          class="cursor-help"
        >
          <template #icon>
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-width="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </template>
        </AppStatcard>

        <AppStatcard
          title="Transaksi Hari Ini"
          :value="cards.transaksiHariIni"
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        >
          <template #icon>
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </template>
        </AppStatcard>
      </div>

      <DashboardSearch :stok-per-produk="stokPerProduk" />

      <div class="grid grid-cols-1 gap-6 mb-6">
        <TransaksiTerbaru
          :data="transaksiTerbaru"
          :formatDate="formatDate"
          :getIconBg="tipeIconClass"
          :getIconColor="tipeIconColor"
          :getIconPath="tipeIconPath"
          :getBadgeClass="tipeClass"
        />
      </div>

      <div class="base-card">
        <h3 class="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
          ⚠️ Peringatan Stok
        </h3>
        <div class="overflow-x-auto">
          <table class="table w-full border-collapse">
            <thead>
              <tr class="border-b border-gray-200 bg-slate-50 text-gray-600 text-sm">
                <th class="p-3 text-left font-semibold">Informasi Produk</th>
                <th class="p-3 text-right font-semibold">Jumlah Stok</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in stokMenipis"
                :key="item.id"
                class="border-b last:border-0 hover:bg-slate-50/50 transition"
              >
                <td class="p-3">
                  <span class="font-bold text-sm text-slate-800 block">{{ item.produkSku }}</span>
                  <span class="text-xs text-slate-500 block max-w-xs truncate">
                    {{ item.produkNama }}
                  </span>
                </td>

                <td class="p-3 text-right">
                  <span
                    class="font-bold text-sm text-red-600 bg-red-50 px-2.5 py-1 rounded border border-red-100"
                  >
                    {{ item.quantity }}
                  </span>
                </td>
              </tr>

              <tr v-if="stokMenipis.length === 0">
                <td colspan="3" class="p-6 text-center text-gray-400 font-medium">
                  Seluruh stok produk aman di semua rak penempatan.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
