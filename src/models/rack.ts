import { reactive, ref } from 'vue'
import { useApi } from '@/functions/api'

export function useRackList() {
  const api = useApi()
  const racks = ref<Rack[]>([])
  const loading = ref(false)
  const meta = ref<any>(null)

  const getData = async () => {
    try {
      loading.value = true
      const response = await api.GET<ApiCollection<Rack>>(`admin/racks`)
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

export function useRackBulkGenerate() {
  const api = useApi()
  const submitting = ref(false)
  const errors = ref<FormError>({})
  const form = reactive<RackBulkGeneratePayload>({
    rack_name: '',
    total_column: 1,
    total_level: 1,
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
      return response.data
    } finally {
      toggling.value = false
    }
  }

  return {
    toggling,
    submitToggle,
  }
}
