<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { isAxiosError } from 'axios';
import { Eye, EyeOff, Building2 } from 'lucide-vue-next';
import {
  Button,
  Input,
  Label,
  InputError,
  Spinner,
  AuthBase,
} from '@/Global';
import { apiClient } from '@/central/api/client';

const router = useRouter();

// Extract subdomain from hostname: "naivasha-sacco.localhost" → "naivasha-sacco"
const subdomain = computed(() => {
  const hostname = window.location.hostname;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null;
  const parts = hostname.split('.');
  return parts.length >= 2 ? parts[0] : null;
});

const saccoName = computed(() => {
  if (!subdomain.value) return 'Your SACCO';
  return subdomain.value
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
});

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const processing = ref(false);
const errors = ref<{ email?: string; password?: string; form?: string }>({});

async function submit() {
  processing.value = true;
  errors.value = {};

  try {
    const headers: Record<string, string> = {};
    if (subdomain.value) {
      headers['X-Tenant-Subdomain'] = subdomain.value;
    }

    const { data } = await apiClient.post(
      '/auth/login',
      { email: email.value, password: password.value, type: 'tenant' },
      { headers },
    );

    // Store token and redirect to tenant dashboard
    if (data?.data?.access_token) {
      localStorage.setItem('tenant_token', data.data.access_token);
    }

    const redirectUrl = data?.data?.redirect_url;
    if (typeof redirectUrl === 'string' && redirectUrl.trim()) {
      window.location.assign(redirectUrl.trim());
    } else {
      await router.push('/tenant/dashboard');
    }
  } catch (error) {
    if (isAxiosError(error)) {
      const payload = error.response?.data as {
        message?: string;
        errors?: Record<string, string[]>;
      };
      if (payload?.errors?.email?.[0]) errors.value.email = payload.errors.email[0];
      if (payload?.errors?.password?.[0]) errors.value.password = payload.errors.password[0];
      if (!errors.value.email && !errors.value.password) {
        errors.value.form = payload?.message ?? 'Login failed. Please try again.';
      }
    } else {
      errors.value.form = 'Login failed. Please try again.';
    }
  } finally {
    processing.value = false;
  }
}
</script>

<template>
  <AuthBase
    :title="`Sign in to ${saccoName}`"
    description="Enter your admin credentials to access the portal"
  >
    <!-- SACCO badge -->
    <div class="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#001d22]/5 border border-[#001d22]/10">
      <div class="size-8 rounded-lg bg-[#001d22] flex items-center justify-center shrink-0">
        <Building2 class="size-4 text-white" />
      </div>
      <div>
        <p class="text-xs text-neutral-500 font-medium">Tenant Portal</p>
        <p class="text-sm font-bold text-[#001d22]">{{ saccoName }}</p>
      </div>
    </div>

    <!-- Alerts -->
    <div v-if="errors.form"
      class="mb-6 rounded-lg bg-red-50 p-4 text-center text-sm font-medium text-red-600 border border-red-100">
      {{ errors.form }}
    </div>

    <form @submit.prevent="submit" class="flex flex-col gap-8">
      <div class="grid gap-6">
        <!-- Email -->
        <div class="grid gap-2">
          <Label for="email" class="text-sm font-semibold text-[#001d22]">Email address</Label>
          <Input
            id="email"
            type="email"
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

        <!-- Password -->
        <div class="grid gap-2">
          <Label for="password" class="text-sm font-semibold text-[#001d22]">Password</Label>
          <div class="relative">
            <Input
              id="password"
              :type="showPassword ? 'text' : 'password'"
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

        <!-- Submit -->
        <Button
          type="submit"
          class="h-12 w-full bg-[#001d22] hover:bg-[#001d22]/90 text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#001d22]/10"
          :tabindex="3"
          :disabled="processing"
        >
          <Spinner v-if="processing" class="mr-2" />
          Sign in
        </Button>
      </div>
    </form>

    <!-- Right panel: branded panel matching the central login style -->
    <template #right-panel>
      <div class="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[#001418]">
        <!-- Glow blobs -->
        <div class="absolute top-1/4 left-1/4 size-64 rounded-full bg-[#2dd4bf]/10 blur-3xl"></div>
        <div class="absolute bottom-1/4 right-1/4 size-48 rounded-full bg-white/5 blur-3xl"></div>

        <!-- Center icon -->
        <div class="relative z-10 flex flex-col items-center gap-8">
          <div class="relative">
            <div class="absolute -inset-6 bg-white/10 blur-3xl rounded-full animate-pulse"></div>
            <div class="absolute -inset-3 border border-white/10 rounded-[2.5rem] animate-[spin_12s_linear_infinite] opacity-30"></div>
            <div class="relative size-36 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl">
              <Building2 class="size-16 text-[#001d22]" />
            </div>
          </div>

          <div class="text-center space-y-3 max-w-xs px-6">
            <h2 class="text-4xl font-black tracking-tight text-white leading-tight">
              {{ saccoName }}
            </h2>
            <p class="text-sm text-[#2dd4bf] tracking-[0.2em] uppercase font-bold">
              Admin Portal
            </p>
            <p class="text-sm text-white/40 font-medium">
              Manage your SACCO with confidence
            </p>
          </div>
        </div>

        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-b from-[#001418] via-transparent to-[#001418] pointer-events-none"></div>
      </div>
    </template>
  </AuthBase>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
</style>
