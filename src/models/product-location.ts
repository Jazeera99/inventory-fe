import { ref } from 'vue'
import { useApi } from '@/functions/api'

export function useProductLocationList() {
  const api = useApi()
  const productLocations = ref<ProductLocation[]>([])
  const loading = ref(false)
  const meta = ref<any>(null)

  const getData = async () => {
    try {
      loading.value = true
      const response = await api.GET<ApiCollection<ProductLocation>>('admin/product-locations', {
        per_page: 'all',
      })
      productLocations.value = response.data
      meta.value = response.meta
    } finally {
      loading.value = false
    }
  }

  return { productLocations, loading, meta, getData }
}
