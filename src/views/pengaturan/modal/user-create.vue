<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useUserAdminCreate, useRoleList } from '@/models/user'
import AppButton from '@/components/app-button.vue'

// const props = defineProps<{ isOpen: boolean; availableRoles: string[] }>()
const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits(['close', 'create'])

// const form = reactive({ name: '', email: '', role: 'Staff Gudang' })

const { form, errors, submitting, submitForm } = useUserAdminCreate()
const { roles, getRoles } = useRoleList()

onMounted(() => {
  getRoles()
})

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      form.full_name = ''
      form.username = ''
      form.password = 'password123'
      errors.value = {}
    }
  },
)

const handleSubmit = async () => {
  await submitForm()
  if (Object.keys(errors.value).length === 0) {
    emit('create')
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  >
    <div
      class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
    >
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 class="text-lg font-bold text-gray-800">Tambah User Baru</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <input type="text" style="display: none" aria-hidden="true" />
        <input type="password" style="display: none" aria-hidden="true" />
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Role Akses</label>
          <select
            v-model="form.role_id"
            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            required
          >
            <option value="" disabled>Pilih Role</option>
            <option v-for="role in roles" :key="role.id" :value="role.id">
              {{ role.role_name }}
            </option>
          </select>
          <p v-if="errors.role_id" class="text-red-500 text-xs mt-1">{{ errors.role_id[0] }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
          <input
            v-model="form.full_name"
            type="text"
            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username </label>
          <input
            v-model="form.username"
            type="text"
            readonly
            onfocus="this.removeAttribute('readonly')"
            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>
        <div class="bg-blue-50 p-3 rounded-lg border border-blue-100">
          <p class="text-xs text-blue-600">
            <strong>Info:</strong> Password default user baru adalah
            <span class="font-bold">{{ form.password }}</span
            >.
          </p>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <AppButton variant="outline" @click="$emit('close')"> Batal </AppButton>
          <AppButton type="submit" variant="primary" :loading="submitting"> Simpan </AppButton>
        </div>
      </form>
    </div>
  </div>
</template>
