<template>
  <tr class="hover:bg-gray-50 transition-colors text-xs border-b">
    <td class="px-6 py-4 font-mono text-gray-500 italic">
      {{ formatDate(item.tanggal) }}
    </td>
    <td class="px-6 py-4 font-bold text-gray-900 uppercase">
      {{ item.noTransaksi }}
    </td>
    <td class="px-6 py-4">
      <span
        :class="[
          'px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter',
          tipeClass(item.tipe),
        ]"
      >
        {{ item.tipe }}
      </span>
    </td>
    <td class="px-6 py-4">
      <div class="flex items-center gap-2">
        <span class="p-1 bg-gray-100 rounded text-gray-600">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              stroke-width="2"
            />
          </svg>
        </span>
        <span class="font-mono text-gray-700 font-bold">{{ item.lokasi || 'N/A' }}</span>
      </div>
    </td>
    <td class="px-6 py-4 text-right font-bold text-blue-600">
      {{ item.quantity > 0 ? '+' + item.quantity : '-' }}
    </td>
    <td class="px-6 py-4 text-right font-bold text-red-500">
      {{ item.quantity < 0 ? Math.abs(item.quantity) : '-' }}
    </td>
    <td class="px-6 py-4 text-right">
      <div class="font-black text-gray-900 bg-gray-100 px-2 py-1 rounded inline-block min-w-[40px]">
        {{ item.balanceAfter }}
      </div>
    </td>
    <td class="px-6 py-4 text-gray-500 italic">
      {{ item.keterangan || '-' }}
    </td>
    <td class="px-6 py-4 text-center">
      <div class="flex items-center justify-center gap-1">
        <div
          class="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-700 font-bold uppercase"
        >
          {{ item.user.substring(0, 2) }}
        </div>
        <span class="text-xs font-medium text-gray-600">{{ item.user }}</span>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
defineProps<{ item: any }>()

const tipeClass = (tipe: string) => {
  const map: any = {
    MASUK: 'bg-blue-100 text-blue-700 border border-blue-200',
    KELUAR: 'bg-red-100 text-red-700 border border-red-200',
    ADJUSTMENT: 'bg-orange-100 text-orange-700 border border-orange-200',
    PINDAH: 'bg-purple-100 text-purple-700 border border-purple-200',
  }
  return map[tipe] || 'bg-gray-100 text-gray-700'
}

const formatDate = (date: any) => {
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
