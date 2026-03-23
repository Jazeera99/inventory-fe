<template>
  <tr class="hover:bg-gray-50 transition-colors text-sm border-b">
    <td class="px-6 py-4 font-mono font-bold text-gray-900">{{ item.sku }}</td>
    <td class="px-6 py-4 font-semibold text-gray-800">{{ item.produkNama }}</td>

    <td class="px-6 py-4 text-right font-medium text-gray-500">{{ item.stokAwal }}</td>

    <td class="px-6 py-4 text-right text-blue-600 font-bold">+{{ item.totalMasuk }}</td>
    <td class="px-6 py-4 text-right text-red-500 font-bold">-{{ item.totalKeluar }}</td>

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
        v-if="item.stokAkhir <= 5"
        class="text-[10px] text-red-500 mt-1 font-bold italic animate-pulse tracking-tighter"
      >
        LOW STOCK!
      </p>
    </td>

    <td class="px-6 py-4 text-center text-[11px] text-gray-400 font-mono">
      {{ item.lastUpdate !== '-' ? new Date(item.lastUpdate).toLocaleString('id-ID') : '-' }}
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

<script setup lang="ts">
defineProps<{ item: any }>()
defineEmits(['detail', 'kartu'])
</script>
