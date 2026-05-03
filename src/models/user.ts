import { reactive, ref } from 'vue'
import { useApi } from '@/functions/api'
import { useToastStore } from '@/stores/toast'

export function useUserAdminList() {
  const api = useApi()
  const users = ref<User[]>([])
  const loading = ref(false)

  const getData = async (params = {}) => {
    try {
      loading.value = true
      const response = await api.GET<PaginatedResponse<User>>('admin/users', params)
      users.value = response.data
    } finally {
      loading.value = false
    }
  }

  return { users, loading, getData }
}

export function useUserAdminCreate() {
  const api = useApi()
  const errors = ref<FormError>({})
  const submitting = ref(false)
  const form = reactive<UserPayload>({
    username: '',
    full_name: '',
    password: '',
    role_id: 0,
  })

  const submitForm = async () => {
    try {
      submitting.value = true
      return await api.POST<ApiResource<User>>('admin/users', form)
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

export function useUserAdminEdit() {
  const api = useApi()
  const submitting = ref(false)
  const errors = ref<FormError>({})
  const form = reactive<UserPayload>({
    username: '',
    full_name: '',
    role_id: 0,
    password: '',
  })

  const submitForm = async (id: number) => {
    try {
      submitting.value = true
      return await api.PUT<ApiResource<User>>(`admin/users/${id}`, form)
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

export function useRoleList() {
  const api = useApi()
  const roles = ref<any[]>([])

  const getRoles = async () => {
    try {
      const response = await api.GET<any>('admin/roles')
      roles.value = response.data || response
      console.log('Roles fetched:', roles.value)
    } catch {
      console.error('Gagal mengambil role')
    }
  }

  return { roles, getRoles }
}

export function useUserAdminToggle() {
  const api = useApi()
  const toast = useToastStore()

  const toggle = async (id: number) => {
    try {
      const response = await api.PATCH<{ is_active: boolean; message: string }>(
        `admin/users/${id}/toggle-status`,
      )
      toast.add(response.message)
      return response.is_active
    } catch (error: unknown) {
      const err = api.formErrors(error)

      if (err && 'user' in err && err.user) {
        toast.add(String(err.user))
      }

      return null
    }
  }

  return { toggle }
}
