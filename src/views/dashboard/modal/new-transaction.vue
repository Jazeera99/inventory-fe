<script setup lang="ts">
defineProps<{
  data: any[]
  formatDate: (date: string) => string
  getIconBg: (tipe: string) => string
  getIconColor: (tipe: string) => string
  getIconPath: (tipe: string) => string
  getBadgeClass: (tipe: string) => string
}>()
</script>

<template>
  <div class="base-card text-left">
    <h3 class="text-lg font-semibold mb-4 text-gray-800">🔄 5 Transaksi Mutasi Terbaru</h3>
    <div class="overflow-x-auto">
      <table class="table w-full border-collapse">
        <thead>
          <tr class="border-b border-gray-200 bg-slate-50 text-gray-600 text-sm">
            <th class="p-3 text-left font-semibold">Waktu / Tipe</th>
            <th class="p-3 text-left font-semibold">Informasi Produk</th>
            <th class="p-3 text-right font-semibold">Jumlah (Qty)</th>
            <th class="p-3 text-left font-semibold">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in data"
            :key="item.id"
            class="border-b last:border-0 hover:bg-slate-50/50 transition"
          >
            <td class="p-3">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg" :class="getIconBg(item.tipe)">
                  <svg
                    class="w-5 h-5"
                    :class="getIconColor(item.tipe)"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-width="2" :d="getIconPath(item.tipe)" />
                  </svg>
                </div>
                <div>
                  <span
                    class="badge badge-sm font-bold block mb-0.5"
                    :class="getBadgeClass(item.tipe)"
                  >
                    {{ item.tipe }}
                  </span>
                  <span class="text-xs text-gray-400 block font-medium">{{
                    formatDate(item.tanggal)
                  }}</span>
                </div>
              </div>
            </td>
            <td class="p-3">
              <span class="font-bold text-sm text-slate-800 block">{{ item.sku }}</span>
              <span class="text-xs text-slate-500 block max-w-xs truncate">{{
                item.nama_produk || item.namaProduk
              }}</span>
            </td>
            <td class="p-3 text-right font-bold text-sm text-slate-700">{{ item.qty }}</td>
            <td class="p-3 text-sm text-gray-500 font-medium">
              {{ item.keterangan }}
            </td>
          </tr>
          <tr v-if="data.length === 0">
            <td colspan="4" class="p-6 text-center text-gray-400 font-medium">
              Belum ada riwayat mutasi stok hari ini.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
