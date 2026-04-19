import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApi, useApiToken } from '@/functions/api'
import { useInitApp } from '@/models/app'
import { useAuthStore } from '@/stores/auth'

interface ApiExtended {
  POST: <T>(url: string, data?: object) => Promise<T>
  formErrors: (error: unknown) => FormError
}

interface AuthStoreExtended {
  $reset: () => void
  setAuthenticated: (value: number) => void
}

export function useAuthLogin() {
  const router = useRouter()
  const api = useApi() as unknown as ApiExtended
  const { setToken } = useApiToken()
  const { init } = useInitApp()

  const form = reactive({
    username: '',
    password: '',
    remember: true,
  })
  const submitting = ref(false)
  const errors = ref<FormError>({})

  const submit = async () => {
    try {
      submitting.value = true
      errors.value = {}
      const response = await api.POST<{ token: string }>('login', form)
      setToken(response.token)
      await init()
      await router.push({ name: 'dashboard' })
    } catch (error) {
      console.log('error', error)
      errors.value = api.formErrors(error)
      submitting.value = false
    } finally {
      submitting.value = false
    }
  }

  return { form, submitting, errors, submit }
}

export function useAuthLogout() {
  const router = useRouter()
  const api = useApi() as unknown as ApiExtended
  const auth = useAuthStore() as unknown as AuthStoreExtended

  return () => {
    router.push({ name: 'login' })
    api.POST('auth/logout')
    auth.$reset()
    auth.setAuthenticated(0)
  }
}
