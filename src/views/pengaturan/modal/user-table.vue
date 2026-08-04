<script setup lang="ts">
import AppTable from '@/components/app-table.vue'
import AppButton from '@/components/app-button.vue'

defineProps<{ users: any[] }>()
defineEmits(['edit', 'toggle'])

const tableHeaders = [
  { text: 'User', align: 'left' as const },
  { text: 'Role', align: 'left' as const },
  { text: 'Aksi', align: 'right' as const },
]
</script>

<template>
  <AppTable :headers="tableHeaders">
    <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50/50 transition-colors">
      <!-- 1. KOLOM USER -->
      <td class="px-6 py-4">
        <div class="flex items-center">
          <div
            class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3"
          >
            {{ user.full_name?.charAt(0) || 'U' }}
          </div>
          <div>
            <div class="font-medium text-gray-900">{{ user.full_name }}</div>
            <div class="text-xs text-gray-500">{{ user.username }}</div>
          </div>
        </div>
      </td>

      <!-- 2. KOLOM ROLE (Tampilkan selalu nama rolenya) -->
      <td class="px-6 py-4 text-sm text-gray-600">
        <span
          class="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-gray-200"
        >
          {{ user.role?.name || 'Tanpa Role' }}
        </span>
      </td>

      <!-- 3. KOLOM AKSI -->
      <td class="px-6 py-4 text-right space-x-3">
        <!-- Jika Superadmin / Admin Utama: Tampilkan Badge Proteksi -->
        <template
          v-if="
            user.username === 'admin' ||
            user.id === 1 ||
            user.role?.name.toLowerCase() === 'superadmin'
          "
        >
          <span
            class="inline-block text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-medium"
          >
            🔒 Proteksi Akun
          </span>
        </template>

        <!-- Jika User Biasa: Tampilkan Tombol Status & Edit -->
        <template v-else>
          <AppButton
            :variant="user.is_active ? 'success' : 'outline'"
            size="sm"
            @click="$emit('toggle', user)"
          >
            {{ user.is_active ? 'Aktif' : 'Non-Aktif' }}
          </AppButton>

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
        </template>
      </td>
    </tr>
  </AppTable>
</template>
