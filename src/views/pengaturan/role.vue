<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoleList, useRoleCreate, useRoleEdit, useRoleDelete } from '@/models/role'
import { toast } from '@/stores/toast'
import RoleCard from './modal/role-card.vue'
import RoleCreateModal from './modal/role-create.vue'
import RoleEditModal from './modal/role-edit.vue'

// Ambil semua senjata dari models
const { roles, loading, getData } = useRoleList()
const { submitForm: submitCreate } = useRoleCreate()
const { submitForm: submitEdit } = useRoleEdit()
const { submitDelete } = useRoleDelete()

const availablePermissions = [
  'Manajemen Rak',
  'Daftar Produk',
  'Produk Masuk',
  'Produk Keluar',
  'Laporan Stok',
  'Manajemen User',
]

const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedRole = ref<any>(null)

onMounted(() => {
  getData()
})

const openEdit = (role: any) => {
  selectedRole.value = {
    id: role.id,
    role_name: role.role_name,
    permissions: role.permissions,
  }
  showEditModal.value = true
}

const handleCreate = async () => {
  // const res = await submitCreate()
  // if (res) {
  //   toast.dataSaved()
  //   showCreateModal.value = false
  //   await getData()
  // }
  showCreateModal.value = false
  toast.dataSaved()
  await getData()
}

const handleUpdate = async () => {
  // const res = await submitEdit(data.id)
  // if (res) {
  //   toast.dataSaved()
  //   showEditModal.value = false
  //   selectedRole.value = null
  //   await getData()
  // }
  showEditModal.value = false
  selectedRole.value = null
  toast.dataSaved()
  await getData()

  console.log('UI Berhasil di-refresh otomatis!')
}

const handleDelete = async (id: number) => {
  if (confirm('Apakah Anda yakin ingin menghapus role ini?')) {
    const res = await submitDelete(id)
    if (res) {
      toast.dataDeleted()
      await getData()
    }
  }
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Hak Akses</h1>
        <p class="text-gray-500 text-sm">Kelola peran dan izin akses sistem dari database.</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
      >
        + Tambah Role
      </button>
    </div>

    <div v-if="loading" class="text-center py-10 text-gray-400">Memuat data dari database...</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <RoleCard
        v-for="role in roles"
        :key="role.id"
        :role="role"
        @edit="openEdit"
        @delete="handleDelete"
      />
    </div>

    <RoleCreateModal
      :is-open="showCreateModal"
      :available-permissions="availablePermissions"
      @close="showCreateModal = false"
      @create="handleCreate"
    />

    <RoleEditModal
      v-if="selectedRole"
      :is-open="showEditModal"
      :initial-data="selectedRole"
      :available-permissions="availablePermissions"
      @close="showEditModal = false"
      @update="handleUpdate"
    />
  </div>
</template>
