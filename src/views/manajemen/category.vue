<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppTable from '@/components/app-table.vue'
import AppStatusToggle from '@/components/app-status-toggle.vue'
import CategoryModal from '@/views/manajemen/modal/category-modal.vue'
import { useCategoryList, useCategoryCreate, useCategoryToggle } from '@/models/category'

// 1. Fitur dari Composable
const { categories, loading, getData } = useCategoryList()
const { form, submitting, submitForm } = useCategoryCreate()
const { toggle } = useCategoryToggle()

const showModal = ref(false)
const searchQuery = ref('')

const headers = [
  { text: 'Nama Kategori' },
  { text: 'Deskripsi' },
  { text: 'Tanggal Dibuat' },
  { text: 'Aksi', align: 'center' },
]

onMounted(() => {
  getData()
})

const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  const query = searchQuery.value.toLowerCase()
  return categories.value.filter(
    (c) =>
      c.category_name.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query)),
  )
})

const onSaveCategory = async (formData: any) => {
  form.category_name = formData.category_name
  form.description = formData.description

  const result = await submitForm()

  if (result) {
    showModal.value = false
    getData()
  }
}

const handleToggleStatus = async (category: Category) => {
  const result = await toggle(category.id)
  if (result !== null) {
    category.is_active = result
  }
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Daftar Kategori</h2>
        <p class="text-gray-500 text-sm">Kelola kategori produk dan status aktifnya.</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="relative w-full sm:w-64">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari Kategori..."
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

        <AppButton @click="showModal = true" variant="primary">+ Tambah Kategori</AppButton>
      </div>
    </div>

    <AppTable :headers="headers">
      <tr v-if="loading">
        <td colspan="4" class="px-6 py-10 text-center text-gray-400 italic">Sedang memuat...</td>
      </tr>

      <tr
        v-for="category in filteredCategories"
        :key="category.id"
        :class="!category.is_active && 'bg-gray-50 opacity-70'"
      >
        <td class="px-6 py-4 font-mono font-bold text-blue-600">
          {{ category.category_name }}
          <div v-if="!category.is_active" class="mt-1">
            <span
              class="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded italic uppercase font-sans tracking-wider"
            >
              TIDAK AKTIF
            </span>
          </div>
        </td>
        <td class="px-6 py-4 text-gray-700 font-medium">{{ category.description }}</td>
        <td class="px-6 py-4 text-gray-500 text-sm">{{ formatDate(category.created_at) }}</td>
        <td class="px-6 py-4 text-center">
          <AppStatusToggle :active="category.is_active" @toggle="handleToggleStatus(category)" />
        </td>
      </tr>

      <tr v-if="!loading && filteredCategories.length === 0">
        <td colspan="6" class="px-6 py-10 text-center text-gray-400">Data tidak ditemukan.</td>
      </tr>
    </AppTable>

    <CategoryModal
      :is-open="showModal"
      :loading="submitting"
      @close="showModal = false"
      @save="onSaveCategory"
    />
  </div>
</template>
