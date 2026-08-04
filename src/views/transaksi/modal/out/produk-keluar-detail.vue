<script setup lang="ts">
import AppButton from '@/components/app-button.vue'
import ProdukKeluarRow from '@/views/transaksi/modal/out/produk-keluar-row.vue'

// Props yang diterima dari halaman utama
defineProps<{
  trx: any // Data transaksi tunggal yang didapat
  trxNo: string | any // Nomor transaksi dari URL (?trx=...)
  loading: boolean // State loading saat refresh halaman
  racks: any // Data rak untuk keperluan row detail
}>()

// Event emit untuk memberi tahu parent jika tombol kembali diklik
defineEmits(['close'])
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-2 text-sm text-red-600 font-medium mb-1">
      <button @click="$emit('close')" class="hover:underline flex items-center gap-1">
        ← Kembali ke Produk Keluar
      </button>
    </div>
    <header
      class="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Detail Transaksi</h1>
        <p class="text-gray-500 text-sm font-mono">{{ trxNo }}</p>
      </div>
      <!-- <AppButton variant="secondary" @click="$emit('close')">Kembali</AppButton> -->
    </header>

    <div v-if="loading" class="bg-white p-12 rounded-xl text-center border">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p class="text-gray-400 text-sm">Memuat data transaksi...</p>
    </div>

    <div
      v-else-if="trx"
      class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      <div class="p-6">
        <h3 class="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">Saved Items</h3>

        <div class="space-y-4">
          <ProdukKeluarRow
            v-for="(item, index) in trx.items"
            :key="index"
            :index="Number(index)"
            :model-value="{
              product_sku: item.product_sku,
              qty: Math.abs(Number(item.qty || 0)),
              rack_id: item.rack_id,
              rack_name: item.rack_name,
              notes: item.notes,
              isValid: true,
            }"
            :all-racks="racks"
            :show-delete="false"
            :readonly="true"
          />
        </div>

        <!-- <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <label class="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">
            Catatan Transaksi Global
          </label>
          <p class="text-gray-700 text-sm italic">
            {{ trx.notes || 'Tidak ada catatan global pada transaksi ini.' }}
          </p>
        </div> -->
      </div>

      <!-- <div class="bg-gray-50 px-6 py-4 flex justify-end border-t">
        <AppButton @click="$emit('close')">Tutup Detail</AppButton>
      </div> -->
    </div>

    <!-- <div v-else class="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 text-center">
      Data transaksi <span class="font-mono font-bold">{{ trxNo }}</span> tidak ditemukan atau telah
      dihapus.
    </div> -->
  </div>
</template>
