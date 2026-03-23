<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div
      v-for="stat in stats"
      :key="stat.label"
      class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
    >
      <p class="text-[10px] font-black uppercase text-gray-400 tracking-widest">{{ stat.label }}</p>
      <div class="flex items-end justify-between mt-1">
        <h4 :class="['text-2xl font-black', stat.color]">{{ stat.value }}</h4>
        <span class="text-[10px] text-gray-300 font-bold mb-1">PCS</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ stats: any[] }>()
</script>
