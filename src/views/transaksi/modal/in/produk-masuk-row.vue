<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import AppInputSku from '@/components/app-input-sku.vue'
import AppInputRack from '@/components/app-input-rack.vue'
import fmtDate from '@/functions/fmt/date'
import { useRackRecommendations } from '@/models/rack'

const props = defineProps<{
  modelValue: any
  showDelete?: boolean
  readonly?: boolean
  allProducts?: any[]
  allRacks?: any[]
  index: number
  errors?: Record<string, any>
  isExactDuplicate?: boolean
  isSkuExpiredDuplicate?: boolean
}>()
const emit = defineEmits(['update:modelValue', 'remove', 'openSearch', 'validate', 'clear-error'])

const showSuggestions = ref(false)

const todayString = computed(() => {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
})

const dateValidation = computed(() => {
  if (!props.modelValue?.expired_at) return { type: null, message: '' }

  const selectedDate = new Date(props.modelValue.expired_at)
  selectedDate.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Cek jika tanggal sebelum hari ini (Merah)
  if (selectedDate < today) {
    return { type: 'error', message: '✕ Expired tidak boleh lampau!' }
  }

  // 2. Cek jika kurang dari 3 bulan / 90 hari ke depan (Kuning)
  const threeMonthsLater = new Date()
  threeMonthsLater.setDate(today.getDate() + 90)
  threeMonthsLater.setHours(0, 0, 0, 0)

  if (selectedDate < threeMonthsLater) {
    return { type: 'error', message: '⚠️ Stok (< 3 bulan)' }
  }

  return { type: null, message: '' }
})

const updateField = (field: string, value: any) => {
  let finalValue = value
  if (field === 'rack_id' && value !== null) {
    finalValue = Number(value)
  }

  // Buat objek baru untuk modelValue
  const updatedData = {
    ...props.modelValue,
    [field]: finalValue,
  }

  // Kirim ke induk agar state 'form' terupdate
  emit('update:modelValue', updatedData)

  // KRITIKAL: Jika yang berubah SKU, suruh induk validasi ulang saat itu juga
  if (field === 'product_sku') {
    emit('validate', value)
  }
}

const setDefaultRack = () => {
  // Hanya eksekusi jika mode input (bukan readonly), rack belum terisi, dan data rak sudah ada
  if (!props.readonly && !props.modelValue.rack_id && props.allRacks && props.allRacks.length > 0) {
    const ldRack = props.allRacks.find((r: any) => r.location_code === 'LD-01')
    if (ldRack) {
      updateField('rack_id', ldRack.id)
    }
  }
}

const getRackLabel = (rackId: any) => {
  if (!props.allRacks || props.allRacks.length === 0) return 'Memuat...'
  if (!rackId) return 'N/A'

  const rack = props.allRacks.find((r: any) => Number(r.id) === Number(rackId))
  return rack ? `${rack.location_code} (${rack.rack_name})` : `ID ${rackId}`
}

const suggestedProducts = computed(() => {
  const skuValue = props.modelValue?.product_sku ?? props.modelValue?.produkSku ?? ''
  const s = String(skuValue).toLowerCase().trim()
  if (!s) return []

  // Ambil data produk (pastikan tembus ke .data)
  const rawData = props.allProducts as any
  const productList = Array.isArray(rawData) ? rawData : rawData?.data || []

  return productList
    .filter((p: any) => {
      return (
        String(p.sku).toLowerCase().includes(s) || String(p.product_name).toLowerCase().includes(s)
      )
    })
    .slice(0, 10)
})

const selectProduct = (product: any) => {
  if (product.is_active === false || product.is_active === 0) {
    return
  }

  updateField('product_sku', product.sku)
  showSuggestions.value = false
  emit('validate', product.sku)
}

const onFocusQty = (e: FocusEvent) => {
  ;(e.target as HTMLInputElement).select()
}

const hideSuggestions = () => {
  window.setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const qtyError = computed(() => {
  if (!props.errors) return null

  // Mencari key error dinamis (misal: items.0.qty)
  const key = `items.${props.index}.qty`

  if (props.errors[key]) {
    // Jika dari backend berupa array string, ambil baris pertama
    return Array.isArray(props.errors[key]) ? props.errors[key][0] : props.errors[key]
  }

  return null
})

const skuError = computed(() => {
  if (!props.errors) return null
  const key = `items.${props.index}.product_sku`
  if (props.errors[key]) {
    return Array.isArray(props.errors[key]) ? props.errors[key][0] : props.errors[key]
  }
  return null
})

// 2. Tambahkan Error untuk Rak
const rackError = computed(() => {
  if (!props.errors) return null
  const key = `items.${props.index}.rack_id`
  if (props.errors[key]) {
    return Array.isArray(props.errors[key]) ? props.errors[key][0] : props.errors[key]
  }
  return null
})

const expiredError = computed(() => {
  if (!props.errors) return null
  const key = `items.${props.index}.expired_at`
  if (props.errors[key]) {
    return Array.isArray(props.errors[key]) ? props.errors[key][0] : props.errors[key]
  }
  return null
})

watch(
  () => props.allRacks,
  (newRacks) => {
    if (newRacks && newRacks.length > 0) {
      setDefaultRack()
    }
  },
  { immediate: true },
)

onMounted(() => {
  nextTick(() => {
    setDefaultRack()
  })
})
</script>

<template>
  <div class="w-full flex flex-col mb-2">
    <!-- Peringatan Duplikasi: Hanya muncul jika NOT readonly -->
    <div
      v-if="!readonly && isExactDuplicate"
      class="text-[11px] text-red-600 font-bold mb-1 flex items-center gap-1 bg-red-100 px-3 py-1 rounded-t-lg border-x border-t border-red-200"
    >
      ⚠️ Baris Duplikat Total! SKU, QTY, & Expired Date sama persis dengan baris lain.
    </div>
    <div
      v-else-if="!readonly && isSkuExpiredDuplicate"
      class="text-[11px] text-amber-700 font-bold mb-1 flex items-center gap-1 bg-amber-100 px-3 py-1 rounded-t-lg border-x border-t border-amber-200"
    >
      ⚠️ Perhatian Duplikat Parsial: SKU & Expired Date sama dengan baris lain (QTY Berbeda).
    </div>

    <div
      class="grid grid-cols-12 gap-2.5 p-3 items-start rounded-lg border relative group transition-all"
      :class="{
        'opacity-80 bg-gray-50 border-gray-100': readonly,
        'bg-red-50/50 border-red-300 shadow-sm rounded-tr-none rounded-tl-none':
          !readonly && isExactDuplicate,
        'bg-amber-50/50 border-amber-300 shadow-sm rounded-tr-none rounded-tl-none':
          !readonly && isSkuExpiredDuplicate,
        'bg-gray-50 border-gray-100': !readonly && !isExactDuplicate && !isSkuExpiredDuplicate,
      }"
    >
      <div class="col-span-4 relative">
        <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight"
          >Kode SKU Produk *</label
        >

        <template v-if="readonly">
          <input
            type="text"
            :value="modelValue.product_sku"
            disabled
            class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white font-mono font-bold text-blue-600"
          />
        </template>

        <template v-else>
          <AppInputSku
            :model-value="{
              produkSku: modelValue.product_sku || modelValue.produkSku || '',
              isValid: modelValue.isValid || false,
              isError: modelValue.isError || false,
            }"
            @update:model-value="(val) => updateField('product_sku', val.produkSku)"
            @focus="showSuggestions = true"
            @blur="hideSuggestions"
            @validate="() => emit('validate', modelValue.product_sku || modelValue.produkSku)"
            placeholder="Input SKU"
            class="bg-white"
          />

          <div class="mt-1 flex justify-between items-center px-1">
            <p
              v-if="
                (modelValue.product_sku || modelValue.produkSku) &&
                suggestedProducts.length === 0 &&
                !modelValue.isValid
              "
              class="text-[10px] text-red-500 font-bold animate-pulse"
            >
              ✕ SKU tidak ditemukan di database
            </p>

            <p v-if="modelValue.isValid" class="text-[10px] text-green-600 font-bold">
              ✓ Produk Terverifikasi
            </p>
            <p v-if="skuError" class="text-[10px] text-red-500 font-semibold mt-0.5">
              {{ skuError }}
            </p>
          </div>

          <div
            v-if="showSuggestions && suggestedProducts.length > 0"
            class="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto"
          >
            <div v-for="p in suggestedProducts" :key="p.sku" class="border-b last:border-0">
              <div
                @mousedown="p.is_active ? selectProduct(p) : null"
                :class="[
                  'px-4 py-2 transition-colors flex justify-between items-center',
                  p.is_active
                    ? 'hover:bg-blue-50 cursor-pointer text-gray-800'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-60',
                ]"
                :title="
                  p.is_active
                    ? 'Pilih Produk'
                    : 'Produk non-aktif tidak dapat dipilih untuk transaksi'
                "
              >
                <p
                  class="text-sm font-bold font-mono"
                  :class="p.is_active ? 'text-gray-800' : 'text-gray-400'"
                >
                  {{ p.sku }}
                </p>
                <p
                  class="text-[10px] uppercase"
                  :class="p.is_active ? 'text-gray-500' : 'text-gray-400'"
                >
                  {{ p.product_name }}
                </p>
              </div>
              <div v-if="!p.is_active" class="px-4 py-2 bg-red-50">
                <span
                  class="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                >
                  TIDAK AKTIF
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="col-span-1 relative">
        <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight"
          >Qty *</label
        >
        <input
          type="number"
          :value="modelValue.qty"
          :disabled="readonly"
          @input="(e) => updateField('qty', Number((e.target as HTMLInputElement).value))"
          @focus="onFocusQty"
          class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
          :class="{ 'border-red-400 ring-2 ring-red-50': qtyError }"
        />
      </div>

      <!-- <AppInputSku
        :model-value="modelValue.product_sku"
        @update:model-value="
          (val) => $emit('update:modelValue', { ...modelValue, product_sku: val })
        "
        placeholder="Input SKU..."
      />

      <p v-if="modelValue.isValid" class="text-[11px] text-green-600 mt-1 font-semibold italic">
        📦 {{ modelValue.namaProduk }}
      </p>

      <input
        type="number"
        :value="modelValue.qty"
        @input="
          (e) =>
            $emit('update:modelValue', {
              ...modelValue,
              qty: Number((e.target as HTMLInputElement).value),
            })
        "
        class="..."
      /> -->
      <!-- </div> -->

      <div class="col-span-2">
        <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight"
          >Rak *</label
        >
        <template v-if="readonly">
          <div
            class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
          >
            {{ modelValue.rack_name || getRackLabel(modelValue.rack_id) }}
          </div>
        </template>

        <template v-else>
          <AppInputRack
            :model-value="modelValue.rack_id"
            :options="allRacks || []"
            placeholder="Cari Rak"
            @update:model-value="(val) => updateField('rack_id', val)"
            :class="{ 'border-red-400 ring-2 ring-red-50 rounded-lg': rackError }"
          />
          <p v-if="rackError" class="text-[10px] text-red-500 font-semibold mt-1 px-1">
            {{ rackError }}
          </p>
        </template>
      </div>

      <div class="col-span-2">
        <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight"
          >Expired At *</label
        >
        <template v-if="readonly">
          <div
            class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
          >
            {{
              modelValue.expired_at
                ? fmtDate.date(new Date(modelValue.expired_at), 'dd MMM yyyy')
                : '-'
            }}
          </div>
        </template>
        <div v-else class="w-full flex flex-col">
          <input
            type="date"
            :value="modelValue.expired_at"
            :disabled="readonly"
            :min="todayString"
            @input="(e) => updateField('expired_at', (e.target as HTMLInputElement).value)"
            class="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm"
            :class="[
              expiredError || dateValidation.type === 'error'
                ? 'border-red-400 ring-2 ring-red-50'
                : dateValidation.type === 'warning'
                  ? 'border-amber-400 ring-2 ring-amber-50 bg-amber-50/30'
                  : 'border-gray-300 focus:ring-blue-100',
            ]"
          />
          <!-- Label Penanda Dinamis di bawah Input -->
          <div class="mt-0.5 px-0.5 flex flex-col gap-px">
            <p v-if="dateValidation.type === 'error'" class="text-[9px] text-red-500 font-bold">
              {{ dateValidation.message }}
            </p>
            <p
              v-else-if="dateValidation.type === 'warning'"
              class="text-[9px] text-amber-600 font-bold"
            >
              {{ dateValidation.message }}
            </p>
            <p v-if="expiredError" class="text-[9px] text-red-500 font-semibold">
              {{ expiredError }}
            </p>
          </div>
        </div>
      </div>

      <div class="col-span-3">
        <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight"
          >Keterangan Barang</label
        >
        <input
          type="text"
          :value="modelValue.notes"
          :disabled="readonly"
          @input="(e) => updateField('notes', (e.target as HTMLInputElement).value)"
          placeholder="Catatan..."
          class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm"
        />
      </div>
    </div>

    <button
      v-if="showDelete && !readonly"
      type="button"
      @click="$emit('remove')"
      class="self-end md:mb-1.5 p-2 text-red-300 hover:text-red-600"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
  <div v-if="qtyError" class="mt-2">
    <AppAlert
      variant="error"
      :message="qtyError"
      :show="true"
      @close="emit('clear-error', `items.${index}.qty`)"
    />
  </div>
</template>
