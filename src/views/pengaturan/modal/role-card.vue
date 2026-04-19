<template>
  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group">
    <div class="flex justify-between items-start mb-4">
      <h3 class="font-bold text-lg text-gray-900">{{ role.role_name }}</h3>
      <div class="flex space-x-2">
        <button
          @click="$emit('edit', role)"
          class="text-gray-400 hover:text-blue-600 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
        <button
          @click="$emit('delete', role.id)"
          class="text-gray-400 hover:text-red-600 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Izin Akses:</p>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="p in role.permissions"
          :key="p"
          class="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-medium border border-blue-100"
        >
          {{ p }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ role: any }>()
defineEmits(['edit', 'delete'])
</script>
