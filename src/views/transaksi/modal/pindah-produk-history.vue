<template>
  <div class="space-y-4">
    <AppTable :headers="headers">
      <tr v-for="trx in data" :key="trx.id" class="hover:bg-gray-50 transition-colors text-sm">
        <td class="px-6 py-4 font-bold text-gray-500 uppercase tracking-tighter">
          {{ trx.noTransaksi }}
        </td>
        <td class="px-6 py-4">
          <div
            v-for="item in trx.items"
            :key="item.produkSku"
            class="font-mono font-bold text-orange-600"
          >
            {{ item.produkSku }}
          </div>
        </td>
        <td class="px-6 py-4 font-bold">
          <div v-for="item in trx.items" :key="item.produkSku">{{ item.quantity }} pcs</div>
        </td>
        <td class="px-6 py-4">
          <div v-for="item in trx.items" :key="item.produkSku" class="text-xs">
            <span class="bg-gray-100 px-2 py-0.5 rounded border">{{ item.fromLokasi }}</span>
            <span class="mx-1 text-gray-400">➔</span>
            <span
              class="bg-orange-50 px-2 py-0.5 rounded border border-orange-100 text-orange-700"
              >{{ item.toLokasi }}</span
            >
          </div>
        </td>
        <td class="px-6 py-4 text-gray-500 truncate max-w-[150px]">{{ trx.keterangan || '-' }}</td>
        <td class="px-6 py-4 text-gray-600">{{ formatDate(trx.tanggal) }}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <div
              class="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-[10px] font-bold text-orange-600 uppercase"
            >
              {{ trx.userName.substring(0, 2) }}
            </div>
            <span class="font-medium text-gray-700">{{ trx.userName }}</span>
          </div>
        </td>
      </tr>
    </AppTable>
  </div>
</template>

<script setup lang="ts">
import AppTable from '@/components/app-table.vue'
defineProps<{ data: any[]; headers: any[] }>()

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
