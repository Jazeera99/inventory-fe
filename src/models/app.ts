import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { useApi } from '@/functions/api'
import { useAuthStore } from '@/stores/auth'

export function useInitApp() {
  type AppInitResponse = {
    user: User
  }

  const route = useRoute()
  const router = useRouter()

  const api = useApi()
  const auth = useAuthStore()

  const init = async () => {
    try {
      const response = await api.GET<AppInitResponse>('auth/init')

      auth.setUser(response.user)

      auth.setAuthenticated(1)
    } catch (error: any) {
      if (error.response?.status === 401) {
        auth.setAuthenticated(0)
        return
      }
    }

    if (isOnGuestPage(route.name as string)) {
      await router.replace('/' + (route.query.r ?? ''))
    }
  }

  return {
    init,
  }
}

// route where authenticated user should not be able to access
export function isOnGuestPage(routeName: string) {
  return ['login'].includes(routeName)
}
