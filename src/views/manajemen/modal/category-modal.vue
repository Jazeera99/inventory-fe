<script setup lang="ts">
import { reactive, watch } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppInput from '@/components/app-input.vue'

const props = defineProps<{
  isOpen: boolean
  loading: boolean
  category: any | null
  errors: any | null
}>()
const emit = defineEmits(['close', 'save'])

const form = reactive({
  category_name: '',
  description: '',
  is_active: true,
})

watch(
  () => props.category,
  (newCategory) => {
    if (newCategory) {
      form.category_name = newCategory.category_name
      form.description = newCategory.description
    } else {
      // Jika null, bersihkan form (mode tambah baru)
      form.category_name = ''
      form.description = ''
    }
  },
  { immediate: true },
)

const handleSave = () => {
  emit('save', { ...form })

  // Reset form setelah emit
  form.category_name = ''
  form.description = ''
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
      <div
        class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50"
      >
        <h3 class="text-lg font-bold text-gray-800">
          {{ category ? 'Edit Detail Kategori' : 'Tambah Kategori Baru' }}
        </h3>
        <button
          @click="$emit('close')"
          :disabled="loading"
          class="text-gray-400 hover:text-gray-600 text-2xl"
        >
          &times;
        </button>
      </div>

      <form @submit.prevent="handleSave" class="p-6 grid grid-cols-2 gap-4">
        <div class="col-span-1">
          <AppInput
            v-model="form.category_name"
            label="Nama Kategori *"
            placeholder="Contoh: Minuman Ringan"
            :disabled="loading"
            required
          />
          <p v-if="errors?.category_name" class="text-xs text-red-500 mt-1">
            {{ errors.category_name[0] }}
          </p>
        </div>
        <div class="col-span-1">
          <AppInput
            v-model="form.description"
            label="Deskripsi"
            placeholder="Deskripsi kategori"
            :disabled="loading"
            required
          />
          <p v-if="errors?.description" class="text-xs text-red-500 mt-1">
            {{ errors.description[0] }}
          </p>
        </div>

        <div class="col-span-2 pt-4 flex justify-end gap-3">
          <AppButton variant="outline" type="button" @click="$emit('close')" :disabled="loading">
            Batal
          </AppButton>
          <AppButton variant="primary" type="submit" :loading="loading">
            Simpan Kategori
          </AppButton>
        </div>
      </form>
    </div>
  </div>
</template>
