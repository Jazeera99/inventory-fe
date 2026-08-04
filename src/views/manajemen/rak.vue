<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppTable from '@/components/app-table.vue'
import AppStatusToggle from '@/components/app-status-toggle.vue'
import RackGenerator from '@/views/manajemen/modal/rack-generator.vue'
import RackEdit from '@/views/manajemen/modal/rack-edit.vue'
import number from '@/functions/fmt/number'
import { useRackList, useRackToggle, useRackUpdate } from '@/models/rack'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppInputSearch from '@/components/app-input-search.vue'

const router = useRouter()
const authStore = useAuthStore()
const showGenerator = ref(false)
const showEditModal = ref(false)
const selectedRack = ref<any | null>(null)
const searchKeyword = ref('')
const { racks, getData, loading } = useRackList()
const { submitToggle } = useRackToggle()
const {
  form: editForm,
  setFormValue,
  submitUpdate,
  errors: editErrors,
  submitting: updating,
} = useRackUpdate()

// const filteredRacks = computed(() => {
//   if (!searchKeyword.value) return racks.value

//   const query = searchKeyword.value.toLowerCase()
//   return racks.value.filter((rak: any) => {
//     const matchLocation = rak.location_code?.toLowerCase().includes(query)
//     const matchName = rak.rack_name?.toLowerCase().includes(query)
//     return matchLocation || matchName
//   })
// })

const headers = computed(() => {
  const baseHeaders = [
    { text: 'Lokasi' },
    { text: 'Rak', align: 'center' },
    { text: 'Kolom', align: 'center' },
    { text: 'Tingkat', align: 'center' },
    { text: 'Kapasitas', align: 'center' },
    { text: 'Status', align: 'center' },
  ]

  if (authStore.hasPermission('Manajemen Rak')) {
    baseHeaders.push({ text: 'Aksi', align: 'center' })
  }

  return baseHeaders
})

onMounted(() => {
  getData()
})

let debounceTimer: any = null
watch(searchKeyword, (newVal) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    getData({ search: newVal })
  }, 300)
})

const handleToggle = async (rak: any) => {
  try {
    const res = await submitToggle(rak.id)
    const responseData = (res?.data ? res.data : res) as any

    // Cek jika backend mengembalikan status warning / butuh evakuasi barang
    if (
      responseData &&
      responseData.status === 'warning' &&
      responseData.action === 'evacuation_required'
    ) {
      // 1. Tampilkan pesan peringatan dari backend
      alert(responseData.message)
      // Alihkan ke halaman pindah produk sambil membawa ID rak yang retak/maintenance
      router.push({
        path: 'pindah-produk',
        query: { evacuate_source_id: responseData.source_rack_id },
      })
      return
    }

    await getData() // Refresh list normal jika rak memang kosong
  } catch (e) {
    console.error('Gagal mengubah status', e)
  }
}

const onGenerateSuccess = (responseData?: any) => {
  showGenerator.value = false
  getData() // Refresh list setelah generate sukses

  if (responseData) {
    console.log('Detail pembuatan rak:', {
      status: responseData.status,
      Berhasil: responseData.generated,
      Dilewati: responseData.already_exists,
    })
  }
}

const openEditModal = (rak: Rack) => {
  selectedRack.value = rak
  setFormValue(rak)
  showEditModal.value = true
}

const onUpdateSuccess = () => {
  showEditModal.value = false
  selectedRack.value = null
  getData() // Refresh tabel data
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
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <!-- Memanggil Komponen Search Rak Baru -->
        <AppInputSearch v-model="searchKeyword" placeholder="Cari lokasi / nama rak..." />

        <AppButton
          v-if="authStore.hasPermission('Manajemen Rak')"
          @click="showGenerator = !showGenerator"
          :variant="showGenerator ? 'outline' : 'primary'"
        >
          {{ showGenerator ? 'Tutup Generator' : '+ Tambah Rak Baru' }}
        </AppButton>
      </div>
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
        <td class="px-6 py-4 text-gray-600 text-center text-lg">
          <template
            v-if="
              rak.location_code?.toLowerCase().startsWith('ld') ||
              rak.rack_name?.toLowerCase().includes('loading')
            "
          >
            &infin;
          </template>
          <template v-else>
            {{ rak.capacity }}
          </template>
        </td>
        <td class="px-6 py-4 text-center">
          <AppStatusToggle
            v-if="authStore.hasPermission('Manajemen Rak')"
            :active="rak.is_active"
            @toggle="handleToggle(rak)"
          />
          <span
            v-else
            :class="rak.is_active ? 'text-green-600' : 'text-red-500'"
            class="text-xs font-bold uppercase"
          >
            {{ rak.is_active ? 'Aktif' : 'Non-Aktif' }}
          </span>
        </td>
        <td v-if="authStore.hasPermission('Manajemen Rak')" class="px-6 py-4 text-center">
          <button
            v-if="authStore.hasPermission('Manajemen Rak')"
            @click="openEditModal(rak)"
            class="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            title="Edit Rak"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </button>
        </td>
      </tr>

      <tr v-if="racks.length === 0 && !loading">
        <td colspan="headers.length" class="px-6 py-10 text-center text-gray-400">
          Belum ada data rak.
        </td>
      </tr>
    </AppTable>
    <RackEdit
      :show="showEditModal"
      :rack="selectedRack"
      @updated="onUpdateSuccess"
      @close="showEditModal = false"
    />
  </div>
</template>
