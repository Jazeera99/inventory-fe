import { ref, reactive } from 'vue'
import { useApi } from '@/functions/api'
import { useToastStore } from '@/stores/toast'

export function useCustomerList() {
  const api = useApi()
  const customers = ref<Customer[]>([])
  const loading = ref(false)

  const getData = async (params = {}) => {
    try {
      loading.value = true
      const response = await api.GET<ApiCollection<Customer>>('admin/customers', params)
      customers.value = response.data
    } finally {
      loading.value = false
    }
  }

  return { customers, loading, getData }
}

export function useCustomerCreate() {
  const api = useApi()
  const errors = ref<FormError>({})
  const submitting = ref(false)
  const form = reactive<CustomerFormData>({
    customer_name: '',
    phone: '',
    address: '',
  })

  const submitForm = async () => {
    try {
      submitting.value = true
      errors.value = {}
      return await api.POST<ApiResource<Customer>>('admin/customers', form)
    } catch (error) {
      errors.value = api.formErrors(error)
    } finally {
      submitting.value = false
    }
  }

  return { form, errors, submitting, submitForm }
}

export function useCustomerEdit() {
  const api = useApi()
  const errors = ref<FormError>({})
  const submitting = ref(false)
  const form = reactive<CustomerFormData>({
    customer_name: '',
    phone: '',
    address: '',
  })

  const submitForm = async (id: number) => {
    try {
      submitting.value = true
      errors.value = {}
      return await api.PUT<ApiResource<Customer>>(`admin/customers/${id}`, form)
    } catch (error) {
      errors.value = api.formErrors(error)
    } finally {
      submitting.value = false
    }
  }

  return { form, errors, submitting, submitForm }
}

export function useCustomerToggle() {
  const api = useApi()
  const toast = useToastStore()

  const toggle = async (id: number) => {
    try {
      const response = await api.PATCH<ApiResource<Customer>>(`admin/customers/${id}/toggle-active`)
      toast.add('Status pelanggan berhasil diperbarui')
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
