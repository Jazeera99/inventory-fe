<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Kelola Rak & Lokasi</h2>
        <p class="text-gray-500 text-sm">Atur denah penyimpanan barang di gudang.</p>
      </div>
      <AppButton
        @click="showGenerator = !showGenerator"
        :variant="showGenerator ? 'outline' : 'primary'"
      >
        {{ showGenerator ? 'Tutup Generator' : '+ Tambah Rak Baru' }}
      </AppButton>
    </div>

    <RackGenerator
      v-if="showGenerator"
      @generate="handleGenerate"
      @cancel="showGenerator = false"
    />

    <AppTable :headers="headers">
      <tr v-for="rak in daftarRak" :key="rak.id" :class="!rak.status && 'bg-gray-50 opacity-70'">
        <td
          class="px-6 py-4 font-mono font-bold"
          :class="rak.status ? 'text-blue-600' : 'text-gray-400'"
        >
          {{ rak.nama }}
          <span
            v-if="!rak.status"
            class="ml-2 text-[10px] bg-gray-400 text-white px-2 py-0.5 rounded italic uppercase font-sans tracking-wider"
          >
            Maintenance
          </span>
        </td>
        <td class="px-6 py-4 text-gray-600">Rak {{ rak.induk }}</td>
        <td class="px-6 py-4 text-gray-600">Kolom {{ rak.kolom }}</td>
        <td class="px-6 py-4 text-gray-600">Tingkat {{ rak.tingkat }}</td>
        <td class="px-6 py-4 text-center">
          <AppStatusToggle :active="rak.status" @toggle="toggleStatus(rak)" />
        </td>
      </tr>

      <tr v-if="daftarRak.length === 0">
        <td colspan="5" class="px-6 py-10 text-center text-gray-400">Belum ada data rak.</td>
      </tr>
    </AppTable>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppTable from '@/components/app-table.vue'
import AppStatusToggle from '@/components/app-status-toggle.vue'
import RackGenerator from '@/views/manajemen/modal/rack-generator.vue'

const showGenerator = ref(false)
const headers = [
  { text: 'Lokasi' },
  { text: 'Rak' },
  { text: 'Kolom' },
  { text: 'Tingkat' },
  { text: 'Aksi', align: 'right' },
]

const daftarRak = ref([
  { id: 1, nama: 'A1-1', induk: 'A', kolom: 1, tingkat: 1, status: true },
  { id: 2, nama: 'A1-2', induk: 'A', kolom: 1, tingkat: 2, status: false },
  { id: 3, nama: 'B1-1', induk: 'B', kolom: 1, tingkat: 1, status: true },
])

const toggleStatus = (rak: any) => {
  rak.status = !rak.status
}

const handleGenerate = (data: any) => {
  data.locations.forEach((locName: string, index: number) => {
    daftarRak.value.push({
      id: Date.now() + index,
      nama: locName,
      induk: data.induk,
      kolom: Math.ceil((index + 1) / (data.tingkat || 1)),
      tingkat: (index % (data.tingkat || 1)) + 1,
      status: true,
    })
  })
  showGenerator.value = false
}
</script>
