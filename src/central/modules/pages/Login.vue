<script setup lang="ts">
import { useMouse, useWindowSize } from '@vueuse/core'
import {
  Landmark,
  ShieldCheck,
  Wallet,
  PieChart,
  TrendingUp,
  Users,
  Eye,
  EyeOff,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import InputError from '@/components/InputError.vue'
import TextLink from '@/components/TextLink.vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import AuthBase from '@/layouts/auth/AuthSplitLayout.vue'

const router = useRouter()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const processing = ref(false)
const errors = ref<{ email?: string; password?: string }>({})
const status = ref('')

const canResetPassword = ref(true)
const canRegister = ref(true)

const { x, y } = useMouse()
const { width, height } = useWindowSize()

// Parallax calculation for 3D effect
const parallaxStyle = computed(() => {
  const rotateY = ((x.value - width.value / 2) / width.value) * 15
  const rotateX = ((y.value - height.value / 2) / height.value) * -15
  return {
    transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
  }
})

const elements = [
  { icon: Landmark, label: 'Sacco Management', angle: 0, z: '40px', delay: '0s' },
  { icon: ShieldCheck, label: 'Secure Deposits', angle: 60, z: '80px', delay: '0.2s' },
  { icon: Wallet, label: 'Easy Withdrawals', angle: 120, z: '60px', delay: '0.4s' },
  { icon: PieChart, label: 'Real-time Audits', angle: 180, z: '100px', delay: '0.1s' },
  { icon: TrendingUp, label: 'Smart Dividends', angle: 240, z: '50px', delay: '0.3s' },
  { icon: Users, label: 'Member Growth', angle: 300, z: '70px', delay: '0.5s' },
]

const showPassword = ref(false)

const submit = async () => {
  processing.value = true
  errors.value = {}

  // Simulate API call
  setTimeout(() => {
    processing.value = false
    // authStore.login(...)
    router.push('/central')
  }, 1500)
}
</script>

<template>
  <AuthBase title="Welcome back" description="Sign in to your account to continue">
    <div
      v-if="status"
      class="mb-6 rounded-lg bg-green-50 p-4 text-center text-sm font-medium text-green-600 border border-green-100"
    >
      {{ status }}
    </div>

    <form @submit.prevent="submit" class="flex flex-col gap-8">
      <div class="grid gap-6">
        <div class="grid gap-2">
          <Label for="email" class="text-sm font-semibold text-[#001d22]">Email address</Label>
          <Input
            id="email"
            type="email"
            name="email"
            v-model="email"
            required
            autofocus
            :tabindex="1"
            autocomplete="email"
            placeholder="Enter your email"
            class="h-12 border-[#d1dfdb] focus:border-[#001d22] focus:ring-[#001d22]/10"
          />
          <InputError :message="errors.email" />
        </div>

        <div class="grid gap-2">
          <div class="flex items-center justify-between">
            <Label for="password" class="text-sm font-semibold text-[#001d22]">Password</Label>
          </div>
          <div class="relative">
            <Input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              v-model="password"
              required
              :tabindex="2"
              autocomplete="current-password"
              placeholder="Enter your password"
              class="h-12 w-full pr-12 border-[#d1dfdb] focus:border-[#001d22] focus:ring-[#001d22]/10"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-[#001d22] transition-colors"
              tabindex="-1"
            >
              <component :is="showPassword ? EyeOff : Eye" :size="20" />
            </button>
          </div>
          <InputError :message="errors.password" />
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Checkbox id="remember" name="remember" v-model="rememberMe" :tabindex="3" />
            <Label for="remember" class="text-sm text-muted-foreground cursor-pointer"
              >Remember me</Label
            >
          </div>
          <TextLink
            v-if="canResetPassword"
            href="/central/forgot-password"
            class="text-sm font-medium text-[#001d22] hover:underline"
            :tabindex="5"
          >
            Forgot password?
          </TextLink>
        </div>

        <Button
          type="submit"
          class="h-12 w-full bg-[#001d22] hover:bg-[#001d22]/90 text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#001d22]/10"
          :tabindex="4"
          :disabled="processing"
          data-test="login-button"
        >
          <Spinner v-if="processing" class="mr-2" />
          Sign in
        </Button>
      </div>

      <div class="text-center text-sm text-muted-foreground" v-if="canRegister">
        Don't have an account?
        <TextLink
          href="/register"
          class="font-semibold text-[#001d22] hover:underline"
          :tabindex="5"
          >Register
        </TextLink>
      </div>
    </form>

    <template #right-panel>
      <div
        class="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[#001418]"
      >
        <!-- 3D Interactive Scene -->
        <div
          class="relative w-full h-[600px] flex items-center justify-center transform-gpu"
          :style="parallaxStyle"
        >
          <!-- Central Outstanding Hub -->
          <div
            class="relative z-20 group transition-all duration-700 ease-out"
            style="transform: translateZ(50px)"
          >
            <!-- Outer Glow Rings -->
            <div
              class="absolute -inset-8 bg-white/10 blur-3xl rounded-full animate-pulse group-hover:bg-white/20 transition-all duration-700"
            ></div>
            <div
              class="absolute -inset-4 border border-white/10 rounded-[2.5rem] animate-[spin_10s_linear_infinite] opacity-40"
            ></div>

            <!-- Main Logo Container -->
            <div
              class="relative w-48 h-48 bg-white backdrop-blur-2xl border border-white/20 rounded-[3rem] flex flex-col items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-105 overflow-hidden"
            >
              <img
                src="/images/mfuko_plus_logo.webp"
                alt="Mfuko Plus Logo"
                class="w-full h-full object-contain p-6"
              />
            </div>
          </div>

          <!-- Circular Orbiting Elements -->
          <div
            v-for="(el, i) in elements"
            :key="i"
            class="absolute flex flex-col items-center gap-3 transition-opacity duration-1000"
            :style="{
              transform: `rotate(${el.angle}deg) translate(250px) rotate(-${el.angle}deg) translateZ(${el.z})`,
            }"
          >
            <!-- Animation Wrapper -->
            <div
              class="animate-float flex flex-col items-center gap-3"
              :style="{ animationDelay: el.delay, '--tw-translate-z': el.z }"
            >
              <!-- Outstanding Icon Box -->
              <div
                class="p-5 bg-[#001d22]/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl hover:bg-[#002d35]/60 hover:border-white/30 transition-all cursor-default group/icon"
              >
                <component
                  :is="el.icon"
                  class="w-10 h-10 text-white/80 group-hover/icon:text-white transition-colors"
                />
              </div>

              <!-- Premium Label Tag -->
              <div
                class="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/5 shadow-lg"
              >
                <span
                  class="text-[10px] font-bold text-white/70 tracking-[0.2em] uppercase whitespace-nowrap"
                  >{{ el.label }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Text Content -->
        <div
          class="mt-8 text-center space-y-4 max-w-sm relative z-30 px-6 transform transition-all duration-1000"
        >
          <h2 class="text-6xl font-black tracking-tight text-white leading-tight">
            Mfuko Pro
            <span
              class="block text-xl mt-4 text-[#2dd4bf] tracking-[0.3em] uppercase font-black drop-shadow-[0_0_10px_rgba(45,212,191,0.3)]"
            >
              THE LEDGER OF YOUR GROWTH
            </span>
          </h2>
        </div>

        <!-- Decorative Background Elements -->
        <div
          class="absolute inset-0 bg-gradient-to-b from-[#001418] via-transparent to-[#001418] pointer-events-none"
        ></div>
      </div>
    </template>
  </AuthBase>
</template>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-15px);
  }
}

.animate-float {
  animation: float 8s ease-in-out infinite;
  transform-style: preserve-3d;
}

:deep(.relative.z-10.w-full.max-w-lg) {
  perspective: 1500px;
}

.transform-gpu {
  transform-style: preserve-3d;
}

/* Ensure the layout container takes full height and width without padding */
:deep(.auth-container) {
  padding: 0;
  margin: 0;
  max-width: none;
}
</style>
