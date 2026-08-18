<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useApi } from '@/functions/api'

interface ReturnableOrderItem {
  product_sku: string
  product_name?: string
  qty_available_for_return: number
  unit_price: number
}

interface ReturnableOrder {
  id: number
  order_no: string
  supplier_id?: number | null
  customer_id?: number | null
  supplier?: { id: number; name: string } | null
  customer?: { id: number; name: string } | null
  items: ReturnableOrderItem[]
}

interface Party {
  id: number
  name: string
}

interface Product {
  sku: string
  product_name: string
}

interface FormItem {
  product_sku: string
  qty_ordered: number
  qty_max: number
  unit_price: number | null
}

interface OrderData {
  id?: number
  type: 'INBOUND' | 'OUTBOUND' | 'RETURN_IN' | 'RETURN_OUT'
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
  initialData?: OrderData | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'save', payload: Record<string, unknown>): void
  (e: 'cancel'): void
}>()

const api = useApi()

const parties = ref<Party[]>([])
const products = ref<Product[]>([])
const returnableOrders = ref<ReturnableOrder[]>([])

const form = reactive({
  type: 'INBOUND' as 'INBOUND' | 'OUTBOUND' | 'RETURN_IN' | 'RETURN_OUT',
  parent_id: null as number | null,
  party_id: null as number | null,
  order_date: new Date().toISOString().split('T')[0],
  expected_date: null as string | null,
  notes: '',
  items: [] as FormItem[],
})

const isReturn = computed(() => ['RETURN_IN', 'RETURN_OUT'].includes(form.type))

const isFormValid = computed(() => {
  if (!form.type || !form.order_date) return false
  if (isReturn.value && !form.parent_id) return false
  if (!form.party_id) return false
  if (form.items.length === 0) return false

  return form.items.every((item) => {
    const validBasic = item.product_sku && item.qty_ordered > 0
    if (isReturn.value && item.qty_max > 0) {
      return validBasic && item.qty_ordered <= item.qty_max
    }
    return validBasic
  })
  // if (!form.type || !form.party_id || !form.order_date) return false
  // if (form.items.length === 0) return false
  // return form.items.every((item) => item.product_sku && item.qty_ordered > 0)
})

const fetchReturnableOrders = async () => {
  try {
    const response = await api.GET<any>('admin/stock-orders/returnable', { type: form.type })
    returnableOrders.value = response.data?.data || response.data || []
  } catch (error) {
    console.error('Gagal mengambil daftar dokumen retur:', error)
    returnableOrders.value = []
  }
}

const fetchParties = async () => {
  try {
    const isSupplier = ['INBOUND', 'RETURN_OUT'].includes(form.type)
    const endpoint = isSupplier ? 'admin/suppliers' : 'admin/customers'
    const response = await api.GET<any>(endpoint)
    parties.value = response.data?.data || response.data || []
  } catch (error) {
    console.error('Gagal mengambil data pihak terkait:', error)
    parties.value = []
  }
}

const fetchProducts = async () => {
  try {
    const response = await api.GET<any>('admin/products')
    products.value = response.data?.data || response.data || []
  } catch (error) {
    console.error('Gagal mengambil data produk:', error)
    products.value = []
  }
}

const addItem = () => {
  form.items.push({
    product_sku: '',
    qty_ordered: 1,
    qty_max: 0,
    unit_price: null,
  })
}

const removeItem = (index: number) => {
  form.items.splice(index, 1)
}

const handleSubmit = () => {
  if (!isFormValid.value) return
  const isSupplier = ['INBOUND', 'RETURN_OUT'].includes(form.type)
  const isCustomer = ['OUTBOUND', 'RETURN_IN'].includes(form.type)

  const payload = {
    type: form.type,
    parent_id: isReturn.value ? form.parent_id : null,
    supplier_id: isSupplier ? form.party_id : null,
    customer_id: isCustomer ? form.party_id : null,
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
    form.parent_id = null
    form.items = []

    if (['RETURN_IN', 'RETURN_OUT'].includes(newType)) {
      fetchReturnableOrders()
    } else {
      fetchParties()
      fetchProducts()
    }
  },
)

watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      form.type = newData.type
      form.parent_id = newData.parent_id ?? null
      form.party_id = ['INBOUND', 'RETURN_OUT'].includes(newData.type)
        ? (newData.supplier_id ?? null)
        : (newData.customer_id ?? null)
      form.order_date = newData.order_date
      form.expected_date = newData.expected_date ?? null
      form.notes = newData.notes ?? ''
      form.items =
        newData.items?.map((item) => ({
          product_sku: item.product_sku,
          qty_ordered: item.qty_ordered,
          qty_max: item.qty_available_for_return || item.qty_fulfilled || item.qty_ordered,
          unit_price: item.unit_price,
        })) || []
    }
    if (isReturn.value) {
      fetchReturnableOrders()
    } else {
      fetchParties()
      fetchProducts()
    }
  },
  { immediate: true },
)
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- Tipe Order -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-semibold text-gray-700 uppercase mb-1">Tipe Order *</label>
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 px-4 py-2 text-sm rounded-lg border font-medium transition flex items-center justify-center gap-2"
            :class="
              form.type === 'INBOUND'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            "
            @click="form.type = 'INBOUND'"
          >
            📦 Purchase Order
          </button>
          <button
            type="button"
            class="flex-1 px-4 py-2 text-sm rounded-lg border font-medium transition flex items-center justify-center gap-2"
            :class="
              form.type === 'OUTBOUND'
                ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            "
            @click="form.type = 'OUTBOUND'"
          >
            🚚 Sales Order
          </button>
          <button
            type="button"
            class="px-2 py-1.5 text-xs rounded-lg border font-medium transition flex items-center justify-center gap-1"
            :class="
              form.type === 'RETURN_OUT'
                ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm font-bold'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            "
            @click="form.type = 'RETURN_OUT'"
          >
            🔄 Retur Keluar (Supplier)
          </button>
          <button
            type="button"
            class="px-2 py-1.5 text-xs rounded-lg border font-medium transition flex items-center justify-center gap-1"
            :class="
              form.type === 'RETURN_IN'
                ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm font-bold'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            "
            @click="form.type = 'RETURN_IN'"
          >
            ↩️ Retur Masuk (Customer)
          </button>
        </div>
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-700 uppercase mb-1"
          >Tanggal Order *</label
        >
        <input
          v-model="form.order_date"
          type="date"
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          required
        />
      </div>
    </div>

    <!-- Pilihan Referensi Sales Order (khusus Retur) -->
    <div v-if="isReturn" class="bg-purple-50/60 p-3 rounded-lg border border-purple-100">
      <label class="block text-xs font-semibold text-purple-900 uppercase mb-1">
        {{
          form.type === 'RETURN_IN'
            ? 'Pilih Ref Sales Order (SO) Terkirim *'
            : 'Pilih Ref Purchase Order (PO) Diterima *'
        }}
      </label>
      <select
        v-model="form.parent_id"
        class="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
        required
        @change="handleParentOrderChange"
      >
        <option :value="null">-- Pilih Dokumen Asal --</option>
        <option v-for="refOrder in returnableOrders" :key="refOrder.id" :value="refOrder.id">
          {{ refOrder.order_no }} ({{ refOrder.customer?.name || refOrder.supplier?.name }})
        </option>
      </select>
      <p class="text-[11px] text-purple-600 mt-1">
        * Memilih dokumen asal akan otomatis mengisi data Customer & batas barang terkirim.
      </p>
    </div>

    <!-- Party & Expected Date -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-semibold text-gray-700 uppercase mb-1">
          {{ ['INBOUND', 'RETURN_OUT'].includes(form.type) ? 'Supplier' : 'Customer' }} *
        </label>
        <select
          v-model="form.party_id"
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          :disabled="isReturn && !!form.parent_id"
          required
        >
          <option :value="null">
            Pilih {{ ['INBOUND', 'RETURN_OUT'].includes(form.type) ? 'Supplier' : 'Customer' }}
          </option>
          <option v-for="party in parties" :key="party.id" :value="party.id">
            {{ party.name }}
          </option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-700 uppercase mb-1"
          >Tanggal Estimasi</label
        >
        <input
          v-model="form.expected_date"
          type="date"
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
    </div>

    <!-- Item List -->
    <div>
      <div class="flex justify-between items-center mb-2">
        <label class="block text-xs font-semibold text-gray-700 uppercase">Daftar Barang *</label>
        <button
          v-if="!isReturn"
          type="button"
          class="text-xs text-blue-600 hover:text-blue-800 font-semibold transition"
          @click="addItem"
        >
          + Tambah Barang
        </button>
      </div>

      <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
        <div
          v-for="(item, index) in form.items"
          :key="index"
          class="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg"
        >
          <input
            v-if="isReturn"
            type="text"
            :value="item.product_sku"
            readonly
            class="flex-1 px-2 py-1.5 text-sm border border-gray-200 bg-gray-100 font-mono rounded-md"
          />
          <select
            v-else
            v-model="item.product_sku"
            class="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
            required
          >
            <option value="">Pilih Produk</option>
            <option v-for="product in products" :key="product.sku" :value="product.sku">
              {{ product.sku }} - {{ product.product_name }}
            </option>
          </select>

          <!-- <input
            v-model.number="item.qty_ordered"
            type="number"
            placeholder="Qty"
            min="1"
            class="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          /> -->

          <div class="relative">
            <input
              v-model.number="item.qty_ordered"
              type="number"
              placeholder="Qty"
              min="1"
              :max="item.qty_max || undefined"
              class="w-24 px-2 py-1.5 text-sm border rounded-md focus:ring-2"
              :class="
                isReturn && item.qty_ordered > item.qty_max
                  ? 'border-rose-500 text-rose-600 font-bold bg-rose-50'
                  : 'border-gray-300'
              "
              required
            />
            <span
              v-if="isReturn && item.qty_max"
              class="text-[10px] text-gray-500 block text-right mt-0.5"
            >
              Max: {{ item.qty_max }}
            </span>
          </div>

          <input
            v-model.number="item.unit_price"
            type="number"
            placeholder="Harga (Rp)"
            min="0"
            step="1000"
            class="w-32 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />

          <button
            v-if="!isReturn"
            type="button"
            class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition"
            @click="removeItem(index)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          class="text-center text-xs text-gray-400 py-4 border-2 border-dashed border-gray-200 rounded-lg"
        >
          Belum ada barang dimasukkan. Klik "+ Tambah Barang"
        </p>
      </div>
    </div>

    <!-- Notes -->
    <div>
      <label class="block text-xs font-semibold text-gray-700 uppercase mb-1"
        >Catatan Tambahan</label
      >
      <textarea
        v-model="form.notes"
        rows="2"
        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder="Informasi pengiriman, pembayaran, dll..."
      ></textarea>
    </div>

    <!-- Submit / Action Footer -->
    <div class="flex justify-end gap-2 pt-2 border-t">
      <button
        type="button"
        class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        :disabled="loading"
        @click="emit('cancel')"
      >
        Batal
      </button>
      <button
        type="submit"
        class="px-5 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        :disabled="loading || !isFormValid"
      >
        <span v-if="loading">Menyimpan...</span>
        <span v-else>Simpan Order</span>
      </button>
    </div>
  </form>
</template>
