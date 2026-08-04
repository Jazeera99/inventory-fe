import { reactive, ref } from 'vue'
import { useApi } from '@/functions/api'

export function useRackList() {
  const api = useApi()
  const racks = ref<Rack[]>([])
  const loading = ref(false)
  const meta = ref<any>(null)

  const getData = async (params: { search?: string } = {}) => {
    try {
      loading.value = true

      const queryParams = new URLSearchParams()
      if (params.search) {
        queryParams.append('search', params.search)
      }

      const response = await api.GET<ApiCollection<Rack>>(`admin/racks?${queryParams.toString()}`)
      racks.value = response.data
      meta.value = response.meta
    } finally {
      loading.value = false
    }
  }

  return {
    getData,
    loading,
    racks,
    meta,
  }
}

export function useRackCreate() {
  const api = useApi()
  const submitting = ref(false)
  const errors = ref<FormError>({})
  const form = reactive<RackFormData>({
    rack_name: '',
    column_number: 1,
    level_number: 1,
    location_code: '',
    capacity: 15,
  })

  const submitForm = async () => {
    try {
      submitting.value = true
      errors.value = {}
      return await api.POST<ApiResource<Rack>>('admin/racks', form)
    } catch (error) {
      errors.value = api.formErrors(error)
      throw error
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

export function useRackUpdate() {
  const api = useApi()
  const submitting = ref(false)
  const errors = ref<FormError>({})
  const form = reactive<RackFormData>({
    rack_name: '',
    column_number: 1,
    level_number: 1,
    location_code: '',
    capacity: 100,
  })

  const setFormValue = (rak: Rack) => {
    form.rack_name = rak.rack_name
    form.column_number = rak.column_number
    form.level_number = rak.level_number
    form.location_code = rak.location_code
    form.capacity = rak.capacity
  }

  const submitUpdate = async (id: number) => {
    try {
      submitting.value = true
      errors.value = {}
      return await api.PUT<ApiResource<Rack>>(`admin/racks/${id}`, form)
    } catch (error) {
      errors.value = api.formErrors(error)
      throw error
    } finally {
      submitting.value = false
    }
  }
  return { form, errors, submitting, setFormValue, submitUpdate }
}

export function useRackBulkGenerate() {
  const api = useApi()
  const submitting = ref(false)
  const errors = ref<FormError>({})
  const form = reactive<RackBulkGeneratePayload>({
    rack_name: '',
    total_column: 1,
    total_level: 1,
    capacity: 15,
  })

  const submitGenerate = async () => {
    try {
      submitting.value = true
      errors.value = {}
      return await api.POST('admin/racks/generate', form)
    } catch (error) {
      errors.value = api.formErrors(error)
      throw error
    } finally {
      submitting.value = false
    }
  }

  return {
    form,
    errors,
    submitting,
    submitGenerate,
  }
}

export function useRackToggle() {
  const api = useApi()
  const toggling = ref(false)

  const submitToggle = async (id: number) => {
    try {
      toggling.value = true
      const response = await api.PATCH<ApiResource<Rack>>(`admin/racks/${id}/toggle-maintenance`)
      return response
    } finally {
      toggling.value = false
    }
  }

  return {
    toggling,
    submitToggle,
  }
}

export function useRackRecommendations() {
  const api = useApi()
  const recommendedRacks = ref<Rack[]>([])
  const loading = ref(false)

  const fetchRecommendations = async (
    qtyNeeded: number,
    currentRackId?: number,
    formItems: any[] = [],
  ) => {
    try {
      loading.value = true

      // Menyusun query parameter URL
      const response = await api.POST<{ status: string; data: Rack[] }>(
        'admin/racks/recommendations',
        {
          qty_needed: qtyNeeded,
          current_rack_id: currentRackId || null,
          form_items: formItems,
        },
      )

      recommendedRacks.value = response.data
      return response.data
    } catch (error) {
      console.error('Gagal mengambil rekomendasi rak:', error)
      recommendedRacks.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    recommendedRacks,
    loading,
    fetchRecommendations,
  }
}

export function useRackEvacuation() {
  const api = useApi()
  const loading = ref(false)

  const fetchEvacuationContents = async (rackId: number) => {
    try {
      loading.value = true
      const response = await api.GET<{ status: string; source_rack_code: string; items: any[] }>(
        `admin/racks/${rackId}/evacuation-contents`,
      )
      return response
    } catch (error) {
      console.error('Gagal mengambil isi rak untuk evakuasi:', error)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    fetchEvacuationContents,
  }
}
