<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Mail, Pencil, Trash2, Camera, Loader2, KeyRound, Copy, Check,
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
const copied = ref(false)

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
const firstName = computed(() => displayName.value.trim().split(/\s+/)[0] ?? '')
const lastName = computed(() => displayName.value.trim().split(/\s+/).slice(1).join(' '))
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

function copyId() {
  const id = String(profile.value?.id ?? '')
  if (!id) return
  navigator.clipboard?.writeText(id).then(() => {
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  })
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

/** Downscale + compress the chosen image so any photo uploads cleanly (well
 *  under the server limit) and loads fast. Falls back to the raw file if the
 *  browser can't process it. */
function downscaleImage(file: File, max = 512): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let { width, height } = img
      if (width > max || height > max) {
        const scale = max / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); return resolve(file) }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          resolve(blob ? new File([blob], 'avatar.jpg', { type: 'image/jpeg' }) : file)
        },
        'image/jpeg',
        0.9,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

async function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  formError.value = null
  const processed = await downscaleImage(file)
  avatarFile.value = processed
  avatarPreview.value = URL.createObjectURL(processed)
}

/** Push the updated profile into the auth session so the top-bar avatar/name
 *  (which read from authStore.user via the profile store) refresh immediately. */
function syncSessionUser(updated: CentralProfile) {
  const next = {
    ...authStore.user,
    id: updated.id,
    name: updated.staff_fall_name ?? authStore.user?.name,
    email: updated.staff_email ?? authStore.user?.email,
    avatar: updated.avatar_url ?? (authStore.user as any)?.avatar ?? null,
  } as any
  authStore.user = next
  localStorage.setItem('auth_user', JSON.stringify(next))
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
    if (updated) {
      profile.value = updated
      syncSessionUser(updated)
    }
    drawerOpen.value = false
  } catch (e: any) {
    const errors = e?.response?.data?.errors as Record<string, string[]> | undefined
    formError.value = (errors ? Object.values(errors)[0]?.[0] : undefined)
      ?? e?.response?.data?.message
      ?? 'Could not save changes. Please try again.'
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
    <div class="w-full px-4 py-8 sm:px-6 lg:px-10">
      <!-- Loading skeleton -->
      <div v-if="loading && !profile" class="grid gap-8 lg:grid-cols-[300px_1fr]">
        <div class="h-72 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse"></div>
        <div class="space-y-6">
          <div class="h-64 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse"></div>
          <div class="h-48 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse"></div>
        </div>
      </div>

      <div v-else-if="profile" class="grid gap-8 lg:grid-cols-[300px_1fr]">
        <!-- ── Left identity rail ───────────────────────── -->
        <aside class="lg:sticky lg:top-6 self-start">
          <div class="flex flex-col items-start">
            <div class="size-24 rounded-full overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-700 shadow-sm">
              <img v-if="profile.avatar_url" :src="profile.avatar_url" alt="Avatar" class="size-full object-cover" />
              <div v-else class="size-full flex items-center justify-center text-2xl font-black text-white bg-nfuko-primary-950">
                {{ initials }}
              </div>
            </div>

            <h1 class="mt-4 text-lg font-black text-neutral-900 dark:text-white break-all leading-tight">
              {{ profile.staff_email ?? displayName }}
            </h1>
            <p class="text-sm text-neutral-400 mt-0.5">Member since {{ fmtDate(profile.created_at) }}</p>

            <!-- Account ID + copy -->
            <div class="mt-4 flex items-center gap-2">
              <div class="inline-flex items-center rounded-lg bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-500">
                <span class="text-neutral-400 mr-1">Account ID :</span>#{{ profile.id }}
              </div>
              <button
                class="inline-flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-neutral-700 px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                @click="copyId"
              >
                <component :is="copied ? Check : Copy" class="size-3.5" :class="copied ? 'text-green-600' : ''" />
                {{ copied ? 'Copied' : 'Copy' }}
              </button>
            </div>

            <!-- Action links -->
            <nav class="mt-8 w-full space-y-1">
              <button class="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" @click="openEdit">
                <Pencil class="size-4 text-neutral-500" /> Edit Profile
              </button>
              <button class="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" @click="openEdit">
                <KeyRound class="size-4 text-neutral-500" /> Change Password
              </button>
              <button class="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" @click="showDeleteConfirm = true">
                <Trash2 class="size-4" /> Delete Account
              </button>
            </nav>
          </div>
        </aside>

        <!-- ── Right detail cards ───────────────────────── -->
        <div class="space-y-6">
          <!-- Personal Information -->
          <section class="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-black text-neutral-900 dark:text-white">Personal Information</h2>
              <Button variant="outline" class="h-9 gap-2 font-bold rounded-lg" @click="openEdit">
                <Pencil class="size-3.5" /> Edit
              </Button>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="block text-sm text-neutral-500 mb-1.5">First Name</label>
                <div class="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 px-4 py-3 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                  {{ firstName || '—' }}
                </div>
              </div>
              <div>
                <label class="block text-sm text-neutral-500 mb-1.5">Last Name</label>
                <div class="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 px-4 py-3 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                  {{ lastName || '—' }}
                </div>
              </div>
              <div class="sm:col-span-2">
                <label class="block text-sm text-neutral-500 mb-1.5">Email Address</label>
                <div class="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 px-4 py-3">
                  <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate flex items-center gap-2">
                    <Mail class="size-4 text-neutral-400 shrink-0" /> {{ profile.staff_email ?? '—' }}
                  </span>
                  <span v-if="isVerified" class="shrink-0 inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-600">Verified</span>
                  <span v-else class="shrink-0 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-600">Unverified</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Account & Security -->
          <section class="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8">
            <h2 class="text-xl font-black text-neutral-900 dark:text-white mb-6">Account &amp; Security</h2>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="block text-sm text-neutral-500 mb-1.5">System Role</label>
                <div class="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 px-4 py-3 text-sm font-semibold capitalize text-neutral-800 dark:text-neutral-100">
                  {{ profile.system_role ?? '—' }}
                </div>
              </div>
              <div>
                <label class="block text-sm text-neutral-500 mb-1.5">Account Status</label>
                <div class="flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 px-4 py-3">
                  <span :class="['size-2 rounded-full', statusStyles.dot]" />
                  <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{{ statusStyles.label }}</span>
                </div>
              </div>
              <div>
                <label class="block text-sm text-neutral-500 mb-1.5">Password</label>
                <button class="flex w-full items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" @click="openEdit">
                  <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-100">••••••••</span>
                  <span class="inline-flex items-center gap-1 text-xs font-bold text-nfuko-primary"><KeyRound class="size-3.5" /> Change</span>
                </button>
              </div>
              <div>
                <label class="block text-sm text-neutral-500 mb-1.5">Member Since</label>
                <div class="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 px-4 py-3 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                  {{ fmtDate(profile.created_at) }}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- Edit drawer -->
    <Drawer :open="drawerOpen" title="Edit Profile" width="w-full sm:max-w-[480px]" :showFooter="false" @update:open="drawerOpen = $event">
      <template #body>
        <div class="flex flex-col gap-5 py-4">
          <!-- Avatar -->
          <div class="flex items-center gap-4">
            <div class="size-20 rounded-full overflow-hidden ring-1 ring-neutral-200 shadow-sm shrink-0">
              <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar preview" class="size-full object-cover" />
              <div v-else class="size-full flex items-center justify-center text-xl font-black text-white bg-nfuko-primary-950">
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
