<template>
  <div class="space-y-6 p-1">
    <header class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          {{ isAdding ? 'Buat Penyesuaian Stok' : 'Riwayat Penyesuaian Stok' }}
        </h1>
        <p class="text-gray-500 text-sm italic">
          {{
            isAdding ? 'Input detail koreksi stok barang.' : 'Audit dan koreksi jumlah stok barang.'
          }}
        </p>
      </div>

      <button
        v-if="isAdding"
        @click="isAdding = false"
        class="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-semibold transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Kembali
      </button>

      <AppButton
        v-else
        variant="primary"
        @click="isAdding = true"
        class="!bg-indigo-600 hover:!bg-indigo-700"
      >
        + Buat Penyesuaian Stok
      </AppButton>
    </header>

    <div
      v-if="isAdding"
      class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-xs font-bold text-gray-400 uppercase mb-2"
            >Jenis Penyesuaian</label
          >
          <select
            v-model="form.globalTipe"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
          >
            <option value="MASUK">Penambahan Stok (+)</option>
            <option value="KELUAR">Pengurangan Stok (-)</option>
          </select>
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">
          Daftar Produk
        </h3>
        <StockAdjustmentRow
          v-for="(item, index) in form.items"
          :key="index"
          v-model="form.items[index]"
          :show-delete="form.items.length > 1"
          @remove="removeItem(index)"
          @update:modelValue="validateSku(index)"
        />
        <button
          @click="addItem"
          class="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-all active:scale-95"
        >
          <span>+ Tambah Baris Produk</span>
        </button>
      </div>

      <div>
        <label class="block text-xs font-bold text-gray-400 uppercase mb-2"
          >Keterangan (Opsional)</label
        >
        <textarea
          v-model="form.keterangan"
          placeholder="Alasan penyesuaian (contoh: Hasil stock opname akhir bulan)..."
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none h-24"
        ></textarea>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <AppButton variant="outline" @click="isAdding = false">Batal</AppButton>
        <AppButton
          variant="primary"
          @click="submitAdjustment"
          :loading="isSubmitting"
          class="!bg-indigo-600 px-8"
        >
          Simpan Penyesuaian
        </AppButton>
      </div>
    </div>

    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <AppTableFilter v-model="tableFilters" />
      <StockAdjustmentHistory :data="filteredHistory" :headers="headers" class="mt-4" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import AppButton from '@/components/app-button.vue'
import AppTableFilter from '@/components/app-table-filter.vue'
import StockAdjustmentRow from '@/views/transaksi/modal/stock-adjusment-row.vue'
import StockAdjustmentHistory from '@/views/transaksi/modal/stock-adjusment-history.vue'
import { produkData } from '@/data/dummyData'

// State untuk toggle halaman
const isAdding = ref(false)
const isSubmitting = ref(false)

const headers = [
  { text: 'No. Transaksi' },
  { text: 'Tanggal Dibuat' },
  { text: 'Tanggal Disesuaikan' },
  { text: 'Jenis' },
  { text: 'User' },
  { text: 'Total Qty' },
]

const tableFilters = reactive({ date: '', sku: '' })

const form = reactive({
  globalTipe: 'MASUK',
  keterangan: '',
  items: [{ produkSku: '', namaProduk: '', quantity: 1, isValid: false }],
})

const historyData = ref([
  {
    id: 1,
    noTransaksi: 'ADJ-001',
    tanggalDibuat: new Date(),
    tanggalDisesuaikan: new Date(),
    jenis: 'MASUK',
    userName: 'Admin Audit',
    totalQty: 10,
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
  form.items.push({ produkSku: '', namaProduk: '', quantity: 1, isValid: false })
const removeItem = (index: number) => form.items.splice(index, 1)

const filteredHistory = computed(() => historyData.value)

const submitAdjustment = async () => {
  if (form.items.some((i) => !i.isValid)) return alert('Ada SKU yang belum valid!')

  isSubmitting.value = true
  await new Promise((r) => setTimeout(r, 1000))

  historyData.value.unshift({
    id: Date.now(),
    noTransaksi: `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
    tanggalDibuat: new Date(),
    tanggalDisesuaikan: new Date(),
    jenis: form.globalTipe,
    userName: 'User Gudang',
    totalQty: form.items.reduce((acc, curr) => acc + curr.quantity, 0),
  })

  isSubmitting.value = false
  isAdding.value = false // Otomatis balik ke tabel riwayat

  // Reset Form
  form.globalTipe = 'MASUK'
  form.keterangan = ''
  form.items = [{ produkSku: '', namaProduk: '', quantity: 1, isValid: false }]
}
</script>
