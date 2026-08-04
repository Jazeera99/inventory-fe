<script setup lang="ts">
import { computed } from 'vue'
// Kita import langsung utility date kustom Anda untuk memastikan bypass format sukses
import fmtDate from '@/functions/fmt/date'

const props = defineProps({
  show: Boolean,
  recommendations: {
    type: Array as () => any[],
    default: () => [],
  },
})

defineEmits(['close', 'evacuate'])

// Menentukan teks peringatan yang tegas & dinamis berdasarkan isi data dari backend
const computedAlertMessage = computed(() => {
  if (!props.recommendations.length) return ''

  const hasFefoIssue = props.recommendations.some(
    (item) => String(item.reason).includes('FEFO') || String(item.reason).includes('Expired'),
  )
  const hasShortageIssue = props.recommendations.some(
    (item) =>
      String(item.reason).includes('tidak mencukupi') || String(item.reason).includes('kurang'),
  )

  if (hasFefoIssue && hasShortageIssue) {
    return 'Sistem mendeteksi bahwa stok di Loading Dock saat ini kurang, DAN terdapat stok di Rak Internal yang memiliki tanggal expired lebih dekat (Wajib mengikuti aturan FEFO).'
  } else if (hasFefoIssue) {
    return 'Sistem mendeteksi adanya stok barang di Rak Internal yang memiliki tanggal kedaluwarsa lebih mendesak (Lebih tua) dibanding stok di Loading Dock saat ini. Anda wajib mengeluarkan produk ini terlebih dahulu sesuai aturan FEFO.'
  } else {
    return 'Stok yang mengendap di lokasi utama (Loading Dock) saat ini tidak mencukupi kuantitas permintaan pengeluaran Anda. Silakan tarik tambahan stok dari rak internal berikut.'
  }
})
</script>

<template>
  <div v-if="show" class="fefo-custom-overlay" id="fefoModalWrapper">
    <div class="fefo-custom-card">
      <div class="fefo-custom-header bg-warning text-dark">
        <h5 class="fw-bold d-flex align-items-center gap-2 m-0" style="font-size: 1.1rem">
          <span>⚠️</span> Peringatan Kritis Prioritas Stok (FEFO)
        </h5>
        <button type="button" class="fefo-close-btn" @click="$emit('close')">&times;</button>
      </div>

      <div class="fefo-custom-body text-start">
        <div
          class="alert alert-danger border-0 bg-danger-subtle text-danger-emphasis p-3 rounded-3 mb-4 small fw-medium"
        >
          ℹ️ {{ computedAlertMessage }}
        </div>

        <p class="text-secondary small mb-3">
          Silakan lakukan evakuasi/pemindahan produk-produk di bawah ini menuju ke
          <strong>Loading Dock</strong> terlebih dahulu sebelum melanjutkan transaksi:
        </p>

        <div class="table-responsive rounded-3 border border-light-subtle shadow-sm bg-white">
          <table class="table table-hover align-middle mb-0 text-sm">
            <thead class="table-light text-secondary small text-uppercase font-bold tracking-wider">
              <tr>
                <th class="ps-3 py-3">Produk / SKU</th>
                <th class="text-center py-3">Rak Asal</th>
                <th class="text-center py-3">Tgl Expired</th>
                <th class="text-center py-3">Rekomendasi Pindah</th>
                <th class="pe-3 py-3">Alasan Sistem</th>
              </tr>
            </thead>
            <tbody class="small">
              <tr v-for="(item, idx) in recommendations" :key="idx" class="align-middle">
                <td class="ps-3 py-3">
                  <div class="fw-bold text-dark text-truncate" style="max-width: 220px">
                    {{ item.product_name || 'Produk Tanpa Nama' }}
                  </div>
                  <code class="text-muted text-xs font-monospace bg-light px-1 py-0.5 rounded">
                    {{ item.product_sku }}
                  </code>
                </td>
                <td class="text-center py-3">
                  <span
                    class="badge bg-warning-subtle text-warning-emphasis border border-warning px-2 py-1 font-monospace fw-bold"
                  >
                    {{ item.current_rack_code }}
                  </span>
                </td>
                <td class="text-center text-nowrap font-monospace fw-medium text-secondary py-3">
                  {{
                    item.expired_at ? fmtDate.date(new Date(item.expired_at), 'dd MMM yyyy') : '-'
                  }}
                </td>
                <td class="text-center fw-bold text-danger py-3">
                  <span class="fs-5">{{ item.recommended_move_qty }}</span>
                  <span class="text-muted small fw-normal"> / {{ item.available_qty }}</span>
                </td>
                <td class="pe-3 py-3">
                  <span
                    :class="[
                      String(item.reason).includes('FEFO') ||
                      String(item.reason).includes('Expired')
                        ? 'bg-danger text-white'
                        : 'bg-primary text-white',
                      'px-2 py-1 rounded text-2xs fw-bold shadow-sm',
                    ]"
                    style="font-size: 11px"
                  >
                    {{ item.reason }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="fefo-custom-footer bg-light">
        <button
          type="button"
          class="btn btn-outline-secondary px-3 py-2 small fw-bold"
          @click="$emit('close')"
        >
          Batal
        </button>
        <button
          type="button"
          class="btn btn-warning px-4 py-2 fw-black text-dark shadow-sm d-flex align-items-center gap-1"
          style="font-weight: 800"
          @click="$emit('evacuate', recommendations)"
        >
          🚚 Pindahkan Produk ke LD Sekarang
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Pemaksaan CSS khusus agar terbebas dari jeratan bug backdrop gelap gulita */
.fefo-custom-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background-color: rgba(0, 0, 0, 0.45) !important; /* Transparansi abu-abu transparan cantik */
  backdrop-filter: blur(5px) !important;
  -webkit-backdrop-filter: blur(5px) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 999999 !important; /* Menjamin modal berada paling depan di atas form adjustment */
  padding: 1rem;
}

.fefo-custom-card {
  background: #ffffff !important;
  border-radius: 12px !important;
  width: 100% !important;
  max-width: 780px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: fadeInModal 0.2s ease-out;
}

.fefo-custom-header {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fefo-close-btn {
  background: transparent;
  border: 0;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  color: inherit;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s ease;
  padding: 0;
}
.fefo-close-btn:hover {
  opacity: 1;
}

.fefo-custom-body {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.fefo-custom-footer {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.text-2xs {
  font-size: 10px;
}

@keyframes fadeInModal {
  from {
    transform: scale(0.96);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
