import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { UnauthenticatedException, useApi } from '@/functions/api'
import { useAuthStore } from '@/stores/auth'

export function useInitApp() {
  type AppInitResponse = {
    user: AuthenticatedUser
  }

  const route = useRoute()
  const router = useRouter()

  const api = useApi()
  const auth = useAuthStore()

  const init = async () => {
    try {
      const response = await api.GET<AppInitResponse>('spg/init')
      auth.setUser(response.user)
    } catch (error) {
      if (error instanceof UnauthenticatedException) {
        return
      }
    }

    if (isOnGuestPage(route.name as string)) {
      await router.replace('/' + (route.query.r ?? ''))
    }
    auth.setAuthenticated(1)
  }

  return {
    init,
  }
}

// route where authenticated user should not be able to access
export function isOnGuestPage(routeName: string) {
  return ['login'].includes(routeName)
}
