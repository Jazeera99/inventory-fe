<script setup lang="ts">
import { computed } from 'vue'
import { stokLokasiData, transaksiData, produkData } from '../../data/dummyData'
import StokRak from '@/views/dashboard/stok-rak.vue'
import TransaksiTerbaru from '@/views/dashboard/new-transaction.vue'

// Data untuk Stat Cards
const totalProduk = computed(() => produkData.length)
const totalLokasi = computed(() => 250) // Sesuai kode awal Anda
const totalStok = computed(() => stokLokasiData.reduce((sum, item) => sum + item.quantity, 0))
const transaksiHariIni = computed(() => {
  const today = new Date().toDateString()
  return transaksiData.filter((t) => new Date(t.tanggal).toDateString() === today).length
})

const getProdukNama = (sku: string) => produkData.find((p) => p.sku === sku)?.nama || '-'

const transaksiTerbaru = computed(() =>
  [...transaksiData]
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, 5),
)

const stokMenipis = computed(() => stokLokasiData.filter((item) => item.quantity < 20))

const formatDate = (date: any) =>
  new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

// Helper functions untuk TransaksiTerbaru (disesuaikan dengan enum MASUK, KELUAR, dll)
const tipeClass = (tipe: string) => {
  const classes: any = {
    MASUK: 'badge-success',
    KELUAR: 'badge-danger',
    PINDAH: 'badge-info',
    ADJUSTMENT: 'badge-warning',
  }
  return classes[tipe] || 'bg-gray-100'
}
const tipeIconClass = (tipe: string) => {
  const classes: any = {
    MASUK: 'bg-green-100',
    KELUAR: 'bg-red-100',
    PINDAH: 'bg-blue-100',
    ADJUSTMENT: 'bg-yellow-100',
  }
  return classes[tipe] || 'bg-gray-100'
}
const tipeIconColor = (tipe: string) => {
  const colors: any = {
    MASUK: 'text-green-600',
    KELUAR: 'text-red-600',
    PINDAH: 'text-blue-600',
    ADJUSTMENT: 'text-yellow-600',
  }
  return colors[tipe] || 'text-gray-600'
}
const tipeIconPath = (tipe: string) => {
  const paths: any = {
    MASUK: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
    KELUAR:
      'M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14v-6a2 2 0 00-2-2h-2m-4 0H8m4 0V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2z',
    PINDAH: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    ADJUSTMENT:
      'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
  }
  return paths[tipe] || ''
}
</script>

<template>
  <div class="p-6 text-left">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-600">Selamat datang kembali, Admin!</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <AppStatcard
        title="Total Produk"
        :value="totalProduk"
        iconBg="bg-blue-100"
        iconColor="text-blue-600"
      >
        <template #icon>
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-width="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </template>
      </AppStatcard>

      <AppStatcard
        title="Total Lokasi"
        :value="totalLokasi"
        iconBg="bg-green-100"
        iconColor="text-green-600"
      >
        <template #icon>
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </template>
      </AppStatcard>

      <AppStatcard
        title="Total Stok"
        :value="totalStok + ' pcs'"
        iconBg="bg-yellow-100"
        iconColor="text-yellow-600"
      >
        <template #icon>
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </template>
      </AppStatcard>

      <AppStatcard
        title="Transaksi Hari Ini"
        :value="transaksiHariIni"
        iconBg="bg-purple-100"
        iconColor="text-purple-600"
      >
        <template #icon>
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </template>
      </AppStatcard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <StokRak :stokData="stokLokasiData" :getProdukNama="getProdukNama" :produkData="produkData" />

      <TransaksiTerbaru
        :data="transaksiTerbaru"
        :formatDate="formatDate"
        :getIconBg="tipeIconClass"
        :getIconColor="tipeIconColor"
        :getIconPath="tipeIconPath"
        :getBadgeClass="tipeClass"
      />
    </div>

    <div class="base-card">
      <h3 class="text-lg font-semibold mb-4">Stok Menipis</h3>
      <AppTable :headers="['SKU', 'Produk', 'Lokasi', 'Stok']">
        <tr v-for="item in stokMenipis" :key="item.id" class="border-b last:border-0">
          <td class="p-3 font-medium">{{ item.produkSku }}</td>
          <td class="p-3">{{ getProdukNama(item.produkSku) }}</td>
          <td class="p-3">{{ item.kodeLokasi }}</td>
          <td class="p-3 text-right">
            <span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600 font-semibold">
              {{ item.quantity }} pcs
            </span>
          </td>
        </tr>
      </AppTable>
    </div>
  </div>
</template>
