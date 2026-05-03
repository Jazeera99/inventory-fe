<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserAdminList, useUserAdminToggle } from '@/models/user'
import UserTable from '@/views/pengaturan/modal/user-table.vue'
import UserCreateModal from '@/views/pengaturan/modal/user-create.vue'
import UserEditModal from '@/views/pengaturan/modal/user-edit.vue'
// import UserDeleteModal from '@/views/pengaturan/modal/user-delete.vue'

// const availableRoles = ['Super Admin', 'Manager', 'Staff Gudang']
// const users = ref([
//   { id: 1, name: 'Admin Utama', email: 'admin@pro.com', role: 'Super Admin' },
//   { id: 2, name: 'Budi Gudang', email: 'budi@pro.com', role: 'Staff Gudang' },
// ])

const { users, loading, getData } = useUserAdminList()
const { toggle } = useUserAdminToggle()

const showCreateModal = ref(false)
const showEditModal = ref(false)
// const showDeleteModal = ref(false)
const selectedUser = ref<any>(null)

onMounted(() => getData())

const openCreate = () => (showCreateModal.value = true)

const openEdit = (user: any) => {
  selectedUser.value = user
  showEditModal.value = true
}

// const openDelete = (user: any) => {
//   selectedUser.value = user
//   showDeleteModal.value = true
// }

// const handleCreate = (newData: any) => {
//   users.value.push(newData)
//   showCreateModal.value = false
// }

// const handleUpdate = (updatedData: any) => {
//   const index = users.value.findIndex((u) => u.id === updatedData.id)
//   if (index !== -1) users.value[index] = updatedData
//   showEditModal.value = false
// }

// const handleDelete = (id: number) => {
//   users.value = users.value.filter((u) => u.id !== id)
//   showDeleteModal.value = false
// }

const handleToggle = async (user: any) => {
  const result = await toggle(user.id)
  if (result !== null) {
    user.is_active = result
  }
}

const onSuccess = () => {
  showCreateModal.value = false
  showEditModal.value = false
  getData()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Manajemen User</h1>
        <p class="text-gray-500 text-sm">Kelola pengguna yang memiliki akses ke sistem.</p>
      </div>
      <button
        @click="openCreate"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Tambah User
      </button>
    </div>

    <div v-if="loading" class="text-center py-10">Memuat data...</div>
    <UserTable v-else :users="users" @edit="openEdit" @toggle="handleToggle" />

    <UserCreateModal
      :is-open="showCreateModal"
      @close="showCreateModal = false"
      @create="onSuccess"
    />

    <UserEditModal
      v-if="selectedUser"
      :is-open="showEditModal"
      :initial-data="selectedUser"
      @close="showEditModal = false"
      @update="onSuccess"
    />
  </div>
</template>
