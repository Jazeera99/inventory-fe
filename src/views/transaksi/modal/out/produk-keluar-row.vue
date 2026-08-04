<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppInputSku from '@/components/app-input-sku.vue'
import AppInputRack from '@/components/app-input-rack.vue'
import fmtDate from '@/functions/fmt/date'

const props = defineProps<{
  modelValue: any
  showDelete?: boolean
  readonly?: boolean
  allProducts?: any[]
  allRacks?: any[]
  productLocations?: any[]
  loadingDockId?: any
  index: number
  errors?: Record<string, any>
  isExactDuplicate?: boolean
}>()
const emit = defineEmits(['update:modelValue', 'remove', 'openSearch', 'validate', 'clear-error'])

const router = useRouter()
const showSuggestions = ref(false)
const isOpenFefo = ref(false)

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

const loadingDockRack = computed(() => {
  if (!props.allRacks || props.allRacks.length === 0) return null

  // Ambil data array-nya
  const rawData = props.allRacks as any
  const rackList = Array.isArray(rawData) ? rawData : rawData?.data || []

  // 1. Coba cari jika ada ID dari prop induk dulu
  if (props.loadingDockId) {
    const foundById = rackList.find((r: any) => Number(r.id) === Number(props.loadingDockId))
    if (foundById) return foundById
  }

  // 2. Jika tidak ada ID dari induk, cari yang namanya ada kata 'loading' atau kode 'ld'
  return (
    rackList.find(
      (r: any) =>
        String(r.rack_name).toLowerCase().includes('loading') ||
        String(r.location_code).toLowerCase().includes('ld'),
    ) || null
  )
})

const totalGlobalStock = computed(() => {
  const sku = props.modelValue.product_sku || props.modelValue.produkSku
  if (!sku || !props.productLocations) return 0

  return props.productLocations
    .filter((loc) => loc.product_sku === sku)
    .reduce((sum, loc) => sum + Number(loc.qty || 0), 0)
})

const loadingDockStock = computed(() => {
  const sku = props.modelValue.product_sku || props.modelValue.produkSku
  if (!sku || !props.productLocations || !loadingDockRack.value) return 0

  // const targetLoc = props.productLocations.find(
  //   (loc) => loc.product_sku === sku && Number(loc.rack_id) === Number(loadingDockRack.value?.id),
  // )
  // return targetLoc ? Number(targetLoc.qty) : 0
  return props.productLocations
    .filter(
      (loc) => loc.product_sku === sku && Number(loc.rack_id) === Number(loadingDockRack.value?.id),
    )
    .reduce((sum, loc) => sum + Number(loc.qty || 0), 0)
})

const fefoBreakdown = computed(() => {
  const sku = props.modelValue.product_sku || props.modelValue.produkSku
  const qtyNeeded = Number(props.modelValue.qty || 0)

  if (!sku || !props.productLocations || !loadingDockRack.value) return []

  // 1. Ambil semua lokasi/rak yang menyimpan SKU ini dan stoknya > 0
  const availableBatches = props.productLocations
    .filter(
      (loc) =>
        loc.product_sku === sku &&
        Number(loc.rack_id) === Number(loadingDockRack.value?.id) &&
        Number(loc.qty) > 0,
    )
    .map((loc) => ({
      rack_id: loc.rack_id,
      expired_at: loc.expired_at || loc.expired,
      qty_available: Number(loc.qty || 0),
    }))
    // 2. Urutkan FEFO: Expired paling dekat (asc) naik ke atas paling pertama
    .sort((a, b) => {
      if (!a.expired_at) return 1
      if (!b.expired_at) return -1
      return new Date(a.expired_at).getTime() - new Date(b.expired_at).getTime()
    })

  // 3. Simulasikan pemotongan $qtyNeeded (Persis logika backend min($loc->qty, $qtyNeeded))
  let remainingQty = qtyNeeded
  return availableBatches.map((batch) => {
    let allocated = 0
    if (remainingQty > 0) {
      if (batch.qty_available >= remainingQty) {
        allocated = remainingQty
        remainingQty = 0
      } else {
        allocated = batch.qty_available
        remainingQty -= batch.qty_available
      }
    }
    return {
      ...batch,
      allocated,
    }
  })
})

// 3. Fungsi Navigasi Pintas ke Pindah Produk dengan membawa info SKU
const goToMoveProduct = () => {
  const sku = props.modelValue.product_sku || props.modelValue.produkSku || ''
  const qtyNeeded = Number(props.modelValue.qty || 0)
  const currentLdStock = Number(loadingDockStock.value || 0)
  const qtyShortage = qtyNeeded > currentLdStock ? qtyNeeded - currentLdStock : 0
  router.push({
    path: 'pindah-produk',
    query: {
      sku: sku,
      qty: qtyShortage,
      from_trigger: 'OUT',
    }, // Mengirim parameter SKU agar otomatis terisi di sana
  })
}

// 3. LOGIKA SET DEFAULT RACK (Otomatis mengunci baris baru ke Loading Dock)
const setDefaultRack = () => {
  if (!props.readonly && loadingDockRack.value) {
    updateField('rack_id', Number(loadingDockRack.value.id))
  }
}

watch(
  () => props.allRacks,
  () => {
    setDefaultRack()
  },
  { immediate: true },
)

onMounted(() => {
  setDefaultRack()
})

const getRackLabel = (rackId: any) => {
  if (!props.allRacks || props.allRacks.length === 0) return 'Memuat...'
  if (!rackId) return 'Pilih Rak...'

  const searchId = Number(rackId)
  const rack = props.allRacks.find((r: any) => Number(r.id) === searchId)

  return rack ? `${rack.location_code}` : `ID ${rackId}`
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
  const key = `items.${props.index}.qty`
  if (props.errors[key]) {
    return Array.isArray(props.errors[key]) ? props.errors[key][0] : props.errors[key]
  }
  return null
})
</script>

<template>
  <div class="w-full flex flex-col mb-2">
    <!-- Banner Deteksi Duplikasi SKU & QTY -->
    <div
      v-if="!readonly && isExactDuplicate"
      class="text-[11px] text-red-600 font-bold mb-1 flex items-center gap-1 bg-red-100 px-3 py-1 rounded-t-lg border-x border-t border-red-200"
    >
      ⚠️ Baris Duplikat! SKU dan QTY sama persis dengan baris lain.
    </div>

    <div
      class="flex flex-col md:flex-row gap-3 p-4 rounded-lg border relative group transition-all"
      :class="{
        'opacity-80 bg-gray-50 border-gray-100': readonly,
        'bg-red-50/50 border-red-300 shadow-sm rounded-tr-none rounded-tl-none':
          !readonly && isExactDuplicate,
        'bg-gray-50 border-gray-100': !readonly && !isExactDuplicate,
      }"
    >
      <!-- 1. KODE SKU PRODUK -->
      <div class="w-full md:flex-[3.5] flex flex-col">
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
          <div class="relative w-full">
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
          </div>
        </template>
      </div>

      <div class="w-full md:flex-1">
        <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight"
          >Qty *</label
        >

        <input
          type="number"
          :value="modelValue.qty"
          :disabled="readonly"
          @input="(e) => updateField('qty', Number((e.target as HTMLInputElement).value))"
          @focus="onFocusQty"
          class="w-full px-3 py-2 border bg-white border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
        />
        <p
          v-if="!readonly && modelValue.isValid"
          class="text-[10px] text-gray-400 font-medium mt-1 px-1"
        >
          Total Stok: <span class="font-bold text-gray-700">{{ totalGlobalStock }}</span>
        </p>
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

      <div class="w-full md:flex-[1.5]">
        <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight"
          >Rak Keluar *</label
        >
        <div
          class="w-full px-3 py-2.5 border rounded-lg flex justify-between items-center transition-all"
          :class="
            !readonly && modelValue.product_sku && loadingDockStock === 0
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-white border-gray-300'
          "
        >
          <span class="font-medium text-sm text-gray-700 font-mono">
            {{ loadingDockRack ? loadingDockRack.location_code : 'LD-01' }}
          </span>
          <span class="text-[10px] font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-600"
            >Loading Dock</span
          >
        </div>

        <div v-if="!readonly && modelValue.isValid" class="text-[10px] font-bold mt-1 px-1">
          <button
            v-if="loadingDockStock > 0"
            type="button"
            @click="isOpenFefo = !isOpenFefo"
            class="text-green-600 hover:text-green-700 underline flex items-center gap-1 transition-all"
          >
            <span>📦 Stok Siap (LD): {{ loadingDockStock }}</span>
            <svg
              class="w-3 h-3 transform transition-transform duration-200"
              :class="{ 'rotate-180': isOpenFefo }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <div v-else class="flex flex-col gap-1">
            <span class="text-red-500 animate-pulse"
              >⚠️ Stok LD Kosong! (Total ada {{ totalGlobalStock }})</span
            >
            <button
              type="button"
              @click="goToMoveProduct"
              class="text-left text-[10px] text-blue-600 hover:text-blue-800 underline font-black flex items-center gap-0.5"
            >
              Pindah Barang Ke LD Sekarang →
            </button>
          </div>
        </div>
        <div
          v-if="modelValue.isValid && isOpenFefo && fefoBreakdown.length > 0"
          class="mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-inner animate-fade-in"
        >
          <div
            class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 pb-1 border-b border-gray-100"
          >
            📋 Breakdown Urutan Pengambilan
          </div>

          <div class="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
            <div
              v-for="(batch, idx) in fefoBreakdown"
              :key="idx"
              class="flex flex-row items-center justify-between gap-4 px-3 py-2 rounded border text-xs transition-all"
              :class="
                batch.allocated > 0
                  ? 'bg-blue-50/50 border-blue-200 font-medium'
                  : 'bg-gray-50/50 border-gray-100 text-gray-400'
              "
            >
              <div class="flex-1 flex flex-col min-w-[90px]">
                <span class="text-[9px] uppercase font-bold text-gray-400 tracking-tight"
                  >Expired At *</span
                >
                <span
                  class="font-mono font-bold"
                  :class="batch.allocated > 0 ? 'text-gray-800' : 'text-gray-400'"
                >
                  {{
                    batch.expired_at
                      ? fmtDate.date(new Date(batch.expired_at), 'dd MMM yyyy')
                      : 'Tanpa Exp'
                  }}
                </span>
              </div>

              <div class="flex-1 flex flex-col text-center">
                <span class="text-[9px] uppercase font-bold text-gray-400 tracking-tight"
                  >Tersedia</span
                >
                <span
                  class="font-semibold"
                  :class="batch.allocated > 0 ? 'text-gray-700' : 'text-gray-400'"
                >
                  {{ batch.qty_available }}
                </span>
              </div>

              <div class="flex-1 flex items-center justify-end min-w-[90px]">
                <span
                  v-if="batch.allocated > 0"
                  class="bg-blue-600 text-white py-1 px-2.5 rounded font-black font-mono text-[10px] tracking-wider shadow-sm animate-fade-in text-center whitespace-nowrap"
                >
                  AMBIL: {{ batch.allocated }}
                </span>
                <span v-else class="text-gray-300 text-[10px] font-mono italic whitespace-nowrap">
                  Sisa / Lewat
                </span>
              </div>
            </div>
          </div>

          <div
            v-if="Number(modelValue.qty || 0) > loadingDockStock"
            class="mt-2 text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded flex items-center gap-1 w-fit animate-pulse"
          >
            <span></span>
            ⚠️ Stok di Loading Dock tidak cukup! Kurang
            {{ Number(modelValue.qty || 0) - loadingDockStock }}. Silakan lakukan mutasi produk
            dahulu.
          </div>
          <div v-if="Number(modelValue.qty || 0) > loadingDockStock">
            <button
              type="button"
              @click="goToMoveProduct"
              class="text-left text-[10px] text-blue-600 hover:text-blue-800 underline font-black flex items-center gap-0.5"
            >
              Pindah Barang Ke LD Sekarang →
            </button>
          </div>
        </div>
      </div>
      <div>
        <div class="w-full md:flex-[2]">
          <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight"
            >Keterangan Barang</label
          >
          <input
            type="text"
            :value="modelValue.notes"
            :disabled="readonly"
            @input="(e) => updateField('notes', (e.target as HTMLInputElement).value)"
            placeholder="Catatan"
            class="w-full px-3 py-2 border bg-white border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
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
</template>
