import './assets/main.css'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'
import GlobalComponents from '@/components'
import GlobalDirectives from '@/directives'

// Import Views
import MainLayout from './views/layout/main-layout.vue'
import Dashboard from './views/dashboard/page-dashboard.vue'
import Rak from './views/manajemen/rak.vue'
import Produk from './views/manajemen/produk.vue'
import ProdukMasuk from './views/transaksi/produk-masuk.vue'
import ProdukKeluar from './views/transaksi/produk-keluar.vue'
import PindahProduk from './views/transaksi/pindah-produk.vue'
import StockAdjustment from './views/transaksi/stock-adjustment.vue'
import DaftarStok from './views/laporan/daftar-stok.vue'
import KartuStok from './views/laporan/kartu-stok.vue'
import Users from './views/pengaturan/user.vue'
import Roles from './views/pengaturan/role.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'page-dashboard', component: Dashboard },
      { path: 'rak', name: 'rak', component: Rak },
      { path: 'produk', name: 'produk', component: Produk },
      { path: 'produk-masuk', name: 'produk-masuk', component: ProdukMasuk },
      { path: 'produk-keluar', name: 'produk-keluar', component: ProdukKeluar },
      { path: 'pindah-produk', name: 'pindah-produk', component: PindahProduk },
      { path: 'stock-adjustment', name: 'stock-adjustment', component: StockAdjustment },
      { path: 'daftar-stok', name: 'daftar-stok', component: DaftarStok },
      { path: 'kartu-stok', name: 'kartu-stok', component: KartuStok },
      { path: 'users', name: 'users', component: Users },
      { path: 'roles', name: 'roles', component: Roles },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const app = createApp(App)

// DAFTARKAN PLUGIN DI SINI
app.use(GlobalComponents)
app.use(GlobalDirectives)
app.use(router)

app.mount('#app')
