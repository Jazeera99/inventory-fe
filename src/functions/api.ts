import type { AxiosProgressEvent, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { isOnGuestPage } from '@/models/app'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

export const useApiToken = () => {
  const KEY = 'api_token'

  const getToken = () => localStorage.getItem(KEY) ?? 'empty'
  const setToken = (token: string) => {
    localStorage.setItem(KEY, token)
  }
  const removeToken = () => {
    localStorage.removeItem(KEY)
  }

  return {
    getToken,
    setToken,
    removeToken,
  }
}

export const useApi = () => {
  const route = useRoute()
  const router = useRouter()
  const toast = useToastStore()
  const auth = useAuthStore()

  const { getToken } = useApiToken()

  // let controller = new AbortController()
  const config: () => AxiosRequestConfig = () => ({
    baseURL: import.meta.env.VITE_BASE_API,
    timeout: 300000, // 300s / 5m
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
      Timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      Authorization: `Bearer ${getToken()}`,
    },
    // signal: controller.signal,
  })

  const REQUEST = async <T>(conf: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await axios.request({ ...config(), ...conf })
      return response.data
    } catch (error) {
      handleErrors(error)
      return Promise.reject(error)
    }
  }
  const GET = <T>(url: string, params = {}) => {
    return REQUEST<T>({ method: 'get', url, params })
  }
  const POST = <T>(url: string, data: object = {}) => {
    return REQUEST<T>({ method: 'post', url, data })
  }
  const PUT = <T>(url: string, data: object) => {
    return REQUEST<T>({ method: 'put', url, data })
  }
  const DELETE = <T>(url: string, data = {}) => {
    return REQUEST<T>({ method: 'delete', url, data })
  }
  const POSTFORMDATA = <T>(
    url: string,
    formData: FormData,
    onUploadProgress?: (event: AxiosProgressEvent) => void,
  ) => {
    return REQUEST<T>({
      headers: { ...config().headers, 'Content-Type': 'multipart/form-data' },
      method: 'post',
      url,
      data: formData,
      onUploadProgress,
    })
  }

  const onError = {
    unauthorized: () => {
      if (!isOnGuestPage(route.name as string)) {
        const path = route.fullPath.replace(/^\/+/, '')
        const query = path ? { r: path } : undefined
        router.replace({ name: 'login', query })
      }
      auth.setAuthenticated(0)
      throw new UnauthenticatedException()
    },
    notFound: () => {
      throw new NotFoundException()
    },
    validationFailed: (errors: FormError) => {
      toast.add('Terdapat kesalahan pada data yang dikirim')
      setTimeout(() => {
        const errorMessage = document.querySelector('.error-message')
        errorMessage?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      throw new ValidationErrorException(errors)
    },
    tooManyRequest: () => {
      toast.add('Terlalu banyak melakukan request, tunggu beberapa menit sebelum mencoba kembali')
    },
    internalServerError: () => {
      toast.add('Error pada sisi server, akan segera kami perbaiki')
    },
    networkError: () => {
      toast.add('Tidak terhubung dengan internet')
    },
  }

  /* https://github.com/axios/axios#handling-errors */
  const handleErrors = (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      /**
       * Not axios error
       * Something happened in setting up the request that triggered an Error
       */
      console.error('[NotAxiosError]', error)
      return
    }

    if (error.response) {
      /**
       * The request was made and the server responded with a
       * status code that falls out of the range of 2xx
       */
      switch (error.response.status) {
        case 401:
          onError.unauthorized()
          break
        case 403:
          router.replace({ name: 'forbidden' })
          break
        case 404:
          onError.notFound()
          break
        case 422:
          onError.validationFailed(error.response.data.errors)
          break
        case 429:
          onError.tooManyRequest()
          break
        case 500:
          onError.internalServerError()
          break
        default:
          break
      }
      if (error.message === 'Network Error') {
        onError.networkError()
      }
      console.error('[Axios error]', error)
      return 'AxiosError'
    }

    /**
     * The request was made but no response was received.
     * `error.request` is an instance of XMLHttpRequest
     * in the browser and an instance of
     * http.ClientRequest in node.js
     */
    // if (error.request) {
    // }
    console.error('[API] Axios error but no response', error)
    return
  }

  const formErrors = (error: unknown): FormError => {
    if (error instanceof ValidationErrorException) {
      return error.getErrors()
    }
    return {}
  }

  return {
    GET,
    POST,
    DELETE,
    PUT,
    REQUEST,
    POSTFORMDATA,
    config,
    formErrors,
    // abort: () => {
    //   controller.abort()
    //   controller = new AbortController()
    //   config.signal = controller.signal
    // },
  }
}

export class UnauthenticatedException extends Error {
  constructor() {
    super()
    this.name = 'UnauthenticatedException'
  }
}

export class ValidationErrorException extends Error {
  constructor(private errors: FormError) {
    super()
    this.name = 'ValidationErrorException'
  }
  getErrors() {
    return this.errors
  }
}

export class NotFoundException extends Error {
  constructor() {
    super()
    this.name = 'NotFoundException'
  }
}
