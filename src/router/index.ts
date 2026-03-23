import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from '@/../src/App.vue'
import MainLayout from '@/views/layout/main-layout.vue'
import Dashboard from '@/views/dashboard/page-dashboard.vue'
import DaftarStok from '@/views/laporan/daftar-stok.vue'
import KartuStok from '@/views/laporan/kartu-stok.vue'
import ProdukMasuk from '@/views/transaksi/produk-masuk.vue'
import Users from '@/views/pengaturan/user.vue'
import Roles from '@/views/pengaturan/role.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: Dashboard },
      { path: 'daftar-stok', component: DaftarStok },
      { path: 'kartu-stok', component: KartuStok },
      { path: 'produk-masuk', component: ProdukMasuk },
      { path: 'user', component: Users },
      { path: 'role', component: Roles },
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
