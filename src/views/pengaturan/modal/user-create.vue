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
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
          <input
            v-model="form.name"
            type="text"
            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Alamat Email</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Role Akses</label>
          <select
            v-model="form.role"
            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option v-for="role in availableRoles" :key="role" :value="role">{{ role }}</option>
          </select>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <AppButton variant="outline" @click="$emit('close')"> Batal </AppButton>
          <AppButton type="submit" variant="primary" :loading="isSubmitting"> Simpan </AppButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
const props = defineProps<{ isOpen: boolean; availableRoles: string[] }>()
const emit = defineEmits(['close', 'create'])

const form = reactive({ name: '', email: '', role: 'Staff Gudang' })

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      form.name = ''
      form.email = ''
      form.role = 'Staff Gudang'
    }
  },
)

const handleSubmit = () => emit('create', { ...form, id: Date.now() })
</script>
