import { ref, reactive } from 'vue'
import { useApi } from '@/functions/api'
import { useToastStore } from '@/stores/toast'

export function useCategoryList() {
  const api = useApi()
  const categories = ref<Category[]>([])
  const loading = ref(false)

  const getData = async (params = {}) => {
    try {
      loading.value = true
      const response = await api.GET<ApiCollection<Category>>('admin/categories', params)
      categories.value = response.data
    } finally {
      loading.value = false
    }
  }

  return { categories, loading, getData }
}

export function useCategoryCreate() {
  const api = useApi()
  const errors = ref<FormError>({})
  const submitting = ref(false)
  const form = reactive({
    category_name: '',
    description: '',
  })

  const submitForm = async () => {
    try {
      submitting.value = true
      return await api.POST<ApiResource<Category>>('admin/categories', form)
    } catch (error) {
      errors.value = api.formErrors(error)
    } finally {
      submitting.value = false
    }
  }

  return { form, errors, submitting, submitForm }
}

export function useCategoryEdit() {
  const api = useApi()
  const errors = ref<FormError>({})
  const submitting = ref(false)
  const form = reactive({
    category_name: '',
    description: '',
  })

  const submitForm = async (id: number) => {
    try {
      submitting.value = true
      return await api.PUT<ApiResource<Category>>(`admin/categories/${id}`, form)
    } catch (error) {
      errors.value = api.formErrors(error)
    } finally {
      submitting.value = false
    }
  }

  return { form, errors, submitting, submitForm }
}

export function useCategoryToggle() {
  const api = useApi()
  const toast = useToastStore()

  const toggle = async (id: number) => {
    try {
      const response = await api.PATCH<ApiResource<Category>>(
        `admin/categories/${id}/toggle-active`,
      )
      toast.add('Status kategori berhasil diperbarui')
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
