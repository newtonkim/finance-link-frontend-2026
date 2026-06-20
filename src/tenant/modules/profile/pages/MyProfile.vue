<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue'
import {
  Mail, Pencil, KeyRound, Copy, Check, Camera, Loader2, RotateCcw, MapPin, ShieldCheck,
} from 'lucide-vue-next'
import { Button, Input, Label, Drawer } from '@/Global'
import { useProfileStore } from '@/stores/profileStore'
import { toast } from 'vue-sonner'
import EditProfileDrawer from '../components/EditProfileDrawer.vue'

const profileStore = useProfileStore()
const profile = computed(() => profileStore.combinedProfile)

const drawerOpen = ref(false)
const copied = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  await profileStore.fetchFullProfile()
})

const displayName = computed(() => profile.value.name || 'Staff Member')
const firstName = computed(() => displayName.value.trim().split(/\s+/)[0] ?? '')
const lastName = computed(() => displayName.value.trim().split(/\s+/).slice(1).join(' '))
const initials = computed(() => {
  const words = displayName.value.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return displayName.value.slice(0, 2).toUpperCase()
})

const memberSince = computed(() => profile.value.staff_data?.created_at ?? null)
const roleLabel = computed(() => (profile.value.is_tenant_admin ? 'Admin' : 'Staff'))

const statusStyles = computed(() => {
  const map: Record<string, { badge: string; dot: string; label: string }> = {
    active: { badge: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', label: 'Active' },
    trial: { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Trial' },
    suspended: { badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Suspended' },
    expired: { badge: 'bg-neutral-100 text-neutral-500 border-neutral-200', dot: 'bg-neutral-400', label: 'Expired' },
  }
  return map[profile.value.status ?? 'active'] ?? map.active
})

const permissionGroups = computed(() => {
  const groups: Record<string, number> = {}
  ;(profile.value.permissions ?? []).forEach((perm: string) => {
    const part = perm.split('-')[0]
    groups[part] = (groups[part] ?? 0) + 1
  })
  return groups
})

const capabilities = computed(() => [
  { label: 'Vote on Loans', enabled: !!profile.value.staff_data?.can_vote_on_loans },
  { label: 'Manage Branch', enabled: !!profile.value.staff_data?.can_manage_branch },
  { label: 'Finalise Loans', enabled: !!profile.value.staff_data?.can_finalise_loan },
])

function fmtDate(v: any) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function copyId() {
  const id = String(profile.value.id ?? '')
  if (!id) return
  navigator.clipboard?.writeText(id).then(() => {
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  })
}

async function syncData() {
  await profileStore.fetchFullProfile(true)
  toast.success('Profile data refreshed.')
}

/** Downscale + compress so any photo uploads cleanly and loads fast. */
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

async function onAvatarSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.error('Please select an image file.')
    return
  }
  const processed = await downscaleImage(file)
  try {
    await profileStore.uploadAvatar(processed)
    toast.success('Avatar updated.')
  } catch {
    toast.error('Failed to update avatar.')
  }
  if (avatarInput.value) avatarInput.value.value = ''
}

// ── Password change drawer ─────────────────────────────────────
const passwordOpen = ref(false)
const pwSaving = ref(false)
const pwError = ref<string | null>(null)
const pwForm = reactive({ password: '', confirm: '' })

function openPassword() {
  pwError.value = null
  pwForm.password = ''
  pwForm.confirm = ''
  passwordOpen.value = true
}

async function savePassword() {
  pwError.value = null
  if (pwForm.password.length < 8) {
    pwError.value = 'Password must be at least 8 characters.'
    return
  }
  if (pwForm.password !== pwForm.confirm) {
    pwError.value = 'Passwords do not match.'
    return
  }
  pwSaving.value = true
  try {
    await profileStore.changePassword('', pwForm.password)
    toast.success('Password updated.')
    passwordOpen.value = false
  } catch {
    pwError.value = 'Could not update password. Please try again.'
  } finally {
    pwSaving.value = false
  }
}
</script>

<template>
  <div class="min-h-full bg-nfuko-surface dark:bg-neutral-950">
    <div class="w-full px-4 py-8 sm:px-6 lg:px-10">
      <!-- Loading skeleton -->
      <div v-if="profileStore.isLoading && !profile.staff_data" class="grid gap-8 lg:grid-cols-[300px_1fr]">
        <div class="h-72 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse"></div>
        <div class="space-y-6">
          <div class="h-64 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse"></div>
          <div class="h-48 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse"></div>
        </div>
      </div>

      <div v-else class="grid gap-8 lg:grid-cols-[300px_1fr]">
        <!-- ── Left identity rail ───────────────────────── -->
        <aside class="lg:sticky lg:top-6 self-start">
          <div class="flex flex-col items-start">
            <div class="relative size-24">
              <div class="size-24 rounded-full overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-700 shadow-sm">
                <img v-if="profile.avatar" :src="profile.avatar" alt="Avatar" class="size-full object-cover" />
                <div v-else class="size-full flex items-center justify-center text-2xl font-black text-white bg-nfuko-primary-950">
                  {{ initials }}
                </div>
              </div>
              <button
                class="absolute -bottom-1 -right-1 size-8 rounded-full bg-nfuko-primary text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-neutral-900 hover:bg-nfuko-primary/90 transition-colors disabled:opacity-60"
                :disabled="profileStore.isUploadingAvatar"
                title="Change photo"
                @click="avatarInput?.click()"
              >
                <Loader2 v-if="profileStore.isUploadingAvatar" class="size-4 animate-spin" />
                <Camera v-else class="size-4" />
              </button>
              <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarSelected" />
            </div>

            <h1 class="mt-4 text-lg font-black text-neutral-900 dark:text-white break-all leading-tight">
              {{ profile.email || displayName }}
            </h1>
            <p class="text-sm text-neutral-400 mt-0.5">Member since {{ fmtDate(memberSince) }}</p>

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
              <button class="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" @click="drawerOpen = true">
                <Pencil class="size-4 text-neutral-500" /> Edit Profile
              </button>
              <button class="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" @click="openPassword">
                <KeyRound class="size-4 text-neutral-500" /> Change Password
              </button>
              <button class="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-60" :disabled="profileStore.isLoading" @click="syncData">
                <RotateCcw class="size-4 text-neutral-500" :class="profileStore.isLoading ? 'animate-spin' : ''" /> Sync Data
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
              <Button variant="outline" class="h-9 gap-2 font-bold rounded-lg" @click="drawerOpen = true">
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
                <div class="flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 px-4 py-3">
                  <Mail class="size-4 text-neutral-400 shrink-0" />
                  <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">{{ profile.email ?? '—' }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Account & Security -->
          <section class="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8">
            <h2 class="text-xl font-black text-neutral-900 dark:text-white mb-6">Account &amp; Security</h2>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="block text-sm text-neutral-500 mb-1.5">Role</label>
                <div class="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 px-4 py-3 text-sm font-semibold capitalize text-neutral-800 dark:text-neutral-100">
                  {{ profile.role || roleLabel }}
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
                <label class="block text-sm text-neutral-500 mb-1.5">Branch</label>
                <div class="flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 px-4 py-3">
                  <MapPin class="size-4 text-neutral-400 shrink-0" />
                  <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">{{ profileStore.branchName ?? '—' }}</span>
                </div>
              </div>
              <div>
                <label class="block text-sm text-neutral-500 mb-1.5">Password</label>
                <button class="flex w-full items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" @click="openPassword">
                  <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-100">••••••••</span>
                  <span class="inline-flex items-center gap-1 text-xs font-bold text-nfuko-primary"><KeyRound class="size-3.5" /> Change</span>
                </button>
              </div>
              <div class="sm:col-span-2">
                <label class="block text-sm text-neutral-500 mb-1.5">Member Since</label>
                <div class="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 px-4 py-3 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                  {{ fmtDate(memberSince) }}
                </div>
              </div>
            </div>

            <!-- Capabilities -->
            <div class="mt-6 flex flex-wrap gap-2">
              <span
                v-for="cap in capabilities"
                :key="cap.label"
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold',
                  cap.enabled ? 'border-green-200 bg-green-50 text-green-700' : 'border-neutral-200 bg-neutral-50 text-neutral-400',
                ]"
              >
                <span :class="['size-1.5 rounded-full', cap.enabled ? 'bg-green-500' : 'bg-neutral-300']" />
                {{ cap.label }}
              </span>
            </div>
          </section>

          <!-- Permissions -->
          <section class="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8">
            <div class="flex items-center gap-2 mb-6">
              <ShieldCheck class="size-5 text-nfuko-primary" />
              <h2 class="text-xl font-black text-neutral-900 dark:text-white">Permissions</h2>
              <span class="ml-auto inline-flex items-center rounded-full bg-nfuko-primary-50 px-2.5 py-0.5 text-xs font-bold text-nfuko-primary">
                {{ (profile.permissions ?? []).length }} total
              </span>
            </div>

            <div v-if="Object.keys(permissionGroups).length" class="flex flex-wrap gap-2">
              <span
                v-for="(count, group) in permissionGroups"
                :key="group"
                class="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 px-3 py-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-200 capitalize"
              >
                {{ group }}
                <span class="inline-flex items-center justify-center rounded-full bg-nfuko-primary/10 text-nfuko-primary px-1.5 text-[10px]">{{ count }}</span>
              </span>
            </div>
            <p v-else class="text-sm text-neutral-400">No permissions assigned.</p>
          </section>
        </div>
      </div>
    </div>

    <!-- Edit profile drawer (name) -->
    <EditProfileDrawer v-model:open="drawerOpen" />

    <!-- Change password drawer -->
    <Drawer :open="passwordOpen" title="Change Password" width="w-full sm:max-w-[440px]" :showFooter="false" @update:open="passwordOpen = $event">
      <template #body>
        <div class="flex flex-col gap-5 py-4">
          <div class="grid gap-2">
            <Label for="t-pass" class="text-sm font-semibold">New password</Label>
            <Input id="t-pass" v-model="pwForm.password" type="password" placeholder="Enter a new password" class="h-11" />
          </div>
          <div class="grid gap-2">
            <Label for="t-pass2" class="text-sm font-semibold">Confirm new password</Label>
            <Input id="t-pass2" v-model="pwForm.confirm" type="password" placeholder="Re-enter new password" class="h-11" />
          </div>

          <p v-if="pwError" class="text-sm font-medium text-red-600">{{ pwError }}</p>

          <div class="flex gap-2 pt-2">
            <Button type="button" variant="outline" class="h-11 flex-1 font-bold" @click="passwordOpen = false">Cancel</Button>
            <Button type="button" class="h-11 flex-1 gap-2 bg-nfuko-primary hover:bg-nfuko-primary/90 text-white font-bold" :disabled="pwSaving" @click="savePassword">
              <Loader2 v-if="pwSaving" class="size-4 animate-spin" />
              {{ pwSaving ? 'Saving…' : 'Update password' }}
            </Button>
          </div>
        </div>
      </template>
    </Drawer>
  </div>
</template>
