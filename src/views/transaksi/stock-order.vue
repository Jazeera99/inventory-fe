<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/functions/api'
import { useAuthStore } from '@/stores/auth'
import debounce from 'lodash.debounce'
import AppTableFilter from '@/components/app-table-filter.vue'
import AppInputSearch from '@/components/app-input-search.vue'
import StockOrderReceipt from './modal/stock-order/stock-order-receipt.vue'
import StockOrderModal from './modal/stock-order/stock-order-modal.vue'

const router = useRouter()
const api = useApi()
const authStore = useAuthStore()
const canManageOrder = computed(
  () => authStore.hasPermission('Kelola Order') || authStore.user?.role === 'Superadmin',
)

// Interface Paginated Data
interface OrderPaginated {
  data: StockOrder[]
  current_page: number
  last_page: number
  from: number
  to: number
  total: number
}

// State
const orders = ref<OrderPaginated>({
  data: [],
  current_page: 1,
  last_page: 1,
  from: 0,
  to: 0,
  total: 0,
})
const loading = ref(false)
const filters = reactive({
  type: '',
  status: '',
  start_date: '',
  end_date: '',
  exp_start_date: '',
  exp_end_date: '',
})

const dateFilterModel = ref<{ start?: any; end?: any }>({})
const expDateFilterModel = ref<{ start?: any; end?: any }>({})

// Helper format tanggal yang aman terhadap null / Date / String / Range Object
const formatDateString = (val: any): string => {
  if (!val) return ''
  if (val instanceof Date) {
    // Format tanggal ke YYYY-MM-DD lokal agar tidak bergeser akibat UTC/timezone
    const year = val.getFullYear()
    const month = String(val.getMonth() + 1).padStart(2, '0')
    const day = String(val.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  if (typeof val === 'string') {
    // Jika format string ISO dengan jam (misal "2026-08-04T00:00:00.000Z")
    const parts = val.split('T')
    return parts[0] || ''
  }
  return ''
}

// Watcher untuk sinkronisasi nilai dateFilterModel ke filters
watch(
  dateFilterModel,
  (newVal) => {
    if (!newVal) {
      filters.start_date = ''
      filters.end_date = ''
      return
    }

    // Tangani jika newVal berbentuk Array (beberapa konfigurasi range picker vue-datepicker)
    if (Array.isArray(newVal)) {
      filters.start_date = formatDateString(newVal[0])
      filters.end_date = formatDateString(newVal[1])
    } else {
      // Tangani jika newVal berbentuk Object { start, end }
      filters.start_date = formatDateString(newVal?.start)
      filters.end_date = formatDateString(newVal?.end)
    }
  },
  { deep: true },
)

watch(
  expDateFilterModel,
  (newVal) => {
    if (!newVal) {
      filters.exp_start_date = ''
      filters.exp_end_date = ''
      return
    }
    if (Array.isArray(newVal)) {
      filters.exp_start_date = formatDateString(newVal[0])
      filters.exp_end_date = formatDateString(newVal[1])
    } else {
      filters.exp_start_date = formatDateString(newVal?.start)
      filters.exp_end_date = formatDateString(newVal?.end)
    }
  },
  { deep: true },
)

// Modal state
const showModal = ref(false)
const selectedOrder = ref<StockOrder | null>(null)
const modalLoading = ref(false)

// Detail state
const showDetail = ref(false)
const detailOrder = ref<any | null>(null)
const detailLoading = ref(false)

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {
      type: filters.type || undefined,
      status: filters.status || undefined,
      // search: filters.search || undefined,
      start_date: filters.start_date || undefined,
      end_date: filters.end_date || undefined,
      exp_start_date: filters.exp_start_date || undefined,
      exp_end_date: filters.exp_end_date || undefined,
      page: orders.value.current_page,
      per_page: 10,
    }
    const response = await api.GET<any>('admin/stock-orders', params)

    if (response.meta) {
      orders.value = {
        data: response.data || [],
        current_page: response.meta.current_page || 1,
        last_page: response.meta.last_page || 1,
        from: response.meta.from || 0,
        to: response.meta.to || 0,
        total: response.meta.total || 0,
      }
    } else {
      orders.value = {
        data: response.data?.data || response.data || [],
        current_page: response.data?.current_page || 1,
        last_page: response.data?.last_page || 1,
        from: response.data?.from || 0,
        to: response.data?.to || 0,
        total: response.data?.total || 0,
      }
    }
  } catch (error) {
    console.error('Gagal mengambil data:', error)
  } finally {
    loading.value = false
  }
}

// Auto Search Debounce (500ms delay)
const debouncedFetch = debounce(() => {
  orders.value.current_page = 1 // Reset ke page 1 tiap filter berubah
  fetchOrders()
}, 500)

watch(
  dateFilterModel,
  (newVal) => {
    if (!newVal) {
      filters.start_date = ''
      filters.end_date = ''
      return
    }

    // Tangani jika newVal berbentuk Array (beberapa konfigurasi range picker vue-datepicker)
    if (Array.isArray(newVal)) {
      filters.start_date = formatDateString(newVal[0])
      filters.end_date = formatDateString(newVal[1])
    } else {
      // Tangani jika newVal berbentuk Object { start, end }
      filters.start_date = formatDateString(newVal?.start)
      filters.end_date = formatDateString(newVal?.end)
    }
  },
  { deep: true },
)

// Watcher untuk auto-search & auto-filter di semua halaman
watch(
  () => [
    filters.type,
    filters.status,
    filters.start_date,
    filters.end_date,
    filters.exp_start_date,
    filters.exp_end_date,
  ],
  () => {
    debouncedFetch()
  },
  { deep: true },
)

// watch(dateFilterModel, (newVal) => {
//   filters.start_date = newVal?.start || ''
//   filters.end_date = newVal?.end || ''
// })

const changePage = (page: number) => {
  if (page < 1 || page > orders.value.last_page) return
  orders.value.current_page = page
  fetchOrders()
}

const resetFilters = () => {
  filters.type = ''
  filters.status = ''
  filters.start_date = ''
  filters.end_date = ''
  filters.exp_start_date = ''
  filters.exp_end_date = ''
  dateFilterModel.value = { start: '', end: '' }
  expDateFilterModel.value = { start: '', end: '' }
  orders.value.current_page = 1
  fetchOrders()
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    PENDING: 'bg-yellow-100 text-yellow-700',
    PARTIAL: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

const formatDate = (date?: string | null) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const isUrgentDate = (dateString?: string | null) => {
  if (!dateString) return false
  const expDate = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return expDate <= today
}

const calculateProgress = (order: StockOrder) => {
  if (!order.items?.length) return 0
  const total = order.items.reduce((sum, item) => sum + item.qty_ordered, 0)
  const fulfilled = order.items.reduce((sum, item) => sum + (item as any).qty_fulfilled, 0)
  return Math.round((fulfilled / total) * 100)
}

const progressColor = (order: StockOrder) => {
  const progress = calculateProgress(order)
  if (progress === 100) return 'bg-green-500'
  if (progress > 50) return 'bg-blue-500'
  if (progress > 0) return 'bg-yellow-500'
  return 'bg-gray-300'
}

// Modal Actions
const openCreateModal = () => {
  selectedOrder.value = null
  showModal.value = true
}

const editOrder = (order: StockOrder) => {
  selectedOrder.value = order
  showModal.value = true
}

const viewOrder = async (id: number) => {
  detailLoading.value = true
  showDetail.value = true
  try {
    const response = await api.GET<any>(`admin/stock-orders/${id}`)
    detailOrder.value = response.data?.data || response.data
  } catch (error) {
    console.error('Gagal mengambil detail:', error)
  } finally {
    detailLoading.value = false
  }
}

const saveOrder = async (formData: Record<string, unknown>) => {
  modalLoading.value = true
  try {
    let response
    if (selectedOrder.value?.id) {
      response = await api.PUT<any>(`admin/stock-orders/${selectedOrder.value.id}`, formData)
    } else {
      response = await api.POST<any>('admin/stock-orders', formData)
    }

    await fetchOrders()
    closeModal()

    const resData = response.data?.data || response.data
    if (resData?.id) {
      viewOrder(resData.id)
    }
  } catch (error: any) {
    console.error('Gagal menyimpan order:', error)
    alert(
      error?.response?.data?.message ||
        'Dokumen gagal diperbarui. Silakan periksa data yang diisi.',
    )
  } finally {
    modalLoading.value = false
  }
}

const cancelOrder = async (order: any) => {
  if (!confirm(`Yakin ingin membatalkan order ${order.order_no}?`)) return
  try {
    const reason = prompt('Masukkan alasan pembatalan:')
    if (reason === null) return
    await api.POST(`admin/stock-orders/${order.id}/cancel`, { cancel_reason: reason })
    await fetchOrders()
    if (showDetail.value && detailOrder.value?.id === order.id) {
      viewOrder(order.id)
    }
  } catch (error: any) {
    console.error('Gagal membatalkan order:', error)
  }
}

const closeRemainingOrder = async (order: any) => {
  const reason = prompt(
    `Sisa barang yang belum dikirim pada order ${order.order_no} akan dibatalkan. Masukkan alasan (Opsional):`,
  )
  if (reason === null) return // User menekan cancel di prompt

  try {
    await api.POST(`admin/stock-orders/${order.id}/close-remaining`, { reason: reason })
    alert(`Order ${order.order_no} berhasil di-Short Close (Dianggap Selesai Sebagian).`)
    await fetchOrders()
    if (showDetail.value && detailOrder.value?.id === order.id) {
      viewOrder(order.id)
    }
  } catch (error: any) {
    console.error('Gagal menutup sisa order:', error)
    alert(error?.response?.data?.message || 'Gagal menutup sisa order.')
  }
}

const closeModal = () => {
  showModal.value = false
  selectedOrder.value = null
}

const closeDetail = () => {
  showDetail.value = false
  detailOrder.value = null
}

// const createTransaction = (order: any) => {
//   router.push({
//     name: 'StockTransactionCreate',
//     query: {
//       stock_order_id: order.id,
//       type: order.type === 'INBOUND' ? 'IN' : 'OUT',
//     },
//   })
// }

const createTransaction = (order: any) => {
  if (['INBOUND', 'RETURN_IN'].includes(order.type)) {
    router.push({
      path: 'produk-masuk',
      query: { stock_order_id: order.id },
    })
  } else {
    router.push({
      path: 'produk-keluar',
      query: { stock_order_id: order.id },
    })
  }
}

onMounted(() => {
  fetchOrders()
  const query = router.currentRoute.value.query
  if (query.action === 'create_retur') {
    selectedOrder.value = {
      type: 'RETURN_OUT',
      supplier_id: query.supplier_id ? Number(query.supplier_id) : null,
      parent_id: query.parent_id ? Number(query.parent_id) : null,
      order_date: new Date().toISOString().split('T')[0],
      items: [
        {
          product_sku: String(query.sku || ''),
          qty_ordered: Number(query.qty || 1),
          unit_price: 0,
        },
      ],
    } as any
    showModal.value = true
  }
})
</script>

<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Daftar Purchase / Sales Order / Retur</h1>
        <p class="text-sm text-gray-500 mt-1">Kelola pesanan pembelian dan penjualan</p>
      </div>
      <button
        v-if="canManageOrder"
        @click="openCreateModal"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
      >
        + Buat PO / SO / Retur
      </button>
    </div>

    <!-- Filter -->
    <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div class="flex flex-wrap gap-4 items-end">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Tipe</label>
          <select
            v-model="filters.type"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <option value="">Semua</option>
            <option value="INBOUND">Purchase Order (PO)</option>
            <option value="OUTBOUND">Sales Order (SO)</option>
            <option value="RETURN_IN">Retur ke Supplier</option>
            <option value="RETURN_OUT">Retur dari Customer</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            v-model="filters.status"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">Semua</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <!-- <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Cari</label>
          <AppInputSearch v-model="filters.search" placeholder="Ketik No. Order" />
        </div> -->
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Tanggal Order</label>
          <AppTableFilter v-model="dateFilterModel" minimal />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1"
            >Tanggal Estimasi (Kirim/Tiba)</label
          >
          <AppTableFilter v-model="expDateFilterModel" minimal />
        </div>
        <button
          @click="resetFilters"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          Reset Filter
        </button>
      </div>
    </div>

    <!-- Tabel -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                No. Order
              </th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Tipe
              </th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Pihak Terkait
              </th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Status
              </th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Tanggal Order
              </th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Tanggal Estimasi
              </th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Total Item
              </th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Progress
              </th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="orders.data.length > 0">
              <tr
                v-for="order in orders.data"
                :key="order.id"
                class="border-b hover:bg-gray-50 transition cursor-pointer"
                @click="viewOrder(order.id!)"
              >
                <td class="px-4 py-3 font-mono text-sm text-blue-600">
                  {{ order.order_no }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="px-2 py-1 rounded-full text-xs font-medium"
                    :class="
                      order.type === 'INBOUND'
                        ? 'bg-green-100 text-green-700'
                        : order.type === 'OUTBOUND'
                          ? 'bg-orange-100 text-orange-700'
                          : order.type === 'RETURN_OUT'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-purple-100 text-purple-700'
                    "
                  >
                    {{
                      order.type === 'INBOUND'
                        ? 'PO'
                        : order.type === 'OUTBOUND'
                          ? 'SO'
                          : order.type === 'RETURN_OUT'
                            ? 'Retur Supplier'
                            : 'Retur Customer'
                    }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm font-medium">
                  {{
                    ['INBOUND', 'RETURN_OUT'].includes(order.type)
                      ? order.supplier?.supplier_name
                      : order.customer?.customer_name
                  }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="px-2 py-1 rounded-full text-xs font-medium"
                    :class="statusBadge((order as any).status)"
                  >
                    {{ (order as any).status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm">{{ formatDate(order.order_date) }}</td>
                <td class="px-4 py-3 text-sm">
                  <span
                    :class="[
                      'font-medium px-2 py-0.5 rounded',
                      isUrgentDate(order.expected_date) &&
                      !['COMPLETED', 'CANCELLED'].includes((order as any).status)
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'text-gray-700',
                    ]"
                  >
                    {{ formatDate(order.expected_date) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">{{ order.items?.length || 0 }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-2">
                    <span class="text-xs font-medium">{{ calculateProgress(order) }}%</span>
                    <div class="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :style="{ width: calculateProgress(order) + '%' }"
                        :class="progressColor(order)"
                      ></div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3" @click.stop>
                  <div class="flex items-center justify-center gap-2">
                    <button @click="viewOrder(order.id!)" class="p-1 text-blue-600 hover:underline">
                      Detail
                    </button>
                    <button
                      v-if="canManageOrder && ['DRAFT'].includes((order as any).status)"
                      @click="editOrder(order)"
                      class="p-1 text-yellow-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      v-if="['PENDING', 'PARTIAL'].includes((order as any).status)"
                      @click="createTransaction(order)"
                      class="p-1 text-green-600 hover:underline"
                    >
                      Proses
                    </button>
                    <button
                      v-if="canManageOrder && (order as any).status === 'PARTIAL'"
                      @click="closeRemainingOrder(order)"
                      class="p-1 text-purple-600 hover:underline font-medium"
                      title="Selesaikan order & batalkan sisa kuantitas barang"
                    >
                      Close
                    </button>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="8" class="px-4 py-8 text-center text-gray-400">
                Tidak ada data order. Klik
                <button @click="openCreateModal" class="text-blue-600 underline font-medium">
                  Buat PO / SO baru
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-4 py-3 border-t flex items-center justify-between bg-gray-50">
        <span class="text-xs text-gray-500">
          Menampilkan {{ orders.from }} - {{ orders.to }} dari {{ orders.total }} data
        </span>
        <div class="flex items-center gap-2">
          <!-- Tombol Kiri (Sebelumnya) -->
          <button
            @click="changePage(orders.current_page - 1)"
            :disabled="orders.current_page <= 1"
            class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white flex items-center gap-1 transition"
          >
            ‹ Prev
          </button>

          <span class="text-xs font-semibold px-2 text-gray-700">
            Halaman {{ orders.current_page }} dari {{ orders.last_page }}
          </span>

          <!-- Tombol Kanan (Selanjutnya) -->
          <button
            @click="changePage(orders.current_page + 1)"
            :disabled="orders.current_page >= orders.last_page"
            class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white flex items-center gap-1 transition"
          >
            Next ›
          </button>
        </div>
      </div>
    </div>

    <!-- Component Modals -->
    <StockOrderModal
      v-if="showModal"
      :is-open="showModal"
      :order="selectedOrder"
      :loading="modalLoading"
      @close="closeModal"
      @save="saveOrder"
    />

    <div
      v-if="showDetail"
      class="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4 flex items-center justify-center"
      @click.self="closeDetail"
    >
      <div class="w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden p-4">
        <StockOrderReceipt
          :order="detailOrder"
          :loading="detailLoading"
          :can-create-transaction="
            ['DRAFT', 'PENDING', 'PARTIAL'].includes(detailOrder?.status || '')
          "
          @print="() => {}"
          @create-transaction="() => detailOrder && createTransaction(detailOrder)"
          @edit="
            () => {
              const orderToEdit = detailOrder
              closeDetail()
              if (orderToEdit) editOrder(orderToEdit)
            }
          "
          @cancel="() => detailOrder && cancelOrder(detailOrder)"
          @short-close="closeRemainingOrder(detailOrder)"
        />
        <div class="text-right mt-4 border-t pt-2">
          <button @click="closeDetail" class="px-4 py-2 bg-gray-600 text-white rounded-lg">
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
