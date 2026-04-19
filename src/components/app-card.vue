<template>
  <div :class="['bg-white rounded-xl shadow-lg overflow-hidden', className]">
    <div v-if="title || $slots.header" class="px-6 py-4 border-b border-gray-100">
      <slot name="header">
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
        <p v-if="subtitle" class="text-sm text-gray-500 mt-1">{{ subtitle }}</p>
      </slot>
    </div>
    <div :class="['p-6', contentClass]">
      <slot>{{ content }}</slot>
    </div>
    <div v-if="$slots.footer" class="px-6 py-4 bg-gray-50 border-t border-gray-100">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  content?: string
  className?: string
  contentClass?: string
}

defineProps<Props>()
</script>
