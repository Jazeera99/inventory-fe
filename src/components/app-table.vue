<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th
              v-for="h in headers"
              :key="h.text"
              :class="[
                'px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider',
                h.align === 'right' ? 'text-right' : 'text-left',
              ]"
            >
              {{ h.text }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <slot></slot>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
// Kita buat prop headers lebih canggih agar bisa atur posisi teks (kiri/kanan)
defineProps<{
  headers: { text: string; align?: 'left' | 'right' }[]
}>()
</script>
