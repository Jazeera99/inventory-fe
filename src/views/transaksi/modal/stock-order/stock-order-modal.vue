<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useApi } from '@/functions/api'
import AppInputSku from '@/components/app-input-sku.vue'

export interface Party {
  id: number
  name?: string
  supplier_name?: string
  customer_name?: string
  is_active?: boolean
}

export interface Product {
  sku: string
  product_name: string
  is_active?: boolean
}

export interface FormItem {
  product_sku: string
  qty_ordered: number
  unit_price: number | null
  searchQuery: string
  skuModel: {
    produkSku: string
    isValid: boolean
    isError: boolean
  }
  showDropdown?: boolean
}

export interface StockOrder {
  id?: number
  type: 'INBOUND' | 'OUTBOUND' | 'RETURN_IN' | 'RETURN_OUT'
  supplier_id?: number | null
  customer_id?: number | null
  order_date: string
  expected_date?: string | null
  notes?: string | null
  parent_id?: number | null
  parent_order_no?: string | null
  items?: Array<{
    product_sku: string
    qty_ordered: number
    unit_price: number
  }>
}

const props = defineProps<{
  isOpen: boolean
  order?: StockOrder | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: Record<string, unknown>): void
}>()

const api = useApi()

const parties = ref<Party[]>([])
const products = ref<Product[]>([])
const sourceOrders = ref<any[]>([])

const partySearchQuery = ref('')
const showPartyDropdown = ref(false)
const sourceSearchQuery = ref('')
const showSourceDropdown = ref(false)

const form = reactive({
  type: 'INBOUND' as 'INBOUND' | 'OUTBOUND' | 'RETURN_IN' | 'RETURN_OUT',
  party_id: null as number | null,
  parent_id: null as number | null,
  party_name: '',
  order_date: new Date().toISOString().split('T')[0],
  expected_date: null as string | null,
  notes: '',
  items: [] as FormItem[],
})

const isReturn = computed(() => ['RETURN_IN', 'RETURN_OUT'].includes(form.type))
const isSupplierType = computed(() => ['INBOUND', 'RETURN_OUT'].includes(form.type))

const filteredSourceOrders = computed(() => {
  const query = sourceSearchQuery.value.trim().toLowerCase()
  if (!query) return sourceOrders.value
  return sourceOrders.value.filter((source) => {
    const party = isSupplierType.value
      ? source.supplier?.supplier_name
      : source.customer?.customer_name
    return `${source.order_no || ''} ${party || ''}`.toLowerCase().includes(query)
  })
})

const isFormValid = computed(() => {
  if (!form.type || !form.party_id || !form.order_date) return false
  if (isReturn.value && !form.parent_id) return false
  if (form.items.length === 0) return false
  return form.items.every((item) => item.product_sku && item.qty_ordered > 0)
})

const fetchParties = async () => {
  try {
    const endpoint = isSupplierType.value ? 'admin/suppliers' : 'admin/customers'
    const response = await api.GET<any>(endpoint)
    parties.value = response.data || []
  } catch (error) {
    console.error('Gagal mengambil data pihak terkait:', error)
    parties.value = []
  }
}

const fetchReturnableOrders = async () => {
  if (!isReturn.value) {
    sourceOrders.value = []
    return
  }
  const response = await api.GET<any>('admin/stock-orders/returnable', { type: form.type })
  sourceOrders.value = response.data?.data || response.data || []
}

const selectSourceOrder = (source?: any) => {
  source = source || sourceOrders.value.find((order) => order.id === form.parent_id)
  if (!source) return
  form.parent_id = source.id
  sourceSearchQuery.value = `${source.order_no} — ${isSupplierType.value ? source.supplier?.supplier_name : source.customer?.customer_name}`
  showSourceDropdown.value = false
  form.party_id = isSupplierType.value ? source.supplier_id : source.customer_id
  const party = isSupplierType.value ? source.supplier : source.customer
  form.party_name = party?.supplier_name || party?.customer_name || ''
  partySearchQuery.value = form.party_name
  form.items = source.items.map((item: any) => ({
    product_sku: item.product_sku,
    qty_ordered: item.qty_available_for_return,
    unit_price: item.unit_price,
    searchQuery: item.product_sku,
    skuModel: { produkSku: item.product_sku, isValid: true, isError: false },
    showDropdown: false,
  }))
}

const handleSourceInput = () => {
  form.parent_id = null
  form.party_id = null
  form.items = []
  showSourceDropdown.value = true
}

const handleSourceBlur = () => {
  window.setTimeout(() => {
    showSourceDropdown.value = false
  }, 200)
}

const fetchProducts = async () => {
  try {
    const response = await api.GET<any>('admin/products')
    const rawData = response.data || response
    products.value = Array.isArray(rawData) ? rawData : rawData.data || []
  } catch (error) {
    console.error('Gagal mengambil data produk:', error)
    products.value = []
  }
}

const getFilteredParties = computed(() => {
  if (!partySearchQuery.value) return parties.value
  const q = partySearchQuery.value.toLowerCase()
  return parties.value.filter((p) => {
    const name = p.supplier_name || p.customer_name || p.name || ''
    return name.toLowerCase().includes(q)
  })
})

const selectParty = (party: Party) => {
  if (party.is_active === false && !isReturn.value) {
    alert(
      `${isSupplierType.value ? 'Supplier' : 'Customer'} ini sedang NON-AKTIF dan tidak bisa dipilih.`,
    )
    return
  }

  form.party_id = party.id
  const name = party.supplier_name || party.customer_name || party.name || ''
  form.party_name = name
  partySearchQuery.value = name
  showPartyDropdown.value = false
}

const handlePartyFocus = () => {
  showPartyDropdown.value = true
}

const handlePartyBlur = () => {
  window.setTimeout(() => {
    showPartyDropdown.value = false
  }, 200)
}

const handlePartyInput = () => {
  showPartyDropdown.value = true
  form.party_id = null
  form.party_name = ''
}

const addItem = () => {
  form.items.push({
    product_sku: '',
    qty_ordered: 1,
    unit_price: null,
    searchQuery: '',
    skuModel: { produkSku: '', isValid: false, isError: false },
    showDropdown: false,
  })
}

const removeItem = (index: number) => {
  form.items.splice(index, 1)
}

const getFilteredProducts = (query: string) => {
  if (!query) return products.value
  const q = query.toLowerCase().trim()
  return products.value.filter(
    (p) => p.sku.toLowerCase().includes(q) || p.product_name.toLowerCase().includes(q),
  )
}

const handleSkuFocus = (item: FormItem) => {
  item.showDropdown = true
}

const handleSkuBlur = (item: FormItem) => {
  window.setTimeout(() => {
    item.showDropdown = false
  }, 200)
}

const formatRupiah = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) return '0,00'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val))
}

const handlePriceInput = (item: FormItem, event: Event) => {
  const input = event.target as HTMLInputElement
  const rawValue = input.value.replace(/\D/g, '')
  const numericValue = rawValue ? parseInt(rawValue, 10) : 0
  item.unit_price = numericValue

  if (rawValue) {
    input.value = new Intl.NumberFormat('id-ID').format(numericValue)
  } else {
    input.value = ''
  }
}

const handlePriceBlur = (item: FormItem, event: Event) => {
  const input = event.target as HTMLInputElement
  if (item.unit_price) {
    input.value = formatRupiah(item.unit_price)
  } else {
    input.value = '0,00'
  }
}

const handlePriceFocus = (item: FormItem, event: Event) => {
  const input = event.target as HTMLInputElement
  if (item.unit_price) {
    input.value = new Intl.NumberFormat('id-ID').format(item.unit_price)
  } else {
    input.value = ''
  }
}

const autoSetPrice = (item: FormItem, prod: Product) => {
  if (prod.pricing) {
    item.unit_price = isSupplierType.value
      ? prod.pricing.purchase_price
      : prod.pricing.selling_price
  } else {
    item.unit_price = 0
  }
}

const selectSkuProduct = (item: FormItem, prod: Product) => {
  if (prod.is_active === false) return

  item.product_sku = prod.sku
  item.searchQuery = prod.sku
  item.skuModel = {
    produkSku: prod.sku,
    isValid: true,
    isError: false,
  }
  item.showDropdown = false

  autoSetPrice(item, prod)
}

const updateSkuValue = (
  item: FormItem,
  val: { produkSku: string; isValid: boolean; isError: boolean },
) => {
  item.skuModel = val
  item.product_sku = val.produkSku
  item.searchQuery = val.produkSku
  item.showDropdown = true

  const matched = products.value.find((p) => p.sku.toLowerCase() === val.produkSku.toLowerCase())
  if (matched && matched.is_active !== false) {
    item.skuModel.isValid = true
    item.skuModel.isError = false
    item.product_sku = matched.sku
    autoSetPrice(item, matched)
  } else {
    item.skuModel.isValid = false
  }
}

const handleSubmitWithStatus = (targetStatus: 'DRAFT' | 'PENDING') => {
  if (!isFormValid.value) return

  const payload = {
    type: form.type,
    status: targetStatus,
    supplier_id: isSupplierType.value ? form.party_id : null,
    customer_id: !isSupplierType.value ? form.party_id : null,
    parent_id: isReturn.value ? form.parent_id : null,
    order_date: form.order_date,
    expected_date: form.expected_date,
    notes: form.notes,
    items: form.items.map((item) => ({
      product_sku: item.product_sku,
      qty_ordered: item.qty_ordered,
      unit_price: item.unit_price || 0,
    })),
  }

  emit('save', payload)
}

const handleSubmit = () => {
  handleSubmitWithStatus('PENDING')
}

watch(
  () => form.type,
  (newType, oldType) => {
    const isLoadingExistingOrder = Boolean(props.order?.id) && newType === props.order?.type
    if (isLoadingExistingOrder) {
      fetchParties()
      fetchReturnableOrders()
      return
    }

    if (oldType && newType !== oldType) {
      form.party_id = null
      form.party_name = ''
      partySearchQuery.value = ''
      form.parent_id = null
      sourceSearchQuery.value = ''
      if (isReturn.value) form.items = []
    }
    // form.party_id = null
    // form.party_name = ''
    // partySearchQuery.value = ''
    // form.parent_id = null
    // sourceSearchQuery.value = ''
    // if (isReturn.value) form.items = []
    fetchParties()
    fetchReturnableOrders()

    form.items.forEach((item) => {
      if (item.product_sku) {
        const matched = products.value.find((p) => p.sku === item.product_sku)
        if (matched) {
          autoSetPrice(item, matched)
        }
      }
    })
  },
)

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      const initialItemsFromProps = props.order?.items ? [...props.order.items] : []

      if (props.order?.id) {
        form.type = props.order.type
        form.party_id = ['INBOUND', 'RETURN_OUT'].includes(form.type)
          ? (props.order.supplier_id ?? null)
          : (props.order.customer_id ?? null)
        form.parent_id = props.order.parent_id ?? null
        sourceSearchQuery.value = props.order.parent_order_no || ''
        form.order_date = props.order.order_date
        form.expected_date = props.order.expected_date ?? null
        form.notes = props.order.notes || ''

        form.items = (props.order.items || []).map((item) => ({
          product_sku: item.product_sku,
          qty_ordered: item.qty_ordered,
          unit_price: item.unit_price,
          searchQuery: item.product_sku,
          skuModel: { produkSku: item.product_sku, isValid: true, isError: false },
          showDropdown: false,
        }))
      } else {
        // const isReturAction =
        //   Boolean(props.order?.items?.length) || Boolean(props.order?.type?.startsWith('RETURN'))

        // form.type = props.order?.type || 'INBOUND'
        // form.party_id = null
        // form.party_name = ''
        // partySearchQuery.value = ''
        // form.order_date = new Date().toISOString().split('T')[0]
        // form.expected_date = null
        // form.notes = ''
        // form.parent_id = null
        // sourceSearchQuery.value = ''

        form.type = props.order?.type || 'RETURN_OUT'
        form.party_id = props.order?.supplier_id || props.order?.customer_id || null
        form.parent_id = props.order?.parent_id || null
        form.order_date = new Date().toISOString().split('T')[0]
        form.expected_date = null
        form.notes = ''

        // 2. Jika ada item awal dari props (misal SKU & Qty dari tombol Retur Expired)
        form.items = initialItemsFromProps.map((item) => ({
          product_sku: item.product_sku,
          qty_ordered: item.qty_ordered || 1,
          unit_price: item.unit_price || 0,
          searchQuery: item.product_sku,
          skuModel: { produkSku: item.product_sku, isValid: true, isError: false },
          showDropdown: false,
        }))
      }
      await fetchParties()
      await fetchProducts()
      await fetchReturnableOrders()

      // --- LOGIKA AUTO-FILL DOKUMEN ASAL (PO/SO) ---
      if (isReturn.value && sourceOrders.value.length > 0) {
        let matchedSource = null

        // 1. Cari via parent_id
        if (form.parent_id) {
          matchedSource = sourceOrders.value.find((s) => s.id === form.parent_id)
        }
        // 2. Jika tidak ada parent_id, cari PO/SO yang mengandung SKU item tersebut
        if (!matchedSource && form.items.length > 0 && form.items[0]?.product_sku) {
          const targetSku = form.items[0].product_sku
          matchedSource = sourceOrders.value.find((s) =>
            s.items.some((i: any) => i.product_sku === targetSku),
          )
        }

        // Jika ketemu, otomatis set PO dan Supplier-nya!
        if (matchedSource) {
          const initialItems = [...form.items] // Simpan item awal
          selectSourceOrder(matchedSource)

          // Kembalikan SKU/Qty spesifik jika dibuka dari Retur Expired
          if (initialItems.length > 0) {
            const targetSku = initialItems[0]?.product_sku
            const matchedItem = form.items.find((i) => i.product_sku === targetSku)
            if (matchedItem) {
              // DIPERBAIKI: Tambahkan fallback '|| 1' agar bertipe 'number' (bukan undefined)
              matchedItem.qty_ordered = initialItems[0]?.qty_ordered || 1
            }
          }
        }
      }

      // Sync Nama Party
      if (form.party_id) {
        const matched = parties.value.find((p) => p.id === form.party_id)
        if (matched) {
          const name = matched.supplier_name || matched.customer_name || matched.name || ''
          form.party_name = name
          partySearchQuery.value = name
        }
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <!-- Header Rapi tanpa Tombol Silang acak/tengah & tombol header -->
        <div class="px-6 py-4 border-b flex justify-between items-center shrink-0">
          <h2 class="text-xl font-bold">
            {{ order ? 'Edit Dokumen' : 'Buat PO / SO / Retur' }}
          </h2>
        </div>

        <!-- Form Body -->
        <div class="p-6 overflow-y-auto flex-1">
          <form @submit.prevent="handleSubmit">
            <!-- Tipe Order -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tipe Order *</label>
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="form.type = 'INBOUND'"
                    class="flex-1 px-4 py-2 rounded-lg border transition font-medium"
                    :class="
                      form.type === 'INBOUND'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    "
                  >
                    📦 Purchase Order
                  </button>
                  <button
                    type="button"
                    @click="form.type = 'OUTBOUND'"
                    class="flex-1 px-4 py-2 rounded-lg border transition font-medium"
                    :class="
                      form.type === 'OUTBOUND'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    "
                  >
                    🚚 Sales Order
                  </button>
                  <button
                    type="button"
                    @click="form.type = 'RETURN_OUT'"
                    class="flex-1 px-4 py-2 rounded-lg border transition font-medium"
                    :class="
                      form.type === 'RETURN_OUT'
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    "
                  >
                    ↗ Retur Supplier
                  </button>
                  <button
                    type="button"
                    @click="form.type = 'RETURN_IN'"
                    class="flex-1 px-4 py-2 rounded-lg border transition font-medium"
                    :class="
                      form.type === 'RETURN_IN'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    "
                  >
                    ↩ Retur Customer
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Order *</label>
                <input
                  v-model="form.order_date"
                  type="date"
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm border-gray-300"
                  required
                />
              </div>
            </div>

            <div v-if="isReturn" class="mb-4 relative">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Dokumen Asal {{ form.type === 'RETURN_OUT' ? '(PO)' : '(SO)' }} *
              </label>
              <input
                v-model="sourceSearchQuery"
                type="text"
                placeholder="Ketik nomor PO/SO atau nama pihak terkait..."
                class="w-full px-3 py-2 border rounded-lg text-sm bg-white border-gray-300"
                @focus="showSourceDropdown = true"
                @blur="handleSourceBlur"
                @input="handleSourceInput"
                required
              />
              <div
                v-if="showSourceDropdown && filteredSourceOrders.length"
                class="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto"
              >
                <button
                  v-for="source in filteredSourceOrders"
                  :key="source.id"
                  type="button"
                  @mousedown="selectSourceOrder(source)"
                  class="w-full text-left px-3 py-2 border-b last:border-0 hover:bg-blue-50 text-sm"
                >
                  <span class="font-mono font-semibold text-blue-700">{{ source.order_no }}</span>
                  <span class="text-gray-600">
                    —
                    {{
                      isSupplierType
                        ? source.supplier?.supplier_name
                        : source.customer?.customer_name
                    }}</span
                  >
                </button>
              </div>
              <p class="mt-1 text-xs text-gray-500">
                Item diisi dari sisa barang yang telah diterima/dikirim dan belum diretur.
              </p>
            </div>

            <!-- Party & Date -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="relative">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ isSupplierType ? 'Supplier' : 'Customer' }} *
                </label>

                <input
                  v-model="partySearchQuery"
                  type="text"
                  :placeholder="`Cari / Ketik ${isSupplierType ? 'Supplier' : 'Customer'}...`"
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white border-gray-300"
                  @focus="handlePartyFocus"
                  @blur="handlePartyBlur"
                  @input="handlePartyInput"
                  :disabled="isReturn"
                  required
                />

                <div class="mt-1 px-1">
                  <p v-if="form.party_id" class="text-[10px] text-green-600 font-bold">
                    ✓ {{ isSupplierType ? 'Supplier' : 'Customer' }} Terpilih
                  </p>
                  <p
                    v-else-if="partySearchQuery && getFilteredParties.length === 0"
                    class="text-[10px] text-red-500 font-bold animate-pulse"
                  >
                    ✕ Tidak ditemukan
                  </p>
                </div>

                <div
                  v-if="showPartyDropdown && getFilteredParties.length > 0"
                  class="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto"
                >
                  <div
                    v-for="party in getFilteredParties"
                    :key="party.id"
                    class="border-b last:border-0"
                  >
                    <div
                      @mousedown="selectParty(party)"
                      :class="[
                        'px-4 py-2 text-xs transition-colors flex justify-between items-center',
                        party.is_active !== false
                          ? 'hover:bg-blue-50 cursor-pointer text-gray-800'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-60',
                      ]"
                    >
                      <span class="font-bold">
                        {{ party.supplier_name || party.customer_name || party.name }}
                      </span>
                      <span
                        v-if="party.is_active === false"
                        class="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                      >
                        TIDAK AKTIF
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ isReturn ? 'Tanggal Retur' : 'Tanggal Estimasi' }}
                </label>
                <input
                  v-model="form.expected_date"
                  type="date"
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm border-gray-300"
                  :required="isReturn"
                />
              </div>
            </div>

            <!-- Items -->
            <div class="mb-4">
              <div class="flex justify-between items-center mb-2">
                <label class="block text-sm font-medium text-gray-700">Daftar Item *</label>
                <button
                  type="button"
                  @click="addItem"
                  class="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Tambah Item
                </button>
              </div>

              <div class="space-y-2 p-1">
                <div
                  v-for="(item, index) in form.items"
                  :key="index"
                  class="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div class="w-95 shrink-0 relative">
                    <AppInputSku
                      :model-value="item.skuModel"
                      @update:model-value="(val) => updateSkuValue(item, val)"
                      placeholder="Input SKU..."
                      @focus="handleSkuFocus(item)"
                      @blur="handleSkuBlur(item)"
                      class="bg-white"
                    />

                    <div class="mt-1 flex justify-between items-center px-1">
                      <p
                        v-if="
                          item.searchQuery &&
                          getFilteredProducts(item.searchQuery).length === 0 &&
                          !item.skuModel.isValid
                        "
                        class="text-[10px] text-red-500 font-bold animate-pulse"
                      >
                        ✕ SKU / Produk tidak ditemukan di database
                      </p>

                      <p v-if="item.skuModel.isValid" class="text-[10px] text-green-600 font-bold">
                        ✓ Produk Terverifikasi
                      </p>
                    </div>

                    <div
                      v-if="item.showDropdown && getFilteredProducts(item.searchQuery).length > 0"
                      class="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto left-0"
                    >
                      <div
                        v-for="p in getFilteredProducts(item.searchQuery)"
                        :key="p.sku"
                        class="border-b last:border-0"
                      >
                        <div
                          @mousedown="p.is_active !== false ? selectSkuProduct(item, p) : null"
                          :class="[
                            'px-4 py-2 transition-colors flex justify-between items-center',
                            p.is_active !== false
                              ? 'hover:bg-blue-50 cursor-pointer text-gray-800'
                              : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-60',
                          ]"
                        >
                          <p
                            class="text-sm font-bold font-mono"
                            :class="p.is_active !== false ? 'text-gray-800' : 'text-gray-400'"
                          >
                            {{ p.sku }}
                          </p>
                          <p
                            class="text-[10px] uppercase"
                            :class="p.is_active !== false ? 'text-gray-500' : 'text-gray-400'"
                          >
                            {{ p.product_name }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="w-20 shrink-0">
                    <input
                      v-model.number="item.qty_ordered"
                      type="number"
                      placeholder="Qty"
                      min="1"
                      class="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white border-gray-300"
                      required
                    />
                  </div>

                  <div class="flex-1 relative flex items-center">
                    <span
                      class="absolute left-3 text-xs font-semibold text-gray-500 pointer-events-none"
                    >
                      Rp
                    </span>
                    <input
                      type="text"
                      :value="formatRupiah(item.unit_price)"
                      @input="(e) => handlePriceInput(item, e)"
                      @focus="(e) => handlePriceFocus(item, e)"
                      @blur="(e) => handlePriceBlur(item, e)"
                      placeholder="0,00"
                      class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-normal text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>

                  <!-- Menghapus icon/tanda silang merah -->
                </div>

                <p
                  v-if="form.items.length === 0"
                  class="text-center text-gray-400 py-4 border-2 border-dashed rounded-lg text-sm"
                >
                  Belum ada item, klik "Tambah Item"
                </p>
              </div>
            </div>

            <!-- Catatan -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
              <textarea
                v-model="form.notes"
                rows="2"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm border-gray-300 resize-none"
                placeholder="Catatan tambahan..."
              />
            </div>
          </form>
        </div>

        <!-- Footer Action -->
        <div class="px-6 py-4 border-t flex justify-end gap-2 shrink-0">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
            :disabled="loading"
          >
            Batal
          </button>

          <!-- Opsi 1: Mode EDIT -> Muncul Simpan Draft & Update Order -->
          <template v-if="order">
            <button
              type="button"
              @click="handleSubmitWithStatus('DRAFT')"
              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium disabled:opacity-50"
              :disabled="loading || !isFormValid"
            >
              Simpan Draft
            </button>
            <button
              type="button"
              @click="handleSubmitWithStatus('PENDING')"
              class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
              :disabled="loading || !isFormValid"
            >
              <span v-if="loading">Menyimpan...</span>
              <span v-else>Update Order</span>
            </button>
          </template>

          <!-- Opsi 2: Mode CREATE -> Cukup Simpan Order -->
          <template v-else>
            <button
              type="button"
              @click="handleSubmit"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
              :disabled="loading || !isFormValid"
            >
              <span v-if="loading">Menyimpan...</span>
              <span v-else>Simpan Order</span>
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
