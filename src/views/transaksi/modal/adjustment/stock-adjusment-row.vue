<script setup lang="ts">
import { computed } from 'vue'
import { fmt } from '@/functions'
import AppInputSku from '@/components/app-input-sku.vue'

const props = defineProps<{
  modelValue: any
  showDelete: boolean
  readonly?: boolean
  allProducts?: any[]
  allRacks?: any[]
  productLocations?: any[]
  duplicateStatus?: 'exact' | 'partial' | null
}>()

const emit = defineEmits(['update:modelValue', 'remove', 'validate'])

// Format tanggal dari database ke YYYY-MM-DD
const formatDateForSelect = (dateString: string | null): string => {
  if (!dateString) return ''
  let clean = String(dateString)
  if (clean.includes('T')) clean = clean.split('T')[0] || ''
  if (clean.includes(' ')) clean = clean.split(' ')[0] || ''
  return clean
}

// Helper Label Rak
const getRackLabel = (rackId: any, locObj?: any, isTarget: boolean = false) => {
  if (props.readonly) {
    if (isTarget) {
      if (props.modelValue.target_rack_name) return props.modelValue.target_rack_name
      if (props.modelValue.to_rack_name) return props.modelValue.to_rack_name
    } else {
      if (props.modelValue.rack_name) return props.modelValue.rack_name
      if (props.modelValue.from_rack_name) return props.modelValue.from_rack_name
    }
  }

  if (locObj) {
    if (locObj.rack_name) return locObj.rack_name
    if (locObj.rack?.rack_name) return locObj.rack.rack_name
    if (locObj.location_code) return locObj.location_code
  }

  if (!rackId) return 'Pilih Rak...'
  const searchId = Number(rackId)

  const rawRacks = Array.isArray(props.allRacks)
    ? props.allRacks
    : (props.allRacks as any)?.data || []

  const rack = rawRacks.find((r: any) => Number(r.id) === searchId)
  if (rack) {
    return rack.location_code || rack.rack_name || rack.rack_code || `Rak ${rack.id}`
  }

  return `ID: ${rackId}`
}

// Ambil lokasi yang cocok dengan SKU
const availableLocations = computed(() => {
  const sku = props.modelValue.product_sku
  if (!sku || !props.productLocations) return []
  return props.productLocations.filter((loc) => loc.product_sku === sku)
})

const updateItem = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const selectedId = Number(target.value)

  const selected = availableLocations.value.find((l) => Number(l.id) === selectedId)

  if (selected) {
    const cleanDate = formatDateForSelect(selected.expired_at)
    emit('update:modelValue', {
      ...props.modelValue,
      rack_id: selected.rack_id,
      rack_name: selected.location_code || getRackLabel(selected.rack_id, selected),
      expired_at: cleanDate,
    })
  } else {
    emit('update:modelValue', {
      ...props.modelValue,
      rack_id: null,
      expired_at: '',
    })
  }
}

const updateField = (field: string, value: any) => {
  let finalValue = value
  if (field === 'rack_id' && value !== null) finalValue = Number(value)
  emit('update:modelValue', { ...props.modelValue, [field]: finalValue })
}

// Handler ketika SKU dipilih via Autocomplete / AppInputSku
const handleSelectProduct = (product: any) => {
  emit('update:modelValue', {
    ...props.modelValue,
    product_sku: product.sku || product.product_sku,
    namaProduk: product.product_name || product.namaProduk,
  })
  emit('validate', product.sku || product.product_sku)
}

// Filter Expired Date unik
const availableExpiredDates = computed(() => {
  const sku = props.modelValue.product_sku
  if (!sku || !props.productLocations) return []

  return props.productLocations
    .filter((loc) => loc.product_sku === sku && loc.qty > 0)
    .map((loc) => formatDateForSelect(loc.expired_at))
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort()
})
</script>

<template>
  <div
    class="group relative flex flex-col gap-4 p-5 bg-white border-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:border-indigo-300"
    :class="{
      'border-l-4 border-l-red-500': modelValue.type === 'OUT' || modelValue.jenis === 'KELUAR',
      'border-l-4 border-l-green-500': modelValue.type === 'IN' || modelValue.jenis === 'MASUK',
    }"
  >
    <!-- BADGE PERTANDA DUPLIKAT -->
    <div v-if="duplicateStatus" class="flex items-center gap-2 -mb-2">
      <span
        v-if="duplicateStatus === 'exact'"
        class="text-[11px] font-bold bg-rose-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm"
      >
        ⚠️ DUPLIKAT (SKU, Lokasi, Expired & Qty Sama!)
      </span>
      <span
        v-else-if="duplicateStatus === 'partial'"
        class="text-[11px] font-bold bg-amber-500 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm"
      >
        ⚡ DUPLIKAT LOKASI & EXPIRED (SKU + Lokasi + Expired Sama)
      </span>
    </div>

    <!-- MODE 1: TAMPILKAN INPUT CARI PRODUK BILA SKU MASIH KOSONG -->
    <div v-if="!modelValue.product_sku" class="w-full">
      <label class="text-xs font-bold text-gray-600 mb-1 block">Cari Produk / SKU</label>
      <AppInputSku
        :model-value="modelValue.product_sku"
        :products="allProducts"
        @select="handleSelectProduct"
      />
    </div>

    <!-- MODE 2: BILA SKU SUDAH DIPILIH (TAMPILKAN BARIS LENGKAP SERAGAM) -->
    <div v-else class="flex flex-col md:flex-row gap-4 w-full items-center">
      <!-- Info Produk -->
      <div class="flex-[2] w-full">
        <div class="font-bold text-gray-800 text-base md:text-lg">{{ modelValue.product_sku }}</div>
        <div class="text-xs text-gray-500 mt-0.5 truncate">
          {{ modelValue.namaProduk || modelValue.product_name }}
        </div>
      </div>

      <!-- Pemilihan Lokasi & Expired (Seragam untuk Tambah/Kurang) -->
      <div class="flex-[2] w-full">
        <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
          Pilih Lokasi & Expired
        </label>
        <div class="relative">
          <select
            @change="updateItem"
            :value="
              availableLocations.find((l) => {
                const normalizedLocExp = formatDateForSelect(l.expired_at)
                return (
                  String(l.rack_id) === String(modelValue.rack_id) &&
                  normalizedLocExp === modelValue.expired_at
                )
              })?.id || ''
            "
            class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs md:text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer"
          >
            <option value="">
              {{
                availableLocations.length === 0
                  ? 'Stok tidak ditemukan'
                  : '-- Pilih Rak & Expired --'
              }}
            </option>
            <option v-for="loc in availableLocations" :key="loc.id" :value="loc.id">
              🏢 {{ getRackLabel(loc.rack_id, loc) }} | 📅 Exp:
              {{ loc.expired_at ? fmt.date(loc.expired_at) : '-' }} | 📦 Stok: {{ loc.qty }}
            </option>
          </select>
        </div>
      </div>

      <!-- Quantity Adjustment -->
      <div class="w-full md:w-32">
        <label
          class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block text-center"
        >
          Qty Adjustment
        </label>
        <div
          class="flex items-center bg-gray-50 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-500 transition-all"
        >
          <!-- Simbol + atau - tergantung jenis/type -->
          <span
            class="px-2 text-lg font-bold"
            :class="
              modelValue.type === 'IN' || modelValue.jenis === 'MASUK'
                ? 'text-green-500'
                : 'text-red-500'
            "
          >
            {{ modelValue.type === 'IN' || modelValue.jenis === 'MASUK' ? '+' : '-' }}
          </span>
          <input
            type="number"
            :value="modelValue.qty"
            @input="
              (e: any) =>
                emit('update:modelValue', { ...modelValue, qty: Math.abs(Number(e.target.value)) })
            "
            class="w-full p-2 bg-transparent text-center font-bold outline-none text-sm"
            min="1"
          />
        </div>
      </div>

      <!-- Notes / Catatan -->
      <div class="flex-1 w-full">
        <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
          Catatan
        </label>
        <input
          type="text"
          :value="modelValue.notes"
          @input="(e: any) => emit('update:modelValue', { ...modelValue, notes: e.target.value })"
          placeholder="Opsional..."
          class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
        />
      </div>

      <!-- Delete Button -->
      <button
        v-if="showDelete"
        type="button"
        @click="$emit('remove')"
        class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
        title="Hapus item"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            stroke-width="2"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
