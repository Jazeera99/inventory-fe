<script setup lang="ts">
import { fmt } from '@/functions'

const props = defineProps<{ item: any }>()
defineEmits(['detail', 'kartu'])

const isExpiredSoon = (dateString: string) => {
  // Jika stok habis atau tidak ada tanggal, jangan jalankan fungsi
  if (props.item.stokAkhir <= 0 || !dateString || dateString === '-' || dateString === 'null')
    return false

  const expiredDate = new Date(dateString)
  const today = new Date()

  // Validasi jika format dateString ternyata merusak fungsi Date internal (Invalid Date)
  if (isNaN(expiredDate.getTime())) return false

  // Hitung selisih dalam milidetik, lalu ubah ke satuan hari
  const diffTime = expiredDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // 6 bulan diasumsikan kurang lebih 183 hari
  // Dan pastikan tanggalnya belum lewat (diffDays > 0)
  return diffDays > 0 && diffDays <= 183
}

const formatTanggalAman = (dateString: any) => {
  if (!dateString || dateString === '-' || dateString === 'null') return '-'

  const parsedDate = new Date(dateString)
  // Jika tanggal tidak valid atau menghasilkan tahun 1970 karena data corrupt/kosong, kembalikan '-'
  if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() === 1970) return '-'

  return parsedDate.toLocaleString('id-ID')
}
</script>

<template>
  <tr class="hover:bg-gray-50 transition-colors text-sm border-b">
    <td class="px-6 py-4 font-mono font-bold text-gray-900">{{ item.sku }}</td>
    <td class="px-6 py-4 font-semibold text-gray-800">{{ item.produkNama }}</td>

    <!-- <td class="px-6 py-4 text-right font-medium text-gray-500">{{ item.stokAwal }}</td> -->

    <td class="px-6 py-4 text-right text-blue-600 font-bold">
      {{ item.totalMasuk > 0 ? '+' + item.totalMasuk : item.totalMasuk }}
    </td>
    <td class="px-6 py-4 text-right text-red-500 font-bold">
      {{ item.totalKeluar > 0 ? '-' + item.totalKeluar : item.totalKeluar }}
    </td>

    <td class="px-6 py-4 text-right">
      <span :class="item.totalAdj >= 0 ? 'text-emerald-600' : 'text-orange-600'" class="font-bold">
        {{ item.totalAdj > 0 ? '+' : '' }}{{ item.totalAdj }}
      </span>
    </td>

    <td class="px-6 py-4 text-right">
      <div
        :class="[
          'inline-block px-3 py-1 rounded-lg font-black text-base',
          item.stokAkhir <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700',
        ]"
      >
        {{ item.stokAkhir }}
      </div>
      <p
        v-if="item.stokAkhir <= 5 && item.stokAkhir > 0"
        class="text-[10px] text-red-500 mt-1 font-bold italic animate-pulse tracking-tighter"
      >
        LOW STOCK!
      </p>
      <p
        v-if="item.stokAkhir <= 0"
        class="text-[10px] text-gray-400 mt-1 font-medium italic tracking-tighter"
      >
        HABIS
      </p>
    </td>
    <td class="px-6 py-4 text-center font-mono font-medium">
      <div
        v-if="
          item.stokAkhir > 0 &&
          item.expiredTerdekat &&
          item.expiredTerdekat !== '-' &&
          item.expiredTerdekat !== 'null'
        "
      >
        <span
          :class="
            isExpiredSoon(item.expiredTerdekat)
              ? 'bg-rose-50 text-rose-700 border-rose-200/60'
              : 'bg-amber-50 text-amber-700 border-amber-200/60'
          "
          class="px-2 py-1 rounded border font-bold"
        >
          {{ fmt.date(item.expiredTerdekat) }}
        </span>

        <p
          v-if="isExpiredSoon(item.expiredTerdekat)"
          class="text-[10px] text-rose-600 mt-1 font-black italic animate-pulse tracking-tighter"
        >
          EXPIRED SOON!
        </p>
      </div>

      <span v-else class="text-gray-400">-</span>
    </td>

    <td class="px-6 py-4 text-center text-[11px] text-gray-400 font-mono">
      {{ item.lastUpdate && item.lastUpdate !== '-' ? fmt.date(item.lastUpdate) : '-' }}
    </td>

    <td class="px-6 py-4 text-center">
      <div class="flex justify-center gap-1">
        <button
          @click="$emit('detail', item.sku)"
          class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
          title="Lokasi Rak"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              stroke-width="2"
            />
            <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke-width="2" />
          </svg>
        </button>
        <button
          @click="$emit('kartu', item.sku)"
          class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
          title="Kartu Stok"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              stroke-width="2"
            />
          </svg>
        </button>
      </div>
    </td>
  </tr>
</template>
