<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div
      class="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden shadow-indigo-200/50"
    >
      <div class="p-6 border-b flex justify-between items-center bg-gray-50">
        <div>
          <h3 class="text-lg font-bold text-gray-900 leading-none">Posisi Inventaris</h3>
          <span
            class="text-xs font-mono font-bold text-indigo-500 tracking-widest uppercase mt-1 inline-block"
            >{{ sku }}</span
          >
        </div>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-red-500 transition-colors font-bold text-xl"
        >
          ✕
        </button>
      </div>

      <div class="p-6">
        <div class="space-y-3 max-h-64 overflow-y-auto pr-2">
          <div
            v-for="loc in data"
            :key="loc.id"
            class="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl hover:border-indigo-300 transition-all shadow-sm group"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors"
              >
                {{ loc.kodeLokasi.charAt(0) }}
              </div>
              <span class="font-mono text-sm font-bold text-gray-700">{{ loc.kodeLokasi }}</span>
            </div>
            <span class="text-lg font-black text-gray-900"
              >{{ loc.quantity }} <small class="text-[10px] text-gray-400">PCS</small></span
            >
          </div>
        </div>

        <div
          class="mt-8 pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-center"
        >
          <span class="text-xs font-bold text-gray-400 uppercase tracking-widest"
            >Total Akumulasi</span
          >
          <span class="text-2xl font-black text-indigo-600"
            >{{ total }} <small class="text-xs">PCS</small></span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ sku: string; data: any[]; total: number }>()
defineEmits(['close'])
</script>
