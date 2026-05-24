<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppTable from '@/components/app-table.vue'
import AppStatusToggle from '@/components/app-status-toggle.vue'
import ProductModal from '@/views/manajemen/modal/produk-modal.vue'
import { useProductList, useProductToggle } from '@/models/product'

// 1. Fitur dari Composable
const { products, loading, getData } = useProductList()
const { submitToggle } = useProductToggle()

// 2. State UI
const showModal = ref(false)
const filterSKU = ref('')

// 3. Header Tabel
const headers = [
  { text: 'SKU' },
  { text: 'Nama Produk' },
  { text: 'Merk' },
  { text: 'Type' },
  { text: 'Size' },
  { text: 'Tgl Dibuat' },
  { text: 'Status', align: 'center' },
]

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

const handleToggleStatus = async (produk: any) => {
  try {
    const updated = await submitToggle(produk.sku)
    produk.is_active = updated.is_active
  } catch (error) {
    alert('Gagal mengubah status')
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('id-ID')
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
            placeholder="Cari berdasarkan SKU atau Nama..."
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

        <AppButton @click="showModal = true" variant="primary">+ Tambah Produk</AppButton>
      </div>
    </div>

    <AppTable :headers="headers">
      <tr v-if="loading">
        <td colspan="6" class="px-6 py-10 text-center text-gray-400 italic">Sedang memuat...</td>
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
        <td class="px-6 py-4 text-gray-600">{{ produk.type }}</td>
        <td class="px-6 py-4 text-gray-600">{{ produk.size }}</td>
        <td class="px-6 py-4 text-gray-500 text-sm">{{ formatDate(produk.created_at) }}</td>
        <td class="px-6 py-4 text-center">
          <AppStatusToggle :active="produk.is_active" @toggle="handleToggleStatus(produk)" />
        </td>
      </tr>

      <tr v-if="!loading && filteredProduk.length === 0">
        <td colspan="6" class="px-6 py-10 text-center text-gray-400">Data tidak ditemukan.</td>
      </tr>
    </AppTable>

    <ProductModal :is-open="showModal" @close="showModal = false" @refresh="getData" />
  </div>
</template>
