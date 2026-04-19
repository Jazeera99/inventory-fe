import type { AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { useRouter } from 'vue-router'
// Pastikan path ini benar di project kamu, atau hapus jika tidak ada
// import { isOnGuestPage } from '@/models/app'

export const useApiToken = () => {
  const KEY = 'api_token'
  const getToken = () => localStorage.getItem(KEY) ?? ''
  const setToken = (token: string) => localStorage.setItem(KEY, token)
  const removeToken = () => localStorage.removeItem(KEY)

  return { getToken, setToken, removeToken }
}

export const useApi = () => {
  const router = useRouter()
  const { getToken } = useApiToken()

  const config: () => AxiosRequestConfig = () => ({
    // Mengambil URL dari .env (VITE_BASE_API=http://localhost:8000/api)
    baseURL: import.meta.env.VITE_BASE_API || 'http://inventory-api.test/api',
    timeout: 300000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
  })

  const REQUEST = async <T>(conf: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await axios.request({ ...config(), ...conf })
      // Karena backend Laravel kamu return { data: ... }, kita ambil .data nya
      return response.data
    } catch (error: any) {
      // Penanganan error simpel jika toast store belum siap
      if (error.response?.status === 401) router.push({ name: 'login' })
      return Promise.reject(error)
    }
  }

  const formErrors = (error: any) => {
    if (error.response && error.response.status === 422) {
      return error.response.data.errors
    }
    return {}
  }

  return {
    GET: <T>(url: string, params = {}) => REQUEST<T>({ method: 'get', url, params }),
    POST: <T>(url: string, data: object = {}) => REQUEST<T>({ method: 'post', url, data }),
    PUT: <T>(url: string, data: object) => REQUEST<T>({ method: 'put', url, data }),
    DELETE: <T>(url: string, data = {}) => REQUEST<T>({ method: 'delete', url, data }),
    PATCH: <T>(url: string, data: object = {}) => REQUEST<T>({ method: 'patch', url, data }),
    formErrors,
  }
}
