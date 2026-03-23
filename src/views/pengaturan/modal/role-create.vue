<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  >
    <div
      class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200"
    >
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 class="text-lg font-bold text-gray-800">Tambah Role Baru</h3>
        <button
          @click="$emit('close')"
          :disabled="isSubmitting"
          class="text-gray-400 hover:text-gray-600 disabled:opacity-30"
        >
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
            v-model="form.name"
            type="text"
            class="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            placeholder="Masukkan nama role..."
            :disabled="isSubmitting"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">Pilih Izin Akses</label>
          <div class="grid grid-cols-2 gap-3">
            <label
              v-for="opt in availablePermissions"
              :key="opt"
              class="flex items-center space-x-3 p-2 border border-gray-50 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              :class="{ 'opacity-50 cursor-not-allowed': isSubmitting }"
            >
              <input
                type="checkbox"
                v-model="form.permissions"
                :value="opt"
                :disabled="isSubmitting"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="text-sm text-gray-600">{{ opt }}</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <AppButton
            variant="outline"
            type="button"
            @click="$emit('close')"
            :disabled="isSubmitting"
          >
            Batal
          </AppButton>

          <AppButton type="submit" variant="primary" :loading="isSubmitting">
            Simpan Role
          </AppButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import AppButton from '@/components/app-button.vue'

const props = defineProps<{
  isOpen: boolean
  availablePermissions: string[]
}>()

const emit = defineEmits(['close', 'create'])

const isSubmitting = ref(false) // State loading

const form = reactive({
  name: '',
  permissions: [] as string[],
})

// Reset form & loading state setiap kali modal dibuka
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      form.name = ''
      form.permissions = []
      isSubmitting.value = false
    }
  },
)

const handleSubmit = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true

  // Simulasi loading 1 detik
  await new Promise((resolve) => setTimeout(resolve, 1000))

  emit('create', { ...form, id: Date.now() })
}
</script>
