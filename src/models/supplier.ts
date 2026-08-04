import { ref, reactive } from 'vue'
import { useApi } from '@/functions/api'
import { useToastStore } from '@/stores/toast'

export function useSupplierList() {
  const api = useApi()
  const suppliers = ref<Supplier[]>([])
  const loading = ref(false)

  const getData = async (params = {}) => {
    try {
      loading.value = true
      const response = await api.GET<ApiCollection<Supplier>>('admin/suppliers', params)
      suppliers.value = response.data
    } finally {
      loading.value = false
    }
  }

  return { suppliers, loading, getData }
}

export function useSupplierCreate() {
  const api = useApi()
  const errors = ref<FormError>({})
  const submitting = ref(false)
  const form = reactive<SupplierFormData>({
    supplier_name: '',
    phone: '',
    address: '',
  })

  const submitForm = async () => {
    try {
      submitting.value = true
      errors.value = {}
      return await api.POST<ApiResource<Supplier>>('admin/suppliers', form)
    } catch (error) {
      errors.value = api.formErrors(error)
    } finally {
      submitting.value = false
    }
  }

  return { form, errors, submitting, submitForm }
}

export function useSupplierEdit() {
  const api = useApi()
  const errors = ref<FormError>({})
  const submitting = ref(false)
  const form = reactive<SupplierFormData>({
    supplier_name: '',
    phone: '',
    address: '',
  })

  const submitForm = async (id: number) => {
    try {
      submitting.value = true
      errors.value = {}
      return await api.PUT<ApiResource<Supplier>>(`admin/suppliers/${id}`, form)
    } catch (error) {
      errors.value = api.formErrors(error)
    } finally {
      submitting.value = false
    }
  }

  return { form, errors, submitting, submitForm }
}

export function useSupplierToggle() {
  const api = useApi()
  const toast = useToastStore()

  const toggle = async (id: number) => {
    try {
      const response = await api.PATCH<ApiResource<Supplier>>(`admin/suppliers/${id}/toggle-active`)
      toast.add('Status supplier berhasil diperbarui')
      return response.data.is_active
    } catch (error: unknown) {
      const err = api.formErrors(error)
      if (err && 'message' in err) {
        toast.add(String(err.message))
      }
      return null
    }
  }

  return { toggle }
}
