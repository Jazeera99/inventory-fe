<template>
  <AppTable :headers="tableHeaders">
    <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50/50 transition-colors">
      <td class="px-6 py-4">
        <div class="flex items-center">
          <div
            class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3"
          >
            {{ user.name.charAt(0) }}
          </div>
          <div>
            <div class="font-medium text-gray-900">{{ user.name }}</div>
            <div class="text-xs text-gray-500">{{ user.email }}</div>
          </div>
        </div>
      </td>

      <td class="px-6 py-4 text-sm text-gray-600">
        <span class="px-2 py-1 bg-gray-100 rounded text-xs">{{ user.role }}</span>
      </td>

      <td class="px-6 py-4 text-right space-x-3">
        <AppButton
          variant="ghost"
          size="sm"
          is-icon
          title="Edit User"
          @click="$emit('edit', user)"
          class="text-blue-600 hover:bg-blue-50"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </AppButton>
        <AppButton
          variant="danger"
          size="sm"
          is-icon
          title="Hapus User"
          @click="$emit('delete', user)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </AppButton>
      </td>
    </tr>
  </AppTable>
</template>

<script setup lang="ts">
import AppTable from '@/components/app-table.vue'
import AppButton from '@/components/app-button.vue'

defineProps<{ users: any[] }>()
defineEmits(['edit', 'delete'])

// Definisi Header untuk tabel user
const tableHeaders = [
  { text: 'User', align: 'left' },
  { text: 'Role', align: 'left' },
  { text: 'Aksi', align: 'right' },
]
</script>
