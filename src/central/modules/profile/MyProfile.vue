<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Mail, ShieldCheck, CalendarDays, Hash, Pencil, Trash2, Camera, Loader2,
  BadgeCheck, KeyRound, AlertTriangle, UserCircle2,
} from 'lucide-vue-next'
import { Button, Input, Label, Drawer } from '@/Global'
import { centralProfileApi, type CentralProfile } from '@/central/modules/apis'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profileStore'

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const { getProfile, updateProfile, deleteProfile } = centralProfileApi()

const profile = ref<CentralProfile | null>(null)
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)

const drawerOpen = ref(false)
const showDeleteConfirm = ref(false)

const form = ref({
  staff_fall_name: '',
  staff_email: '',
  system_role: '',
  password: '',
  password_confirmation: '',
})
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)
const formError = ref<string | null>(null)

/** Build a CentralProfile from whatever the auth session already holds, so the
 *  page always renders even if the profile endpoint is unreachable. */
function profileFromAuth(): CentralProfile | null {
  const u = authStore.user as Record<string, any> | null
  if (!u) return null
  return {
    id: u.id,
    staff_fall_name: u.name ?? null,
    staff_email: u.email ?? null,
    system_role: u.role_id ?? u.system_role ?? u.role ?? 'Administrator',
    status: u.status ?? 'active',
    avatar: u.avatar ?? null,
    avatar_url: u.avatar_url ?? (typeof u.avatar === 'string' && u.avatar.startsWith('/') ? u.avatar : null),
    email_verified_time: u.email_verified_at ?? null,
    created_at: u.created_at ?? null,
  }
}

const displayName = computed(() => profile.value?.staff_fall_name || 'Administrator')
const initials = computed(() => {
  const words = displayName.value.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return displayName.value.slice(0, 2).toUpperCase()
})

const statusStyles = computed(() => {
  const map: Record<string, { badge: string; dot: string; label: string }> = {
    active: { badge: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', label: 'Active' },
    trial: { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Trial' },
    suspended: { badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Suspended' },
    expired: { badge: 'bg-neutral-100 text-neutral-500 border-neutral-200', dot: 'bg-neutral-400', label: 'Expired' },
  }
  return map[profile.value?.status ?? 'active'] ?? map.active
})

const isVerified = computed(() => !!profile.value?.email_verified_time)

function fmtDate(v: any) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function load() {
  loading.value = true
  // Render immediately from the session, then enrich from the backend.
  authStore.hydrateAuth()
  profile.value = profileFromAuth()
  try {
    const fetched = await getProfile()
    if (fetched) profile.value = fetched
  } catch {
    // Endpoint unavailable — keep the session-derived profile.
  } finally {
    loading.value = false
  }
}

function openEdit() {
  formError.value = null
  avatarFile.value = null
  avatarPreview.value = profile.value?.avatar_url ?? null
  form.value = {
    staff_fall_name: profile.value?.staff_fall_name ?? '',
    staff_email: profile.value?.staff_email ?? '',
    system_role: profile.value?.system_role ?? '',
    password: '',
    password_confirmation: '',
  }
  drawerOpen.value = true
}

function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

async function saveEdit() {
  formError.value = null
  if (form.value.password && form.value.password !== form.value.password_confirmation) {
    formError.value = 'Passwords do not match.'
    return
  }
  saving.value = true
  try {
    const updated = await updateProfile({
      staff_fall_name: form.value.staff_fall_name,
      staff_email: form.value.staff_email,
      system_role: form.value.system_role,
      password: form.value.password || undefined,
      avatar: avatarFile.value,
    })
    if (updated) profile.value = updated
    profileStore.fetchFullProfile(true)
    drawerOpen.value = false
  } catch {
    formError.value = 'Could not save changes. Please try again.'
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  deleting.value = true
  try {
    const res = await deleteProfile()
    await authStore.logout()
    profileStore.clear()
    router.push(res?.redirect_url ?? '/central/login')
  } catch {
    deleting.value = false
    showDeleteConfirm.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="min-h-full bg-nfuko-surface dark:bg-neutral-950">
    <div class="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <!-- Heading -->
      <div class="mb-6 flex items-center gap-2">
        <UserCircle2 class="size-6 text-nfuko-primary" />
        <div>
          <h1 class="text-2xl font-black text-neutral-900 dark:text-white leading-none">My Profile</h1>
          <p class="text-sm text-neutral-500 mt-1">Manage your central administrator account.</p>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading && !profile" class="space-y-4">
        <div class="h-48 rounded-3xl bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse"></div>
        <div class="grid gap-4 sm:grid-cols-3">
          <div v-for="i in 3" :key="i" class="h-24 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse"></div>
        </div>
      </div>

      <template v-else-if="profile">
        <!-- Hero card -->
        <div class="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
          <div class="h-28 relative" style="background: linear-gradient(120deg, var(--color-nfuko-primary-950) 0%, var(--color-nfuko-primary) 100%)">
            <div class="absolute inset-0 opacity-30" style="background-image: radial-gradient(circle at 80% -10%, rgba(255,255,255,0.25), transparent 45%)"></div>
          </div>

          <div class="px-6 pb-6">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-12">
              <div class="flex items-end gap-4">
                <div class="size-24 rounded-3xl overflow-hidden ring-4 ring-white dark:ring-neutral-900 shadow-xl shrink-0">
                  <img v-if="profile.avatar_url" :src="profile.avatar_url" alt="Avatar" class="size-full object-cover" />
                  <div v-else class="size-full flex items-center justify-center text-3xl font-black text-white" style="background: linear-gradient(135deg, var(--color-nfuko-primary-950), var(--color-nfuko-primary))">
                    {{ initials }}
                  </div>
                </div>
                <div class="min-w-0 pb-1">
                  <div class="flex items-center gap-2">
                    <h2 class="text-2xl font-black text-neutral-900 dark:text-white leading-tight truncate">{{ displayName }}</h2>
                    <BadgeCheck v-if="isVerified" class="size-5 text-nfuko-primary shrink-0" />
                  </div>
                  <div class="flex items-center gap-1.5 mt-0.5 text-sm font-medium text-neutral-500">
                    <Mail class="size-3.5 shrink-0" />
                    <span class="truncate">{{ profile.staff_email ?? '—' }}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <span :class="['inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black border', statusStyles.badge]">
                  <span :class="['size-2 rounded-full', statusStyles.dot]" />
                  {{ statusStyles.label }}
                </span>
                <Button class="h-10 gap-2 bg-nfuko-primary hover:bg-nfuko-primary/90 text-white font-bold rounded-xl" @click="openEdit">
                  <Pencil class="size-4" /> Edit Profile
                </Button>
              </div>
            </div>

            <!-- Quick stats -->
            <div class="mt-6 grid gap-3 sm:grid-cols-3">
              <div class="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 p-4">
                <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-1.5">
                  <ShieldCheck class="size-3.5" /> System Role
                </div>
                <p class="text-sm font-black text-neutral-800 dark:text-neutral-100 capitalize truncate">{{ profile.system_role ?? '—' }}</p>
              </div>
              <div class="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 p-4">
                <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-1.5">
                  <CalendarDays class="size-3.5" /> Member Since
                </div>
                <p class="text-sm font-black text-neutral-800 dark:text-neutral-100 truncate">{{ fmtDate(profile.created_at) }}</p>
              </div>
              <div class="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 p-4">
                <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-1.5">
                  <Hash class="size-3.5" /> Account ID
                </div>
                <p class="text-sm font-black text-neutral-800 dark:text-neutral-100 truncate">#{{ profile.id }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Lower grid -->
        <div class="mt-4 grid gap-4 lg:grid-cols-3">
          <!-- Account details -->
          <div class="lg:col-span-2 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
            <div class="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 class="text-sm font-black text-neutral-800 dark:text-neutral-100">Account Details</h3>
            </div>
            <dl class="divide-y divide-neutral-100 dark:divide-neutral-800">
              <div class="flex items-center justify-between gap-4 px-5 py-3.5">
                <dt class="text-sm font-medium text-neutral-500">Full name</dt>
                <dd class="text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate">{{ profile.staff_fall_name ?? '—' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4 px-5 py-3.5">
                <dt class="text-sm font-medium text-neutral-500">Email address</dt>
                <dd class="flex items-center gap-1.5 text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate">
                  {{ profile.staff_email ?? '—' }}
                  <span v-if="isVerified" class="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">Verified</span>
                  <span v-else class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Unverified</span>
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4 px-5 py-3.5">
                <dt class="text-sm font-medium text-neutral-500">System role</dt>
                <dd class="text-sm font-bold text-neutral-800 dark:text-neutral-100 capitalize truncate">{{ profile.system_role ?? '—' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4 px-5 py-3.5">
                <dt class="text-sm font-medium text-neutral-500">Account status</dt>
                <dd class="text-sm font-bold capitalize truncate">{{ statusStyles.label }}</dd>
              </div>
            </dl>
          </div>

          <!-- Security + danger -->
          <div class="space-y-4">
            <div class="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <div class="flex items-center gap-2 mb-1">
                <KeyRound class="size-4 text-nfuko-primary" />
                <h3 class="text-sm font-black text-neutral-800 dark:text-neutral-100">Security</h3>
              </div>
              <p class="text-xs text-neutral-500 mb-4">Update your password to keep your account secure.</p>
              <Button variant="outline" class="h-10 w-full gap-2 font-bold rounded-xl" @click="openEdit">
                <KeyRound class="size-4" /> Change password
              </Button>
            </div>

            <div class="rounded-2xl border border-red-200/70 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20 p-5">
              <div class="flex items-center gap-2 mb-1">
                <AlertTriangle class="size-4 text-red-600" />
                <h3 class="text-sm font-black text-red-700 dark:text-red-400">Danger Zone</h3>
              </div>
              <p class="text-xs text-red-600/80 mb-4">Permanently deactivate your account. This cannot be undone.</p>
              <Button variant="outline" class="h-10 w-full gap-2 border-red-300 text-red-600 hover:bg-red-100 font-bold rounded-xl" @click="showDeleteConfirm = true">
                <Trash2 class="size-4" /> Delete account
              </Button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Edit drawer -->
    <Drawer :open="drawerOpen" title="Edit Profile" width="w-full sm:max-w-[480px]" :showFooter="false" @update:open="drawerOpen = $event">
      <template #body>
        <div class="flex flex-col gap-5 py-4">
          <!-- Avatar -->
          <div class="flex items-center gap-4">
            <div class="size-20 rounded-2xl overflow-hidden ring-1 ring-neutral-200 shadow-sm shrink-0">
              <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar preview" class="size-full object-cover" />
              <div v-else class="size-full flex items-center justify-center text-xl font-black text-white" style="background: linear-gradient(135deg, var(--color-nfuko-primary-950), var(--color-nfuko-primary))">
                {{ initials }}
              </div>
            </div>
            <label class="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
              <Camera class="size-4" /> Change photo
              <input type="file" accept="image/*" class="hidden" @change="onAvatarChange" />
            </label>
          </div>

          <div class="grid gap-2">
            <Label for="p-name" class="text-sm font-semibold">Full name</Label>
            <Input id="p-name" v-model="form.staff_fall_name" placeholder="Enter your name" class="h-11" />
          </div>

          <div class="grid gap-2">
            <Label for="p-email" class="text-sm font-semibold">Email address</Label>
            <Input id="p-email" v-model="form.staff_email" type="email" placeholder="Enter your email" class="h-11" />
          </div>

          <div class="grid gap-2">
            <Label for="p-role" class="text-sm font-semibold">System role</Label>
            <Input id="p-role" v-model="form.system_role" placeholder="e.g. super-admin" class="h-11" />
            <p class="text-xs text-neutral-400">The role identifier controlling your access level.</p>
          </div>

          <div class="border-t border-neutral-100 pt-4">
            <p class="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-3">Change password (optional)</p>
            <div class="grid gap-3">
              <div class="grid gap-2">
                <Label for="p-pass" class="text-sm font-semibold">New password</Label>
                <Input id="p-pass" v-model="form.password" type="password" placeholder="Leave blank to keep current" class="h-11" />
              </div>
              <div class="grid gap-2">
                <Label for="p-pass2" class="text-sm font-semibold">Confirm new password</Label>
                <Input id="p-pass2" v-model="form.password_confirmation" type="password" placeholder="Re-enter new password" class="h-11" />
              </div>
            </div>
          </div>

          <p v-if="formError" class="text-sm font-medium text-red-600">{{ formError }}</p>

          <div class="flex gap-2 pt-2">
            <Button type="button" variant="outline" class="h-11 flex-1 font-bold" @click="drawerOpen = false">Cancel</Button>
            <Button type="button" class="h-11 flex-1 gap-2 bg-nfuko-primary hover:bg-nfuko-primary/90 text-white font-bold" :disabled="saving" @click="saveEdit">
              <Loader2 v-if="saving" class="size-4 animate-spin" />
              {{ saving ? 'Saving…' : 'Save changes' }}
            </Button>
          </div>
        </div>
      </template>
    </Drawer>

    <!-- Delete confirmation -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" @click.self="showDeleteConfirm = false">
      <div class="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-2xl">
        <div class="flex items-center gap-3 mb-3">
          <div class="size-10 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 class="size-5 text-red-600" />
          </div>
          <h3 class="text-lg font-black text-neutral-900 dark:text-white">Delete your account?</h3>
        </div>
        <p class="text-sm text-neutral-500 mb-5">
          This will deactivate your central administrator account and sign you out immediately. This action cannot be undone.
        </p>
        <div class="flex gap-2">
          <Button type="button" variant="outline" class="h-11 flex-1 font-bold" :disabled="deleting" @click="showDeleteConfirm = false">Cancel</Button>
          <Button type="button" class="h-11 flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white font-bold" :disabled="deleting" @click="confirmDelete">
            <Loader2 v-if="deleting" class="size-4 animate-spin" />
            {{ deleting ? 'Deleting…' : 'Delete account' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
