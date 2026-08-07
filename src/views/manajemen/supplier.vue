<!-- views/manajemen/supplier.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppTable from '@/components/app-table.vue'
import AppStatusToggle from '@/components/app-status-toggle.vue'
import SupplierModal from '@/views/manajemen/modal/supplier-modal.vue'
import fmtDate from '@/functions/fmt/date'
import {
  useSupplierList,
  useSupplierCreate,
  useSupplierEdit,
  useSupplierToggle,
} from '@/models/supplier'
import { useAuthStore } from '@/stores/auth'

// Composable (Mengikuti struktur composable category)
const { suppliers, loading, getData } = useSupplierList()
const {
  form: createForm,
  submitting: creating,
  submitForm: submitCreate,
  errors: createErrors,
} = useSupplierCreate()

const {
  form: editForm,
  submitting: updating,
  submitForm: submitUpdate,
  errors: editErrors,
} = useSupplierEdit()

const { toggle } = useSupplierToggle()
const authStore = useAuthStore()

// State UI
const showModal = ref(false)
const searchQuery = ref('')
const selectedSupplier = ref<any | null>(null)

const modalSubmitting = computed(() => creating.value || updating.value)
const modalErrors = computed(() => {
  return selectedSupplier.value ? editErrors.value : createErrors.value
})

const headers = computed(() => {
  const baseHeaders = [
    { text: 'Nama Supplier' },
    { text: 'No. Telepon', align: 'center' },
    { text: 'Alamat', align: 'center' },
    { text: 'Tanggal Dibuat', align: 'center' },
    { text: 'Status', align: 'center' },
  ]

  if (authStore.hasPermission('Daftar Supplier')) {
    baseHeaders.push({ text: 'Aksi', align: 'center' })
  }

  return baseHeaders
})

onMounted(() => {
  getData()
})

const filteredSuppliers = computed(() => {
  if (!searchQuery.value) return suppliers.value
  const query = searchQuery.value.toLowerCase()
  return suppliers.value.filter(
    (s) =>
      s.supplier_name.toLowerCase().includes(query) ||
      (s.phone && s.phone.toLowerCase().includes(query)) ||
      (s.address && s.address.toLowerCase().includes(query)),
  )
})

const openCreateModal = () => {
  createErrors.value = {}
  editErrors.value = {}
  selectedSupplier.value = null
  showModal.value = true
}

const openEditModal = (supplier: any) => {
  editErrors.value = {}
  selectedSupplier.value = supplier
  showModal.value = true
}

const onSaveSupplier = async (formData: any) => {
  if (selectedSupplier.value) {
    // Mode EDIT
    editForm.supplier_name = formData.supplier_name
    editForm.phone = formData.phone
    editForm.address = formData.address

    const result = await submitUpdate(selectedSupplier.value.id)
    if (result) {
      showModal.value = false
      selectedSupplier.value = null
      getData()
    }
  } else {
    // Mode TAMBAH
    createForm.supplier_name = formData.supplier_name
    createForm.phone = formData.phone
    createForm.address = formData.address

    const result = await submitCreate()
    if (result) {
      showModal.value = false
      getData()
    }
  }
}

const handleToggleStatus = async (supplier: any) => {
  const result = await toggle(supplier.id)

  // result bernilai boolean (true/false) atau null jika error
  if (result !== null) {
    await getData()
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Daftar Supplier</h2>
        <p class="text-gray-500 text-sm">Kelola daftar pemasok/vendor barang ke gudang.</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="relative w-full sm:w-64">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari Supplier..."
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
          v-if="authStore.hasPermission('Daftar Supplier')"
          @click="openCreateModal"
          variant="primary"
        >
          + Tambah Supplier
        </AppButton>
      </div>
    </div>

    <AppTable :headers="headers">
      <tr v-if="loading">
        <td :colspan="headers.length" class="px-6 py-10 text-center text-gray-400 italic">
          Sedang memuat data supplier...
        </td>
      </tr>

      <tr
        v-for="supplier in filteredSuppliers"
        :key="supplier.id"
        :class="!supplier.is_active && 'bg-gray-50 opacity-70'"
      >
        <td class="px-6 py-4 font-bold text-gray-800">
          {{ supplier.supplier_name }}
          <div v-if="!supplier.is_active" class="mt-1">
            <span
              class="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded italic uppercase font-sans tracking-wider"
            >
              NON-AKTIF
            </span>
          </div>
        </td>
        <td class="px-6 py-4 text-gray-600 text-center font-mono">
          {{ supplier.phone || '-' }}
        </td>
        <td class="px-6 py-4 text-gray-600 text-center">
          {{ supplier.address || '-' }}
        </td>
        <td class="px-6 py-4 text-gray-500 text-sm text-center">
          {{ fmtDate.date(new Date(supplier.created_at), 'dd MMMM yyyy') }}
        </td>
        <td class="px-6 py-4 text-center">
          <AppStatusToggle
            v-if="authStore.hasPermission('Daftar Supplier')"
            :active="supplier.is_active"
            @toggle="handleToggleStatus(supplier)"
          />
          <span
            v-else
            :class="
              supplier.is_active ? 'text-green-600 bg-green-100' : 'text-gray-500 bg-gray-100'
            "
            class="text-xs px-2.5 py-1 rounded-full font-medium"
          >
            {{ supplier.is_active ? 'Aktif' : 'Non-Aktif' }}
          </span>
        </td>
        <td v-if="authStore.hasPermission('Daftar Supplier')" class="px-6 py-4 text-center">
          <button
            @click="supplier.is_active ? openEditModal(supplier) : null"
            :disabled="!supplier.is_active"
            :class="[
              'inline-flex items-center gap-1 text-sm font-semibold transition-colors',
              supplier.is_active
                ? 'text-blue-600 hover:text-blue-800'
                : 'text-gray-400 cursor-not-allowed opacity-50',
            ]"
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

      <tr v-if="!loading && filteredSuppliers.length === 0">
        <td :colspan="headers.length" class="px-6 py-10 text-center text-gray-400">
          Data supplier tidak ditemukan.
        </td>
      </tr>
    </AppTable>

    <SupplierModal
      :is-open="showModal"
      :loading="modalSubmitting"
      :supplier="selectedSupplier"
      :errors="modalErrors"
      @close="showModal = false"
      @save="onSaveSupplier"
    />
  </div>
</template>
