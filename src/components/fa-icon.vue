<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{
    icon: string,
    fixedWidth?: boolean,
  }>()

  const iconName = computed(() => {
    return props.icon.replace(/^i-fa[srltb]-/, '')
  })
</script>

<template>
  <span
    :class="[icon, { 'w-1.2em': fixedWidth }]"
    :title="iconName"></span>
</template>
