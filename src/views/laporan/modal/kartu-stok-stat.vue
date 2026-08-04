<script setup lang="ts">
defineProps<{
  stats: Array<{
    label: string
    value: string | number
    color: string
  }>
}>()
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
    <div
      v-for="stat in stats"
      :key="stat.label"
      class="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-center"
    >
      <p class="text-[10px] font-black text-gray-400 uppercase mb-1">{{ stat.label }}</p>
      <p :class="['text-xl font-black', stat.color]">{{ stat.value }}</p>
    </div>
  </div>
</template>
