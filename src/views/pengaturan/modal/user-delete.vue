<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  >
    <div
      class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in duration-200"
    >
      <div
        class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 class="text-xl font-bold text-gray-900 mb-2">Hapus User?</h3>
      <p class="text-gray-500 text-sm mb-6">
        Tindakan ini tidak dapat dibatalkan. User <b>{{ userData?.name }}</b> akan kehilangan akses.
      </p>
      <div class="grid grid-cols-2 gap-3">
        <AppButton
          @click="$emit('close')"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
        >
          Batal
        </AppButton>
        <AppButton
          @click="$emit('confirm', userData.id)"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
        >
          Ya, Hapus
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppButton from '@/components/app-button.vue'

defineProps<{ isOpen: boolean; userData: any }>()
defineEmits(['close', 'confirm'])
</script>
