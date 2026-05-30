<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next';
import { isAxiosError } from 'axios';
import { ref, onMounted, onUnmounted,computed } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { registerApi } from '@/central/api/auth';
import { useAuthStore } from '@/stores/auth';
import {
  Button, InputError,
  TextLink,
  Input,
  Label,
  Spinner,
  AuthBase,
} from '@/Global';


const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');
const password_confirmation = ref('');
const processing = ref(false);
const errors = ref<{ name?: string; email?: string; password?: string; password_confirmation?: string; form?: string }>({});

const features = [
  {
    title: "Precision Accounting",
    description: "Seamlessly manage your ledgers with bank-grade security and accuracy.",
    image: "/images/automated_reporting.png"
  },
  {
    title: "Community-First Credit",
    description: "Intelligent credit scoring tailored for the unique needs of your Sacco.",
    image: "/images/credit_scoring.png"
  },
  {
    title: "Unified Savings Hub",
    description: "Empower your members with easy-access savings and automated tracking.",
    image: "/images/ai_savings.png"
  },
  {
    title: "Scalable Financial Growth",
    description: "The complete financial ecosystem for modern, growing Saccos.",
    image: "/images/unified_ecosystem.png"
  }
];

const activeIndex = ref(0);
let interval: any = null;
const fallbackFeature = {
  title: '',
  description: '',
  image: '',
};
const activeFeature = computed(() => features[activeIndex.value] ?? fallbackFeature);

onMounted(() => {
  interval = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % features.length;
  }, 5000);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});

const showPassword = ref(false);
const showConfirmPassword = ref(false);

const submit = async () => {
  processing.value = true;
  errors.value = {};

  if (password.value !== password_confirmation.value) {
    errors.value.password_confirmation = "The password confirmation does not match.";
    processing.value = false;
    return;
  }

  try {
    const response = await registerApi({
      name: name.value,
      email: email.value,
      password: password.value,
      password_confirmation: password_confirmation.value,
    });

    authStore.setAuthSession(response.data);
    toast.success(response.message || 'Registration successful');

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

      if (payload?.errors?.name?.[0]) {
        errors.value.name = payload.errors.name[0];
      }
      if (payload?.errors?.email?.[0]) {
        errors.value.email = payload.errors.email[0];
      }
      if (payload?.errors?.password?.[0]) {
        errors.value.password = payload.errors.password[0];
      }
      if (payload?.errors?.password_confirmation?.[0]) {
        errors.value.password_confirmation = payload.errors.password_confirmation[0];
      }
      if (!errors.value.name && !errors.value.email && !errors.value.password && !errors.value.password_confirmation) {
        errors.value.form = payload?.message ?? 'Registration failed. Please try again.';
      }
    } else {
      errors.value.form = 'Registration failed. Please try again.';
    }
  } finally {
    processing.value = false;
  }
};

const loginPath = '/central/login';
</script>

<template>
  <AuthBase title="Create an account" description="Join Finance Link and elevate your financial inclusion though AI">
    <div
      v-if="errors.form"
      class="mb-6 rounded-lg bg-red-50 p-4 text-center text-sm font-medium text-red-600 border border-red-100"
    >
      {{ errors.form }}
    </div>
    <form @submit.prevent="submit" class="flex flex-col gap-6">
      <div class="grid gap-6">
        <div class="grid gap-2">
          <Label for="name" class="text-sm font-semibold  text-nfuko-primary">Name</Label>
          <Input id="name" v-model="name" type="text" required autofocus :tabindex="1" autocomplete="name" name="name"
            placeholder="Your full name"
            class="h-12 border-[#d1dfdb] focus: border-nfuko-primary focus:ring-bg-nfuko-primary/10 transition-all duration-300" />
          <InputError :message="errors.name" />
        </div>

        <div class="grid gap-2">
          <Label for="email" class="text-sm font-semibold  text-nfuko-primary">Email address</Label>
          <Input id="email" v-model="email" type="email" required :tabindex="2" autocomplete="email" name="email"
            placeholder="m@example.com"
            class="h-12 border-[#d1dfdb] focus: border-nfuko-primary focus:ring-bg-nfuko-primary/10 transition-all duration-300" />
          <InputError :message="errors.email" />
        </div>

        <div class="grid gap-2">
          <Label for="password" class="text-sm font-semibold  text-nfuko-primary">Password</Label>
          <div class="relative">
            <Input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" required :tabindex="3"
              autocomplete="new-password" name="password" placeholder="Create a secure password"
              class="h-12 pr-12 border-[#d1dfdb] focus: border-nfuko-primary focus:ring-bg-nfuko-primary/10 transition-all duration-300" />
            <button type="button" @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover: text-nfuko-primary transition-colors"
              tabindex="-1">
              <component :is="showPassword ? EyeOff : Eye" :size="20" />
            </button>
          </div>
          <InputError :message="errors.password" />
        </div>

        <div class="grid gap-2">
          <Label for="password_confirmation" class="text-sm font-semibold  text-nfuko-primary">Confirm password</Label>
          <div class="relative">
            <Input id="password_confirmation" v-model="password_confirmation"
              :type="showConfirmPassword ? 'text' : 'password'" required :tabindex="4" autocomplete="new-password"
              name="password_confirmation" placeholder="Re-enter password"
              class="h-12 pr-12 border-[#d1dfdb] focus: border-nfuko-primary focus:ring-bg-nfuko-primary/10 transition-all duration-300" />
            <button type="button" @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover: text-nfuko-primary transition-colors"
              tabindex="-1">
              <component :is="showConfirmPassword ? EyeOff : Eye" :size="20" />
            </button>
          </div>
          <InputError :message="errors.password_confirmation" />
        </div>

        <Button type="submit"
          class="h-12 w-full  bg-[#052659] hover: bg-[#052659]/90 text-white font-semibold rounded-xl transition-all shadow-lg shadow-bg-[#052659]/10 mt-2"
          tabindex="5" :disabled="processing" data-test="register-user-button">
          <Spinner v-if="processing" class="mr-2" />
          Create account
        </Button>
      </div>

      <div class="text-center text-sm text-muted-foreground">
        Already have an account?
        <TextLink :to="loginPath" class="font-semibold  text-nfuko-primary hover:underline" :tabindex="6">Log in</TextLink>
      </div>
    </form>

    <template #right-panel>
      <div class="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#001020] to-[#A8E6FF] p-8">
        <div class="relative w-full aspect-square max-w-sm mb-12">
          <transition-group name="fade-slide" tag="div" class="relative w-full h-full">
            <div v-for="(feature, index) in features" :key="feature.title" v-show="activeIndex === index"
              class="absolute inset-0 flex flex-col items-center justify-center">
              <img :src="feature.image" :alt="feature.title"
                class="w-full h-auto object-contain rounded-3xl shadow-2xl shadow-black/40" />
            </div>
          </transition-group>
        </div>

        <div class="space-y-4 max-w-sm text-center">
          <h2 class="text-4xl font-bold tracking-tight leading-tight text-white">
            {{ activeFeature.title }}
          </h2>
          <p class="text-lg text-white/70">
            {{ activeFeature.description }}
          </p>
        </div>

        <!-- Indicator dots -->
        <div class="mt-12 flex gap-3">
          <button v-for="(_, index) in features" :key="index" @click="activeIndex = index"
            class="h-1.5 rounded-full transition-all duration-300"
            :class="activeIndex === index ? 'w-8 bg-white' : 'w-1.5 bg-white/20'"></button>
        </div>

        <!-- Decorative Background Elements Removed for gradient clarity -->
      </div>
    </template>
  </AuthBase>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.8s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Ensure the layout container takes full height and width without padding */
:deep(.auth-container) {
  padding: 0;
  margin: 0;
  max-width: none;
}
</style>
