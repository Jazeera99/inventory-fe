<script setup lang="ts">
  import { useElementVisibility } from '@vueuse/core'
  import { ref, watch } from 'vue'
  import { debounce } from '@/functions'

  // Disable infinite scroll, useful to prevent double request
  // when the content is shorter than the viewport
  const props = defineProps<{
    disabled?: boolean,
  }>()

  const emit = defineEmits<{
    (e: 'endReached'): void,
  }>()

  const sentinel = ref<HTMLElement>()
  const targetIsVisible = useElementVisibility(sentinel)
  const duration = 200
  const debounceOption = { immediate: true }
  const endReached = debounce(() => {
    emit('endReached')
  }, duration, debounceOption)
  watch(targetIsVisible, (value) => {
    if (value && !props.disabled) {
      endReached()
    }
  })
</script>

<template>
  <div>
    <slot></slot>
    <div ref="sentinel"></div>
  </div>
</template>
