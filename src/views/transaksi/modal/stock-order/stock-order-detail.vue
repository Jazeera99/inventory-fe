<script setup lang="ts">
import { computed } from 'vue'

interface OrderItem {
  product_sku: string
  qty_ordered: number
  qty_fulfilled: number
  unit_price: number
  product?: {
    product_name: string
  }
}

interface OrderDetail {
  id: number
  order_no: string
  type: 'INBOUND' | 'OUTBOUND'
  status: string
  order_date: string
  expected_date?: string | null
  notes?: string | null
  cancel_reason?: string | null
  supplier?: { name: string; phone?: string; address?: string }
  customer?: { name: string; phone?: string; address?: string }
  items?: OrderItem[]
}

const props = defineProps<{
  order: OrderDetail | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create-transaction', order: OrderDetail): void
}>()

const statusBadge = computed(() => {
  const map: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    PENDING: 'bg-yellow-100 text-yellow-800',
    PARTIAL: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }
  return map[props.order?.status || ''] || 'bg-gray-100 text-gray-600'
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (date?: string | null) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
      <div>
        <h2 class="text-lg font-bold text-gray-800">
          {{ order?.type === 'INBOUND' ? 'Purchase Order' : 'Sales Order' }} #{{ order?.order_no }}
        </h2>
        <p class="text-xs text-gray-500">Dibuat tanggal {{ formatDate(order?.order_date) }}</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1 rounded-full text-xs font-semibold" :class="statusBadge">
          {{ order?.status }}
        </span>
        <button class="p-1 hover:bg-gray-200 rounded-lg text-gray-500" @click="emit('close')">
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
    </div>

    <!-- Body / Loading -->
    <div v-if="loading" class="p-8 text-center text-gray-400">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"
      ></div>
      <p>Mengambil data detail...</p>
    </div>

    <div v-else-if="order" class="p-6 space-y-6">
      <!-- Grid Info Pihak -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <h4 class="text-xs font-semibold uppercase text-gray-400 tracking-wider">
            {{ order.type === 'INBOUND' ? 'Informasi Supplier' : 'Informasi Customer' }}
          </h4>
          <p class="font-bold text-gray-800 mt-1">
            {{ order.type === 'INBOUND' ? order.supplier?.name : order.customer?.name }}
          </p>
          <p class="text-xs text-gray-600">
            {{ order.type === 'INBOUND' ? order.supplier?.address : order.customer?.address }}
          </p>
        </div>
        <div>
          <h4 class="text-xs font-semibold uppercase text-gray-400 tracking-wider">
            Estimasi Pengiriman
          </h4>
          <p class="font-medium text-gray-700 mt-1">{{ formatDate(order.expected_date) }}</p>
          <p v-if="order.notes" class="text-xs text-gray-500 mt-2">
            <b>Catatan:</b> {{ order.notes }}
          </p>
        </div>
      </div>

      <!-- Item Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-100 text-xs text-gray-600 uppercase font-semibold">
            <tr>
              <th class="py-2 px-3">SKU</th>
              <th class="py-2 px-3">Produk</th>
              <th class="py-2 px-3 text-right">Dipesan</th>
              <th class="py-2 px-3 text-right">Terpenuhi</th>
              <th class="py-2 px-3 text-right">Harga Satuan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="item in order.items" :key="item.product_sku">
              <td class="py-2.5 px-3 font-mono text-xs font-semibold text-blue-600">
                {{ item.product_sku }}
              </td>
              <td class="py-2.5 px-3 text-gray-800">{{ item.product?.product_name || '-' }}</td>
              <td class="py-2.5 px-3 text-right font-medium">{{ item.qty_ordered }}</td>
              <td
                class="py-2.5 px-3 text-right font-medium"
                :class="
                  item.qty_fulfilled >= item.qty_ordered ? 'text-green-600' : 'text-amber-600'
                "
              >
                {{ item.qty_fulfilled }}
              </td>
              <td class="py-2.5 px-3 text-right text-gray-600">
                {{ formatCurrency(item.unit_price) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer Action -->
    <div class="px-6 py-3 bg-gray-50 border-t flex justify-end gap-2">
      <button
        class="px-4 py-2 text-sm border rounded-lg hover:bg-white text-gray-700"
        @click="emit('close')"
      >
        Tutup
      </button>
      <button
        v-if="order && ['PENDING', 'PARTIAL'].includes(order.status)"
        class="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition"
        @click="emit('create-transaction', order)"
      >
        + Process Transaksi Stok
      </button>
    </div>
  </div>
</template>
