<template>
  <div class="base-card">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-800">Sebaran Stok di Rak</h3>
        <p v-if="search && infoProduk" class="text-xs text-blue-600 font-medium">
          Menampilkan: {{ infoProduk.nama }} ({{ infoProduk.sku }})
        </p>
      </div>

      <AppSearch v-model="search" placeholder="Masukkan SKU Produk..." />
    </div>

    <div class="space-y-5">
      <div v-if="filteredStok.length === 0" class="text-center py-10">
        <p class="text-sm text-gray-400 italic">Data produk tidak ditemukan di rak manapun</p>
      </div>

      <div v-for="item in filteredStok" :key="item.rak" class="group">
        <div class="flex justify-between mb-1 text-sm">
          <span class="font-medium text-gray-600">Rak {{ item.rak }}</span>
          <span class="text-gray-900 font-bold">{{ item.total }} pcs</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            class="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(37,99,235,0.4)]"
            :style="{ width: (item.total / maxStok) * 100 + '%' }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  stokData: any[]
  produkData: any[] // Kita butuh ini untuk ambil nama produk berdasarkan SKU
}>()

const search = ref('')

// Cari info produk (nama & sku) berdasarkan apa yang diketik
const infoProduk = computed(() => {
  if (!search.value) return null
  return props.produkData.find((p) => p.sku.toLowerCase() === search.value.toLowerCase())
})

const filteredStok = computed(() => {
  const rakStats: { [key: string]: number } = {}

  props.stokData.forEach((item) => {
    const s = search.value.toLowerCase()

    // Logika: Filter ketat berdasarkan SKU
    // Jika search kosong, tampilkan semua. Jika diisi, hanya yang SKU-nya sama.
    if (!s || item.produkSku.toLowerCase() === s) {
      const rak = item.kodeLokasi[0] // Ambil inisial rak (A, B, C, dst)
      if (rak) {
        rakStats[rak] = (rakStats[rak] || 0) + item.quantity
      }
    }
  })

  // Ubah object ke array dan urutkan berdasarkan Nama Rak
  return Object.entries(rakStats)
    .map(([rak, total]) => ({ rak, total }))
    .sort((a, b) => a.rak.localeCompare(b.rak))
})

// Max stok untuk kalkulasi lebar progress bar
const maxStok = computed(() => {
  const values = filteredStok.value.map((i) => i.total)
  return values.length > 0 ? Math.max(...values) : 1
})
</script>
