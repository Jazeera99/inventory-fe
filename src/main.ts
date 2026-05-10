import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
// import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'
import router from '@/router'
import GlobalComponents from '@/components'
import GlobalDirectives from '@/directives'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(GlobalComponents)
app.use(GlobalDirectives)
app.use(router)

app.mount('#app')
