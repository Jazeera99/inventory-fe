<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loggedInUser = ref({
  name: 'Guest',
  username: 'guest01',
})

const openCategories = reactive<Record<string, boolean>>({
  manajemen: true,
  transaksi: false,
  laporan: false,
  pengaturan: false,
})

const filteredMenuGroups = computed(() => {
  const rawGroups = [
    {
      name: 'Manajemen Data',
      id: 'manajemen',
      items: [
        { name: 'Daftar Supplier', path: '/supplier', permission: 'Lihat Supplier' },
        { name: 'Daftar Customer', path: '/customer', permission: 'Lihat Customer' },
        { name: 'Manajemen Rak', path: '/rak', permission: 'Lihat Rak' },
        { name: 'Daftar Kategori', path: '/kategori', permission: 'Lihat Kategori' },
        { name: 'Daftar Produk', path: '/produk', permission: 'Lihat Produk' },
      ],
    },
    {
      name: 'Transaksi Stok',
      id: 'transaksi',
      items: [
        { name: 'Stok Order', path: '/stok-order', permission: 'Transaksi' },
        { name: 'Produk Masuk', path: '/produk-masuk', permission: 'Transaksi' },
        { name: 'Produk Keluar', path: '/produk-keluar', permission: 'Transaksi' },
        { name: 'Pindah Produk', path: '/pindah-produk', permission: 'Transaksi' },
        { name: 'Penyesuaian Stok', path: '/stock-adjustment', permission: 'Transaksi' },
      ],
    },
    {
      name: 'Laporan',
      id: 'laporan',
      items: [
        { name: 'Daftar Stok', path: '/daftar-stok', permission: 'Laporan Stok' },
        { name: 'Kartu Stok', path: '/kartu-stok', permission: 'Laporan Stok' },
      ],
    },
    {
      name: 'Pengaturan Sistem',
      id: 'pengaturan',
      items: [
        { name: 'Manajemen User', path: '/users', permission: 'Manajemen User' },
        { name: 'Hak Akses', path: '/roles', permission: 'Hak Akses' },
      ],
    },
  ]
  return rawGroups
    .map((group) => {
      const allowedItems = group.items.filter((item) => authStore.hasPermission(item.permission))
      return { ...group, items: allowedItems }
    })
    .filter((group) => group.items.length > 0) // Jika satu group kosong (misal semua menu pengaturan dicopot), sembunyikan seluruh judul kategorinya
})

onMounted(() => {
  if (route.path.includes('users') || route.path.includes('roles')) {
    openCategories.pengaturan = true
  }

  const savedUser = localStorage.getItem('user')
  if (savedUser) {
    try {
      const parsedUser = JSON.parse(savedUser)
      // Sesuaikan dengan properti data backend: full_name dan username
      loggedInUser.value.name = parsedUser.full_name || parsedUser.name || 'Guest'
      loggedInUser.value.username = parsedUser.username || 'guest01'
    } catch (error) {
      console.error('Gagal membaca data user dari localStorage:', error)
    }
  }
})

const toggleCategory = (id: string) => {
  openCategories[id] = !openCategories[id]
}

const isActive = (path: string) => route.path === path

const handleLogout = () => {
  const confirmLogout = confirm('Apakah Anda yakin ingin keluar dari sistem?')
  if (confirmLogout) {
    // Bersihkan session token login kamu di sini jika ada, contoh:
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    // Tendang balik ke halaman login
    router.push('/login')
  }
}
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
          <span class="truncate">Inventory</span>
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

        <div v-for="group in filteredMenuGroups" :key="group.id">
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
          <div class="ml-3">
            <p class="text-sm font-medium text-white">{{ loggedInUser.name }}</p>
            <p class="text-xs text-gray-400">{{ loggedInUser.username }}</p>
          </div>
          <div p-4 class="ml-auto">
            <button
              @click="handleLogout"
              title="Keluar Sistem"
              class="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors shrink-0"
            >
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
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
