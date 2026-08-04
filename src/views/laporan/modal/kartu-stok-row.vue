<script setup lang="ts">
defineProps<{ item: StockLedgerItem }>()

const tipeClass = (t: string) => {
  // Sesuai dengan tipe di Backend: IN, OUT, MOVE, ADJUSTMENT
  if (t === 'IN') return 'bg-blue-50 text-blue-700 border-blue-100'
  if (t === 'OUT') return 'bg-red-50 text-red-700 border-red-100'
  if (t === 'MOVE') return 'bg-purple-50 text-purple-700 border-purple-100'
  return 'bg-amber-50 text-amber-700 border-amber-100'
}

const isExpiringSoon = (date: string | null) => {
  if (!date) return false
  const exp = new Date(date).getTime()
  const now = new Date().getTime()
  return exp - now < 90 * 24 * 60 * 60 * 1000
}
</script>

<template>
  <tr class="border-b last:border-0 hover:bg-gray-50/50 transition-colors group">
    <td class="px-6 py-4 text-[11px] font-mono font-bold text-gray-400 italic">
      {{ item.date }}
    </td>
    <td class="px-6 py-4 text-xs font-black text-gray-900 tracking-tight">
      {{ item.transaction_no }}
    </td>
    <td class="px-6 py-4">
      <span :class="['px-2 py-1 rounded-md text-[10px] font-black border', tipeClass(item.type)]">
        {{ item.type }}
      </span>
    </td>
    <td class="px-6 py-4">
      <p class="text-xs font-bold text-gray-800">{{ item.lokasi }}</p>
      <div class="flex items-center gap-1 mt-0.5">
        <span
          class="w-2 h-2 rounded-full bg-red-400 animate-pulse"
          v-if="item.expired_at && isExpiringSoon(item.expired_at)"
        ></span>
        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
          Exp: <span class="text-gray-600">{{ item.expired_at }}</span>
        </p>
      </div>
    </td>
    <td class="px-6 py-4 text-right font-black text-blue-600 text-sm">
      {{ item.masuk > 0 ? '+' + item.masuk : '-' }}
    </td>
    <td class="px-6 py-4 text-right font-black text-red-500 text-sm">
      {{ item.keluar > 0 ? '-' + item.keluar : '-' }}
    </td>
    <td class="px-6 py-4 text-right">
      <span
        class="bg-gray-900 text-white px-3 py-1 rounded-lg font-mono text-xs font-bold shadow-sm"
      >
        {{ item.saldo }}
      </span>
    </td>
    <td class="px-6 py-4">
      <div class="flex items-center gap-2">
        <span class="text-[11px] font-bold text-gray-600">{{ item.user }}</span>
      </div>
    </td>
  </tr>
</template>
