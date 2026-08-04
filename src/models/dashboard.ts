import { ref } from 'vue'
import { useApi } from '@/functions/api'

export function useDashboardSummary() {
  const api = useApi()
  const loading = ref(false)

  // Inisialisasi state awal sesuai tipe data d.ts
  const cards = ref({ totalProduk: 0, totalRak: 0, totalStok: 0, transaksiHariIni: 0 })
  const stokPerProduk = ref<DashboardStokProduk[]>([])
  const transaksiTerbaru = ref<DashboardTransaksi[]>([])
  const stokMenipis = ref<DashboardStokMenipis[]>([])

  const getSummary = async () => {
    try {
      loading.value = true
      // Memanggil endpoint admin/dashboard/summary
      const response = await api.GET<DashboardSummary>('admin/dashboard/summary')

      cards.value = response.cards
      stokPerProduk.value = response.stokPerProduk
      transaksiTerbaru.value = response.transaksiTerbaru
      stokMenipis.value = response.stokMenipis
    } catch (error) {
      console.error('Gagal mengambil data ringkaran dashboard:', error)
    } finally {
      loading.value = false
    }
  }

  return { cards, stokPerProduk, transaksiTerbaru, stokMenipis, loading, getSummary }
}
