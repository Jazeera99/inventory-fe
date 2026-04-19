<script setup lang="ts">
import { reactive, watch } from 'vue'
import AppButton from '@/components/app-button.vue'
import { useRoleCreate } from '@/models/role'

const props = defineProps<{
  isOpen: boolean
  availablePermissions: string[]
}>()

const emit = defineEmits(['close', 'create'])

// Gunakan form dari models
const { form, submitting, submitForm, errors } = useRoleCreate()

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      form.role_name = ''
      form.permissions = []
    }
  },
)

const handleSubmit = async () => {
  const res = await submitForm()
  if (res) {
    emit('create')
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  >
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
      <form @submit.prevent="handleSubmit" class="p-6 space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama Role</label>
          <input
            v-model="form.role_name"
            type="text"
            class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            :class="errors.role_name ? 'border-red-500' : 'border-gray-200'"
            placeholder="Contoh: Staff Gudang"
            required
          />
          <p v-if="errors.role_name" class="text-red-500 text-xs mt-1">{{ errors.role_name[0] }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">Pilih Izin Akses</label>
          <div class="grid grid-cols-2 gap-3">
            <label
              v-for="opt in availablePermissions"
              :key="opt"
              class="flex items-center space-x-3 p-2 border border-gray-50 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                v-model="form.permissions"
                :value="opt"
                class="w-4 h-4 text-blue-600"
              />
              <span class="text-sm text-gray-600">{{ opt }}</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <AppButton variant="outline" type="button" @click="$emit('close')">Batal</AppButton>
          <AppButton type="submit" variant="primary" :loading="submitting">Simpan Role</AppButton>
        </div>
      </form>
    </div>
  </div>
</template>
