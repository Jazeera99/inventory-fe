<template>
  <div class="flex flex-col gap-1 w-full">
    <label v-if="label" class="text-sm font-medium text-gray-700">{{ label }}</label>
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
      :type="type"
      :placeholder="placeholder"
      class="px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
    />
  </div>
</template>

<script setup lang="ts">
defineProps({
  modelValue: {
    type: [String, Object, Number],
    default: '',
  },
  label: String,
  placeholder: String,
  type: { type: String, default: 'text' },
})
defineEmits(['update:modelValue', 'focus', 'blur'])
</script>
