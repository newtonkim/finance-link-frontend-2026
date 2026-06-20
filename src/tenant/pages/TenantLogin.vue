<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { isAxiosError } from 'axios';
import { Eye, EyeOff, ShieldCheck, Lock } from 'lucide-vue-next';
import {  Button,  Input,  Label,  InputError,  Spinner,  AuthBase,storeUserLogedinData, storeUserPermissions,setSystemBranding,  keysToUse,  appendOnAjsonStore} from '@/Global';
import { tenantClient } from '@/tenant/apis/tenantClient';
import { setBearerToken } from 'septor-store';
import { useBranchStore } from '@/stores/branchStore';
import TenantBrandMark from '@/tenant/components/globals/TenantBrandMark.vue';

const router = useRouter()
const branchStore = useBranchStore()

// Extract subdomain from hostname: "naivasha-sacco.localhost" → "naivasha-sacco"
const subdomain = computed(() => {
  const hostname = window.location.hostname;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null;
  const parts = hostname.split('.');
  return parts.length >= 2 ? parts[0] : null;
});

/**
 * Last-resort name formatting from the subdomain when the backend can't
 * supply a real display name, e.g. "jambosacco" → "Jambo Sacco".
 */
function humaniseSubdomain(sub: string | null): string {
  if (!sub) return 'Your SACCO';
  let name = sub.replace(/[-_]/g, ' ');
  if (!name.includes(' ')) {
    for (const suffix of ['sacco', 'cooperative', 'coop']) {
      if (name.toLowerCase().endsWith(suffix)) {
        name = name.slice(0, -suffix.length) + ' ' + suffix;
        break;
      }
    }
  }
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ── Tenant branding (fetched pre-auth) ─────────────────────────
interface TenantBranding {
  name?: string;
  subdomain?: string;
  logo_url?: string | null;
  tagline?: string | null;
  primary_color?: string;
  initials?: string;
}
const branding = ref<TenantBranding | null>(null);

const saccoName = computed(() => branding.value?.name || humaniseSubdomain(subdomain.value));
const logoUrl = computed(() => branding.value?.logo_url || null);
const accent = computed(() => branding.value?.primary_color || '#052659');
const initials = computed(() => branding.value?.initials || deriveInitials(saccoName.value));
const tagline = computed(() => branding.value?.tagline || 'Manage your SACCO with confidence');

onMounted(async () => {
  try {
    const res = await tenantClient.get('/public-branding');
    branding.value = res?.data?.data ?? null;
    if (branding.value?.name) document.title = `Sign in · ${branding.value.name}`;
  } catch {
    // No public branding available — fall back to subdomain-derived values.
  }
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

    const res = await tenantClient.post(
      '/auth/login',
      { email: email.value, password: password.value, type: 'tenant' },
      { headers },
    );
    const data=JSON.parse(atob(res?.data))

  if(data.data.Setting)
     appendOnAjsonStore({ data: data.data.Setting, key: keysToUse.systemSettings })


    setSystemBranding(data.data.branding)

    // Store token, subdomain, and user profile for sidebar display
    if (data?.data?.access_token) {
      localStorage.setItem('tenant_token', data.data.access_token);

    }
    if (subdomain.value) {
      localStorage.setItem('tenant_subdomain', subdomain.value);
    }
    if (data?.data?.user) {
      localStorage.setItem('tenant_user', JSON.stringify(data.data.user));
    }

    setBearerToken({token: data.data.access_token,...data.data.user})
    storeUserLogedinData(data.data.user)
    storeUserPermissions({data:data.data?.permissions})

    if (data?.data?.branch_context) {
      branchStore.setBranchContext(data.data.branch_context)
    }


    const redirectUrl = data?.data?.redirect_url;
    if (typeof redirectUrl === 'string' && redirectUrl.trim()) {
      window.location.assign(redirectUrl.trim());
    } else {
      await router.push('/tenant/dashboard');
    }
  } catch (error) {
     console.error(error)
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
  <AuthBase :title="`Sign in to ${saccoName}`" description="Enter your admin credentials to access the portal" titleClass="text-[#052659]">
    <!-- Brand: tenant logo / monogram (overrides the platform logo) -->
    <template #brand>
      <div class="size-14 rounded-2xl overflow-hidden shadow-md ring-1 ring-black/5">
        <TenantBrandMark :logo-url="logoUrl" :initials="initials" :accent="accent" text-class="text-lg" />
      </div>
    </template>

    <!-- SACCO badge -->
    <div class="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F0F5FF] border border-[#D0E2FF]">
      <div class="size-9 rounded-lg overflow-hidden shrink-0 ring-1 ring-black/5 bg-white">
        <TenantBrandMark :logo-url="logoUrl" :initials="initials" :accent="accent" text-class="text-[11px]" />
      </div>
      <div>
        <p class="text-xs text-neutral-500 font-medium">Tenant Portal</p>
        <p class="text-sm font-bold" :style="{ color: accent }">{{ saccoName }}</p>
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
          <Label for="email" class="text-sm font-semibold text-[#052659]">Email address</Label>
          <Input id="email" type="email" v-model="email" required autofocus :tabindex="1" autocomplete="email"
            placeholder="Enter your email"
            class="h-12 border-neutral-300 focus:border-[#052659] focus:ring-[#052659]/10 transition-all" />
          <InputError :message="errors.email" />
        </div>

        <!-- Password -->
        <div class="grid gap-2">
          <Label for="password" class="text-sm font-semibold text-[#052659]">Password</Label>
          <div class="relative">
            <Input id="password" :type="showPassword ? 'text' : 'password'" v-model="password" required :tabindex="2"
              autocomplete="current-password" placeholder="Enter your password"
              class="h-12 w-full pr-12 border-neutral-300 focus:border-[#052659] focus:ring-[#052659]/10 transition-all" />
            <button type="button" @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-[#052659] transition-colors"
              tabindex="-1">
              <component :is="showPassword ? EyeOff : Eye" :size="20" />
            </button>
          </div>
          <InputError :message="errors.password" />
        </div>

        <!-- Submit -->
        <Button type="submit"
          class="h-12 w-full text-white font-semibold rounded-xl transition-all shadow-lg hover:brightness-110 disabled:opacity-70"
          :style="{ backgroundColor: accent }"
          :tabindex="3" :disabled="processing">
          <Spinner v-if="processing" class="mr-2" />
          {{ processing ? 'Signing in…' : 'Sign in' }}
        </Button>
      </div>

      <!-- Trust note -->
      <p class="flex items-center justify-center gap-2 text-xs text-neutral-400">
        <Lock :size="13" />
        Secured with bank-grade encryption
      </p>
    </form>

    <!-- Right panel: branded tenant showcase -->
    <template #right-panel>
      <div class="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
        :style="{ backgroundColor: accent }">
        <!-- Depth layers -->
        <div class="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/30"></div>
        <div class="absolute top-[-10%] right-[-5%] size-[28rem] rounded-full bg-white/5 blur-3xl"></div>
        <div class="absolute bottom-[-15%] left-[-10%] size-[26rem] rounded-full bg-white/[0.04] blur-3xl"></div>

        <!-- Center brand -->
        <div class="relative z-10 flex flex-col items-center gap-8 px-8">
          <div class="relative">
            <div class="absolute -inset-5 bg-white/10 blur-2xl rounded-[2.75rem]"></div>
            <div
              class="relative size-36 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl overflow-hidden p-5 ring-1 ring-white/20">
              <TenantBrandMark :logo-url="logoUrl" :initials="initials" :accent="accent" text-class="text-5xl" />
            </div>
          </div>

          <div class="text-center space-y-3 max-w-sm">
            <h2 class="text-4xl font-black tracking-tight text-white leading-tight">
              {{ saccoName }}
            </h2>
            <p class="text-sm text-white/70 tracking-[0.25em] uppercase font-bold">
              Admin Portal
            </p>
            <p class="text-sm text-white/45 font-medium">
              {{ tagline }}
            </p>
          </div>

          <!-- Trust strip -->
          <div class="mt-4 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm ring-1 ring-white/10">
            <ShieldCheck :size="16" class="text-white/80" />
            <span class="text-xs font-medium text-white/70">Bank-grade security · Audited daily</span>
          </div>
        </div>
      </div>
    </template>
  </AuthBase>
</template>
