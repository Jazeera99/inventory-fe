<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import AppInput from '@/components/app-input.vue'
import AppButton from '@/components/app-button.vue'
import AppCard from '@/components/app-card.vue'
import { useAuthLogin } from '@/models/auth'

const router = useRouter()
const loading = ref(false)
const showPassword = ref(false)

const { form, submitting, errors, submit } = useAuthLogin()

const handleLogin = async () => {
  await submit()
}

// const handleLogin = async () => {
//   try {
//     // 1. Jalankan proses hit API login melalui fungsi submit() bawaan model
//     await submit()

//     // 2. Cek apakah token sudah masuk ke localStorage setelah submit sukses
//     // (Pastikan di dalam fungsi `submit()` Anda sudah ada kode localStorage.setItem('token', ...))
//     const token = localStorage.getItem('token')

//     if (token) {
//       // 3. Jika token ada, pindahkan user ke dashboard secara manual!
//       router.push('/dashboard')
//     }
//   } catch (error) {
//     console.error('Login gagal:', error)
//   }
// }
</script>

<template>
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden">
    <!-- Background Image dengan Overlay -->
    <div class="absolute inset-0 z-0">
      <div
        class="absolute inset-0 bg-gradient-to-br from-white-900/90 via-orange-900/80 to-black/90 z-10"
      ></div>
      <img src="/img/bg_login.jpg" alt="Warehouse Background" class="w-full h-full object-cover" />
    </div>

    <!-- Decorative Elements -->
    <div class="absolute inset-0 z-10 overflow-hidden">
      <div
        class="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
      ></div>
      <div
        class="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"
      ></div>
      <div
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"
      ></div>
    </div>

    <!-- Login Card -->
    <div class="relative z-20 w-full max-w-md px-6">
      <AppCard
        class="backdrop-blur-sm bg-white/95 shadow-2xl transform transition-all duration-500 hover:scale-105"
      >
        <!-- Logo/Brand -->
        <template #header>
          <div class="text-center">
            <div
              class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg mb-4"
            >
              <svg
                class="w-10 h-10 text-white"
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
            </div>
            <h2 class="text-2xl font-bold text-gray-900">Selamat Datang</h2>
            <p class="text-gray-600 mt-2">Silakan login untuk melanjutkan</p>
          </div>
        </template>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-5">
          <AppInput
            v-model="form.username"
            label="Username"
            placeholder="Masukkan username"
            :required="true"
            :error="errors.username?.[0]"
            type="text"
          >
            <template #icon>
              <svg
                class="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </template>
          </AppInput>

          <AppInput
            v-model="form.password"
            label="Password"
            placeholder="Masukkan password"
            :required="true"
            :error="errors.password?.[0]"
            :type="showPassword ? 'text' : 'password'"
          >
            <template #icon>
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="focus:outline-none"
              >
                <svg
                  v-if="!showPassword"
                  class="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <svg
                  v-else
                  class="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              </button>
            </template>
          </AppInput>

          <div class="flex items-center justify-between">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="form.remember"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-600">Ingat saya</span>
            </label>
            <!-- <a href="#" class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >Lupa password?</a
            > -->
          </div>

          <AppButton
            type="submit"
            variant="primary"
            :loading="submitting"
            label="Login"
            class="w-full"
            Login
            >Login
          </AppButton>

          <!-- Demo Credentials -->
          <!-- <div class="mt-4 p-3 bg-blue-50 rounded-lg">
            <p class="text-xs text-blue-800 text-center">
              <strong>Demo Credentials:</strong><br />
              Username: admin | Password: admin123
            </p>
          </div> -->
        </form>

        <!-- <template #footer>
          <div class="text-center text-sm text-gray-600">
            Belum punya akun?
            <a href="#" class="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >Hubungi Administrator</a
            >
          </div>
        </template> -->
      </AppCard>

      <!-- Footer -->
      <div class="text-center mt-8 text-white/60 text-sm">
        &copy; 2026 Inventory System. All rights reserved.
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
