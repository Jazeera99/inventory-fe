<!-- views/manajemen/customer.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppTable from '@/components/app-table.vue'
import AppStatusToggle from '@/components/app-status-toggle.vue'
import CustomerModal from '@/views/manajemen/modal/customer-modal.vue'
import fmtDate from '@/functions/fmt/date'
import {
  useCustomerList,
  useCustomerCreate,
  useCustomerEdit,
  useCustomerToggle,
} from '@/models/customer'
import { useAuthStore } from '@/stores/auth'

// Composable
const { customers, loading, getData } = useCustomerList()
const {
  form: createForm,
  submitting: creating,
  submitForm: submitCreate,
  errors: createErrors,
} = useCustomerCreate()

const {
  form: editForm,
  submitting: updating,
  submitForm: submitUpdate,
  errors: editErrors,
} = useCustomerEdit()

const { toggle } = useCustomerToggle()
const authStore = useAuthStore()

// State UI
const showModal = ref(false)
const searchQuery = ref('')
const selectedCustomer = ref<any | null>(null)

const modalSubmitting = computed(() => creating.value || updating.value)
const modalErrors = computed(() => {
  return selectedCustomer.value ? editErrors.value : createErrors.value
})

const headers = computed(() => {
  const baseHeaders = [
    { text: 'Nama Customer' },
    { text: 'No. Telepon', align: 'center' },
    { text: 'Alamat', align: 'center' },
    { text: 'Tanggal Dibuat', align: 'center' },
    { text: 'Status', align: 'center' },
  ]

  if (authStore.hasPermission('Daftar Customer')) {
    baseHeaders.push({ text: 'Aksi', align: 'center' })
  }

  return baseHeaders
})

onMounted(() => {
  getData()
})

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value
  const query = searchQuery.value.toLowerCase()
  return customers.value.filter(
    (c) =>
      c.customer_name.toLowerCase().includes(query) ||
      (c.phone && c.phone.toLowerCase().includes(query)) ||
      (c.address && c.address.toLowerCase().includes(query)),
  )
})

const openCreateModal = () => {
  createErrors.value = {}
  editErrors.value = {}
  selectedCustomer.value = null
  showModal.value = true
}

const openEditModal = (customer: any) => {
  editErrors.value = {}
  selectedCustomer.value = customer
  showModal.value = true
}

const onSaveCustomer = async (formData: any) => {
  if (selectedCustomer.value) {
    // Mode EDIT
    editForm.customer_name = formData.customer_name
    editForm.phone = formData.phone
    editForm.address = formData.address

    const result = await submitUpdate(selectedCustomer.value.id)
    if (result) {
      showModal.value = false
      selectedCustomer.value = null
      getData()
    }
  } else {
    // Mode TAMBAH
    createForm.customer_name = formData.customer_name
    createForm.phone = formData.phone
    createForm.address = formData.address

    const result = await submitCreate()
    if (result) {
      showModal.value = false
      getData()
    }
  }
}

const handleToggleStatus = async (customer: any) => {
  const result = await toggle(customer.id)
  if (result !== null) {
    customer.is_active =
      typeof result === 'object' && 'is_active' in result ? result.is_active : !customer.is_active
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Daftar Customer</h2>
        <p class="text-gray-500 text-sm">Kelola data pelanggan dan tujuan pengiriman barang.</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="relative w-full sm:w-64">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari Customer..."
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
          v-if="authStore.hasPermission('Daftar Customer')"
          @click="openCreateModal"
          variant="primary"
        >
          + Tambah Customer
        </AppButton>
      </div>
    </div>

    <AppTable :headers="headers">
      <tr v-if="loading">
        <td :colspan="headers.length" class="px-6 py-10 text-center text-gray-400 italic">
          Sedang memuat data customer...
        </td>
      </tr>

      <tr
        v-for="customer in filteredCustomers"
        :key="customer.id"
        :class="!customer.is_active && 'bg-gray-50 opacity-70'"
      >
        <td class="px-6 py-4 font-bold text-gray-800">
          {{ customer.customer_name }}
          <div v-if="!customer.is_active" class="mt-1">
            <span
              class="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded italic uppercase font-sans tracking-wider"
            >
              NON-AKTIF
            </span>
          </div>
        </td>
        <td class="px-6 py-4 text-gray-600 text-center font-mono">
          {{ customer.phone || '-' }}
        </td>
        <td class="px-6 py-4 text-gray-600 text-center">
          {{ customer.address || '-' }}
        </td>
        <td class="px-6 py-4 text-gray-500 text-sm text-center">
          {{ fmtDate.date(new Date(customer.created_at), 'dd MMMM yyyy') }}
        </td>
        <td class="px-6 py-4 text-center">
          <AppStatusToggle
            v-if="authStore.hasPermission('Daftar Customer')"
            :active="customer.is_active"
            @toggle="handleToggleStatus(customer)"
          />
          <span
            v-else
            :class="
              customer.is_active ? 'text-green-600 bg-green-100' : 'text-gray-500 bg-gray-100'
            "
            class="text-xs px-2.5 py-1 rounded-full font-medium"
          >
            {{ customer.is_active ? 'Aktif' : 'Non-Aktif' }}
          </span>
        </td>
        <td v-if="authStore.hasPermission('Daftar Customer')" class="px-6 py-4 text-center">
          <button
            @click="customer.is_active ? openEditModal(customer) : null"
            :disabled="!customer.is_active"
            :class="[
              'inline-flex items-center gap-1 text-sm font-semibold transition-colors',
              customer.is_active
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

      <tr v-if="!loading && filteredCustomers.length === 0">
        <td :colspan="headers.length" class="px-6 py-10 text-center text-gray-400">
          Data customer tidak ditemukan.
        </td>
      </tr>
    </AppTable>

    <CustomerModal
      :is-open="showModal"
      :loading="modalSubmitting"
      :customer="selectedCustomer"
      :errors="modalErrors"
      @close="showModal = false"
      @save="onSaveCustomer"
    />
  </div>
</template>
