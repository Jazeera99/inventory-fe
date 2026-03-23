<template>
  <div class="base-card">
    <div class="flex justify-between mb-4">
      <h3 class="text-lg font-semibold">Transaksi Terbaru</h3>
      <router-link to="/transaksi" class="text-blue-600 text-sm">Lihat Semua</router-link>
    </div>
    <div
      v-for="trx in data"
      :key="trx.id"
      class="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
    >
      <div class="flex items-center">
        <div class="ml-3">
          <p class="text-sm font-medium">{{ trx.noTransaksi }}</p>
          <p class="text-xs text-gray-500">
            {{ formatDate(trx.tanggal) }} •
            <span class="font-semibold text-gray-700">{{ trx.operator || 'Admin' }}</span>
          </p>
        </div>
      </div>
      <span :class="['badge', getBadgeClass(trx.tipe)]">{{ trx.tipe }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: any[]
  formatDate: (d: any) => string
  getIconBg: (t: string) => string
  getIconColor: (t: string) => string
  getIconPath: (t: string) => string
  getBadgeClass: (t: string) => string
}>()
</script>
