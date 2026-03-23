<script setup lang="ts">
import { ref } from 'vue'
// Pastikan path import sesuai dengan lokasi file Anda
import RoleCard from '@/views/pengaturan/modal/role-card.vue'
import RoleCreateModal from '@/views/pengaturan/modal/role-create.vue'
import RoleEditModal from '@/views/pengaturan/modal/role-edit.vue'

// 1. Deklarasi data yang diperlukan
const availablePermissions = [
  'Manajemen Rak',
  'Daftar Produk',
  'Produk Masuk',
  'Produk Keluar',
  'Laporan Stok',
  'Manajemen User',
]

const roles = ref([
  { id: 1, name: 'Super Admin', permissions: ['Manajemen User', 'Laporan Stok'] },
  { id: 2, name: 'Staff Gudang', permissions: ['Produk Masuk', 'Produk Keluar'] },
])

// State untuk kontrol Modal
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedRole = ref<any>(null)

// Logic CRUD
const openCreate = () => {
  showCreateModal.value = true
}

const openEdit = (role: any) => {
  selectedRole.value = { ...role } // Gunakan spread operator agar tidak mengubah data asli sebelum save
  showEditModal.value = true
}

const handleDelete = (id: number) => {
  if (confirm('Apakah Anda yakin ingin menghapus role ini?')) {
    roles.value = roles.value.filter((r) => r.id !== id)
  }
}

const handleSaveNew = (newData: any) => {
  roles.value.push(newData)
  showCreateModal.value = false
}

const handleUpdateData = (updatedData: any) => {
  const index = roles.value.findIndex((r) => r.id === updatedData.id)
  if (index !== -1) {
    roles.value[index] = updatedData
  }
  showEditModal.value = false
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Pengaturan Hak Akses</h1>
        <p class="text-gray-500 text-sm">Kelola peran dan izin akses pengguna sistem.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <RoleCard
        v-for="role in roles"
        :key="role.id"
        :role="role"
        @edit="openEdit"
        @delete="handleDelete"
      />

      <button
        @click="openCreate"
        class="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-all bg-gray-50/50"
      >
        <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span class="font-medium text-sm">Tambah Role Baru</span>
      </button>
    </div>

    <RoleCreateModal
      :is-open="showCreateModal"
      :available-permissions="availablePermissions"
      @close="showCreateModal = false"
      @create="handleSaveNew"
    />

    <RoleEditModal
      v-if="selectedRole"
      :is-open="showEditModal"
      :initial-data="selectedRole"
      :available-permissions="availablePermissions"
      @close="showEditModal = false"
      @update="handleUpdateData"
    />
  </div>
</template>
