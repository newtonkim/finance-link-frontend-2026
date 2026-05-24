<script setup lang="ts">
import { useMouse, useWindowSize } from '@vueuse/core';
import { Landmark, ShieldCheck, Wallet, PieChart, TrendingUp, Users, Eye, EyeOff } from 'lucide-vue-next';
import { isAxiosError } from 'axios';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginApi } from '@/central/api/auth';
import { useAuthStore } from '@/stores/auth';
import {
  Button, InputError,
  TextLink,
  Checkbox,
  Input,
  Label,
  Spinner,
  AuthBase,
} from '@/Global';


const router = useRouter();
const authStore = useAuthStore();
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const processing = ref(false);
const errors = ref<{ email?: string; password?: string; form?: string }>({});
const status = ref('');
const canResetPassword = false;
const canRegister = true;

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
  processing.value = true;
  errors.value = {};
  status.value = '';

  try {
    const response = await loginApi({
      email: email.value,
      password: password.value,
      type: 'central',
    });

    authStore.setAuthSession(response.data);
    status.value = response.message;

    const redirectUrl = response.data.redirect_url;
    const targetPath =
      typeof redirectUrl === 'string' && redirectUrl.trim().length > 0
        ? redirectUrl.trim()
        : '/central/dashboard';

    if (targetPath.startsWith('http://') || targetPath.startsWith('https://') || targetPath.startsWith('//')) {
      window.location.assign(targetPath);
      return;
    }

    try {
      await router.push(targetPath);
    } catch {
      window.location.assign(targetPath);
    }
  } catch (error) {
    if (isAxiosError(error)) {
      const payload = error.response?.data as {
        message?: string;
        errors?: Record<string, string[]>;
      };

      if (payload?.errors?.email?.[0]) {
        errors.value.email = payload.errors.email[0];
      }
      if (payload?.errors?.password?.[0]) {
        errors.value.password = payload.errors.password[0];
      }

      if (!errors.value.email && !errors.value.password) {
        errors.value.form = payload?.message ?? 'Login failed. Please try again2.';
      }
    } else {
      errors.value.form = 'Login failed. Please try again1.';
    }
  } finally {
    processing.value = false;
  }
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
    <div
      v-if="errors.form"
      class="mb-6 rounded-lg bg-red-50 p-4 text-center text-sm font-medium text-red-600 border border-red-100"
    >
      {{ errors.form }}
    </div>

    <form @submit.prevent="submit" class="flex flex-col gap-8">
      <div class="grid gap-6">
        <div class="grid gap-2">
          <Label for="email" class="text-sm font-semibold  text-nfuko-primary">Email address</Label>
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
            class="h-12 border-[#d1dfdb] focus: border-nfuko-primary focus:ring-bg-nfuko-primary/10"
          />
          <InputError :message="errors.email" />
        </div>

        <div class="grid gap-2">
          <div class="flex items-center justify-between">
            <Label for="password" class="text-sm font-semibold  text-nfuko-primary">Password</Label>
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
              class="h-12 w-full pr-12 border-[#d1dfdb] focus: border-nfuko-primary focus:ring-bg-nfuko-primary/10"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover: text-nfuko-primary transition-colors"
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
            to="/central/forgot-password"
            class="text-sm font-medium  text-nfuko-primary hover:underline"
            :tabindex="5"
          >
            Forgot password?
          </TextLink>
        </div>

        <Button
          type="submit"
          style="background-color: #55a9d1;" class="h-12 w-full hover:opacity-90 text-white font-semibold rounded-xl transition-all shadow-lg"
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
          to="/central/register"
          class="font-semibold  text-nfuko-primary hover:underline"
          :tabindex="5"
          >Register
        </TextLink>
      </div>
    </form>

    <template #right-panel>
      <div
        class="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[#1d4780]"
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
                src="/images/finance-link-logo.png"
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
                class="p-5  bg-nfuko-primary/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl hover:bg-[#002d35]/60 hover:border-white/30 transition-all cursor-default group/icon"
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
          class="mt-8 text-center space-y-4 w-full max-w-2xl relative z-30 px-6 transform transition-all duration-1000"
        >
          <h2 class="text-6xl font-black tracking-tight text-white leading-tight">
            Finance Link
            <span
              class="block text-xl mt-4 text-white tracking-[0.3em] uppercase font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
            >
              SEAMLESS FINANCIAL INCLUSION powered by AI
            </span>
          </h2>
        </div>

        <!-- Decorative Background Elements -->
        <div
          class="absolute inset-0 bg-gradient-to-b from-[#1d4780] via-transparent to-[#1d4780] pointer-events-none"
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
