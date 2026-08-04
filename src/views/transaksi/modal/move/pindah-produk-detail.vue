<script setup lang="ts">
import AppButton from '@/components/app-button.vue'
import PindahProdukRow from './pindah-produk-row.vue'

// Props dari file induk (parent)
defineProps<{
  trx: any
  trxNo: any
  loading: boolean
  racks: any[]
}>()

defineEmits(['close'])
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-2 text-sm text-orange-600 font-medium mb-1">
      <button @click="$emit('close')" class="hover:underline flex items-center gap-1">
        ← Kembali ke Pindah Produk
      </button>
    </div>
    <header
      class="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Detail Perpindahan Barang</h1>
        <p class="text-gray-500 text-sm font-mono">{{ trxNo }}</p>
      </div>
    </header>

    <div v-if="loading" class="bg-white p-12 rounded-xl text-center border">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"
      ></div>
      <p class="text-gray-400 text-sm">Memuat data transaksi...</p>
    </div>

    <div
      v-else-if="trx"
      class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      <div class="p-6">
        <h3 class="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">
          Item Terpindah
        </h3>

        <div class="space-y-4">
          <PindahProdukRow
            v-for="(item, index) in trx.items"
            :key="index"
            :index="Number(index)"
            :model-value="{
              product_sku: item.product_sku,
              qty: item.qty,
              expired_at: item.expired_at,
              rack_id: item.rack_id,
              target_rack_id: item.target_rack_id,
              location_code: item.location_code || item.rack_code || item.rack?.location_code,
              target_location_code:
                item.target_location_code ||
                item.target_rack_code ||
                item.target_rack?.location_code,
              rack_name: item.rack_name,
              target_rack_name: item.target_rack_name,
              notes: item.notes,
              isValid: true,
            }"
            :all-racks="racks"
            :readonly="true"
            :show-delete="false"
          />
        </div>

        <div v-if="trx.notes" class="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
          <label class="block text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">
            Catatan Global
          </label>
          <p class="text-gray-700 text-sm italic">{{ trx.notes }}</p>
        </div>
      </div>

      <!-- <div class="bg-gray-50 px-6 py-4 flex justify-end border-t">
        <AppButton @click="$emit('close')">Tutup Detail</AppButton>
      </div> -->
    </div>

    <div v-else class="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 text-center">
      Data transaksi <span class="font-mono font-bold">{{ trxNo }}</span> tidak ditemukan atau telah
      dipindahkan.
    </div>
  </div>
</template>
