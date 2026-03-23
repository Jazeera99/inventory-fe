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
        <h3 class="text-lg font-bold text-gray-800">Tambah Produk Baru</h3>
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
          <label class="block text-sm font-medium text-gray-700 mb-1">SKU</label>
          <input
            v-model="form.sku"
            :disabled="loading"
            type="text"
            class="w-full border border-gray-300 rounded-lg p-2 uppercase focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="A100"
            required
          />
        </div>
        <div class="col-span-1">
          <label class="block text-sm font-medium text-gray-700 mb-1">Merk</label>
          <input
            v-model="form.merk"
            :disabled="loading"
            type="text"
            class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Bango"
            required
          />
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
          <input
            v-model="form.nama"
            :disabled="loading"
            type="text"
            class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Kecap Manis"
            required
          />
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Ukuran (Opsional)</label>
          <input
            v-model="form.ukuran"
            :disabled="loading"
            type="text"
            class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Contoh: 330 ml"
          />
        </div>

        <div class="col-span-2 pt-4 flex justify-end gap-3">
          <AppButton variant="outline" type="button" @click="$emit('close')" :disabled="loading"
            >Batal</AppButton
          >
          <AppButton variant="primary" type="submit" :loading="loading">Simpan Produk</AppButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import AppButton from '@/components/app-button.vue'

defineProps<{ isOpen: boolean; loading: boolean }>()
const emit = defineEmits(['close', 'save'])

const form = reactive({
  sku: '',
  nama: '',
  merk: '',
  ukuran: '',
})

const handleSave = () => {
  emit('save', { ...form })
  // Reset form
  form.sku = ''
  form.nama = ''
  form.merk = ''
  form.ukuran = ''
}
</script>
