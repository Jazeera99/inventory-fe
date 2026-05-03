<script setup lang="ts">
import { reactive } from 'vue'
import { useRoute } from 'vue-router'
import { onMounted } from 'vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])
const route = useRoute()

const openCategories = reactive<Record<string, boolean>>({
  manajemen: true,
  transaksi: false,
  laporan: false,
  pengaturan: false,
})

const menuGroups = [
  {
    name: 'Manajemen Data',
    id: 'manajemen',
    items: [
      { name: 'Manajemen Rak', path: '/rak' },
      { name: 'Manajemen Kategori', path: '/kategori' },
      { name: 'Daftar Produk', path: '/produk' },
    ],
  },
  {
    name: 'Transaksi Stok',
    id: 'transaksi',
    items: [
      { name: 'Produk Masuk', path: '/produk-masuk' },
      { name: 'Produk Keluar', path: '/produk-keluar' },
      { name: 'Pindah Produk', path: '/pindah-produk' },
      { name: 'Stock Adjustment', path: '/stock-adjustment' },
    ],
  },
  {
    name: 'Laporan',
    id: 'laporan',
    items: [
      { name: 'Daftar Stok', path: '/daftar-stok' },
      { name: 'Kartu Stok', path: '/kartu-stok' },
    ],
  },
  {
    name: 'Pengaturan Sistem',
    id: 'pengaturan',
    items: [
      { name: 'Manajemen User', path: '/users' },
      { name: 'Hak Akses', path: '/roles' },
    ],
  },
]

onMounted(() => {
  if (route.path.includes('users') || route.path.includes('roles')) {
    openCategories.pengaturan = true
  }
})

const toggleCategory = (id: string) => {
  openCategories[id] = !openCategories[id]
}

const isActive = (path: string) => route.path === path
</script>

<template>
  <aside
    class="fixed top-0 left-0 z-40 w-64 h-screen transition-transform duration-300 ease-in-out lg:translate-x-0"
    :class="[isOpen ? 'translate-x-0' : '-translate-x-full']"
  >
    <div
      class="h-full px-3 py-4 overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col"
    >
      <div class="flex items-center justify-between mb-6 px-2">
        <h1 class="text-xl font-semibold text-white flex items-center">
          <svg
            class="h-8 w-8 mr-2 text-blue-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <span class="truncate">Inventory Pro</span>
        </h1>
        <button @click="emit('close')" class="lg:hidden text-gray-400 hover:text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <nav class="flex-1 space-y-2">
        <router-link to="/" class="nav-link" :class="{ active: isActive('/') }">
          <span class="ml-3 text-sm font-medium">Dashboard</span>
        </router-link>

        <div v-for="group in menuGroups" :key="group.id">
          <button @click="toggleCategory(group.id)" class="menu-group-btn">
            {{ group.name }}
            <svg
              class="w-4 h-4 transition-transform"
              :class="{ 'rotate-180': openCategories[group.id] }"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <div v-show="openCategories[group.id]" class="pl-2 space-y-1 mt-1">
            <router-link
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="sub-nav-link"
              :class="{ 'sub-active': isActive(item.path) }"
            >
              <span class="ml-3">{{ item.name }}</span>
            </router-link>
          </div>
        </div>
      </nav>

      <div class="p-4 border-t border-gray-700">
        <div class="flex items-center">
          <div
            class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold"
          >
            A
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-white">Admin User</p>
            <p class="text-xs text-gray-400">admin@inventory.com</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
@reference "@/assets/main.css";

.nav-link {
  @apply flex items-center px-4 py-3 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200;
}
.active {
  @apply bg-gray-700 text-white;
}
.menu-group-btn {
  @apply w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors mt-4;
}
.sub-nav-link {
  @apply flex items-center px-4 py-2 text-sm text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-all duration-200;
}
.sub-active {
  @apply bg-gray-800 text-blue-400 font-medium;
}
.badge {
  @apply ml-auto bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full;
}
</style>
