<script setup lang="ts">
interface OrderItem {
  product_sku: string
  qty_ordered: number
  qty_fulfilled: number
  unit_price: number
}

interface SupplierOrCustomer {
  id: number
  name: string
}

interface Order {
  id: number
  order_no: string
  type: 'INBOUND' | 'OUTBOUND'
  status: 'DRAFT' | 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED'
  order_date: string
  items?: OrderItem[]
  supplier?: SupplierOrCustomer
  customer?: SupplierOrCustomer
}

defineProps<{
  orders: Order[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'view', id: number): void
  (e: 'edit', order: Order): void
  (e: 'create-transaction', order: Order): void
  (e: 'cancel', order: Order): void
}>()

const statusBadge = (status: string): string => {
  const map: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    PARTIAL: 'bg-blue-100 text-blue-700 border border-blue-200',
    COMPLETED: 'bg-green-100 text-green-700 border border-green-200',
    CANCELLED: 'bg-red-100 text-red-700 border border-red-200',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

const formatDate = (date: string): string => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const calculateProgress = (order: Order): number => {
  if (!order.items?.length) return 0
  const total = order.items.reduce((sum, item) => sum + item.qty_ordered, 0)
  const fulfilled = order.items.reduce((sum, item) => sum + item.qty_fulfilled, 0)
  return Math.round((fulfilled / total) * 100)
}

const progressColor = (order: Order): string => {
  const progress = calculateProgress(order)
  if (progress === 100) return 'bg-green-500'
  if (progress > 50) return 'bg-blue-500'
  if (progress > 0) return 'bg-yellow-500'
  return 'bg-gray-300'
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse">
      <thead
        class="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider"
      >
        <tr>
          <th class="px-4 py-3">No. Order</th>
          <th class="px-4 py-3">Tipe</th>
          <th class="px-4 py-3">Pihak Terkait</th>
          <th class="px-4 py-3">Status</th>
          <th class="px-4 py-3">Tanggal</th>
          <th class="px-4 py-3 text-right">Total Item</th>
          <th class="px-4 py-3 text-right">Progress</th>
          <th class="px-4 py-3 text-center">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 text-sm">
        <tr v-if="loading">
          <td colspan="8" class="text-center py-8 text-gray-400">
            <div
              class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mr-2"
            ></div>
            Memuat data order...
          </td>
        </tr>
        <template v-else-if="orders && orders.length > 0">
          <tr
            v-for="order in orders"
            :key="order.id"
            class="hover:bg-blue-50/50 transition cursor-pointer"
            @click="emit('view', order.id)"
          >
            <td class="px-4 py-3 font-mono font-medium text-blue-600">{{ order.order_no }}</td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-0.5 rounded-full text-xs font-semibold"
                :class="
                  order.type === 'INBOUND'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                "
              >
                {{ order.type === 'INBOUND' ? 'PO' : 'SO' }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-700 font-medium">
              {{ order.type === 'INBOUND' ? order.supplier?.name : order.customer?.name }}
            </td>
            <td class="px-4 py-3">
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="statusBadge(order.status)"
              >
                {{ order.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ formatDate(order.order_date) }}</td>
            <td class="px-4 py-3 text-right font-medium text-gray-700">
              {{ order.items?.length || 0 }}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-2">
                <span class="text-xs font-semibold text-gray-600"
                  >{{ calculateProgress(order) }}%</span
                >
                <div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-full transition-all duration-300"
                    :style="{ width: calculateProgress(order) + '%' }"
                    :class="progressColor(order)"
                  ></div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3" @click.stop>
              <div class="flex items-center justify-center gap-1">
                <button
                  type="button"
                  class="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition"
                  title="Lihat Detail"
                  @click="emit('view', order.id)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
                <button
                  v-if="order.status === 'PENDING'"
                  type="button"
                  class="p-1.5 text-amber-600 hover:bg-amber-100 rounded-md transition"
                  title="Edit"
                  @click="emit('edit', order)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  v-if="['PENDING', 'PARTIAL'].includes(order.status)"
                  type="button"
                  class="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-md transition"
                  title="Buat Transaksi Stok"
                  @click="emit('create-transaction', order)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </button>
                <button
                  v-if="order.status === 'PENDING'"
                  type="button"
                  class="p-1.5 text-rose-600 hover:bg-rose-100 rounded-md transition"
                  title="Batalkan"
                  @click="emit('cancel', order)"
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
            </td>
          </tr>
        </template>
        <tr v-else>
          <td colspan="8" class="text-center py-8 text-gray-400">
            <p class="text-base font-medium">Tidak ada order ditemukan</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
