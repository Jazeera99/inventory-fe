<script setup lang="ts">
import { computed, ref } from 'vue'

export interface OrderItem {
  product_sku: string
  qty_ordered: number
  qty_fulfilled: number
  unit_price: number
  product?: {
    product_name: string
  }
}

export interface OrderDetail {
  id: number
  order_no: string
  type: 'INBOUND' | 'OUTBOUND' | 'RETURN_IN' | 'RETURN_OUT'
  status: string
  order_date: string
  expected_date?: string | null
  notes?: string | null
  cancel_reason?: string | null
  supplier?: { supplier_name: string; email?: string; phone?: string; address?: string }
  customer?: { customer_name: string; email?: string; phone?: string; address?: string }
  items?: OrderItem[]
  parent_order_no?: string | null
  returns?: Array<{
    id: number
    order_no: string
    type: string
    status: string
    items: Array<{ product_sku: string; qty_ordered: number }>
  }>
}

const props = defineProps<{
  order: OrderDetail | null
  loading?: boolean
  canCreateTransaction?: boolean
}>()

const emit = defineEmits<{
  (e: 'print'): void
  (e: 'create-transaction'): void
  (e: 'edit'): void
  (e: 'cancel'): void
}>()

const receiptContent = ref<HTMLElement | null>(null)

const statusBadgeClass = computed(() => {
  const map: Record<string, string> = {
    DRAFT: 'bg-gray-200 text-gray-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    PARTIAL: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }
  return map[props.order?.status || ''] || 'bg-gray-100 text-gray-600'
})

// const totalQuantity = computed(() => {
//   return props.order?.items?.reduce((sum, item) => sum + item.qty_ordered, 0) || 0
// })

const totalQuantity = computed(() => {
  if (!props.order?.items || !Array.isArray(props.order.items)) return 0
  return props.order.items.reduce((sum, item) => sum + (Number(item.qty_ordered) || 0), 0)
})

const documentTitle = computed(
  () =>
    (
      ({
        INBOUND: 'PURCHASE ORDER',
        OUTBOUND: 'SALES ORDER',
        RETURN_OUT: 'RETUR KE SUPPLIER',
        RETURN_IN: 'RETUR DARI CUSTOMER',
      }) as Record<string, string>
    )[props.order?.type || ''] || 'DOKUMEN',
)

// const totalAmount = computed(() => {
//   return (
//     props.order?.items?.reduce((sum, item) => sum + item.qty_ordered * (item.unit_price || 0), 0) ||
//     0
//   )
// })

const totalAmount = computed(() => {
  if (!props.order?.items || !Array.isArray(props.order.items)) return 0
  return props.order.items.reduce(
    (sum, item) => sum + (Number(item.qty_ordered) || 0) * (Number(item.unit_price) || 0),
    0,
  )
})

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const fulfilledPercentage = computed(() => {
  if (!props.order?.items || !Array.isArray(props.order.items) || props.order.items.length === 0)
    return 0
  const totalOrdered = props.order.items.reduce(
    (sum, item) => sum + (Number(item.qty_ordered) || 0),
    0,
  )
  const totalFulfilled = props.order.items.reduce(
    (sum, item) => sum + (Number(item.qty_fulfilled) || 0),
    0,
  )
  if (totalOrdered === 0) return 0
  return Math.round((totalFulfilled / totalOrdered) * 100)
})

// const fulfilledPercentage = computed(() => {
//   if (!props.order?.items?.length) return 0
//   const totalOrdered = props.order.items.reduce((sum, item) => sum + item.qty_ordered, 0)
//   const totalFulfilled = props.order.items.reduce((sum, item) => sum + item.qty_fulfilled, 0)
//   return Math.round((totalFulfilled / totalOrdered) * 100)
// })

// const completedDate = computed(() => {
//   if (!props.order || props.order.status !== 'COMPLETED') return null

//   // Jika order membawa relasi transaksi (transactions)
//   if (props.order.transactions && props.order.transactions.length > 0) {
//     // Cari tanggal transaksi paling akhir
//     const dates = props.order.transactions.map((t) => new Date(t.date))
//     const latestDate = new Date(Math.max(...dates))
//     return formatDate(latestDate)
//   }

//   // Fallback jika tidak ada relasi transaksi, gunakan updated_at
//   return formatDate(props.order.updated_at)
// })

const formatDate = (date?: string | null) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('id-ID').format(num)
}

const handlePrint = () => {
  emit('print')
  if (receiptContent.value) {
    window.print()
  }
}
</script>

<template>
  <div class="receipt-wrapper">
    <div v-if="order" class="flex justify-between items-center mb-4 print:hidden">
      <h3 class="text-lg font-semibold text-gray-800">
        <span>{{ order.type === 'INBOUND' ? 'Purchase Order' : 'Sales Order' }}</span>
        #{{ order.order_no }}
      </h3>
      <div class="flex gap-2">
        <button
          @click="handlePrint"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          Cetak / PDF
        </button>
        <!-- <button
          v-if="
            canCreateTransaction ||
            (order && ['DRAFT', 'PENDING', 'PARTIAL'].includes(order.status))
          "
          @click="emit('create-transaction')"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          + Transaksi Stok
        </button> -->
        <button
          v-if="['DRAFT', 'PENDING', 'PARTIAL'].includes(order.status)"
          @click="emit('edit')"
          class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
        >
          Edit
        </button>
        <button
          v-if="['DRAFT', 'PENDING', 'PARTIAL'].includes(order.status)"
          @click="emit('cancel')"
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Batalkan
        </button>
      </div>
    </div>

    <!-- Dokumen Detail -->
    <div
      ref="receiptContent"
      v-if="order"
      class="bg-white rounded-xl shadow-lg p-8 print:shadow-none print:p-6 max-w-4xl mx-auto"
    >
      <div class="flex justify-between items-start border-b pb-4 mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">
            {{ documentTitle }}
          </h1>
          <p class="text-sm text-gray-500">No. {{ order.order_no }}</p>
        </div>
        <div class="text-right">
          <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="statusBadgeClass">
            {{ order.status }}
          </span>
          <p class="text-sm text-gray-500 mt-1">
            Tanggal Order: {{ formatDate(order.order_date) }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {{ ['INBOUND', 'RETURN_OUT'].includes(order.type) ? 'Supplier' : 'Customer' }}
          </h4>
          <div class="mt-1 p-3 bg-gray-50 rounded-lg">
            <p class="font-medium text-gray-800">
              {{
                ['INBOUND', 'RETURN_OUT'].includes(order.type)
                  ? order.supplier?.supplier_name || '-'
                  : order.customer?.customer_name || '-'
              }}
            </p>
            <p class="text-sm text-gray-600">
              {{
                ['INBOUND', 'RETURN_OUT'].includes(order.type)
                  ? order.supplier?.phone
                  : order.customer?.phone
              }}
            </p>
          </div>
        </div>
        <div>
          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Informasi Order
          </h4>
          <div class="mt-1 p-3 bg-gray-50 rounded-lg space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Tanggal Order:</span>
              <span class="font-medium text-gray-800">{{ formatDate(order.order_date) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Tanggal Estimasi:</span>
              <span class="font-medium text-gray-800">{{ formatDate(order.expected_date) }}</span>
            </div>
            <!-- <div v-if="order.status === 'COMPLETED'" class="flex justify-between text-green-700 font-medium">
              <span>Selesai Pada:</span>
              <span>{{ completedDate }}</span>
            </div> -->
            <div class="flex justify-between pt-5 border-t border-gray-200/60">
              <span class="text-gray-500">Total Qty:</span>
              <span class="font-medium">{{ totalQuantity }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Total Nilai:</span>
              <span class="font-medium text-blue-600">{{ formatRupiah(totalAmount) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Terpenuhi:</span>
              <span class="font-medium">{{ fulfilledPercentage }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="order.parent_order_no"
        class="mb-4 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-sm text-blue-800"
      >
        Dokumen asal: <strong>{{ order.parent_order_no }}</strong>
      </div>

      <div v-if="order.returns?.length" class="mb-4 rounded-lg border border-gray-200 p-3 text-sm">
        <p class="font-semibold text-gray-700 mb-1">Riwayat retur</p>
        <p v-for="retur in order.returns" :key="retur.id" class="text-gray-600">
          {{ retur.type === 'RETURN_OUT' ? 'Retur ke Supplier' : 'Retur dari Customer' }} —
          {{ retur.order_no }} ({{ retur.status }})
        </p>
      </div>

      <!-- Tabel Items -->
      <div class="overflow-x-auto mb-4">
        <table class="w-full text-sm text-left">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="py-2 px-3">SKU</th>
              <th class="py-2 px-3">Produk</th>
              <th class="py-2 px-3 text-right">Dipesan</th>
              <th class="py-2 px-3 text-right">Terpenuhi</th>
              <th class="py-2 px-3 text-right">Harga Satuan</th>
              <th class="py-2 px-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in order.items" :key="index" class="border-b">
              <td class="py-2 px-3 font-mono text-xs text-blue-600">{{ item.product_sku }}</td>
              <td class="py-2 px-3">
                {{ item.product_name || item.product?.product_name || '-' }}
              </td>
              <td class="py-2 px-3 text-right">{{ item.qty_ordered }}</td>
              <td
                class="py-2 px-3 text-right font-medium"
                :class="
                  item.qty_fulfilled >= item.qty_ordered ? 'text-green-600' : 'text-amber-600'
                "
              >
                {{ item.qty_fulfilled }}
              </td>
              <td class="py-2 px-3 text-right">{{ formatRupiah(item.unit_price) }}</td>
              <td class="py-2 px-3 text-right font-medium">
                {{ formatRupiah(item.qty_ordered * item.unit_price) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-12 text-center">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"
      ></div>
      <p class="text-gray-500">Memuat detail order...</p>
    </div>
  </div>
</template>
