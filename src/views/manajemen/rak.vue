<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppTable from '@/components/app-table.vue'
import AppStatusToggle from '@/components/app-status-toggle.vue'
import RackGenerator from '@/views/manajemen/modal/rack-generator.vue'
import number from '@/functions/fmt/number'
import { useRackList, useRackToggle } from '@/models/rack'

const showGenerator = ref(false)
const { racks, getData, loading } = useRackList()
const { submitToggle } = useRackToggle()

const headers = [
  { text: 'Lokasi' },
  { text: 'Rak', align: 'center' },
  { text: 'Kolom', align: 'center' },
  { text: 'Tingkat', align: 'center' },
  { text: 'Status', align: 'center' },
]
onMounted(() => {
  getData()
})

const handleToggle = async (rak: any) => {
  try {
    await submitToggle(rak.id)
    await getData() // Refresh list setelah status berubah
  } catch (e) {
    console.error('Gagal mengubah status')
  }
}

const onGenerateSuccess = () => {
  showGenerator.value = false
  getData() // Refresh list setelah generate sukses
}

// const daftarRak = ref([
//   { id: 1, nama: 'A1-1', induk: 'A', kolom: 1, tingkat: 1, status: true },
//   { id: 2, nama: 'A1-2', induk: 'A', kolom: 1, tingkat: 2, status: false },
//   { id: 3, nama: 'B1-1', induk: 'B', kolom: 1, tingkat: 1, status: true },
// ])

// const toggleStatus = (rak: any) => {
//   rak.status = !rak.status
// }

// const handleGenerate = (data: any) => {
//   data.locations.forEach((locName: string, index: number) => {
//     daftarRak.value.push({
//       id: Date.now() + index,
//       nama: locName,
//       induk: data.induk,
//       kolom: Math.ceil((index + 1) / (data.tingkat || 1)),
//       tingkat: (index % (data.tingkat || 1)) + 1,
//       status: true,
//     })
//   })
//   showGenerator.value = false
// }
</script>

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
      @generate="onGenerateSuccess"
      @cancel="showGenerator = false"
    />

    <AppTable :headers="headers" :loading="loading">
      <tr v-for="rak in racks" :key="rak.id" :class="rak.is_maintenance && 'bg-gray-50 opacity-70'">
        <td
          class="px-6 py-4 font-mono font-bold"
          :class="!rak.is_maintenance ? 'text-blue-600' : 'text-gray-400'"
        >
          {{ rak.location_code }}
          <span
            v-if="rak.is_maintenance"
            class="ml-2 text-[10px] bg-gray-400 text-white px-2 py-0.5 rounded italic uppercase font-sans tracking-wider"
          >
            Maintenance
          </span>
        </td>
        <td class="px-6 py-4 text-gray-600 text-center">{{ rak.rack_name }}</td>
        <td class="px-6 py-4 text-gray-600 text-center">Kolom {{ rak.column_number }}</td>
        <td class="px-6 py-4 text-gray-600 text-center">Tingkat {{ rak.level_number }}</td>
        <td class="px-6 py-4 text-center">
          <AppStatusToggle :active="rak.is_active" @toggle="handleToggle(rak)" />
        </td>
      </tr>

      <tr v-if="racks.length === 0 && !loading">
        <td colspan="5" class="px-6 py-10 text-center text-gray-400">Belum ada data rak.</td>
      </tr>
    </AppTable>
  </div>
</template>
