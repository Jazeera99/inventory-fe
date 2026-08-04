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
  setUser: (user: any) => void
  setAuthenticated: (value: number) => void
}

export function useAuthLogin() {
  const router = useRouter()
  const api = useApi() as unknown as ApiExtended
  const { setToken } = useApiToken()
  const { init } = useInitApp()
  const auth = useAuthStore() as unknown as AuthStoreExtended

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
      const response = await api.POST<{ token: string; user: any }>('login', form)
      setToken(response.token)
      localStorage.setItem('token', response.token)
      if (response.user) {
        auth.setUser(response.user)
        // Cadangan opsional agar jika di-refresh halaman, data tidak hilang seketika
        localStorage.setItem('user', JSON.stringify(response.user))
      }
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
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }
}
