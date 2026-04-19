import { reactive, ref } from 'vue'
import { useApi } from '@/functions/api'

export function useRoleList() {
  const api = useApi()
  const roles = ref<Role[]>([])
  const loading = ref(false)

  const getData = async () => {
    try {
      loading.value = true
      const response = await api.GET<ApiCollection<Role>>('admin/roles')
      roles.value = response.data
    } finally {
      loading.value = false
    }
  }

  return {
    getData,
    loading,
    roles,
  }
}

export function useRoleCreate() {
  const api = useApi()
  const submitting = ref(false)
  const errors = ref<FormError>({})
  const form = reactive({
    role_name: '',
    permissions: [] as string[],
  })

  const submitForm = async () => {
    try {
      submitting.value = true
      return await api.POST<ApiResource<Role>>('admin/roles', form)
    } catch (error) {
      errors.value = api.formErrors(error)
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

export function useRoleEdit() {
  const api = useApi()
  const submitting = ref(false)
  const errors = ref<FormError>({})
  const form = reactive({
    role_name: '',
    permissions: [] as string[],
  })

  const submitForm = async (id: number) => {
    try {
      submitting.value = true
      return await api.PUT<ApiResource<Role>>(`admin/roles/${id}`, form)
    } catch (error) {
      errors.value = api.formErrors(error)
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

export function useRoleDelete() {
  const api = useApi()
  const submitting = ref(false)
  const errors = ref<FormError>({})

  const submitDelete = async (id: number) => {
    try {
      submitting.value = true
      await api.DELETE(`admin/roles/${id}`)
      return id
    } catch (error) {
      errors.value = api.formErrors(error)
    } finally {
      submitting.value = false
    }
  }

  return {
    errors,
    submitting,
    submitDelete,
  }
}
