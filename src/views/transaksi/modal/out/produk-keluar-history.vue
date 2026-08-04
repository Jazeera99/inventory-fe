<script setup lang="ts">
import AppTable from '@/components/app-table.vue'
import fmtDate from '@/functions/fmt/date'

defineProps<{
  data: any[]
  headers: any[]
  loading?: boolean
  currentTab?: 'active' | 'trash'
}>()

const getTotalQty = (trx: any) => {
  // 1. Jika backend sudah menyediakan field total_qty langsung
  if (trx.total_qty !== undefined && trx.total_qty !== null) {
    return trx.total_qty
  }

  // 2. Jika berbentuk relasi array (items atau details)
  const items = trx.items || trx.details || []
  if (Array.isArray(items)) {
    return items.reduce((sum: number, item: any) => sum + Number(item.qty || 0), 0)
  }

  return 0
}

const isToday = (dateString: string) => {
  if (!dateString) return false

  // Mengubah tanggal transaksi dan tanggal hari ini ke format string murni (e.g., "Fri May 22 2026")
  const dateToCheck = new Date(dateString).toDateString()
  const today = new Date().toDateString()

  return dateToCheck === today
}

defineEmits(['view-detail', 'cancel'])
</script>

<template>
  <div class="space-y-4">
    <div v-if="loading" class="flex justify-center py-10">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <AppTable v-else :headers="headers">
      <tr
        v-for="trx in data"
        :key="trx.transaction_no"
        class="hover:bg-gray-50 transition-colors text-sm"
      >
        <td class="px-6 py-4 font-bold text-gray-500 uppercase tracking-tighter">
          <button
            @click="$emit('view-detail', trx)"
            class="font-medium text-gray-500 hover:underline hover:text-blue-800"
          >
            {{ trx.transaction_no }}
          </button>
        </td>
        <!-- <td class="px-6 py-4">
          <div v-if="trx.items && trx.items.length">
            <div v-for="item in trx.items" :key="item.id" class="font-mono font-bold text-blue-600">
              {{ item.product_sku }}
            </div>
          </div>
          <div v-else class="text-gray-300 italic text-xs">No Items</div>
        </td> -->
        <!-- <td class="px-6 py-4 font-bold text-gray-900">
          <div v-for="item in trx.items" :key="item.id">{{ item.qty }}</div>
        </td> -->
        <td class="px-6 py-4 font-medium text-gray-500">
          {{ trx.created_at ? fmtDate.date(new Date(trx.created_at), 'dd MMMM yyyy') : '-' }}
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <!-- <div
              class="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase"
            >
              {{ trx.user_name.substring(0, 2) }}
            </div> -->
            <span class="font-medium text-gray-500">{{ trx.user_name || 'Admin' }}</span>
          </div>
        </td>

        <td v-if="currentTab === 'trash'" class="px-6 py-4">
          <span
            class="font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs border border-red-100"
          >
            {{ trx.deleted_by_name || 'System' }}
          </span>
        </td>

        <td class="px-6 py-4 text-gray-500">
          <span
            :class="[
              currentTab === 'trash'
                ? 'bg-red-50 text-red-700 border-red-100'
                : trx.type === 'OUT' || getTotalQty(trx) < 0
                  ? 'bg-orange-50 text-orange-700 border-orange-100' // Warna orange khas barang keluar
                  : 'bg-blue-50 text-blue-700 border-blue-100',
              'inline-flex items-center font-medium px-2.5 py-1 rounded-md border font-mono',
            ]"
          >
            <template v-if="currentTab === 'trash'"> - </template>
            <template v-else>
              {{ trx.type === 'OUT' || getTotalQty(trx) < 0 ? '-' : '+' }}
            </template>

            {{ Math.abs(getTotalQty(trx)) }}
          </span>
        </td>
        <td v-if="currentTab === 'active'" class="px-6 py-4 text-right">
          <button
            v-if="isToday(trx.created_at)"
            @click.stop="$emit('cancel', trx.transaction_no)"
            title="Batalkan Transaksi & Kembalikan Stok"
            class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all active:scale-95 group inline-flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="w-5 h-5 transition-transform group-hover:rotate-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>

          <div
            v-else
            title="Transaksi hari sebelumnya tidak dapat dibatalkan demi keamanan stok"
            class="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200 cursor-not-allowed select-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="w-3.5 h-3.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <span>Locked</span>
          </div>
        </td>
      </tr>
      <tr v-if="data.length === 0">
        <td :colspan="headers.length" class="px-6 py-10 text-center text-gray-400 italic">
          Data riwayat produk keluar tidak ditemukan.
        </td>
      </tr>
    </AppTable>
  </div>
</template>
