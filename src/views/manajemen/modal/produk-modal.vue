<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppInput from '@/components/app-input.vue'
import { useProductCreate } from '@/models/product'
import { useCategoryList } from '@/models/category'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits(['close', 'refresh'])

// 1. Ambil fungsi dari Composable
const { form, errors, submitting, submitForm } = useProductCreate()
const { categories, getData: fetchCategories } = useCategoryList()

// 2. State untuk UI Dropdown Kategori
const showDropdown = ref(false)
const searchQuery = ref('')

// 3. Logika Filter Kategori (Mencari saat diketik)
const filteredCategories = computed(() => {
  if (!searchQuery.value) return []
  return categories.value.filter((c) =>
    c.category_name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

// 4. Deteksi jika kategori tidak ada di database
const isNotFound = computed(() => {
  return (
    searchQuery.value !== '' &&
    filteredCategories.value.length === 0 &&
    !categories.value.some((c) => c.category_name === searchQuery.value)
  )
})

// 5. Fungsi saat Kategori dipilih dari list
const selectCategory = (cat: any) => {
  form.category_id = cat.id
  searchQuery.value = cat.category_name
  showDropdown.value = false
}

// 6. Ambil data kategori saat komponen muncul
onMounted(async () => {
  await fetchCategories()
  // Jika ada ID (untuk edit), tampilkan namanya di input
  if (form.category_id) {
    const found = categories.value.find((c) => c.id === form.category_id)
    if (found) searchQuery.value = found.category_name
  }
})

// 7. Simpan Data
const handleSave = async () => {
  try {
    await submitForm()
    emit('refresh')
    emit('close')
    searchQuery.value = '' // Reset pencarian
  } catch (e) {
    // Error ditangani otomatis oleh composable (errors)
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  >
    <div
      class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
    >
      <div
        class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50"
      >
        <h3 class="text-lg font-bold text-gray-800">Tambah Produk Baru</h3>
        <button
          @click="$emit('close')"
          :disabled="submitting"
          class="text-gray-400 hover:text-gray-600 text-2xl"
        >
          &times;
        </button>
      </div>

      <form @submit.prevent="handleSave" class="p-6 grid grid-cols-2 gap-4">
        <div class="col-span-2 relative">
          <label class="block text-sm font-medium text-gray-700 mb-1">Cari Kategori *</label>

          <div class="relative flex items-center">
            <input
              v-model="searchQuery"
              @focus="showDropdown = true"
              @input="showDropdown = true"
              placeholder="Ketik nama kategori..."
              :class="[
                'w-full px-4 py-2 border rounded-lg outline-none text-sm transition-all',
                isNotFound
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500',
              ]"
              required
            />

            <div v-if="isNotFound" class="absolute right-3 text-red-500 flex items-center gap-1">
              <span class="text-[10px] font-bold">Gak Ketemu</span> ❌
            </div>
          </div>

          <ul
            v-if="showDropdown && filteredCategories.length > 0"
            class="absolute z-20 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-xl max-h-48 overflow-y-auto"
          >
            <li
              v-for="cat in filteredCategories"
              :key="cat.id"
              @click="selectCategory(cat)"
              class="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
            >
              {{ cat.category_name }}
            </li>
          </ul>

          <p v-if="isNotFound" class="text-red-500 text-[10px] mt-1 font-medium italic">
            Kategori "{{ searchQuery }}" tidak ditemukan di daftar.
          </p>
          <p v-if="errors.category_id" class="text-red-500 text-xs mt-1">
            {{ errors.category_id[0] }}
          </p>
        </div>

        <AppInput
          v-model="form.product_name"
          label="Nama Produk *"
          placeholder="Kecap Manis"
          :error="errors.product_name"
          required
        />
        <AppInput
          v-model="form.brand"
          label="Merk *"
          placeholder="Bango"
          :error="errors.brand"
          required
        />

        <AppInput v-model="form.type" label="Tipe" placeholder="Goreng" />
        <AppInput v-model="form.packaging" label="Kemasan" placeholder="Pouch" />

        <div class="col-span-2 grid grid-cols-2 gap-4">
          <AppInput v-model="form.size" label="Ukuran" placeholder="100" class="col-span-1" />
          <div class="flex items-end pb-1 text-xs text-gray-400 italic">
            * Pastikan data sudah benar
          </div>
        </div>

        <div class="col-span-2 pt-4 flex justify-end gap-3">
          <AppButton variant="outline" type="button" @click="$emit('close')" :disabled="submitting">
            Batal
          </AppButton>
          <AppButton variant="primary" type="submit" :loading="submitting">
            Simpan Produk
          </AppButton>
        </div>
      </form>
    </div>
  </div>
</template>
