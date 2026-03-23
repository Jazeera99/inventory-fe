<template>
  <div class="space-y-6 p-1">
    <header>
      <h1 class="text-2xl font-bold text-gray-900">Produk Keluar</h1>
      <p class="text-gray-500 text-sm italic">Catat pengeluaran barang dari gudang.</p>
    </header>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-6">
        <h3 class="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">
          Input Items Keluar
        </h3>
        <div class="space-y-4">
          <ProdukKeluarRow
            v-for="(item, index) in form.items"
            :key="index"
            v-model="form.items[index]"
            :show-delete="form.items.length > 1"
            @remove="removeItem(index)"
            @openSearch="openSearchModal(index)"
            @update:modelValue="validateSku(index)"
          />
        </div>
        <button
          @click="addItem"
          class="mt-4 text-sm font-bold text-red-600 hover:text-red-800 flex items-center gap-1 transition-all active:scale-95"
        >
          <span>+ Tambah Item Keluar</span>
        </button>
      </div>

      <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
        <AppButton variant="outline" @click="resetForm">Batal</AppButton>
        <AppButton
          variant="primary"
          @click="submitProdukKeluar"
          :loading="isSubmitting"
          class="!bg-red-600 hover:!bg-red-700"
        >
          Simpan Stok Keluar
        </AppButton>
      </div>
    </div>

    <div class="pt-4">
      <AppTableFilter v-model="tableFilters">
        <template #title>
          <h2 class="text-lg font-bold text-gray-800">Riwayat Keluar</h2>
        </template>
      </AppTableFilter>
      <ProdukKeluarHistory :data="filteredHistory" :headers="headers" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppTableFilter from '@/components/app-table-filter.vue'
import ProdukKeluarRow from './modal/produk-keluar-row.vue'
import ProdukKeluarHistory from './modal/produk-keluar-history.vue'

// Mockup Data Produk (Ganti dengan API nanti)
const produkDataMock = [
  { sku: 'A100', nama: 'Semen Gresik' },
  { sku: 'B200', nama: 'Paku Beton' },
]

const headers = [
  { text: 'No. Transaksi' },
  { text: 'SKU' },
  { text: 'Qty' },
  { text: 'Keterangan' },
  { text: 'Tanggal Keluar' },
  { text: 'User' },
]

const isSubmitting = ref(false)
const tableFilters = reactive({ date: '', sku: '' })
const form = reactive({
  items: [{ produkSku: '', namaProduk: '', quantity: 1, keterangan: '', isValid: false }],
})

const historyData = ref([
  {
    id: 1,
    noTransaksi: 'TRX-OUT-001',
    tanggal: new Date(),
    userName: 'Staff Gudang',
    keterangan: 'Kirim ke Proyek A',
    items: [{ produkSku: 'A100', quantity: 10 }],
  },
])

const validateSku = (index: number) => {
  const item = form.items[index]
  if (!item.produkSku) {
    item.isValid = false
    item.isError = false
    return
  }
  const found = produkDataMock.find((p) => p.sku === item.produkSku.toUpperCase())
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
  form.items.push({ produkSku: '', namaProduk: '', quantity: 1, keterangan: '', isValid: false })
const removeItem = (index: number) => form.items.splice(index, 1)
const resetForm = () =>
  (form.items = [{ produkSku: '', namaProduk: '', quantity: 1, keterangan: '', isValid: false }])

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

const submitProdukKeluar = async () => {
  if (form.items.some((i) => !i.isValid)) return alert('Terdapat SKU yang tidak valid!')
  isSubmitting.value = true
  await new Promise((r) => setTimeout(r, 800))
  historyData.value.unshift({
    id: Date.now(),
    noTransaksi: `TRX-OUT-${Math.floor(100 + Math.random() * 900)}`,
    tanggal: new Date(),
    userName: 'User Demo',
    keterangan:
      form.items
        .map((i) => i.keterangan)
        .filter((k) => k)
        .join(', ') || 'Pengeluaran Barang',
    items: JSON.parse(JSON.stringify(form.items)),
  })
  isSubmitting.value = false
  resetForm()
}

const openSearchModal = (idx: number) => console.log('Search row:', idx)
</script>
