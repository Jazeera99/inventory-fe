import { reactive, ref } from 'vue'
import { useApi } from '@/functions/api'
import router from '@/router'

export function useStockTransactionCreate(
  defaultType: 'IN' | 'OUT' | 'MOVE' | 'ADJUSTMENT' = 'IN',
) {
  const api = useApi()
  const submitting = ref(false)
  const errors = ref<FormError>({})

  const showFefoModal = ref(false)
  const fefoRecommendations = ref<any[]>([])

  const createInitialState = () => ({
    type: defaultType,
    date: '',
    items: [
      {
        product_sku: '',
        qty: 1,
        rack_id: null,
        target_rack_id: null,
        expired_at: '',
        notes: '',
        isValid: false,
        namaProduk: '',
        isEvacuation: false,
      },
    ],
  })

  const form = reactive<StockTransactionFormData>(createInitialState() as any)

  // FUNGSI RESET: Menghapus data lama dan mengisi dengan data awal
  const resetForm = () => {
    const freshState = createInitialState()
    form.type = freshState.type
    form.date = freshState.date

    form.items.splice(0, form.items.length, ...freshState.items)

    errors.value = {}
  }

  const addItem = () => {
    form.items.push({
      product_sku: '',
      qty: 1,
      rack_id: null,
      target_rack_id: null,
      expired_at: '',
      notes: '',
      isValid: false,
      namaProduk: '',
      isEvacuation: false,
    })
  }

  const removeItem = (index: number) => {
    if (form.items.length > 1) {
      form.items.splice(index, 1)
    }
  }

  const normalizeExpiredAt = (expiredAt: any) => {
    if (!expiredAt) return ''
    const raw = String(expiredAt).trim()

    // Jika ada jam/huruf 'T' atau spasi, ambil hanya bagian YYYY-MM-DD nya
    if (raw.includes('T')) {
      return raw.split('T')[0]
    }
    if (raw.includes(' ')) {
      return raw.split(' ')[0]
    }

    return raw
  }

  const alihkanKePindahProduk = () => {
    const dataPindah = fefoRecommendations.value.map((item) => ({
      product_sku: item.product_sku,
      qty: item.recommended_move_qty,
      expired_at: item.expired_at,
      expired_at_raw: item.expired_at_raw,
      from_rack_id: item.current_rack_id,
      from_rack_code: item.current_rack_code,
      target_rack_id: 1, // TODO: Sesuaikan dengan ID Loading Dock (LD-01) Anda di database
    }))

    // Simpan sementara di localStorage agar bisa dibaca saat halaman Pindah Produk di-load
    localStorage.setItem('pending_evacuation_items', JSON.stringify(dataPindah))
    showFefoModal.value = false

    // Redirect ke halaman Pindah Produk (sesuaikan route menu Anda)
    router.push({ path: 'pindah-produk', query: { from_trigger: 'OUT' } })
  }

  const submitForm = async (isForce: boolean = false) => {
    try {
      submitting.value = true
      errors.value = {}

      if (form.type === 'OUT') {
        const payloadCheck = {
          items: form.items.map((item) => ({
            product_sku: item.product_sku,
            qty: parseInt(item.qty as any),
          })),
        }

        const checkRes = await api.POST<any>('admin/stock-transactions/check-fefo', payloadCheck)

        // Jika server mendeteksi butuh evakuasi rak internal
        if (checkRes.data?.status === 'requires_evacuation') {
          fefoRecommendations.value = checkRes.data.fefo_suggestions
          showFefoModal.value = true // Nyalakan flag untuk menampilkan modal di view
          submitting.value = false
          return false // Hentikan penyimpanan transaksi asli
        }
      }

      const payload = {
        ...form,
        items: form.items.map((item) => ({
          ...item,
          expired_at: normalizeExpiredAt(item.expired_at),
        })),
        force: isForce, // Ini akan mengirimkan { ..., force: true/false } ke API Backend Anda
      }

      const response = await api.POST<ApiResource<StockTransaction>>(
        'admin/stock-transactions',
        payload,
      )

      if (form.type === 'OUT') {
        router.push('produk-keluar')
      }

      return response.data
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
    addItem,
    removeItem,
    resetForm,
    showFefoModal,
    fefoRecommendations,
    alihkanKePindahProduk,
  }
}

export function useStockTransactionList() {
  const api = useApi()
  const transactions = ref<StockTransaction[]>([])
  const loading = ref(false)
  const meta = ref<any>(null)

  const getData = async (params: any = {}) => {
    try {
      loading.value = true
      const response = await api.GET<ApiCollection<StockTransaction>>(
        'admin/stock-transactions',
        params,
      )
      transactions.value = response.data
      meta.value = response.meta
    } finally {
      loading.value = false
    }
  }

  const cancelTransaction = async (transactionNo: string) => {
    try {
      loading.value = true
      // Menembak endpoint soft delete Laravel
      const response = await api.DELETE<any>(`admin/stock-transactions/${transactionNo}`)
      return response
    } catch (error) {
      console.error('Gagal membatalkan transaksi:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return { transactions, loading, meta, getData, cancelTransaction }
}

export function useStockTransactionShow() {
  const api = useApi()
  const transaction = ref<StockTransaction | null>(null)
  const loading = ref(false)

  const getDetail = async (transactionNo: string) => {
    try {
      loading.value = true
      const response = await api.GET<ApiResource<StockTransaction>>(
        `admin/stock-transactions/${transactionNo}`,
      )
      transaction.value = response.data
    } finally {
      loading.value = false
    }
  }

  return { transaction, loading, getDetail }
}
