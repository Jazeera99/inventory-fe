import { reactive, ref } from 'vue'
import { useApi } from '@/functions/api'

// Custom interface error form jika belum terdefinisikan global
interface FormError {
  [key: string]: string | string[]
}

export function useStockOrderCreate(initialType: StockOrderType = 'INBOUND') {
  const api = useApi()
  const submitting = ref(false)
  const errors = ref<FormError>({})

  const createInitialState = (): CreateStockOrderPayload => ({
    type: initialType,
    supplier_id: null,
    customer_id: null,
    order_date: '',
    expected_date: null,
    notes: '',
    items: [
      {
        product_sku: '',
        qty_ordered: 1,
        unit_price: 0,
      },
    ],
  })

  const form = reactive<CreateStockOrderPayload>(createInitialState())

  const resetForm = () => {
    const fresh = createInitialState()
    form.type = fresh.type
    form.supplier_id = fresh.supplier_id
    form.customer_id = fresh.customer_id
    form.order_date = fresh.order_date
    form.expected_date = fresh.expected_date
    form.notes = fresh.notes
    form.items.splice(0, form.items.length, ...fresh.items)
    errors.value = {}
  }

  const addItem = () => {
    form.items.push({
      product_sku: '',
      qty_ordered: 1,
      unit_price: 0,
    })
  }

  const removeItem = (index: number) => {
    if (form.items.length > 1) {
      form.items.splice(index, 1)
    }
  }

  const submitForm = async (orderId?: number) => {
    try {
      submitting.value = true
      errors.value = {}

      const payload = {
        ...form,
        supplier_id: form.type === 'INBOUND' ? form.supplier_id : null,
        customer_id: form.type === 'OUTBOUND' ? form.customer_id : null,
        items: form.items.map((item) => ({
          ...item,
          qty_ordered: Number(item.qty_ordered),
          unit_price: Number(item.unit_price || 0),
        })),
      }

      let response
      if (orderId) {
        response = await api.PUT<ApiResource<StockOrder>>(`admin/stock-orders/${orderId}`, payload)
      } else {
        response = await api.POST<ApiResource<StockOrder>>('admin/stock-orders', payload)
      }

      return response.data
    } catch (error) {
      errors.value = api.formErrors(error)
      throw error
    } finally {
      submitting.value = false
    }
  }

  return {
    form,
    errors,
    submitting,
    addItem,
    removeItem,
    resetForm,
    submitForm,
  }
}

export function useStockOrderList() {
  const api = useApi()
  const orders = ref<StockOrder[]>([])
  const loading = ref(false)
  const meta = ref<any>(null)

  const getData = async (params: Record<string, any> = {}) => {
    try {
      loading.value = true
      const response = await api.GET<ApiCollection<StockOrder>>('admin/stock-orders', params)
      orders.value = response.data
      meta.value = response.meta
    } finally {
      loading.value = false
    }
  }

  const cancelOrder = async (id: number, reason: string) => {
    try {
      loading.value = true
      const response = await api.POST<any>(`admin/stock-orders/${id}/cancel`, {
        cancel_reason: reason,
      })
      return response
    } catch (error) {
      console.error('Gagal membatalkan order:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    orders,
    loading,
    meta,
    getData,
    cancelOrder,
  }
}

export function useStockOrderShow() {
  const api = useApi()
  const order = ref<StockOrder | null>(null)
  const loading = ref(false)

  const getDetail = async (id: number) => {
    try {
      loading.value = true
      const response = await api.GET<ApiResource<StockOrder>>(`admin/stock-orders/${id}`)
      order.value = response.data
    } finally {
      loading.value = false
    }
  }

  return {
    order,
    loading,
    getDetail,
  }
}
