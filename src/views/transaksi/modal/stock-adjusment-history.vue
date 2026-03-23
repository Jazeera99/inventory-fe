<template>
  <div class="space-y-4">
    <AppTable :headers="headers">
      <tr v-for="trx in data" :key="trx.id" class="hover:bg-gray-50 transition-colors text-sm">
        <td class="px-6 py-4 font-bold text-gray-500 uppercase tracking-tighter">
          {{ trx.noTransaksi }}
        </td>
        <td class="px-6 py-4 text-gray-600">{{ formatDate(trx.tanggalDibuat) }}</td>
        <td class="px-6 py-4 text-gray-600">{{ formatDate(trx.tanggalDisesuaikan) }}</td>
        <td class="px-6 py-4">
          <span
            :class="trx.jenis === 'MASUK' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'"
            class="px-2 py-1 rounded-full text-[10px] font-bold border"
          >
            {{ trx.jenis === 'MASUK' ? 'PENAMBAHAN' : 'PENGURANGAN' }}
          </span>
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <div
              class="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600 uppercase"
            >
              {{ trx.userName.substring(0, 2) }}
            </div>
            <span class="font-medium text-gray-700">{{ trx.userName }}</span>
          </div>
        </td>
        <td class="px-6 py-4 font-bold text-gray-900">{{ trx.totalQty }} pcs</td>
      </tr>
      <tr v-if="data.length === 0">
        <td colspan="6" class="px-6 py-10 text-center text-gray-400 italic">
          Riwayat penyesuaian tidak ditemukan.
        </td>
      </tr>
    </AppTable>
  </div>
</template>

<script setup lang="ts">
import AppTable from '@/components/app-table.vue'
defineProps<{ data: any[]; headers: any[] }>()
const formatDate = (date: Date) => new Date(date).toLocaleDateString('id-ID')
</script>
