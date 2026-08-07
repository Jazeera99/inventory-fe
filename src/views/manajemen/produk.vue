<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppTable from '@/components/app-table.vue'
import AppStatusToggle from '@/components/app-status-toggle.vue'
import ProductModal from '@/views/manajemen/modal/produk-modal.vue'
import { useProductList, useProductToggle } from '@/models/product'
import fmtDate from '@/functions/fmt/date'
import { useAuthStore } from '@/stores/auth'

// Fitur dari Composable
const { products, loading, getData } = useProductList()
const { submitToggle } = useProductToggle()
const authStore = useAuthStore()

// State UI
const showModal = ref(false)
const filterSKU = ref('')
const selectedProduct = ref<any>(null)

const showStockAlertModal = ref(false)
const stockErrorData = ref<{
  sku: string
  product_name: string
  total_qty: number
  stocks: Array<{ location_code: string; qty: number; expired_at: string }>
} | null>(null)

const formatRupiah = (val: number | string | undefined | null) => {
  if (val === null || val === undefined || val === '') return 'Rp 0,00'
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (isNaN(num)) return 'Rp 0,00'
  return (
    'Rp ' +
    new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  )
}

const headers = computed(() => {
  const baseHeaders = [
    { text: 'SKU' },
    { text: 'Nama Produk', align: 'center' },
    { text: 'Merk', align: 'center' },
    { text: 'Tipe', align: 'center' },
    { text: 'Ukuran', align: 'center' },
    { text: 'Kemasan', align: 'center' },
  ]
  if (authStore.hasPermission('Daftar Produk')) {
    baseHeaders.push(
      { text: 'Harga Beli', align: 'center', class: 'min-w-[130px] whitespace-nowrap' },
      { text: 'Harga Jual', align: 'center', class: 'min-w-[130px] whitespace-nowrap' },
    )
  }

  baseHeaders.push(
    { text: 'Min Stock', align: 'center' },
    { text: 'Tgl Dibuat', align: 'center' },
    { text: 'Status', align: 'center' },
  )

  if (authStore.hasPermission('Daftar Produk')) {
    baseHeaders.push({ text: 'Aksi', align: 'center' })
  }

  return baseHeaders
})

onMounted(() => {
  getData()
})

// 4. Logika Filter
const filteredProduk = computed(() => {
  if (!filterSKU.value) return products.value
  const q = filterSKU.value.toLowerCase()
  return products.value.filter(
    (p) => p.sku.toLowerCase().includes(q) || p.product_name.toLowerCase().includes(q),
  )
})

const openCreateModal = () => {
  selectedProduct.value = null
  showModal.value = true
}

// Trigger Edit Produk Tertentu
const openEditModal = (produk: any) => {
  selectedProduct.value = produk
  showModal.value = true
}

// Tutup Modal & Bersihkan State
const closeModal = () => {
  showModal.value = false
  selectedProduct.value = null
}

const handleToggleStatus = async (produk: any) => {
  try {
    const response = await submitToggle(produk.sku)
    produk.is_active = response.is_active
  } catch (error: any) {
    // Tangkap data error response dari backend (status code 422)
    const errData = error?.response?.data?.data

    if (errData && errData.stocks) {
      stockErrorData.value = errData
      showStockAlertModal.value = true
    } else {
      alert(error?.response?.data?.message || 'Gagal mengubah status produk. Silakan coba lagi.')
    }
  }
}

const closeStockAlert = () => {
  showStockAlertModal.value = false
  stockErrorData.value = null
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Daftar Produk</h2>
        <p class="text-gray-500 text-sm">Kelola spesifikasi SKU dan status ketersediaan barang.</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="relative w-full sm:w-64">
          <input
            v-model="filterSKU"
            type="text"
            placeholder="Cari berdasarkan SKU atau Nama"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <svg
            class="w-4 h-4 text-gray-400 absolute left-3 top-3"
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

        <AppButton
          v-if="authStore.hasPermission('Daftar Produk')"
          @click="openCreateModal"
          variant="primary"
        >
          + Tambah Produk
        </AppButton>
      </div>
    </div>

    <AppTable :headers="headers">
      <tr v-if="loading">
        <td colspan="10" class="px-6 py-10 text-center text-gray-400 italic">Sedang memuat...</td>
      </tr>

      <tr
        v-for="produk in filteredProduk"
        :key="produk.sku"
        :class="!produk.is_active && 'bg-gray-50 opacity-70'"
      >
        <td class="px-6 py-4 font-mono font-bold text-blue-600">
          {{ produk.sku }}
          <div v-if="!produk.is_active" class="mt-1">
            <span
              class="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded italic uppercase font-sans tracking-wider"
            >
              TIDAK AKTIF
            </span>
          </div>
        </td>
        <td class="px-6 py-4 text-gray-700 font-medium">{{ produk.product_name }}</td>
        <td class="px-6 py-4 text-gray-600">{{ produk.brand }}</td>
        <td class="px-6 py-4 text-gray-600">{{ produk.type || '-' }}</td>
        <td class="px-6 py-4 text-gray-600">{{ produk.size || '-' }}</td>
        <td class="px-6 py-4 text-gray-600">{{ produk.packaging || '-' }}</td>
        <template v-if="authStore.hasPermission('Daftar Produk')">
          <td class="px-6 py-4 text-right font-mono text-gray-700 whitespace-nowrap min-w-[130px]">
            {{ formatRupiah(produk.pricing?.purchase_price ?? produk.purchase_price) }}
          </td>
          <td
            class="px-6 py-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap min-w-[130px]"
          >
            {{ formatRupiah(produk.pricing?.selling_price ?? produk.selling_price) }}
          </td>
        </template>
        <td class="px-6 py-4 text-center text-gray-600">{{ produk.min_stock }}</td>
        <td class="px-6 py-4 text-gray-500 text-sm">
          {{ fmtDate.date(new Date(produk.created_at), 'dd MMMM yyyy') }}
        </td>
        <td class="px-6 py-4 text-center">
          <AppStatusToggle
            v-if="authStore.hasPermission('Daftar Produk')"
            :active="produk.is_active"
            @toggle="handleToggleStatus(produk)"
          />
          <span
            v-else
            :class="produk.is_active ? 'text-green-600 bg-green-100' : 'text-gray-500 bg-gray-100'"
            class="text-xs px-2.5 py-1 rounded-full font-medium"
          >
            {{ produk.is_active ? 'Aktif' : 'Non-Aktif' }}
          </span>
        </td>
        <td v-if="authStore.hasPermission('Daftar Produk')" class="px-6 py-4 text-center">
          <button
            v-if="authStore.hasPermission('Daftar Produk')"
            @click="produk.is_active ? openEditModal(produk) : null"
            :disabled="!produk.is_active"
            :class="[
              'inline-flex items-center gap-1 text-sm font-semibold transition-colors',
              produk.is_active
                ? 'text-blue-600 hover:text-blue-800'
                : 'text-gray-400 cursor-not-allowed opacity-50',
            ]"
            :title="produk.is_active ? 'Edit Produk' : 'Produk tidak aktif tidak dapat diedit'"
            type="button"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </button>
        </td>
      </tr>

      <tr v-if="!loading && filteredProduk.length === 0">
        <td :colspan="headers.length" class="px-6 py-10 text-center text-gray-400">
          Data tidak ditemukan.
        </td>
      </tr>
    </AppTable>

    <ProductModal
      :is-open="showModal"
      :product-data="selectedProduct"
      @close="closeModal"
      @refresh="getData"
    />

    <!-- MODAL PERINGATAN STOK AKTIF -->
    <div
      v-if="showStockAlertModal && stockErrorData"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
    >
      <div
        class="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-4"
      >
        <!-- Header Modal -->
        <div class="flex items-center gap-3 text-red-600 border-b pb-3">
          <div class="p-2 bg-red-100 rounded-full">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-900">Gagal Menonaktifkan</h3>
            <p class="text-xs text-red-500 font-semibold">
              Produk masih memiliki stok aktif di gudang!
            </p>
          </div>
        </div>

        <!-- Info Produk -->
        <div class="bg-gray-50 p-3 rounded-lg border text-xs space-y-1">
          <p class="text-gray-500">
            Produk: <span class="font-bold text-gray-800">{{ stockErrorData.product_name }}</span>
          </p>
          <p class="text-gray-500">
            SKU: <span class="font-mono font-bold text-blue-600">{{ stockErrorData.sku }}</span>
          </p>
          <p class="text-gray-500">
            Total Sisa Qty:
            <span class="font-bold text-red-600 text-sm">{{ stockErrorData.total_qty }} Unit</span>
          </p>
        </div>

        <!-- Table Rincian Stok Rak & Expired -->
        <div>
          <p class="text-xs font-bold text-gray-600 mb-2">Rincian Lokasi Stok & Expired Date:</p>
          <div class="max-h-48 overflow-y-auto border rounded-lg">
            <table class="w-full text-left text-xs">
              <thead class="bg-gray-100 text-gray-600 font-bold sticky top-0">
                <tr>
                  <th class="px-3 py-2">Lokasi Rak</th>
                  <th class="px-3 py-2 text-center">Qty</th>
                  <th class="px-3 py-2 text-right">Expired Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="(st, idx) in stockErrorData.stocks" :key="idx" class="hover:bg-gray-50">
                  <td class="px-3 py-2 font-mono font-bold text-gray-800">
                    {{ st.location_code }}
                  </td>
                  <td class="px-3 py-2 text-center font-bold text-blue-600">{{ st.qty }}</td>
                  <td class="px-3 py-2 text-right text-gray-500 font-mono">{{ st.expired_at }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Action Button -->
        <div class="pt-2 flex justify-end">
          <button
            @click="closeStockAlert"
            type="button"
            class="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs rounded-lg transition-colors"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
