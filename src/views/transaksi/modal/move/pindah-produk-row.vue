<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import AppInputSku from '@/components/app-input-sku.vue'
import AppInputRack from '@/components/app-input-rack.vue'
import AppAlert from '@/components/app-alert.vue'
import fmtDate from '@/functions/fmt/date'
import { useRackRecommendations } from '@/models/rack'

const props = defineProps<{
  modelValue: any
  showDelete: boolean
  readonly?: boolean
  allProducts?: any[]
  allRacks?: any[]
  productLocations?: any[]
  moveMode?: 'FEFO' | 'OPTIMASI'
  loadingDockId?: any
  index: number
  errors?: Record<string, any>
  formItems?: any[]
  isExactDuplicate?: boolean
  isSkuExpiredDuplicate?: boolean
  availableStock?: number
  virtualCapacity?: number
}>()
const emit = defineEmits(['update:modelValue', 'remove', 'validate', 'clear-error'])

const showSuggestions = ref(false)

const { recommendedRacks, loading: loadingRack, fetchRecommendations } = useRackRecommendations()

const loadingDockRacks = computed(() => {
  if (!props.allRacks) return []
  // Filter rak yang memiliki nama/kode "Loading Dock" atau "LD"
  return props.allRacks.filter(
    (r: any) =>
      String(r.rack_name).toLowerCase().includes('loading dock') ||
      String(r.location_code).toLowerCase().includes('ld'),
  )
})

// Menentukan ID Loading Dock default untuk baris ini
const defaultLoadingDockId = computed(() => {
  if (props.loadingDockId) return Number(props.loadingDockId)
  if (loadingDockRacks.value.length > 0) return Number(loadingDockRacks.value[0].id)
  return null
})

// Fungsi pembantu untuk set target otomatis jika mode FEFO
const applyFefoTarget = () => {
  if (props.moveMode === 'FEFO' && defaultLoadingDockId.value) {
    updateField('target_rack_id', defaultLoadingDockId.value)
  }
}

const clearFields = () => {
  updateField('expired_at', '')
  updateField('rack_id', null)
  updateField('target_rack_id', null)
}

watch(
  () => [
    props.modelValue.qty,
    props.modelValue.rack_id,
    props.moveMode,
    props.modelValue.isEvacuation,
  ],
  ([newQty, newRackId, currentMode, isEvacuation]) => {
    if (props.readonly) return

    // Hanya cari rekomendasi jika berada di mode OPTIMASI dan Qty valid
    if ((currentMode === 'OPTIMASI' || isEvacuation) && newQty && Number(newQty) > 0) {
      fetchRecommendations(
        Number(newQty),
        newRackId ? Number(newRackId) : undefined,
        props.formItems || [],
      )
    }
  },
  { immediate: true },
)

// LOGIKA AUTO-SELECT BERBASIS PRIORITAS (FEFO)
// 1. WATCHER SKU: Trigger pencarian data expired terdekat hanya jika FEFO
watch(
  () => props.modelValue.product_sku || props.modelValue.produkSku,
  (newSku) => {
    if (props.readonly) return
    if (props.modelValue?.isEvacuation) return
    clearFields()

    if (newSku) {
      nextTick(() => {
        if (props.moveMode === 'FEFO') {
          applyFefoTarget()
          if (availableExpiredDates.value.length > 0) {
            updateField('expired_at', availableExpiredDates.value[0])
          }
        }
      })
    }
  },
)

// WATCHER EXPIRED AT: Cari rak asal otomatis yang memuat expired tersebut
watch(
  () => props.modelValue.expired_at,
  (newExp) => {
    if (props.readonly) return
    if (props.modelValue?.isEvacuation) return
    if (newExp && sourceRacks.value && sourceRacks.value.length > 0) {
      const firstRack = sourceRacks.value[0]
      if (firstRack && firstRack.id) {
        updateField('rack_id', Number(firstRack.id))
      }
    } else {
      updateField('rack_id', null)
    }

    if (props.moveMode === 'FEFO') {
      applyFefoTarget()
    }
  },
)

// 3. WATCHER PERUBAHAN MODE (FEFO / OPTIMASI) DI TENGAH JALAN
watch(
  () => props.moveMode,
  (newMode) => {
    if (props.readonly) return
    if (props.modelValue?.isEvacuation) return
    if (newMode === 'FEFO') {
      applyFefoTarget()
      if (availableExpiredDates.value.length > 0) {
        updateField('expired_at', availableExpiredDates.value[0])
      }
    } else if (newMode === 'OPTIMASI') {
      clearFields()
    }
  },
)

// 🛠️ PERBAIKAN FUNGSI getRackLabel (PRIORITASKAN LOCATION_CODE/BIN)
const getRackLabel = (rackId: any, isTarget: boolean = false) => {
  // 1. Mode Readonly (Mengecek location_code terlebih dahulu)
  if (props.readonly) {
    if (isTarget) {
      if (props.modelValue.target_location_code) return props.modelValue.target_location_code
      if (props.modelValue.target_rack_code) return props.modelValue.target_rack_code
      if (props.modelValue.target_rack_name) return props.modelValue.target_rack_name
      if (props.modelValue.to_rack_name) return props.modelValue.to_rack_name
    } else {
      if (props.modelValue.location_code) return props.modelValue.location_code
      if (props.modelValue.rack_code) return props.modelValue.rack_code
      if (props.modelValue.rack_name) return props.modelValue.rack_name
      if (props.modelValue.from_rack_name) return props.modelValue.from_rack_name
    }
  }

  if (!rackId) return 'Pilih Rak...'

  const searchId = Number(rackId)

  const findInList = (list: any[]) => {
    if (!Array.isArray(list)) return null
    return list.find((r: any) => Number(r.id) === searchId)
  }

  // 2. Cari di master allRacks
  const rawRacks = Array.isArray(props.allRacks)
    ? props.allRacks
    : (props.allRacks as any)?.data || []
  const rack = findInList(rawRacks)
  if (rack) {
    if (rack.location_code) return rack.location_code
    if (rack.rack_code) return rack.rack_code
    if (rack.rack_name) return rack.rack_name
    return `Rak ${rack.id}`
  }

  // 3. Cari di Loading Dock Racks
  const dockRack = findInList(loadingDockRacks.value)
  if (dockRack) return dockRack.location_code || dockRack.rack_code || dockRack.rack_name

  // 4. Cari di Recommended Racks
  const recRack = findInList(recommendedRacks.value)
  if (recRack) return recRack.location_code || recRack.rack_code || recRack.rack_name

  return `ID: ${rackId}`
}

const suggestedProducts = computed(() => {
  const skuValue = props.modelValue?.product_sku ?? props.modelValue?.produkSku ?? ''
  const s = String(skuValue).toLowerCase().trim()
  if (!s) return []

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

const updateField = (field: string, value: any) => {
  let finalValue = value
  if ((field === 'rack_id' || field === 'target_rack_id') && value !== null) {
    finalValue = Number(value)
  }

  emit('update:modelValue', { ...props.modelValue, [field]: finalValue })
  if (field === 'product_sku') emit('validate', finalValue)
}

const onFocusQty = (e: FocusEvent) => {
  ;(e.target as HTMLInputElement).select()
}

const hideSuggestions = () => {
  window.setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const normalizeExpiredAt = (value: any) => {
  if (value === null || value === undefined || value === '') return ''
  const raw = String(value).trim()
  const date = new Date(raw)
  if (!Number.isNaN(date.getTime())) {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
  return raw.includes('T') ? raw.split('T')[0] : raw
}

const availableExpiredDates = computed(() => {
  const sku = props.modelValue.product_sku || props.modelValue.produkSku
  if (!sku || !props.productLocations) return []

  const rawData = props.productLocations as any
  const locationList = Array.isArray(rawData) ? rawData : rawData?.data || []

  return locationList
    .filter((loc: any) => loc.product_sku === sku && loc.qty > 0)
    .map((loc: any) => normalizeExpiredAt(loc.expired_at))
    .filter((value: any, index: number, self: any) => self.indexOf(value) === index)
    .sort()
})

// 🛠️ PERBAIKAN SOURCE RACKS (UTAMAKAN LOCATION_CODE)
const sourceRacks = computed(() => {
  const sku = props.modelValue.product_sku || props.modelValue.produkSku
  const exp = normalizeExpiredAt(props.modelValue.expired_at)

  if (!sku || !exp || !props.productLocations) return []

  const rawData = props.productLocations as any
  const locationList = Array.isArray(rawData) ? rawData : rawData?.data || []

  const rawRacks = props.allRacks as any
  const rackList = Array.isArray(rawRacks) ? rawRacks : rawRacks?.data || []

  return locationList
    .filter(
      (loc: any) =>
        loc.product_sku === sku && normalizeExpiredAt(loc.expired_at) === exp && loc.qty > 0,
    )
    .map((loc: any) => {
      const rackInfo = rackList.find((r: any) => Number(r.id) === Number(loc.rack_id))

      // Utamakan location_code atau rack_code
      const codeLabel =
        loc.location_code ||
        (rackInfo ? rackInfo.location_code || rackInfo.rack_code || rackInfo.rack_name : null) ||
        loc.rack_name ||
        `Rak ID ${loc.rack_id}`

      return {
        id: loc.rack_id,
        label: codeLabel,
        qty: loc.qty,
      }
    })
})

const qtyError = computed(() => {
  if (!props.errors) return null
  const key = `items.${props.index}.qty`
  if (props.errors[key]) {
    return Array.isArray(props.errors[key]) ? props.errors[key][0] : props.errors[key]
  }
  return null
})
</script>

<template>
  <div class="w-full flex flex-col mb-4">
    <!-- Peringatan Duplikasi Total (Merah) -->
    <div
      v-if="!readonly && isExactDuplicate"
      class="text-[11px] text-red-600 font-bold mb-1 flex flex-col gap-0.5 bg-red-100 px-3 py-2 rounded-t-lg border-x border-t border-red-200 shadow-sm"
    >
      <div class="flex items-center gap-1.5 text-xs">
        ⚠️ <span>Baris Duplikat Total (Mode {{ moveMode }})</span>
      </div>
      <p class="text-[10px] font-normal text-red-700 leading-relaxed mt-0.5">
        <template v-if="moveMode === 'FEFO'">
          Sistem mendeteksi ada baris lain dengan kombinasi
          <strong>SKU, Qty, Tanggal Expired, dan Rak Asal</strong> yang sama persis. Harap gabungkan
          Qty atau ubah data agar tidak terjadi double input transaksi persiapan keluar.
        </template>
        <template v-else>
          Sistem mendeteksi ada baris lain dengan kombinasi
          <strong>SKU, Qty, Tanggal Expired, Rak Asal, dan Rak Tujuan</strong> yang sama persis.
          Harap sesuaikan lokasi target atau gabungkan kuantitas untuk optimasi ruang ini.
        </template>
      </p>
    </div>

    <!-- Peringatan Duplikasi Parsial (Amber) -->
    <div
      v-else-if="!readonly && isSkuExpiredDuplicate"
      class="text-[11px] text-amber-800 font-bold mb-1 flex flex-col gap-0.5 bg-amber-100 px-3 py-2 rounded-t-lg border-x border-t border-amber-200 shadow-sm"
    >
      <div class="flex items-center gap-1.5 text-xs">
        ⚠️ <span>Perhatian: Duplikat Alokasi (Mode {{ moveMode }})</span>
      </div>
      <p class="text-[10px] font-normal text-amber-900 leading-relaxed mt-0.5">
        <template v-if="moveMode === 'FEFO'">
          <strong>SKU, Tanggal Expired, dan Rak Asal</strong> sudah digunakan di baris lain dengan
          Qty berbeda. Disarankan untuk langsung menggabungkan total Qty ke dalam satu baris agar
          pencatatan dokumen pengeluaran lebih rapi.
        </template>
        <template v-else>
          <strong>SKU, Tanggal Expired, Rak Asal, dan Rak Tujuan</strong> terdeteksi kembar di baris
          lain. Direkomendasikan menyatukan nilai Qty-nya saja di satu baris alih-alih memecahnya ke
          beberapa baris dengan tujuan rak yang sama.
        </template>
      </p>
    </div>

    <!-- Kotak Row Input Utama -->
    <div
      class="flex flex-col gap-4 p-4 rounded-lg border relative group transition-all"
      :class="{
        'opacity-80 bg-gray-50 border-gray-100': readonly,
        'bg-red-50/50 border-red-300 shadow-sm rounded-tr-none rounded-tl-none':
          !readonly && isExactDuplicate,
        'bg-amber-50/50 border-amber-300 shadow-sm rounded-tr-none rounded-tl-none':
          !readonly && isSkuExpiredDuplicate,
        'bg-gray-50 border-gray-100': !readonly && !isExactDuplicate && !isSkuExpiredDuplicate,
      }"
    >
      <div class="flex flex-col gap-4 w-full">
        <div class="grid grid-cols-12 gap-3 items-start w-full">
          <!-- SKU -->
          <div class="col-span-12 md:col-span-4 relative">
            <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight"
              >Kode SKU Produk *</label
            >

            <template v-if="readonly">
              <input
                type="text"
                :value="modelValue.product_sku"
                disabled
                class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-mono font-bold text-blue-600 text-sm"
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
              </div>

              <div
                v-if="showSuggestions && suggestedProducts.length > 0"
                class="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto"
              >
                <div
                  v-for="p in suggestedProducts"
                  :key="p.sku"
                  @mousedown="p.is_active ? selectProduct(p) : null"
                  :class="[
                    'px-4 py-2 border-b last:border-0 transition-colors flex justify-between items-center',
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
                  <div>
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
                  <div v-if="!p.is_active">
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

          <!-- Qty -->
          <div class="col-span-12 md:col-span-1">
            <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight"
              >Qty *</label
            >
            <input
              type="number"
              :value="modelValue.qty"
              :disabled="readonly"
              @input="(e) => updateField('qty', Number((e.target as HTMLInputElement).value))"
              @focus="onFocusQty"
              class="w-full px-3 py-2 border bg-white border-gray-200 rounded-lg text-sm text-gray-700"
              :class="{ 'border-red-400 ring-2 ring-red-50': qtyError }"
            />
          </div>

          <!-- Expired At -->
          <div class="col-span-12 md:col-span-2">
            <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight"
              >Expired At *</label
            >
            <template v-if="readonly">
              <div
                class="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700"
              >
                {{
                  modelValue.expired_at
                    ? fmtDate.date(new Date(modelValue.expired_at), 'dd MMM yyyy')
                    : '-'
                }}
              </div>
            </template>
            <select
              v-else
              :value="modelValue.expired_at"
              @change="(e) => updateField('expired_at', (e.target as HTMLSelectElement).value)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">-- Pilih --</option>
              <option v-for="date in availableExpiredDates" :key="date" :value="date">
                {{ date ? fmtDate.date(new Date(date), 'dd MMM yyyy') : '-' }}
              </option>
            </select>

            <p
              v-if="!readonly && modelValue.product_sku && availableExpiredDates.length === 0"
              class="text-[9px] text-red-500 mt-1"
            >
              Stok tidak tersedia di lokasi manapun.
            </p>
          </div>

          <!-- Dari Lokasi -->
          <div class="col-span-12 md:col-span-3">
            <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight"
              >Dari Lokasi *</label
            >
            <template v-if="readonly">
              <div
                class="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 font-sm"
              >
                {{ getRackLabel(modelValue.rack_id, false) }}
              </div>
            </template>
            <select
              v-else
              :value="modelValue.rack_id"
              @change="(e) => updateField('rack_id', Number((e.target as HTMLSelectElement).value))"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              :disabled="!modelValue.expired_at"
            >
              <option value="">-- Pilih Rak Asal --</option>
              <option v-for="rack in sourceRacks" :key="rack.id" :value="rack.id">
                {{ rack.label }} [Sisa: {{ rack.qty }}]
              </option>
            </select>
          </div>

          <!-- Ke Lokasi -->
          <div class="col-span-12 md:col-span-2 relative">
            <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight"
              >Ke Lokasi *</label
            >

            <template v-if="readonly">
              <div
                class="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700"
              >
                {{
                  getRackLabel(
                    modelValue.target_rack_id || modelValue.to_rack_id || modelValue.rack_id,
                    true,
                  )
                }}
              </div>
            </template>

            <template v-else-if="moveMode === 'FEFO'">
              <div
                v-if="loadingDockRacks.length <= 1"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                {{ getRackLabel(modelValue.target_rack_id || defaultLoadingDockId, true) }}
              </div>
              <select
                v-else
                :value="modelValue.target_rack_id || defaultLoadingDockId"
                @change="
                  (e) =>
                    updateField('target_rack_id', Number((e.target as HTMLSelectElement).value))
                "
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option v-for="dock in loadingDockRacks" :key="dock.id" :value="dock.id">
                  {{ dock.location_code || dock.rack_code || dock.rack_name }}
                </option>
              </select>
            </template>

            <template v-else-if="moveMode === 'OPTIMASI' || modelValue.isEvacuation">
              <AppInputRack
                :model-value="modelValue.target_rack_id"
                :options="recommendedRacks"
                :placeholder="
                  loadingRack
                    ? '⏳ Memuat Rekomendasi...'
                    : modelValue.isEvacuation
                      ? 'Ketik kode rak evakuasi...'
                      : 'Ketik kode rak pintar...'
                "
                @update:model-value="(val) => updateField('target_rack_id', val)"
                :class="{ 'opacity-50 pointer-events-none': !modelValue.qty }"
              />

              <p
                v-if="recommendedRacks.length === 0 && modelValue.qty > 0 && !loadingRack"
                class="text-[9px] text-red-500 font-bold mt-1"
              >
                ⚠️ Tidak ada kapasitas rak yang muat untuk Qty ini!
              </p>
              <p
                v-else-if="modelValue.qty > 0 && !loadingRack"
                class="text-[9px] text-emerald-600 font-bold mt-1"
              >
                💡 Menampilkan {{ recommendedRacks.length }} rak yang muat.
              </p>
            </template>

            <div
              class="absolute right-2 top-7 flex items-center gap-1 pointer-events-none"
              v-if="loadingRack"
            >
              <span class="text-[10px] text-orange-500 animate-pulse">Mencari rak...</span>
            </div>
          </div>
        </div>

        <div class="w-full">
          <input
            type="text"
            :value="moveMode === 'FEFO' ? 'Persiapan Produk Keluar' : modelValue.notes"
            :disabled="readonly || moveMode === 'FEFO'"
            @input="(e) => updateField('notes', (e.target as HTMLInputElement).value)"
            placeholder="Keterangan pindah barang"
            class="w-full px-3 py-2 border bg-white border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>
        <div v-if="errors && errors.global" class="mb-4">
          <AppAlert
            variant="error"
            :message="errors.global"
            :show="true"
            @close="emit('clear-error', 'global')"
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
  </div>
</template>
