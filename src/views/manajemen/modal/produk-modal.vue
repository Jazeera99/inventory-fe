<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppInput from '@/components/app-input.vue'
import AppAlert from '@/components/app-alert.vue'
import { useProductCreate, useProductUpdate } from '@/models/product'
import { useCategoryList } from '@/models/category'

const props = defineProps<{
  isOpen: boolean
  productData?: any
}>()
const emit = defineEmits(['close', 'refresh'])

// 1. Ambil fungsi dari Composable
const { form, errors: createErrors, submitting: creating, submitForm } = useProductCreate()
const { errors: updateErrors, submitting: updating, submitUpdate } = useProductUpdate()
const { categories, getData: fetchCategories } = useCategoryList()

const submitting = computed(() => creating.value || updating.value)
const errors = computed(() => (props.productData ? updateErrors.value : createErrors.value))

const displayPurchasePrice = ref('')
const displaySellingPrice = ref('')

/**
 * HELPER FORMATTER RUPIAH (1.000.000,00)
 */
const formatToRupiahDisplay = (val: number | string): string => {
  if (val === null || val === undefined || val === '') return ''
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (isNaN(num)) return ''

  // Format ke ribuan titik dan paksa 2 desimal di belakang koma (,00)
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

const parseRawNumber = (val: string): number => {
  if (!val) return 0
  // Bersihkan titik dan ganti koma menjadi titik desimal standar JS
  const cleanVal = val.replace(/\./g, '').replace(',', '.')
  const parsed = parseFloat(cleanVal)
  return isNaN(parsed) ? 0 : parsed
}

// Handlers saat user mengetik di input harga
const onInputPurchasePrice = (e: Event) => {
  const target = e.target as HTMLInputElement
  // Ambil hanya angka & koma
  const value = target.value.replace(/[^0-9,]/g, '')

  const rawNum = parseRawNumber(value)
  form.purchase_price = rawNum
  displayPurchasePrice.value = value
}

const onBlurPurchasePrice = () => {
  displayPurchasePrice.value = formatToRupiahDisplay(form.purchase_price)
}

const onInputSellingPrice = (e: Event) => {
  const target = e.target as HTMLInputElement
  const value = target.value.replace(/[^0-9,]/g, '')

  const rawNum = parseRawNumber(value)
  form.selling_price = rawNum
  displaySellingPrice.value = value
}

const onBlurSellingPrice = () => {
  displaySellingPrice.value = formatToRupiahDisplay(form.selling_price)
}

const clearAllErrors = () => {
  if (createErrors) createErrors.value = {}
  if (updateErrors) updateErrors.value = {}
}

const alertShow = ref(false)
const alertVariant = ref<'success' | 'error' | 'warning' | 'info'>('info')
const alertMessage = ref('')

// State UI Dropdown Kategori
const showDropdown = ref(false)
const searchQuery = ref('')

const isEditMode = computed(() => !!props.productData)

const filteredCategories = computed(() => {
  if (!searchQuery.value) return []
  return categories.value.filter((c) =>
    c.category_name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const isNotFound = computed(() => {
  return (
    searchQuery.value !== '' &&
    filteredCategories.value.length === 0 &&
    !categories.value.some((c) => c.category_name === searchQuery.value)
  )
})

const selectCategory = (cat: any) => {
  if (cat.is_active === false || cat.is_active === 0) return

  form.category_id = cat.id
  searchQuery.value = cat.category_name
  showDropdown.value = false
}

const syncFormWithProps = () => {
  clearAllErrors()
  alertShow.value = false
  alertMessage.value = ''

  if (props.productData) {
    form.sku = props.productData.sku
    form.product_name = props.productData.product_name
    form.category_id = props.productData.category_id
    form.brand = props.productData.brand
    form.type = props.productData.type || ''
    form.packaging = props.productData.packaging || ''
    form.size = props.productData.size || ''
    form.unit = props.productData.unit || ''
    form.min_stock = props.productData.min_stock || 0

    // Set harga dari pricing / props
    form.purchase_price =
      props.productData.pricing?.purchase_price ?? props.productData.purchase_price ?? 0
    form.selling_price =
      props.productData.pricing?.selling_price ?? props.productData.selling_price ?? 0

    displayPurchasePrice.value = formatToRupiahDisplay(form.purchase_price)
    displaySellingPrice.value = formatToRupiahDisplay(form.selling_price)

    if (props.productData.category) {
      searchQuery.value = props.productData.category.category_name
    } else if (categories.value.length > 0) {
      const found = categories.value.find((c) => c.id === props.productData.category_id)
      if (found) searchQuery.value = found.category_name
    }
  } else {
    form.sku = ''
    form.product_name = ''
    form.category_id = null
    form.brand = ''
    form.type = ''
    form.packaging = ''
    form.size = ''
    form.unit = ''
    form.min_stock = 0
    form.purchase_price = 0
    form.selling_price = 0
    displayPurchasePrice.value = ''
    displaySellingPrice.value = ''
    searchQuery.value = ''
  }
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) syncFormWithProps()
  },
)

onMounted(async () => {
  await fetchCategories()
  syncFormWithProps()
})

// 7. Simpan Data (Sudah Diperbaiki)
const handleSave = async () => {
  alertShow.value = false
  alertMessage.value = ''

  if (!form.category_id && searchQuery.value) {
    const match = categories.value.find(
      (c) => c.category_name.toLowerCase() === searchQuery.value.toLowerCase(),
    )
    if (match && match.is_active === true) {
      form.category_id = match.id
    } else if (match) {
      alertVariant.value = 'error'
      alertMessage.value = `Gagal! Kategori "${match.category_name}" saat ini sedang dinonaktifkan.`
      alertShow.value = true
      return
    }
  }

  try {
    let res: any = null
    if (isEditMode.value && props.productData) {
      res = await submitUpdate(props.productData.sku, form)
    } else {
      res = await submitForm()
    }

    // Cek apakah composable mengembalikan error di dalam return val atau di state 'errors'
    if (res && res.error) {
      throw new Error(res.message || 'Gagal menyimpan data.')
    }

    alertVariant.value = 'success'
    alertMessage.value = isEditMode.value
      ? 'Produk berhasil diperbarui!'
      : 'Produk baru berhasil ditambahkan!'
    alertShow.value = true

    setTimeout(() => {
      emit('refresh')
      emit('close')
    }, 1500)
  } catch (error: any) {
    // Menangkap pesan error persis dari response backend (HTTP 422)
    const backendMessage =
      error?.response?.data?.message || error?.message || 'Terjadi kesalahan saat menyimpan data.'

    alertVariant.value = 'error'
    alertMessage.value = backendMessage
    alertShow.value = true
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
        <h3 class="text-lg font-bold text-gray-800">
          {{ isEditMode ? 'Edit Produk' : 'Tambah Produk Baru' }}
        </h3>
        <button
          @click="$emit('close')"
          :disabled="submitting"
          class="text-gray-400 hover:text-gray-600 text-2xl"
        >
          &times;
        </button>
      </div>

      <form @submit.prevent="handleSave" class="p-6 grid grid-cols-2 gap-4">
        <!-- NOTIFIKASI ALERT ERROR / SUKSES -->
        <div v-if="alertShow" class="col-span-2">
          <AppAlert :variant="alertVariant" :message="alertMessage" :show="true" />
        </div>

        <div class="col-span-2">
          <AppInput
            v-model="form.sku"
            label="Kode SKU Produk"
            :placeholder="isEditMode ? '' : 'Kosongkan untuk auto-generate sistem'"
            :error="errors?.sku"
            :disabled="isEditMode"
            class="font-mono uppercase"
          />
          <p v-if="!isEditMode" class="text-gray-400 text-[11px] mt-1 italic">
            💡 Warehouse bisa mengisi dengan kode internal sendiri, atau biarkan kosong jika ingin
            dibuatkan otomatis oleh sistem.
          </p>
        </div>

        <div class="col-span-2 relative">
          <label class="block text-sm font-medium text-gray-700 mb-1">Cari Kategori *</label>

          <div class="relative flex items-center">
            <input
              v-model="searchQuery"
              @focus="showDropdown = true"
              @input="showDropdown = true"
              placeholder="Ketik nama kategori"
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
              :class="[
                'px-4 py-2 text-sm border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center',
                cat.is_active
                  ? 'hover:bg-blue-50 cursor-pointer text-gray-700'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed select-none',
              ]"
            >
              <span>{{ cat.category_name }}</span>

              <span
                v-if="!cat.is_active"
                class="text-[10px] font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-md border border-red-100"
              >
                Tidak Aktif
              </span>
            </li>
          </ul>

          <p v-if="isNotFound" class="text-red-500 text-[10px] mt-1 font-medium italic">
            Kategori "{{ searchQuery }}" tidak ditemukan di daftar.
          </p>
          <p v-if="errors?.category_id" class="text-red-500 text-xs mt-1">
            {{ errors.category_id[0] }}
          </p>
        </div>

        <AppInput
          v-model="form.product_name"
          label="Nama Produk *"
          placeholder="Kecap Manis"
          :error="errors?.product_name"
          required
        />
        <AppInput
          v-model="form.brand"
          label="Merk *"
          placeholder="Bango"
          :error="errors?.brand"
          required
        />

        <AppInput v-model="form.type" label="Tipe" placeholder="Goreng" />
        <AppInput
          v-model="form.packaging"
          label="Kemasan *"
          placeholder="Pouch"
          :error="errors?.packaging"
          required
        />

        <div class="col-span-2 grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.size"
            label="Ukuran/Berat *"
            placeholder="100"
            :error="errors?.size"
            required
          />
          <AppInput
            v-model="form.min_stock"
            type="number"
            label="Minimal Stok *"
            placeholder="10"
            :error="errors?.min_stock"
            required
            class="col-span-1"
          />
        </div>

        <!-- INPUTAN HARGA BELI & HARGA JUAL DENGAN FORMAT RUPIAH (.00) -->
        <div class="col-span-2 grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Harga Beli *</label>
            <div class="relative flex items-center">
              <span class="absolute left-3 text-sm font-semibold text-gray-500">Rp</span>
              <input
                type="text"
                :value="displayPurchasePrice"
                @input="onInputPurchasePrice"
                @blur="onBlurPurchasePrice"
                placeholder="50.000,00"
                class="w-full pl-9 pr-4 py-2 border rounded-lg outline-none text-sm border-gray-300 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <p v-if="errors?.purchase_price" class="text-red-500 text-xs mt-1">
              {{ errors.purchase_price[0] }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Harga Jual *</label>
            <div class="relative flex items-center">
              <span class="absolute left-3 text-sm font-semibold text-gray-500">Rp</span>
              <input
                type="text"
                :value="displaySellingPrice"
                @input="onInputSellingPrice"
                @blur="onBlurSellingPrice"
                placeholder="100.000,00"
                class="w-full pl-9 pr-4 py-2 border rounded-lg outline-none text-sm border-gray-300 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <p v-if="errors?.selling_price" class="text-red-500 text-xs mt-1">
              {{ errors.selling_price[0] }}
            </p>
          </div>
        </div>

        <div class="col-span-2 flex items-center text-xs text-gray-400 italic">
          * Mengubah identitas fisik (Kategori, Merk, Tipe, Kemasan, Ukuran) akan me-regenerasi
          format SKU produk ini secara otomatis.
        </div>

        <div class="col-span-2 pt-4 flex justify-end gap-3">
          <AppButton variant="outline" type="button" @click="$emit('close')" :disabled="submitting">
            Batal
          </AppButton>
          <AppButton variant="primary" type="submit" :loading="submitting">
            {{ isEditMode ? 'Simpan Perubahan' : 'Simpan Produk' }}
          </AppButton>
        </div>
      </form>
    </div>
  </div>
</template>
