<template>
  <div
    class="flex flex-col md:flex-row gap-4 p-4 bg-white border border-gray-200 rounded-xl items-center group hover:border-indigo-200 transition-all"
  >
    <div class="flex-[3] w-full">
      <AppInputSku
        :model-value="modelValue"
        @update:model-value="(val) => $emit('update:modelValue', val)"
        @validate="$emit('validate')"
        placeholder="Ketik atau Scan SKU..."
      />
      <div v-if="modelValue.isValid" class="flex items-center gap-1 mt-1">
        <span class="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter"
          >Produk:</span
        >
        <span class="text-xs font-semibold text-gray-700 truncate">{{
          modelValue.namaProduk
        }}</span>
      </div>
    </div>

    <div class="w-full md:w-40">
      <div
        class="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
      >
        <button
          @click="updateQty(-1)"
          class="px-5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold border-r transition-colors"
        >
          -
        </button>
        <input
          type="number"
          :value="modelValue.quantity"
          @input="onInput('quantity', Number(($event.target as HTMLInputElement).value))"
          class="w-full text-center pl-3 py-2 outline-none font-bold text-indigo-600"
        />
        <button
          @click="updateQty(1)"
          class="px-5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold border-l transition-colors"
        >
          +
        </button>
      </div>
    </div>

    <button
      v-if="showDelete"
      @click="$emit('remove')"
      class="p-2.5 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
      title="Hapus baris"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import AppInputSku from '@/components/app-input-sku.vue'

const props = defineProps<{ modelValue: any; showDelete: boolean }>()
const emit = defineEmits(['update:modelValue', 'remove', 'validate'])

const onInput = (field: string, value: any) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

const updateQty = (delta: number) => {
  const newQty = Math.max(1, (props.modelValue.quantity || 0) + delta)
  onInput('quantity', newQty)
}
</script>
