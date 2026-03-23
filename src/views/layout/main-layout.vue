<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import TheSidebar from '@/views/_components/the-sidebar.vue'

const sidebarOpen = ref(false)
const route = useRoute()

// Logika penentuan judul tetap di sini karena berkaitan dengan router-view
const currentPageTitle = computed(() => {
  if (route.path === '/') return 'Dashboard'
  const menuNames: Record<string, string> = {
    '/rak': 'Manajemen Rak',
    '/produk': 'Daftar Produk',
    '/produk-masuk': 'Produk Masuk',
    '/produk-keluar': 'Produk Keluar',
    '/pindah-produk': 'Pindah Produk',
    '/stock-adjustment': 'Stock Adjustment',
    '/daftar-stok': 'Daftar Stok',
    '/kartu-stok': 'Kartu Stok',
    '/users': 'Manajemen User',
    '/roles': 'Pengaturan Hak Akses',
  }
  return menuNames[route.path] || 'Inventory System'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex">
    <TheSidebar :isOpen="sidebarOpen" @close="sidebarOpen = false" />

    <div
      v-if="sidebarOpen"
      @click="sidebarOpen = false"
      class="fixed inset-0 bg-gray-600/50 z-30 lg:hidden"
    ></div>

    <div class="flex-1 lg:ml-64 min-w-0">
      <header class="bg-white border-b h-16 flex items-center px-6 sticky top-0 z-20">
        <button @click="sidebarOpen = true" class="lg:hidden mr-4">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16m-7 6h7"
            ></path>
          </svg>
        </button>
        <h2 class="text-lg font-semibold">{{ currentPageTitle }}</h2>
      </header>

      <main class="p-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
@reference "@/assets/main.css";

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
