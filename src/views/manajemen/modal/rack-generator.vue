<template>
  <div
    class="bg-white p-6 rounded-xl shadow-md border border-gray-100 animate-in fade-in duration-300"
  >
    <h3 class="text-lg font-semibold mb-4 flex items-center text-gray-800">
      <svg class="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
      Automatic Rack Generator
    </h3>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Rak (Huruf)</label>
        <input
          v-model="form.namaRak"
          type="text"
          placeholder="Contoh: A"
          class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
          maxlength="2"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah Kolom</label>
        <input
          v-model.number="form.kolom"
          type="number"
          placeholder="Maks 10"
          class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah Tingkat</label>
        <input
          v-model.number="form.tingkat"
          type="number"
          placeholder="Maks 5"
          class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
    </div>

    <div
      v-if="previewLocations.length > 0"
      class="mt-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300"
    >
      <p class="text-xs font-bold text-gray-500 uppercase mb-3 text-gray-400">
        Preview Hasil (Total: {{ previewLocations.length }} Lokasi)
      </p>
      <div class="flex flex-wrap gap-2 mb-6">
        <span
          v-for="loc in previewLocations.slice(0, 15)"
          :key="loc"
          class="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-blue-600 font-mono shadow-sm"
        >
          {{ loc }}
        </span>
        <span v-if="previewLocations.length > 15" class="text-gray-400 text-xs self-center italic">
          ... dan {{ previewLocations.length - 15 }} lagi
        </span>
      </div>

      <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
        <AppButton variant="outline" @click="handleCancel" :disabled="isSubmitting">
          Batal
        </AppButton>

        <AppButton variant="primary" @click="handleConfirm" :loading="isSubmitting">
          Simpan Ke Database
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import AppButton from '@/components/app-button.vue'

const emit = defineEmits(['generate', 'cancel'])

const isSubmitting = ref(false)

const form = reactive({
  namaRak: '',
  kolom: null as number | null,
  tingkat: null as number | null,
})

const previewLocations = computed(() => {
  if (!form.namaRak || !form.kolom || !form.tingkat) return []
  const result = []
  for (let k = 1; k <= form.kolom; k++) {
    for (let t = 1; t <= form.tingkat; t++) {
      result.push(`${form.namaRak.toUpperCase()}${k}-${t}`)
    }
  }
  return result
})

const handleConfirm = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true

  // Simulasi delay loading agar user merasa ada proses simpan
  // Ganti ini dengan hit API asli nantinya
  await new Promise((resolve) => setTimeout(resolve, 1000))

  emit('generate', {
    locations: previewLocations.value,
    induk: form.namaRak.toUpperCase(),
    tingkat: form.tingkat,
  })

  resetForm()
  isSubmitting.value = false
}

const handleCancel = () => {
  resetForm()
  emit('cancel')
}

const resetForm = () => {
  form.namaRak = ''
  form.kolom = null
  form.tingkat = null
}
</script>
