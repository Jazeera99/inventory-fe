<script setup lang="ts">
import { reactive, watch } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppInput from '@/components/app-input.vue'

const props = defineProps<{
  isOpen: boolean
  loading: boolean
  supplier: any | null
  errors: any | null
}>()

const emit = defineEmits(['close', 'save'])

const form = reactive({
  supplier_name: '',
  phone: '',
  address: '',
  is_active: true,
})

watch(
  () => props.supplier,
  (newSupplier) => {
    if (newSupplier) {
      form.supplier_name = newSupplier.supplier_name || ''
      form.phone = newSupplier.phone || ''
      form.address = newSupplier.address || ''
      form.is_active = newSupplier.is_active ?? true
    } else {
      // Clear form jika mode tambah baru
      form.supplier_name = ''
      form.phone = ''
      form.address = ''
      form.is_active = true
    }
  },
  { immediate: true },
)

const handleSave = () => {
  emit('save', { ...form })
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
          {{ supplier ? 'Edit Detail Supplier' : 'Tambah Supplier Baru' }}
        </h3>
        <button
          @click="$emit('close')"
          :disabled="loading"
          class="text-gray-400 hover:text-gray-600 text-2xl"
          type="button"
        >
          &times;
        </button>
      </div>

      <form @submit.prevent="handleSave" class="p-6 space-y-4">
        <!-- Nama Supplier -->
        <div>
          <AppInput
            v-model="form.supplier_name"
            label="Nama Supplier *"
            placeholder="Contoh: PT. Indofood Sukses Makmur"
            :disabled="loading"
            required
          />
          <p v-if="errors?.supplier_name" class="text-xs text-red-500 mt-1">
            {{ errors.supplier_name[0] }}
          </p>
        </div>

        <!-- Telepon -->
        <div>
          <AppInput
            v-model="form.phone"
            label="No. Telepon / WhatsApp"
            placeholder="Contoh: 08123456789"
            :disabled="loading"
          />
          <p v-if="errors?.phone" class="text-xs text-red-500 mt-1">
            {{ errors.phone[0] }}
          </p>
        </div>

        <!-- Alamat -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
          <textarea
            v-model="form.address"
            rows="3"
            placeholder="Alamat kantor / gudang supplier..."
            :disabled="loading"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all disabled:bg-gray-100"
          ></textarea>
          <p v-if="errors?.address" class="text-xs text-red-500 mt-1">
            {{ errors.address[0] }}
          </p>
        </div>

        <!-- Tombol Aksi -->
        <div class="pt-4 flex justify-end gap-3">
          <AppButton variant="outline" type="button" @click="$emit('close')" :disabled="loading">
            Batal
          </AppButton>
          <AppButton variant="primary" type="submit" :loading="loading">
            {{ supplier ? 'Simpan Perubahan' : 'Simpan Supplier' }}
          </AppButton>
        </div>
      </form>
    </div>
  </div>
</template>
