import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from '@/../src/App.vue'
import MainLayout from '@/views/layout/main-layout.vue'
import Login from '@/views/auth/page-login.vue'
import Dashboard from '@/views/dashboard/page-dashboard.vue'
import Produk from '@/views/manajemen/produk.vue'
import Rak from '@/views/manajemen/rak.vue'
import Kategori from '@/views/manajemen/category.vue'
import ProdukKeluar from '@/views/transaksi/produk-keluar.vue'
import PindahProduk from '@/views/transaksi/pindah-produk.vue'
import StockAdjustment from '@/views/transaksi/stock-adjustment.vue'
import DaftarStok from '@/views/laporan/daftar-stok.vue'
import KartuStok from '@/views/laporan/kartu-stok.vue'
import ProdukMasuk from '@/views/transaksi/produk-masuk.vue'
import Users from '@/views/pengaturan/user.vue'
import Roles from '@/views/pengaturan/role.vue'
import Supplier from '@/views/manajemen/supplier.vue'
import Customer from '@/views/manajemen/customer.vue'
import StokOrder from '@/views/transaksi/stock-order.vue'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { guestOnly: true },
  },

  {
    path: '/',
    component: MainLayout,
    redirect: 'dashboard',
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', name: 'dashboard', component: Dashboard },
      {
        path: 'supplier',
        name: 'supplier',
        component: Supplier,
        meta: { permission: 'Lihat Supplier' },
      },
      {
        path: 'customer',
        name: 'customer',
        component: Customer,
        meta: { permission: 'Lihat Customer' },
      },
      { path: 'rak', component: Rak, meta: { permission: 'Lihat Rak' } },
      { path: 'kategori', component: Kategori, meta: { permission: 'Lihat Kategori' } },
      { path: 'produk', component: Produk, meta: { permission: 'Lihat Produk' } },
      { path: 'stok-order', component: StokOrder, meta: { permission: 'Transaksi' } },
      { path: 'produk-masuk', component: ProdukMasuk, meta: { permission: 'Transaksi' } },
      { path: 'produk-keluar', component: ProdukKeluar, meta: { permission: 'Transaksi' } },
      { path: 'pindah-produk', component: PindahProduk, meta: { permission: 'Transaksi' } },
      {
        path: 'stock-adjustment',
        component: StockAdjustment,
        meta: { permission: 'Transaksi' },
      },
      { path: 'daftar-stok', component: DaftarStok, meta: { permission: 'Laporan Stok' } },
      { path: 'kartu-stok', component: KartuStok, meta: { permission: 'Laporan Stok' } },
      { path: 'users', component: Users, meta: { permission: 'Manajemen User' } },
      { path: 'roles', component: Roles, meta: { permission: 'Hak Akses' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  // Ambil token dari localStorage (sesuaikan jika Anda menyimpannya di cookies/state pinia)
  const token = localStorage.getItem('token')
  const authStore = useAuthStore()

  // KONDISI 1: User mau masuk ke halaman rahasia, tapi TIDAK PUNYA token
  if (to.matched.some((record) => record.meta.requiresAuth) && !token) {
    // Tendang paksa ke halaman login
    next({ name: 'login' })
  }
  // KONDISI 2: User SUDAH login, tapi iseng mau buka halaman /login lagi
  else if (to.matched.some((record) => record.meta.guestOnly) && token) {
    // Kembalikan ke dashboard, tidak usah login ulang
    next({ name: 'dashboard' })
  }
  // KONDISI 3: Aman, silakan lewat
  if (to.meta.permission && !authStore.hasPermission(to.meta.permission as string)) {
    alert('Akses ditolak! Anda tidak memiliki izin untuk membuka halaman ini.')
    return next({ name: 'dashboard' }) // Buang ke dashboard
  }

  next()
})

const app = createApp(App)
app.use(router)
app.mount('#app')

export default router
