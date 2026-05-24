import { reactive, ref } from 'vue'
import { useApi } from '@/functions/api'

export function useProductList() {
  const api = useApi()
  const products = ref<Product[]>([])
  const loading = ref(false)
  const meta = ref<any>(null)

  const getData = async () => {
    try {
      loading.value = true
      const response = await api.GET<ApiCollection<Product>>(`admin/products`)
      products.value = response.data
      meta.value = response.meta
    } finally {
      loading.value = false
    }
  }

  return {
    getData,
    loading,
    products,
    meta,
  }
}

export function useProductCreate() {
  const api = useApi()
  const submitting = ref(false)
  const errors = ref<FormError>({})
  const form = reactive<ProductFormData>({
    product_name: '',
    category_id: null,
    brand: '',
    type: '',
    packaging: '',
    size: '',
    unit: '',
    min_stock: 0,
  })

  const submitForm = async () => {
    try {
      submitting.value = true
      errors.value = {}
      // Backend akan men-generate SKU secara otomatis dari payload ini
      return await api.POST<ApiResource<Product>>('admin/products', form)
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
    submitForm,
  }
}

export function useProductUpdate() {
  const api = useApi()
  const submitting = ref(false)
  const errors = ref<FormError>({})

  // Update menggunakan SKU sebagai identifier sesuai route Laravel kamu
  const submitUpdate = async (sku: string, payload: ProductFormData) => {
    try {
      submitting.value = true
      errors.value = {}
      return await api.PUT<ApiResource<Product>>(`admin/products/${sku}`, payload)
    } catch (error) {
      errors.value = api.formErrors(error)
      throw error
    } finally {
      submitting.value = false
    }
  }

  return {
    errors,
    submitting,
    submitUpdate,
  }
}

export function useProductToggle() {
  const api = useApi()
  const toggling = ref(false)

  const submitToggle = async (sku: string) => {
    try {
      toggling.value = true
      const response = await api.PATCH<ApiResource<Product>>(`admin/products/${sku}/toggle-active`)
      return response.data
    } finally {
      toggling.value = false
    }
  }

  return {
    toggling,
    submitToggle,
  }
}

export function useProductDelete() {
  const api = useApi()
  const deleting = ref(false)

  const submitDelete = async (sku: string) => {
    try {
      deleting.value = true
      await api.DELETE(`admin/products/${sku}`)
    } finally {
      deleting.value = false
    }
  }

  return {
    deleting,
    submitDelete,
  }
}
