<script setup lang="ts">
import { watch } from 'vue'
import { useRoleEdit } from '@/models/role'
import AppButton from '@/components/app-button.vue'

const props = defineProps<{
  isOpen: boolean
  initialData: any
  availablePermissions: string[]
}>()

const emit = defineEmits(['close', 'update'])

// Gunakan composable edit
const { form, submitting, errors, submitForm } = useRoleEdit()

watch(
  () => props.isOpen,
  (open) => {
    if (open && props.initialData) {
      // Mapping data dari props ke form reactive milik composable
      form.role_name = props.initialData.role_name
      form.permissions = [...props.initialData.permissions]
    }
  },
)

const handleSubmit = async () => {
  const res = await submitForm(props.initialData.id)
  if (res) {
    emit('update')
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  >
    <div
      class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200"
    >
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 class="text-lg font-bold text-gray-800">Edit Akses Role</h3>
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

      <form @submit.prevent="handleSubmit" class="p-6 space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama Role</label>
          <input
            v-model="form.role_name"
            type="text"
            class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            :class="errors.role_name ? 'border-red-500' : 'border-blue-100 bg-blue-50/30'"
            required
          />
          <p v-if="errors.role_name" class="text-red-500 text-xs mt-1">{{ errors.role_name[0] }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3 text-blue-600"
            >Update Izin Akses</label
          >
          <div class="grid grid-cols-2 gap-3">
            <label
              v-for="opt in availablePermissions"
              :key="opt"
              class="flex items-center space-x-3 p-2 border border-gray-50 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                v-model="form.permissions"
                :value="opt"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="text-sm text-gray-600">{{ opt }}</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <AppButton variant="outline" type="button" @click="$emit('close')" :disabled="submitting">
            Batal
          </AppButton>
          <AppButton variant="primary" type="submit" :loading="submitting">
            Simpan Perubahan
          </AppButton>
        </div>
      </form>
    </div>
  </div>
</template>
