import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from '@/../src/App.vue'
import MainLayout from '@/views/layout/main-layout.vue'
import Login from '@/views/auth/page-login.vue'
import Dashboard from '@/views/dashboard/page-dashboard.vue'
import Produk from '@/views/manajemen/produk.vue'
import Rak from '@/views/manajemen/rak.vue'
import ProdukKeluar from '@/views/transaksi/produk-keluar.vue'
import PindahProduk from '@/views/transaksi/pindah-produk.vue'
import StockAdjustment from '@/views/transaksi/stock-adjustment.vue'
import DaftarStok from '@/views/laporan/daftar-stok.vue'
import KartuStok from '@/views/laporan/kartu-stok.vue'
import ProdukMasuk from '@/views/transaksi/produk-masuk.vue'
import Users from '@/views/pengaturan/user.vue'
import Roles from '@/views/pengaturan/role.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: Login,
  },

  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'dashboard', component: Dashboard },
      { path: 'rak', component: Rak },
      { path: 'produk', component: Produk },
      { path: 'produk-masuk', component: ProdukMasuk },
      { path: 'produk-keluar', component: ProdukKeluar },
      { path: 'pindah-produk', component: PindahProduk },
      { path: 'stock-adjustment', component: StockAdjustment },
      { path: 'daftar-stok', component: DaftarStok },
      { path: 'kartu-stok', component: KartuStok },
      { path: 'users', component: Users },
      { path: 'roles', component: Roles },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const app = createApp(App)
app.use(router)
app.mount('#app')

export default router
