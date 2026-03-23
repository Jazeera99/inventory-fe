<template>
  <div
    class="flex flex-col md:flex-row gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 relative group transition-all"
  >
    <div class="flex-1 relative">
      <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight"
        >Kode SKU Produk</label
      >

      <AppInputSku
        :model-value="modelValue"
        @update:model-value="(val) => $emit('update:modelValue', val)"
        @validate="$emit('validate')"
        @openSearch="$emit('openSearch')"
        placeholder="Input SKU lalu Enter... (untuk cek SKU)"
      />

      <p v-if="modelValue.isValid" class="text-[11px] text-green-600 mt-1 font-semibold italic">
        📦 {{ modelValue.namaProduk }}
      </p>
    </div>

    <div class="w-full md:w-28">
      <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight"
        >Qty</label
      >
      <input
        type="number"
        :value="modelValue.quantity"
        @input="onInputQty"
        @focus="onFocusQty"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
      />
    </div>

    <div class="flex-1">
      <label class="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight"
        >Keterangan Barang</label
      >
      <input
        type="text"
        :value="modelValue.keterangan"
        @input="onInputKeterangan"
        placeholder="Catatan..."
        class="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
      />
    </div>

    <button
      v-if="showDelete"
      type="button"
      @click="$emit('remove')"
      class="self-end md:mb-1.5 p-2 text-red-300 hover:text-red-600"
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
const emit = defineEmits(['update:modelValue', 'remove', 'openSearch', 'validate'])

const onInputQty = (e: Event) => {
  emit('update:modelValue', {
    ...props.modelValue,
    quantity: Number((e.target as HTMLInputElement).value),
  })
}

const onInputKeterangan = (e: Event) => {
  emit('update:modelValue', {
    ...props.modelValue,
    keterangan: (e.target as HTMLInputElement).value,
  })
}

const onFocusQty = (e: FocusEvent) => {
  ;(e.target as HTMLInputElement).select()
}
</script>
