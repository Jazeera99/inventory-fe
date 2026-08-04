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
  searchQuery: string // Menyimpan kata kunci pencarian SKU/Nama
  skuModel: {
    produkSku: string
    isValid: boolean
    isError: boolean
  }
  showDropdown?: boolean
}

export interface StockOrder {
  id?: number
  type: 'INBOUND' | 'OUTBOUND'
  supplier_id?: number | null
  customer_id?: number | null
  order_date: string
  expected_date?: string | null
  notes?: string | null
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

const partySearchQuery = ref('')
const showPartyDropdown = ref(false)

const form = reactive({
  type: 'INBOUND' as 'INBOUND' | 'OUTBOUND',
  party_id: null as number | null,
  party_name: '',
  order_date: new Date().toISOString().split('T')[0],
  expected_date: null as string | null,
  notes: '',
  items: [] as FormItem[],
})

const isFormValid = computed(() => {
  if (!form.type || !form.party_id || !form.order_date) return false
  if (form.items.length === 0) return false
  return form.items.every((item) => item.product_sku && item.qty_ordered > 0)
})

const fetchParties = async () => {
  try {
    const endpoint = form.type === 'INBOUND' ? 'admin/suppliers' : 'admin/customers'
    const response = await api.GET<any>(endpoint)
    parties.value = response.data || []
  } catch (error) {
    console.error('Gagal mengambil data pihak terkait:', error)
    parties.value = []
  }
}

const fetchProducts = async () => {
  try {
    const response = await api.GET<any>('admin/products')
    // Mengambil data produk dari response backend
    const rawData = response.data || response
    products.value = Array.isArray(rawData) ? rawData : rawData.data || []
  } catch (error) {
    console.error('Gagal mengambil data produk:', error)
    products.value = []
  }
}

// --- FILTER SUPPLIER / CUSTOMER ---
const getFilteredParties = computed(() => {
  if (!partySearchQuery.value) return parties.value
  const q = partySearchQuery.value.toLowerCase()
  return parties.value.filter((p) => {
    const name = p.supplier_name || p.customer_name || p.name || ''
    return name.toLowerCase().includes(q)
  })
})

const selectParty = (party: Party) => {
  if (party.is_active === false) return
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

// --- FILTER & PENANGANAN SKU ---
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

// Filter produk berdasarkan SKU atau nama produk
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

// Helper untuk memformat angka ke format mata uang Rupiah (contoh: 127368 -> "127.368,00")
const formatRupiah = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) return '0,00'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val))
}

// Handler saat user mengetik manual angka harga di dalam input text
const handlePriceInput = (item: FormItem, event: Event) => {
  const input = event.target as HTMLInputElement
  // Ambil hanya karakter angka
  const rawValue = input.value.replace(/\D/g, '')
  const numericValue = rawValue ? parseInt(rawValue, 10) : 0

  // Simpan nilai asli angka ke item.unit_price
  item.unit_price = numericValue

  // Update tampilan teks di input agar langsung rapi bertitik
  if (rawValue) {
    input.value = new Intl.NumberFormat('id-ID').format(numericValue)
  } else {
    input.value = ''
  }
}

// Handler saat input harga keilangan fokus (blur) -> tambahkan desimal ,00
const handlePriceBlur = (item: FormItem, event: Event) => {
  const input = event.target as HTMLInputElement
  if (item.unit_price) {
    input.value = formatRupiah(item.unit_price)
  } else {
    input.value = '0,00'
  }
}

// Handler saat input harga difokuskan (focus) -> hapus desimal ,00 agar mudah diedit
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
    item.unit_price =
      form.type === 'INBOUND' ? prod.pricing.purchase_price : prod.pricing.selling_price
  } else {
    item.unit_price = 0
  }
}

// Memilih produk dari dropdown autocomplete SKU
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

// Dipanggil saat nilai input di AppInputSku berubah
const updateSkuValue = (
  item: FormItem,
  val: { produkSku: string; isValid: boolean; isError: boolean },
) => {
  item.skuModel = val
  item.product_sku = val.produkSku
  item.searchQuery = val.produkSku
  item.showDropdown = true

  // Cek kecocokan persis dengan produk yang ada
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

const handleSubmit = () => {
  if (!isFormValid.value) return
  const payload = {
    type: form.type,
    supplier_id: form.type === 'INBOUND' ? form.party_id : null,
    customer_id: form.type === 'OUTBOUND' ? form.party_id : null,
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

watch(
  () => form.type,
  (newType) => {
    form.party_id = null
    form.party_name = ''
    partySearchQuery.value = ''
    fetchParties()

    // Update ulang harga item yang sudah ada sesuai tipe order baru
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
  (open) => {
    if (open) {
      if (props.order) {
        form.type = props.order.type
        form.party_id =
          props.order.type === 'INBOUND'
            ? (props.order.supplier_id ?? null)
            : (props.order.customer_id ?? null)
        form.order_date = props.order.order_date
        form.expected_date = props.order.expected_date ?? null
        form.notes = props.order.notes || ''
        form.items =
          props.order.items?.map((item) => ({
            product_sku: item.product_sku,
            qty_ordered: item.qty_ordered,
            unit_price: item.unit_price,
            searchQuery: item.product_sku,
            skuModel: { produkSku: item.product_sku, isValid: true, isError: false },
            showDropdown: false,
          })) || []
      } else {
        form.type = 'INBOUND'
        form.party_id = null
        form.party_name = ''
        partySearchQuery.value = ''
        form.order_date = new Date().toISOString().split('T')[0]
        form.expected_date = null
        form.notes = ''
        form.items = []
      }
      fetchParties().then(() => {
        if (form.party_id) {
          const matched = parties.value.find((p) => p.id === form.party_id)
          if (matched) {
            const name = matched.supplier_name || matched.customer_name || matched.name || ''
            form.party_name = name
            partySearchQuery.value = name
          }
        }
      })
      fetchProducts()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b flex justify-between items-center shrink-0">
          <h2 class="text-xl font-bold">
            {{ order ? 'Edit Order' : 'Buat PO / SO' }}
          </h2>
          <button @click="emit('close')" class="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
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

            <!-- Party & Date -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="relative">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ form.type === 'INBOUND' ? 'Supplier' : 'Customer' }} *
                </label>

                <input
                  v-model="partySearchQuery"
                  type="text"
                  :placeholder="`Cari / Ketik ${form.type === 'INBOUND' ? 'Supplier' : 'Customer'}...`"
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white border-gray-300"
                  @focus="handlePartyFocus"
                  @blur="handlePartyBlur"
                  @input="handlePartyInput"
                  required
                />

                <div class="mt-1 px-1">
                  <p v-if="form.party_id" class="text-[10px] text-green-600 font-bold">
                    ✓ {{ form.type === 'INBOUND' ? 'Supplier' : 'Customer' }} Terpilih
                  </p>
                  <p
                    v-else-if="partySearchQuery && getFilteredParties.length === 0"
                    class="text-[10px] text-red-500 font-bold animate-pulse"
                  >
                    ✕ Tidak ditemukan
                  </p>
                </div>

                <!-- Autocomplete Dropdown Supplier/Customer -->
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
                <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Estimasi</label>
                <input
                  v-model="form.expected_date"
                  type="date"
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm border-gray-300"
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
                  <!-- SKU Input Auto-Search Dropdown -->
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

                    <!-- Autocomplete Suggestions List -->
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
                          :title="
                            p.is_active !== false
                              ? 'Pilih Produk'
                              : 'Produk non-aktif tidak dapat dipilih untuk transaksi'
                          "
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
                        <div v-if="p.is_active === false" class="px-4 py-1 bg-red-50">
                          <span
                            class="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                          >
                            TIDAK AKTIF
                          </span>
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
                  <button
                    type="button"
                    @click="removeItem(index)"
                    class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
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

        <!-- Footer -->
        <div class="px-6 py-4 border-t flex justify-end gap-2 shrink-0">
          <button
            @click="emit('close')"
            class="px-4 py-2 border rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            :disabled="loading"
          >
            Batal
          </button>
          <button
            @click="handleSubmit"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
            :disabled="loading || !isFormValid"
          >
            <span v-if="loading">Menyimpan...</span>
            <span v-else>{{ order ? 'Update' : 'Simpan' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
