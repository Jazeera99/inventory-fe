<template>
  <div
    class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
  >
    <div class="flex items-center gap-3">
      <div class="p-2 bg-indigo-50 rounded-lg">
        <slot name="icon">
          <svg
            class="w-5 h-5 text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              stroke-width="2"
            />
          </svg>
        </slot>
      </div>
      <slot name="title">
        <h2 class="text-lg font-black text-gray-800 tracking-tight uppercase">Filter Data</h2>
      </slot>
    </div>

    <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
      <div
        class="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1 gap-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all"
      >
        <div class="flex flex-col">
          <span class="text-[9px] font-bold text-gray-400 uppercase leading-none">Mulai</span>
          <input
            type="datetime-local"
            :value="modelValue.start"
            @input="updateValue('start', ($event.target as HTMLInputElement).value)"
            class="bg-transparent border-none text-xs font-bold text-gray-700 outline-none p-0 h-5"
          />
        </div>
        <div class="h-8 w-[1px] bg-gray-200 mx-1"></div>
        <div class="flex flex-col">
          <span class="text-[9px] font-bold text-gray-400 uppercase leading-none">Selesai</span>
          <input
            type="datetime-local"
            :value="modelValue.end"
            @input="updateValue('end', ($event.target as HTMLInputElement).value)"
            class="bg-transparent border-none text-xs font-bold text-gray-700 outline-none p-0 h-5"
          />
        </div>
      </div>

      <div class="relative flex-1 lg:w-64">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-width="2" />
          </svg>
        </div>
        <input
          type="text"
          :value="modelValue.sku"
          @input="updateValue('sku', ($event.target as HTMLInputElement).value)"
          placeholder="Ketik SKU Produk..."
          class="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-400"
        />
      </div>

      <slot name="extra-actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: { start: string; end: string; sku: string }
}>()

const emit = defineEmits(['update:modelValue'])

const updateValue = (field: string, val: string) => {
  emit('update:modelValue', { ...props.modelValue, [field]: val })
}
</script>
