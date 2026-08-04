<script setup lang="ts">
defineProps({
  modelValue: {
    type: [String, Object, Number],
    default: '',
  },
  label: String,
  placeholder: String,
  type: { type: String, default: 'text' },
  error: {
    type: [String, Array],
    default: '',
  },
})
defineEmits(['update:modelValue', 'focus', 'blur'])
</script>

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
      class="px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all duration-200"
    />
    <p v-if="error" class="text-xs text-red-500 mt-0.5">
      {{ Array.isArray(error) ? error[0] : error }}
    </p>
  </div>
</template>
