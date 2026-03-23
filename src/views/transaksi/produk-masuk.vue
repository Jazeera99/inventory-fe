<template>
  <div class="space-y-6 p-1">
    <header>
      <h1 class="text-2xl font-bold text-gray-900">Produk Masuk</h1>
      <p class="text-gray-500 text-sm italic">Input stok masuk ke gudang utama (Loading Dock).</p>
    </header>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-6">
        <h3 class="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">Input Items</h3>
        <div class="space-y-4">
          <ProdukMasukRow
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
          class="mt-4 text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-all active:scale-95"
        >
          <span>+ Tambah Item Baru</span>
        </button>
      </div>

      <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
        <AppButton variant="outline" @click="resetForm">Batal</AppButton>
        <AppButton variant="primary" @click="submitProdukMasuk" :loading="isSubmitting"
          >Simpan Stok Masuk</AppButton
        >
      </div>
    </div>

    <div class="pt-4">
      <AppTableFilter v-model="tableFilters">
        <template #title>
          <h2 class="text-lg font-bold text-gray-800">Riwayat Masuk</h2>
        </template>
      </AppTableFilter>

      <ProdukMasukHistory :data="filteredHistory" :headers="headers" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppTableFilter from '@/components/app-table-filter.vue'
import ProdukMasukRow from '@/views/transaksi/modal/produk-masuk-row.vue'
import ProdukMasukHistory from '@/views/transaksi/modal/produk-masuk-history.vue'

// --- DATA MOCKUP ---
const produkDataMock = [
  { sku: 'A100', nama: 'Semen Gresik' },
  { sku: 'B200', nama: 'Paku Beton' },
  { sku: 'C300', nama: 'Cat Avian' },
]

const headers = [
  { text: 'No. Transaksi' },
  { text: 'SKU' },
  { text: 'Qty' },
  { text: 'Keterangan' },
  { text: 'Tanggal Masuk' },
  { text: 'User' },
]

// --- STATES ---
const isSubmitting = ref(false)
const tableFilters = reactive({ date: '', sku: '' })
const form = reactive({
  items: [{ produkSku: '', namaProduk: '', quantity: 1, keterangan: '', isValid: false }],
})

const historyData = ref([
  {
    id: 1,
    noTransaksi: 'TRX-IN-001',
    tanggal: new Date(),
    userName: 'Admin Gudang',
    keterangan: 'Stok awal',
    items: [{ produkSku: 'A100', quantity: 50 }],
  },
])

// --- LOGIC ---
const validateSku = (index: number) => {
  const item = form.items[index]
  // Jika input kosong, reset status
  if (!item.produkSku) {
    item.isValid = false
    item.isError = false
    return
  }

  const found = produkDataMock.find((p) => p.sku === item.produkSku.toUpperCase())

  if (found) {
    Object.assign(item, {
      isValid: true,
      isError: false, // Tambahkan ini
      namaProduk: found.nama,
      produkSku: item.produkSku.toUpperCase(),
    })
  } else {
    // Jika tidak ditemukan, set isError jadi true
    Object.assign(item, {
      isValid: false,
      isError: true, // Ini yang memicu munculnya tanda ❌
      namaProduk: '',
    })
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

const submitProdukMasuk = async () => {
  if (form.items.some((i) => !i.isValid)) return alert('Terdapat SKU yang tidak valid!')

  isSubmitting.value = true
  await new Promise((r) => setTimeout(r, 800)) // Simulasi API

  historyData.value.unshift({
    id: Date.now(),
    noTransaksi: `TRX-IN-${Math.floor(100 + Math.random() * 900)}`,
    tanggal: new Date(),
    userName: 'Operator 1',
    keterangan:
      form.items
        .map((i) => i.keterangan)
        .filter((k) => k)
        .join(', ') || 'Tanpa keterangan',
    items: JSON.parse(JSON.stringify(form.items)),
  })

  isSubmitting.value = false
  resetForm()
}

const openSearchModal = (idx: number) => {
  console.log('Membuka pencarian untuk baris:', idx)
  // Di sini nanti integrasi dengan Modal Pencarian Global
}
</script>
