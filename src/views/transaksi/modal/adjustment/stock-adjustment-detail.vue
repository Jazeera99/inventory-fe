<script setup lang="ts">
import fmtDate from '@/functions/fmt/date'
// Props untuk menerima data transaksi yang dipilih
defineProps<{
  trx: any
}>()

// Emit untuk memberitahu parent kalau user klik tombol kembali
defineEmits(['close'])

const formatDate = (date: string) => {
  if (!date) return '-'
  return date // Atau gunakan library format tanggal kamu
}
</script>

<template>
  <div class="animate-fade-in space-y-6">
    <div class="flex items-center justify-between">
      <button
        @click="$emit('close')"
        class="flex items-center text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
      >
        <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Kembali ke Daftar
      </button>

      <span
        class="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100"
      >
        DETAIL TRANSAKSI
      </span>
    </div>

    <div class="bg-white rounded-xl shadow-sm border p-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-15">
        <div>
          <p class="text-[10px] text-gray-400 uppercase font-bold tracking-widest">No. Transaksi</p>
          <p class="text-lg font-black text-indigo-900">{{ trx.transaction_no }}</p>
        </div>
        <div>
          <p class="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Waktu Dibuat</p>
          <p class="text-gray-700 font-medium">
            {{ trx.created_at ? fmtDate.date(new Date(trx.created_at), 'dd MMMM yyyy') : '-' }}
          </p>
        </div>
        <div>
          <p class="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
            Operator / User
          </p>
          <div class="flex items-center gap-2 mt-1">
            <!-- <div
              class="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600"
            >
              {{ trx.user_name?.substring(0, 2).toUpperCase() }}
            </div> -->
            <span class="text-gray-700 font-medium">{{ trx.user_name }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div class="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 class="font-bold text-gray-700">Rincian Perubahan Stok</h3>
        <span class="text-xs text-gray-500 font-medium">{{ trx.items?.length }} Items</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-50 text-[10px] uppercase text-gray-400 font-bold border-b">
            <tr>
              <th class="px-6 py-3">Produk</th>
              <th class="px-6 py-3">Lokasi / Rak</th>
              <th class="px-6 py-3">Expired</th>
              <th class="px-6 py-3 text-right">Qty Penyesuaian</th>
              <th class="px-6 py-3">Catatan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="item in trx.items"
              :key="item.id"
              class="text-sm hover:bg-gray-50/50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="font-bold text-gray-800">{{ item.product_sku }}</div>
                <div class="text-[11px] text-gray-400 leading-tight">{{ item.product_name }}</div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-600 border border-gray-200"
                >
                  {{ item.rack_name }}
                </span>
              </td>
              <td class="px-6 py-4 text-gray-500 font-medium text-xs">
                {{ item.expired_at ? fmtDate.date(new Date(item.expired_at), 'dd MMM yyyy') : '-' }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex flex-col items-end">
                  <span
                    :class="
                      trx.jenis === 'MASUK' || trx.type === 'IN' ? 'text-green-600' : 'text-red-600'
                    "
                    class="font-bold text-base"
                  >
                    {{ trx.jenis === 'MASUK' || trx.type === 'IN' ? '+' : '-'
                    }}{{ Math.abs(item.qty) }}
                  </span>
                  <span class="text-[10px] text-gray-400">Total Akhir: {{ item.qty_after }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-gray-400 italic text-xs">
                {{ item.notes || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
