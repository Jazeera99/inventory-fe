<script setup lang="ts">
import { watch } from 'vue'
import AppButton from '@/components/app-button.vue'
import { useRackUpdate } from '@/models/rack'

// Menerima prop 'rack' (data yang mau diedit) dan 'show' (status tampil modal)
const props = defineProps<{
  rack: any | null
  show: boolean
}>()

const emit = defineEmits(['updated', 'close'])

const {
  form: editForm,
  setFormValue,
  submitUpdate,
  errors: editErrors,
  submitting: updating,
} = useRackUpdate()

// Setiap kali data rak yang dipilih berubah, isi form dengan data tersebut
watch(
  () => props.rack,
  (newRack) => {
    if (newRack) {
      setFormValue(newRack)
    }
  },
  { immediate: true },
)

watch(
  () => [editForm.rack_name, editForm.column_number, editForm.level_number],
  ([name, col, lvl]) => {
    if (name && col && lvl) {
      // Membersihkan kata "Rak " di depan jika ada agar seragam
      const cleanName = name.toLowerCase().startsWith('rak ') ? name.substring(4) : name
      editForm.location_code = `${cleanName.toUpperCase()}${col}-${lvl}`
    }
  },
)

const handleUpdate = async () => {
  if (!props.rack?.id) return
  try {
    await submitUpdate(props.rack.id)
    emit('updated') // Beritahu komponen utama bahwa data berhasil diupdate
  } catch (e) {
    console.error('Gagal mengupdate rak:', e)
  }
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
  >
    <div
      class="bg-white w-full max-w-md rounded-xl shadow-xl p-6 border border-gray-100 animate-in zoom-in-95 duration-200"
    >
      <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <svg
          class="w-5 h-5 mr-2 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        Edit Detail Rak
      </h3>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Rak *</label>
          <input
            v-model="editForm.rack_name"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-300"
          />
          <p v-if="editErrors?.rack_name" class="text-xs text-red-500 mt-1">
            {{ editErrors.rack_name[0] }}
          </p>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1"
            >Kode Lokasi (Otomatis)</label
          >
          <input
            v-model="editForm.location_code"
            type="text"
            disabled
            class="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none bg-gray-50 text-gray-500 cursor-not-allowed uppercase font-mono font-bold"
            placeholder="Generates automatically..."
          />
          <p v-if="editErrors?.location_code" class="text-xs text-red-500 mt-1">
            {{ editErrors.location_code[0] }}
          </p>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Kolom *</label>
            <input
              v-model.number="editForm.column_number"
              type="number"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-300"
            />
            <p v-if="editErrors?.column_number" class="text-xs text-red-500 mt-1">
              {{ editErrors.column_number[0] }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Tingkat *</label>
            <input
              v-model.number="editForm.level_number"
              type="number"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-300"
            />
            <p v-if="editErrors?.level_number" class="text-xs text-red-500 mt-1">
              {{ editErrors.level_number[0] }}
            </p>
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1"
            >Kapasitas Maksimal *</label
          >
          <input
            v-model.number="editForm.capacity"
            type="number"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-300"
          />
          <p v-if="editErrors?.capacity" class="text-xs text-red-500 mt-1">
            {{ editErrors.capacity[0] }}
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <AppButton variant="outline" @click="emit('close')" :disabled="updating">Batal</AppButton>
        <AppButton
          variant="primary"
          @click="handleUpdate"
          :loading="updating"
          class="!bg-blue-500 !hover:bg-blue-600 text-white"
          >Simpan Perubahan</AppButton
        >
      </div>
    </div>
  </div>
</template>
