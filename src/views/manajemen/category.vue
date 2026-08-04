<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppTable from '@/components/app-table.vue'
import AppStatusToggle from '@/components/app-status-toggle.vue'
import CategoryModal from '@/views/manajemen/modal/category-modal.vue'
import fmtDate from '@/functions/fmt/date'
import {
  useCategoryList,
  useCategoryCreate,
  useCategoryEdit,
  useCategoryToggle,
} from '@/models/category'
import { useAuthStore } from '@/stores/auth'

// 1. Fitur dari Composable
const { categories, loading, getData } = useCategoryList()
const {
  form: createForm,
  submitting: creating,
  submitForm: submitCreate,
  errors: createErrors,
} = useCategoryCreate()
const {
  form: editForm,
  submitting: updating,
  submitForm: submitUpdate,
  errors: editErrors,
} = useCategoryEdit()
const { toggle } = useCategoryToggle()
const authStore = useAuthStore()
const showModal = ref(false)
const searchQuery = ref('')
const selectedCategory = ref<any | null>(null)
const modalSubmitting = computed(() => creating.value || updating.value)
const modalErrors = computed(() => {
  return selectedCategory.value ? editErrors.value : createErrors.value
})

const headers = computed(() => {
  const baseHeaders = [
    { text: 'Nama Kategori' },
    { text: 'Deskripsi', align: 'center' },
    { text: 'Tanggal Dibuat', align: 'center' },
  ]

  if (authStore.hasPermission('Daftar Kategori')) {
    baseHeaders.push({ text: 'Aksi', align: 'center' })
  }

  return baseHeaders
})

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

const openEditModal = (category: any) => {
  editErrors.value = {}
  selectedCategory.value = category
  showModal.value = true
}

const openCreateModal = () => {
  // Bersihkan sisa error lama sebelum membuka modal tambah baru
  createErrors.value = {}
  editErrors.value = {}
  selectedCategory.value = null
  showModal.value = true
}

const onSaveCategory = async (formData: any) => {
  if (selectedCategory.value) {
    // Mode EDIT data
    editForm.category_name = formData.category_name
    editForm.description = formData.description

    const result = await submitUpdate(selectedCategory.value.id)
    if (result) {
      showModal.value = false
      selectedCategory.value = null
      getData()
    }
  } else {
    // Mode TAMBAH data baru
    createForm.category_name = formData.category_name
    createForm.description = formData.description

    const result = await submitCreate()
    if (result) {
      showModal.value = false
      getData()
    }
  }
}

const handleToggleStatus = async (category: Category) => {
  const result = await toggle(category.id)
  if (result !== null) {
    category.is_active = result
  }
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
            placeholder="Cari Kategori"
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
          v-if="authStore.hasPermission('Daftar Kategori')"
          @click="showModal = true"
          variant="primary"
        >
          + Tambah Kategori
        </AppButton>
      </div>
    </div>

    <AppTable :headers="headers">
      <tr v-if="loading">
        <td colspan="6" class="px-6 py-10 text-center text-gray-400 italic">Sedang memuat...</td>
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
        <td class="px-6 py-4 text-gray-500 text-sm text-center">
          {{ fmtDate.date(new Date(category.created_at), 'dd MMMM yyyy') }}
        </td>
        <!-- <td class="px-6 py-4 text-center">
          <AppStatusToggle
            v-if="authStore.hasPermission('Daftar Kategori')"
            :active="category.is_active"
            @toggle="handleToggleStatus(category)"
          />
          <span
            v-else
            :class="
              category.is_active ? 'text-green-600 bg-green-100' : 'text-gray-500 bg-gray-100'
            "
            class="text-xs px-2.5 py-1 rounded-full font-medium"
          >
            {{ category.is_active ? 'Aktif' : 'Non-Aktif' }}
          </span>
        </td> -->
        <td v-if="authStore.hasPermission('Daftar Kategori')" class="px-6 py-4 text-center">
          <button
            v-if="authStore.hasPermission('Daftar Kategori')"
            @click="openEditModal(category)"
            class="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            title="Edit Kategori"
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
          <span v-else class="text-gray-400">-</span>
        </td>
      </tr>

      <tr v-if="!loading && filteredCategories.length === 0">
        <td :colspan="headers.length" class="px-6 py-10 text-center text-gray-400">
          Data tidak ditemukan.
        </td>
      </tr>
    </AppTable>

    <CategoryModal
      :is-open="showModal"
      :loading="modalSubmitting"
      :category="selectedCategory"
      :errors="modalErrors"
      @close="showModal = false"
      @save="onSaveCategory"
    />
  </div>
</template>
