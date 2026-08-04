import { ref } from 'vue'
import { useApi } from '@/functions/api'

export function useStockLedger() {
  const api = useApi()
  const ledgerData = ref<StockLedgerItem[]>([])
  const metaData = ref<StockLedgerMeta | null>(null)
  const expiredOptions = ref<string[]>([])
  const loading = ref(false)
  const summaryData = ref<StockSummaryItem[]>([])

  // Ambil data utama Kartu Stok
  const fetchLedger = async (params: {
    sku: string
    expired_at?: string | null
    start_date?: string | null
    end_date?: string | null
  }) => {
    if (!params.sku) return

    try {
      loading.value = true
      const response = await api.GET<StockLedgerResponse>('admin/stock-ledger', params)
      ledgerData.value = response.data
      metaData.value = response.meta
    } finally {
      loading.value = false
    }
  }

  // Ambil daftar tanggal expired yang tersedia untuk dropdown
  const fetchExpiredOptions = async (sku: string) => {
    try {
      const response = await api.GET<string[]>('admin/stock-ledger/expired-options', { sku })
      expiredOptions.value = response
    } catch (error) {
      console.error('Gagal ambil opsi expired', error)
    }
  }

  const fetchSummary = async (params: { start_date: string; end_date: string }) => {
    try {
      loading.value = true
      const response = await api.GET<StockSummaryResponse>('admin/stock-ledger/summary', params)
      summaryData.value = response.data
    } catch (error) {
      console.error('Gagal mengambil ringkasan mutasi stok', error)
    } finally {
      loading.value = false
    }
  }

  return {
    ledgerData,
    metaData,
    expiredOptions,
    loading,
    summaryData,
    fetchLedger,
    fetchExpiredOptions,
    fetchSummary,
  }
}
