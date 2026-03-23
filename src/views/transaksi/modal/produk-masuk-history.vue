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
            class="font-mono font-bold text-blue-600"
          >
            {{ item.produkSku }}
          </div>
        </td>
        <td class="px-6 py-4 font-bold text-gray-900">
          <div v-for="item in trx.items" :key="item.produkSku">{{ item.quantity }} pcs</div>
        </td>
        <td class="px-6 py-4 text-gray-500 truncate max-w-[200px]">{{ trx.keterangan || '-' }}</td>
        <td class="px-6 py-4 text-gray-600">{{ formatDate(trx.tanggal) }}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <div
              class="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase"
            >
              {{ trx.userName.substring(0, 2) }}
            </div>
            <span class="font-medium text-gray-700">{{ trx.userName }}</span>
          </div>
        </td>
      </tr>
      <tr v-if="data.length === 0">
        <td colspan="6" class="px-6 py-10 text-center text-gray-400 italic">
          Data riwayat tidak ditemukan.
        </td>
      </tr>
    </AppTable>
  </div>
</template>

<script setup lang="ts">
import AppTable from '@/components/app-table.vue'

defineProps<{
  data: any[]
  headers: any[]
}>()

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
