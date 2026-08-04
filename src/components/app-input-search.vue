<script setup lang="ts">
import { computed } from 'vue'

// Mendefinisikan properti yang bisa di-passing dari komponen induk
const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
  }>(),
  {
    placeholder: 'Cari data...',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// Menggunakan computed setter/getter agar v-model sinkron secara reaktif
const searchText = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>

<template>
  <div class="relative w-full sm:w-64">
    <input
      v-model="searchText"
      type="text"
      :placeholder="placeholder"
      class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
    />
    <svg
      class="w-4 h-4 text-gray-400 absolute left-3 top-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  </div>
</template>
