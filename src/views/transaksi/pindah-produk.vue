<template>
  <div class="space-y-6 p-1">
    <header>
      <h1 class="text-2xl font-bold text-gray-900">Pindah Produk</h1>
      <p class="text-gray-500 text-sm italic">Relokasi stok antar rak atau area gudang.</p>
    </header>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-6">
        <h3 class="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">
          Daftar Perpindahan
        </h3>
        <div class="space-y-4">
          <PindahProdukRow
            v-for="(item, index) in form.items"
            :key="index"
            v-model="form.items[index]"
            :show-delete="form.items.length > 1"
            @remove="removeItem(index)"
            @update:modelValue="validateSku(index)"
          />
        </div>
        <button
          @click="addItem"
          class="mt-4 text-sm font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1"
        >
          <span>+ Tambah Item Pindah</span>
        </button>
      </div>

      <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
        <AppButton variant="outline" @click="resetForm">Batal</AppButton>
        <AppButton
          variant="primary"
          @click="submitPindah"
          :loading="isSubmitting"
          class="!bg-orange-600 hover:!bg-orange-700"
        >
          Simpan Perpindahan
        </AppButton>
      </div>
    </div>

    <div class="pt-4">
      <AppTableFilter v-model="tableFilters">
        <template #title><h2 class="text-lg font-bold text-gray-800">Riwayat Pindah</h2></template>
      </AppTableFilter>
      <PindahProdukHistory :data="filteredHistory" :headers="headers" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppTableFilter from '@/components/app-table-filter.vue'
import PindahProdukRow from './modal/pindah-produk-row.vue'
import PindahProdukHistory from './modal/pindah-produk-history.vue'
import { produkData } from '@/data/dummyData'

const headers = [
  { text: 'No. Transaksi' },
  { text: 'SKU' },
  { text: 'Qty' },
  { text: 'Mutasi Lokasi' },
  { text: 'Keterangan' },
  { text: 'Tanggal' },
  { text: 'User' },
]

const isSubmitting = ref(false)
const tableFilters = reactive({ date: '', sku: '' })
const form = reactive({
  items: [
    {
      produkSku: '',
      namaProduk: '',
      quantity: 1,
      fromLokasi: '',
      toLokasi: '',
      keterangan: '',
      isValid: false,
    },
  ],
})

const historyData = ref([
  {
    id: 1,
    noTransaksi: 'TRX-MV-001',
    tanggal: new Date(),
    userName: 'Supervisor',
    items: [{ produkSku: 'A100', quantity: 5, fromLokasi: 'RAK-A1', toLokasi: 'RAK-B2' }],
    keterangan: 'Optimasi ruang',
  },
])

const validateSku = (index: number) => {
  const item = form.items[index]
  if (!item.produkSku) return
  const found = produkData.find((p: any) => p.sku === item.produkSku.toUpperCase())
  if (found) {
    Object.assign(item, {
      isValid: true,
      isError: false,
      namaProduk: found.nama,
      produkSku: item.produkSku.toUpperCase(),
    })
  } else {
    Object.assign(item, { isValid: false, isError: true, namaProduk: '' })
  }
}

const addItem = () =>
  form.items.push({
    produkSku: '',
    namaProduk: '',
    quantity: 1,
    fromLokasi: '',
    toLokasi: '',
    keterangan: '',
    isValid: false,
  })
const removeItem = (index: number) => form.items.splice(index, 1)
const resetForm = () =>
  (form.items = [
    {
      produkSku: '',
      namaProduk: '',
      quantity: 1,
      fromLokasi: '',
      toLokasi: '',
      keterangan: '',
      isValid: false,
    },
  ])

const filteredHistory = computed(() => {
  return historyData.value.filter((trx) => {
    const matchSku = trx.items.some((i) =>
      i.produkSku.toLowerCase().includes(tableFilters.sku.toLowerCase()),
    )
    const matchDate =
      !tableFilters.date || new Date(trx.tanggal).toISOString().split('T')[0] === tableFilters.date
    return matchSku && matchDate
  })
})

const submitPindah = async () => {
  if (form.items.some((i) => !i.isValid || !i.fromLokasi || !i.toLokasi))
    return alert('Lengkapi data & pastikan SKU valid!')
  isSubmitting.value = true
  await new Promise((r) => setTimeout(r, 800))
  historyData.value.unshift({
    id: Date.now(),
    noTransaksi: `TRX-MV-${Math.floor(100 + Math.random() * 900)}`,
    tanggal: new Date(),
    userName: 'Admin Gudang',
    items: JSON.parse(JSON.stringify(form.items)),
    keterangan: form.items[0].keterangan || 'Mutasi Stok',
  })
  isSubmitting.value = false
  resetForm()
}
</script>
