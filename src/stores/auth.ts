import { defineStore } from 'pinia'
import { useApi, useApiToken } from '@/functions/api'

type AuthState = {
  user: User | null
  token: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem('token'),
  }),
  actions: {
    setUser(user: User | null) {
      this.user = user
    },
    setAuthenticated(_value: number) {
      // Bisa diisi logic jika diperlukan nanti
    },

    async login(credentials: Record<string, string>) {
      const api = useApi()
      const { setToken } = useApiToken()

      try {
        const response = await api.POST<{ token: string; user: User }>('auth/login', credentials)

        this.token = response.token
        this.user = response.user

        localStorage.setItem('token', response.token)
        setToken(response.token)
      } catch (error) {
        console.error('Login failed:', error)
        throw error
      }
    },

    logout() {
      const { setToken } = useApiToken()
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      setToken('')
    },
  },
})
