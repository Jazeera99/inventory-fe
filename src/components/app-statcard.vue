<template>
  <div class="base-card hover:shadow-md transition-shadow duration-200">
    <div class="flex items-center">
      <div :class="['p-3 rounded-full', iconBg, iconColor]">
        <slot name="icon"></slot>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-600">{{ title }}</p>
        <p class="text-2xl font-semibold text-gray-900">{{ value }}</p>
      </div>
    </div>
    <div class="mt-4 flex items-center">
      <span :class="['text-sm font-medium', trendClass]">{{ trendValue }}</span>
      <span class="text-sm text-gray-500 ml-2">{{ trendLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  iconBg: string
  iconColor: string
  trendValue?: string
  trendClass?: string
  trendLabel?: string
}>()
</script>
