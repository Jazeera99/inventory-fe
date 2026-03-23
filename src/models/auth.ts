import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApi, useApiToken } from '@/functions/api'
import { useInitApp } from '@/models/app'
import { useAuthStore } from '@/stores/auth'

export function useAuthLogin() {
  const api = useApi()
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
      const response = await api.POST<{ token: string }>('auth/login', form)
      setToken(response.token)
      await init() // let init do the redirect to home
    } catch (error) {
      console.log('error', error)
      errors.value = api.formErrors(error)
      submitting.value = false
    }
  }

  return {
    form,
    submitting,
    errors,
    submit,
  }
}

export function useAuthLogout() {
  const router = useRouter()
  const api = useApi()
  const auth = useAuthStore()

  return () => {
    router.push({ name: 'login' })
    api.POST('auth/logout')
    auth.$reset()
    auth.setAuthenticated(0)
  }
}
