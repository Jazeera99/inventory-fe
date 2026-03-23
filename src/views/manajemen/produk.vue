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
            placeholder="Cari berdasarkan SKU..."
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
      <tr
        v-for="produk in filteredProduk"
        :key="produk.id"
        :class="!produk.status && 'bg-gray-50 opacity-70'"
      >
        <td class="px-6 py-4 font-mono font-bold text-blue-600">
          {{ produk.sku }}
          <div v-if="!produk.status" class="mt-1">
            <span
              class="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded italic uppercase font-sans tracking-wider"
            >
              {{ produk.alasan || 'Tidak Aktif' }}
            </span>
          </div>
        </td>
        <td class="px-6 py-4 text-gray-700 font-medium">{{ produk.nama }}</td>
        <td class="px-6 py-4 text-gray-600">{{ produk.merk }}</td>
        <td class="px-6 py-4 text-gray-600">{{ produk.ukuran || '-' }}</td>
        <td class="px-6 py-4 text-gray-500 text-sm">{{ formatDate(produk.createdAt) }}</td>
        <td class="px-6 py-4 text-center">
          <AppStatusToggle :active="produk.status" @toggle="handleToggleStatus(produk)" />
        </td>
      </tr>

      <tr v-if="filteredProduk.length === 0">
        <td colspan="6" class="px-6 py-10 text-center text-gray-400">SKU tidak ditemukan.</td>
      </tr>
    </AppTable>

    <ProductModal
      :is-open="showModal"
      :loading="isSubmitting"
      @close="showModal = false"
      @save="onSaveProduk"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppTable from '@/components/app-table.vue'
import AppStatusToggle from '@/components/app-status-toggle.vue'
import ProductModal from '@/views/manajemen/modal/produk-modal.vue'

const headers = [
  { text: 'SKU / Keterangan' },
  { text: 'Nama' },
  { text: 'Merk' },
  { text: 'Ukuran' },
  { text: 'Tanggal Dibuat' },
  { text: 'Aksi', align: 'center' },
]

const filterSKU = ref('')
const showModal = ref(false)
const isSubmitting = ref(false)

const listProduk = ref([
  {
    id: 1,
    sku: 'A100',
    nama: 'Kecap Manis',
    merk: 'Bango',
    ukuran: '330 ml',
    status: true,
    alasan: '',
    createdAt: new Date(),
  },
  {
    id: 2,
    sku: 'A200',
    nama: 'Saos Pedas',
    merk: 'Indofood',
    ukuran: '250 ml',
    status: false,
    alasan: 'Discontinued',
    createdAt: new Date(),
  },
])

const filteredProduk = computed(() => {
  if (!filterSKU.value) return listProduk.value
  return listProduk.value.filter((p) => p.sku.toLowerCase().includes(filterSKU.value.toLowerCase()))
})

const onSaveProduk = async (formData: any) => {
  isSubmitting.value = true
  await new Promise((r) => setTimeout(r, 1000)) // Simulasi backend

  listProduk.value.unshift({
    id: Date.now(),
    ...formData,
    sku: formData.sku.toUpperCase(),
    status: true,
    alasan: '',
    createdAt: new Date(),
  })

  isSubmitting.value = false
  showModal.value = false
}

const handleToggleStatus = (produk: any) => {
  if (produk.status) {
    // Jika dari Aktif mau ke Non-Aktif, tanya alasannya
    const reason = prompt('Alasan Non-Aktif? (Contoh: Produk tidak laku, Tidak diproduksi, dsb)')
    if (reason !== null) {
      produk.status = false
      produk.alasan = reason || 'Non-Aktif'
    }
  } else {
    // Jika mau mengaktifkan kembali
    produk.status = true
    produk.alasan = ''
  }
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
</script>
