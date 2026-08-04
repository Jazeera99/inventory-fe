<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: number | string | null
  options: any[]
  placeholder?: string
}>()

const emit = defineEmits(['update:modelValue'])

const search = ref('')
const showDropdown = ref(false)
const isTyping = ref(false)

watch(
  () => props.modelValue,
  (newId) => {
    if (newId) {
      const found = props.options.find((r) => r.id === newId)
      if (found) {
        search.value = `${found.location_code} (${found.rack_name})`
      }
    } else {
      search.value = ''
    }
  },
  { immediate: true },
)

const filteredRacks = computed(() => {
  if (!showDropdown.value) return []

  const s = search.value.toLowerCase().trim()

  // ⚡ JIKA INPUT KOSONG atau user tidak sedang mengetik (baru klik focus), tampilkan semua opsi rekomendasi awal
  if (!s || !isTyping.value) {
    return props.options.slice(0, 15) // Tampilkan 15 data pertama agar lebih banyak pilihan
  }

  // JIKA USER MENGETIK, lakukan filter pencarian yang fleksibel
  return props.options
    .filter((r) => {
      const code = r.location_code.toLowerCase()
      const name = r.rack_name.toLowerCase()
      return code.includes(s) || name.includes(s)
    })
    .slice(0, 15)
})

const selectRack = (rack: any) => {
  isTyping.value = false
  emit('update:modelValue', rack.id)
  search.value = `${rack.location_code} (${rack.rack_name})`
  showDropdown.value = false
}

const onFocus = () => {
  showDropdown.value = true
}

const onInput = () => {
  isTyping.value = true // Set status mengetik jadi true saat ada input keyboard
  showDropdown.value = true
}

const onBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
    isTyping.value = false
  }, 250)
}
</script>

<template>
  <div class="relative w-full">
    <input
      type="text"
      v-model="search"
      @focus="onFocus"
      @input="onInput"
      @blur="onBlur"
      :placeholder="placeholder"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm bg-white"
    />

    <div
      v-if="showDropdown && filteredRacks.length > 0"
      class="absolute z-[60] w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-40 overflow-y-auto"
    >
      <div
        v-for="rack in filteredRacks"
        :key="rack.id"
        @mousedown="selectRack(rack)"
        class="px-3 py-2 hover:bg-orange-50 cursor-pointer border-b last:border-0 transition-colors"
      >
        <p class="text-xs font-bold text-gray-800">{{ rack.location_code }}</p>
        <p class="text-[10px] text-gray-500 uppercase">{{ rack.rack_name }}</p>
      </div>
    </div>
  </div>
</template>
