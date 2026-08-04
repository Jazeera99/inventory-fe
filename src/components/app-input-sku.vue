<script setup lang="ts">
const props = defineProps<{
  modelValue: { produkSku: string; isValid: boolean; isError: boolean }
  placeholder?: string
}>()
const emit = defineEmits(['update:modelValue', 'validate', 'openSearch', 'focus', 'blur'])

const onInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  // Reset status saat user mengetik ulang
  emit('update:modelValue', { ...props.modelValue, produkSku: val, isValid: false, isError: false })
}

const onFocus = () => emit('focus')
const onBlur = () => emit('blur')
</script>

<template>
  <div class="relative">
    <input
      type="text"
      :value="modelValue.produkSku"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keyup.enter="$emit('validate')"
      :placeholder="placeholder"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
      :class="[
        modelValue.isValid
          ? 'border-green-500 bg-green-50'
          : modelValue.isError
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 focus:ring-2 focus:ring-blue-100',
      ]"
    />

    <div class="absolute right-2 top-1.5 flex items-center gap-1">
      <!-- <span v-if="modelValue.isValid" class="text-green-500">✅</span>
      <span v-if="modelValue.isError" class="text-red-500">❌</span> -->
      <button
        type="button"
        @click="$emit('openSearch')"
        class="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
      ></button>
    </div>
  </div>
</template>
