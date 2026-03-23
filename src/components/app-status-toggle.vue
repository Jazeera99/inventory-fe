<template>
  <button
    @click="$emit('toggle')"
    :class="[
      'px-3 py-1.5 rounded-md text-xs font-bold transition-colors border shadow-sm inline-flex items-center',
      active
        ? 'text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100'
        : 'text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100',
    ]"
  >
    <span
      class="mr-1.5 w-1.5 h-1.5 rounded-full"
      :class="active ? 'bg-amber-500' : 'bg-emerald-500'"
    ></span>
    {{ active ? 'Disable' : 'Enable' }}
  </button>
</template>

<script setup lang="ts">
defineProps<{ active: boolean }>()
defineEmits(['toggle'])
</script>
