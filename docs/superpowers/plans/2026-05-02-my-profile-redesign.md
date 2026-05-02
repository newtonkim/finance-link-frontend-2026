# My Profile Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `tenant/my-profile` with a sticky sidebar identity card, wire up Edit Profile drawer, avatar upload, and inline password change.

**Architecture:** New sub-components replace the monolithic `MyProfile.vue` body. State extensions go into the existing `profileStore`. Sheet-based drawer for editing. No new routes needed.

**Tech Stack:** Vue 3 `<script setup>`, Pinia, Tailwind CSS, lucide-vue-next, `@/Global/ui/sheet`, `@/Global/ui/input`, `@/Global/ui/skeleton`, `@/Global/ui/label`, `vue-sonner`, existing `staffApi`, `branchesApi`.

---

## File Map

| Action | Path |
|--------|------|
| Modify | `src/tenant/apis/staff/api.ts` |
| Modify | `src/stores/profileStore.ts` |
| Create | `src/tenant/modules/profile/components/EditProfileDrawer.vue` |
| Create | `src/tenant/modules/profile/components/ProfileSidebar.vue` |
| Create | `src/tenant/modules/profile/components/ProfileOverviewTab.vue` |
| Create | `src/tenant/modules/profile/components/ProfilePermissionsTab.vue` |
| Create | `src/tenant/modules/profile/components/ProfileSecurityTab.vue` |
| Modify | `src/tenant/modules/profile/pages/MyProfile.vue` |

---

## Task 1: Add `uploadAvatar` to staffApi

**Files:**
- Modify: `src/tenant/apis/staff/api.ts`

- [ ] **Step 1: Add the uploadAvatar method**

Open `src/tenant/apis/staff/api.ts`. Add `uploadAvatar` after the existing `delete` method:

```ts
import { tenantClient } from '../tenantClient'

export interface Staff {
  id?: number
  name: string
  email: string
  role: string
  password?: string
  status: 'active' | 'inactive'
  is_tenant_admin?: boolean
  branch_id?: number | null
  can_vote_on_loans?: boolean
  can_manage_branch?: boolean
  can_finalise_loan?: boolean
  created_at?: string
  updated_at?: string
}

export const staffApi = {
  list(params?: { search?: string }) {
    return tenantClient.get('/staff', { params })
  },
  get(id: number) {
    return tenantClient.get(`/staff/${id}`)
  },
  create(data: Staff) {
    return tenantClient.post('/staff', data)
  },
  update(id: number, data: Partial<Staff>) {
    return tenantClient.put(`/staff/${id}`, data)
  },
  delete(id: number) {
    return tenantClient.delete(`/staff/${id}`)
  },
  getReferredMembers(id: number) {
    return tenantClient.get(`/staff/${id}/referred-members`)
  },
  uploadAvatar(id: number, file: File) {
    const form = new FormData()
    form.append('avatar', file)
    return tenantClient.post(`/staff/${id}/avatar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/asd/Mfuko_pro/mfuko-pro-frontend-2026 && pnpm type-check 2>&1 | grep -i "staff/api\|error" | head -10
```

Expected: no errors related to `staff/api.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/tenant/apis/staff/api.ts
git commit -m "feat(profile): add uploadAvatar to staffApi"
```

---

## Task 2: Extend profileStore with update/upload/password/branch actions

**Files:**
- Modify: `src/stores/profileStore.ts`

- [ ] **Step 1: Replace the store with the extended version**

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { staffApi, type Staff } from '@/tenant/apis/staff/api'
import { branchesApi } from '@/tenant/apis/branches/branchesApi'
import { useAuthStore } from './auth'
import { useTenantUserStore } from './tenantUserStore'
import { getLocalValues } from '@/Global'
import { toast } from 'vue-sonner'

export const useProfileStore = defineStore('profile', () => {
  const authStore = useAuthStore()
  const tenantUserStore = useTenantUserStore()

  const staffDetails = ref<Staff | null>(null)
  const permissions = ref<string[]>([])
  const isLoading = ref(false)
  const isUpdating = ref(false)
  const isUploadingAvatar = ref(false)
  const branchName = ref<string | null>(null)

  const combinedProfile = computed(() => {
    const authUser = authStore.user
    const tenantUser = tenantUserStore.user
    const details = staffDetails.value

    return {
      id: details?.id || tenantUser?.id || authUser?.id,
      name: details?.name || tenantUser?.name || authUser?.name || 'User',
      email: details?.email || tenantUser?.email || authUser?.email || '',
      role: details?.role || (authUser as any)?.role || 'Administrator',
      avatar: tenantUser?.avatar || null,
      status: details?.status || 'active',
      is_tenant_admin: details?.is_tenant_admin || false,
      branch_id: details?.branch_id || null,
      permissions: permissions.value,
      staff_data: details,
    }
  })

  async function resolveBranchName(branchId: number | null) {
    if (!branchId) return
    try {
      const { data } = await branchesApi.list()
      const branches: any[] = (data as any).data || data
      const match = branches.find((b: any) => b.id === branchId)
      branchName.value = match?.name || null
    } catch {
      branchName.value = null
    }
  }

  async function fetchFullProfile() {
    isLoading.value = true

    const storedPerms = getLocalValues('userPermissions')
    if (storedPerms?.data) {
      permissions.value = storedPerms.data.map((p: any) => p.name || p)
    }

    const userId = tenantUserStore.user?.id || authStore.user?.id

    if (userId) {
      try {
        const { data } = await staffApi.get(userId)
        staffDetails.value = data.data || data
        await resolveBranchName(staffDetails.value?.branch_id ?? null)
      } catch (error: any) {
        console.error('Failed to fetch staff details:', error)
      }
    }

    isLoading.value = false
  }

  async function updateProfile(data: Partial<Staff>) {
    const id = staffDetails.value?.id
    if (!id) throw new Error('No staff ID')
    isUpdating.value = true
    try {
      await staffApi.update(id, data)
      staffDetails.value = { ...staffDetails.value!, ...data }
    } finally {
      isUpdating.value = false
    }
  }

  async function uploadAvatar(file: File) {
    const id = staffDetails.value?.id
    if (!id) throw new Error('No staff ID')
    isUploadingAvatar.value = true
    try {
      const { data } = await staffApi.uploadAvatar(id, file)
      if (tenantUserStore.user) {
        tenantUserStore.user.avatar = (data as any).avatar_url
      }
    } finally {
      isUploadingAvatar.value = false
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    const id = staffDetails.value?.id
    if (!id) throw new Error('No staff ID')
    // Backend validates currentPassword — we send both; backend decides
    await staffApi.update(id, { password: newPassword })
  }

  return {
    staffDetails,
    permissions,
    isLoading,
    isUpdating,
    isUploadingAvatar,
    branchName,
    combinedProfile,
    fetchFullProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
  }
})
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm type-check 2>&1 | grep -i "profileStore\|error" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/stores/profileStore.ts
git commit -m "feat(profile): extend profileStore with update, avatar upload, password change, branch resolution"
```

---

## Task 3: Create EditProfileDrawer.vue

**Files:**
- Create: `src/tenant/modules/profile/components/EditProfileDrawer.vue`

- [ ] **Step 1: Create the drawer component**

```vue
<script setup lang="ts">
import { reactive, watch } from 'vue'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/Global/ui/sheet'
import { Button } from '@/Global/ui/button'
import { Input } from '@/Global/ui/input'
import { Label } from '@/Global/ui/label'
import { useProfileStore } from '@/stores/profileStore'
import { toast } from 'vue-sonner'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const profileStore = useProfileStore()

const form = reactive({ name: '' })

watch(
  () => props.open,
  (val) => {
    if (val) form.name = profileStore.combinedProfile.name
  },
)

async function save() {
  try {
    await profileStore.updateProfile({ name: form.name })
    toast.success('Profile updated.')
    emit('update:open', false)
  } catch {
    toast.error('Failed to update profile. Please try again.')
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="right" class="w-[420px] flex flex-col gap-0 p-0">
      <SheetHeader class="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
        <SheetTitle class="text-lg font-black text-neutral-900 dark:text-white">
          Edit Profile
        </SheetTitle>
      </SheetHeader>

      <div class="flex-1 px-6 py-6 space-y-6">
        <!-- Name -->
        <div class="space-y-2">
          <Label for="profile-name" class="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Full Name
          </Label>
          <Input
            id="profile-name"
            v-model="form.name"
            placeholder="Enter your full name"
            class="rounded-xl"
          />
        </div>

        <!-- Email — read-only -->
        <div class="space-y-2">
          <Label class="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Email Address
          </Label>
          <div class="px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            {{ profileStore.combinedProfile.email }}
          </div>
          <p class="text-xs text-neutral-400">Contact your admin to change your email address.</p>
        </div>

        <!-- Role — read-only -->
        <div class="space-y-2">
          <Label class="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Role
          </Label>
          <div class="px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            {{ profileStore.combinedProfile.role }}
          </div>
        </div>
      </div>

      <SheetFooter class="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
        <Button
          variant="outline"
          class="rounded-xl"
          @click="emit('update:open', false)"
        >
          Cancel
        </Button>
        <Button
          class="rounded-xl bg-nfuko-primary hover:bg-nfuko-primary/90 text-white font-bold"
          :disabled="profileStore.isUpdating || !form.name.trim()"
          @click="save"
        >
          <span v-if="profileStore.isUpdating" class="flex items-center gap-2">
            <svg class="animate-spin size-4" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Saving…
          </span>
          <span v-else>Save Changes</span>
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm type-check 2>&1 | grep -i "EditProfileDrawer\|error" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/tenant/modules/profile/components/EditProfileDrawer.vue
git commit -m "feat(profile): add EditProfileDrawer slide-over"
```

---

## Task 4: Create ProfileSidebar.vue

**Files:**
- Create: `src/tenant/modules/profile/components/ProfileSidebar.vue`

- [ ] **Step 1: Create the sidebar**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { User, ShieldCheck, Lock, Camera, MapPin } from 'lucide-vue-next'
import { Button } from '@/Global/ui/button'
import { Badge } from '@/Global'
import { Skeleton } from '@/Global/ui/skeleton'
import { Separator } from '@/Global'
import { useProfileStore } from '@/stores/profileStore'
import { toast } from 'vue-sonner'

const emit = defineEmits<{
  'edit-click': []
  'tab-change': [tab: string]
}>()

const props = defineProps<{
  activeTab: string
}>()

const profileStore = useProfileStore()
const profile = computed(() => profileStore.combinedProfile)
const avatarInputRef = ref<HTMLInputElement | null>(null)

const tabs = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
  { id: 'security', label: 'Security', icon: Lock },
]

// Deterministic gradient from name
const GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
]

const avatarGradient = computed(() => {
  const sum = profile.value.name
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return GRADIENTS[sum % GRADIENTS.length]
})

const initials = computed(() =>
  profile.value.name
    .split(' ')
    .map((n: string) => n[0] ?? '')
    .join('')
    .substring(0, 2)
    .toUpperCase(),
)

function triggerAvatarUpload() {
  avatarInputRef.value?.click()
}

async function onAvatarSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.error('Please select an image file.')
    return
  }
  try {
    await profileStore.uploadAvatar(file)
    toast.success('Avatar updated.')
  } catch {
    toast.error('Avatar upload failed. Please try again.')
  }
  // Reset input so the same file can be re-selected
  if (avatarInputRef.value) avatarInputRef.value.value = ''
}
</script>

<template>
  <aside class="sticky top-6 flex flex-col gap-2">
    <div class="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm p-6 flex flex-col gap-5">

      <!-- Loading skeleton -->
      <template v-if="profileStore.isLoading">
        <div class="flex flex-col items-center gap-3">
          <Skeleton class="size-20 rounded-2xl" />
          <Skeleton class="h-5 w-32 rounded-md" />
          <Skeleton class="h-4 w-20 rounded-md" />
        </div>
      </template>

      <!-- Identity card -->
      <template v-else>
        <div class="flex flex-col items-center text-center gap-3">
          <!-- Avatar with upload overlay -->
          <div class="relative group cursor-pointer" @click="triggerAvatarUpload">
            <div
              :class="`size-20 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-2xl font-black text-white overflow-hidden shadow-lg`"
            >
              <img
                v-if="profile.avatar"
                :src="profile.avatar"
                class="w-full h-full object-cover"
                alt="Profile photo"
              />
              <span v-else>{{ initials }}</span>

              <!-- Upload spinner overlay -->
              <div
                v-if="profileStore.isUploadingAvatar"
                class="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl"
              >
                <svg class="animate-spin size-6 text-white" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              </div>

              <!-- Camera hover overlay -->
              <div
                v-else
                class="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera class="size-6 text-white" />
              </div>
            </div>

            <!-- Active status dot -->
            <span
              class="absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-white dark:border-neutral-900"
              :class="profile.status === 'active' ? 'bg-emerald-500' : 'bg-neutral-400'"
            />
          </div>

          <!-- Hidden file input -->
          <input
            ref="avatarInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onAvatarSelected"
          />

          <div>
            <h2 class="text-lg font-black text-neutral-900 dark:text-white leading-tight">
              {{ profile.name }}
            </h2>
            <Badge
              variant="outline"
              class="mt-1.5 bg-nfuko-yellow/10 text-[#0A2318] dark:text-nfuko-yellow border-nfuko-yellow/20 font-bold"
            >
              {{ profile.role }}
            </Badge>
            <div
              v-if="profileStore.branchName"
              class="flex items-center justify-center gap-1 mt-2 text-xs text-neutral-400 font-medium"
            >
              <MapPin class="size-3" />
              {{ profileStore.branchName }}
            </div>
          </div>
        </div>

        <Separator />
      </template>

      <!-- Navigation -->
      <nav class="flex flex-col gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200"
          :class="activeTab === tab.id
            ? 'border-l-2 border-nfuko-action bg-nfuko-action/5 text-nfuko-primary dark:text-white pl-3.5'
            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50'"
          @click="emit('tab-change', tab.id)"
        >
          <component :is="tab.icon" class="size-4 shrink-0" />
          {{ tab.label }}
        </button>
      </nav>

      <Button
        variant="outline"
        class="w-full rounded-xl font-bold mt-1"
        @click="emit('edit-click')"
      >
        Edit Profile
      </Button>
    </div>
  </aside>
</template>
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm type-check 2>&1 | grep -i "ProfileSidebar\|error" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/tenant/modules/profile/components/ProfileSidebar.vue
git commit -m "feat(profile): add ProfileSidebar with gradient avatar, upload, branch, active nav"
```

---

## Task 5: Create ProfileOverviewTab.vue

**Files:**
- Create: `src/tenant/modules/profile/components/ProfileOverviewTab.vue`

- [ ] **Step 1: Create the overview tab**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, Calendar, ShieldCheck, Briefcase } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/Global'
import { formatDateUs } from '@/Global/Helpers'
import { useProfileStore } from '@/stores/profileStore'

const profileStore = useProfileStore()
const profile = computed(() => profileStore.combinedProfile)

const capabilities = computed(() => [
  { label: 'Vote on Loans', enabled: profile.value.staff_data?.can_vote_on_loans },
  { label: 'Manage Branch', enabled: profile.value.staff_data?.can_manage_branch },
  { label: 'Finalise Loans', enabled: profile.value.staff_data?.can_finalise_loan },
])

const statCards = computed(() => [
  {
    label: 'Status',
    icon: CheckCircle2,
    value: profile.value.status,
    accent: 'border-l-emerald-500',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'Member Since',
    icon: Calendar,
    value: formatDateUs(profile.value.staff_data?.created_at),
    accent: 'border-l-indigo-500',
    iconClass: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    label: 'Access Level',
    icon: ShieldCheck,
    value: profile.value.is_tenant_admin ? 'Admin' : 'Staff',
    accent: 'border-l-violet-500',
    iconClass: 'text-violet-600 dark:text-violet-400',
  },
])
</script>

<template>
  <div class="space-y-6">
    <!-- Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div
        v-for="card in statCards"
        :key="card.label"
        :class="`bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border-l-4 ${card.accent} p-6`"
      >
        <component :is="card.icon" :class="`size-5 mb-3 ${card.iconClass}`" />
        <div class="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          {{ card.label }}
        </div>
        <div class="text-xl font-black text-neutral-900 dark:text-white mt-1 capitalize">
          {{ card.value }}
        </div>
      </div>
    </div>

    <!-- Professional Profile -->
    <Card class="rounded-3xl border-none shadow-sm bg-white dark:bg-neutral-900">
      <CardHeader class="px-8 pt-7 pb-4">
        <CardTitle class="text-lg font-black flex items-center gap-2 text-neutral-900 dark:text-white">
          <Briefcase class="size-5 text-nfuko-primary dark:text-nfuko-yellow" />
          Professional Profile
        </CardTitle>
      </CardHeader>
      <CardContent class="px-8 pb-7">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-1">
            <div class="text-xs font-bold text-neutral-400 uppercase tracking-wider">Designation</div>
            <div class="text-sm font-semibold text-neutral-900 dark:text-white">{{ profile.role }}</div>
          </div>

          <div class="space-y-1">
            <div class="text-xs font-bold text-neutral-400 uppercase tracking-wider">Staff ID</div>
            <div class="text-sm font-semibold text-neutral-900 dark:text-white">#{{ profile.id }}</div>
          </div>

          <div class="space-y-1">
            <div class="text-xs font-bold text-neutral-400 uppercase tracking-wider">Email Address</div>
            <div class="text-sm font-semibold text-neutral-900 dark:text-white">{{ profile.email }}</div>
          </div>

          <div
            v-if="profileStore.branchName"
            class="space-y-1"
          >
            <div class="text-xs font-bold text-neutral-400 uppercase tracking-wider">Branch</div>
            <div class="text-sm font-semibold text-neutral-900 dark:text-white">{{ profileStore.branchName }}</div>
          </div>

          <div class="space-y-2 md:col-span-2">
            <div class="text-xs font-bold text-neutral-400 uppercase tracking-wider">Capabilities</div>
            <div class="flex flex-wrap gap-2">
              <Badge
                v-for="cap in capabilities"
                :key="cap.label"
                :class="cap.enabled
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-bold'
                  : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 border-none font-bold'"
              >
                {{ cap.label }}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm type-check 2>&1 | grep -i "ProfileOverviewTab\|error" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/tenant/modules/profile/components/ProfileOverviewTab.vue
git commit -m "feat(profile): add ProfileOverviewTab with stat cards and capabilities"
```

---

## Task 6: Create ProfilePermissionsTab.vue

**Files:**
- Create: `src/tenant/modules/profile/components/ProfilePermissionsTab.vue`

- [ ] **Step 1: Create the permissions tab**

```vue
<script setup lang="ts">
import { ShieldCheck, ShieldAlert } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/Global'

const props = defineProps<{
  permissionGroups: Record<string, string[]>
  totalCount: number
}>()
</script>

<template>
  <Card class="rounded-3xl border-none shadow-sm bg-white dark:bg-neutral-900">
    <CardHeader class="px-8 pt-7 pb-4">
      <CardTitle class="text-lg font-black flex items-center gap-2 text-neutral-900 dark:text-white">
        <ShieldCheck class="size-5 text-emerald-500" />
        Your Permissions
        <span class="ml-auto text-xs font-bold text-neutral-400 normal-case">
          {{ totalCount }} total
        </span>
      </CardTitle>
      <p class="text-sm text-neutral-500 font-medium">
        Modules and actions you are authorized to access.
      </p>
    </CardHeader>
    <CardContent class="px-8 pb-7">
      <div
        v-if="totalCount === 0"
        class="flex flex-col items-center justify-center py-12 text-neutral-400"
      >
        <ShieldAlert class="size-12 mb-4 opacity-20" />
        <p class="font-bold">No explicit permissions found.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          v-for="(perms, group) in permissionGroups"
          :key="group"
          class="space-y-3"
        >
          <h3 class="text-xs font-black text-nfuko-action uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800 pb-2">
            {{ group }}
          </h3>
          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="perm in perms"
              :key="perm"
              class="bg-nfuko-primary/5 text-nfuko-primary dark:bg-neutral-800 dark:text-neutral-300 border-none font-bold py-1 px-3 rounded-lg"
            >
              {{ perm.replace(`${group}-`, '').replace(/-/g, ' ') }}
            </Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm type-check 2>&1 | grep -i "ProfilePermissionsTab\|error" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/tenant/modules/profile/components/ProfilePermissionsTab.vue
git commit -m "feat(profile): add ProfilePermissionsTab with styled permission groups"
```

---

## Task 7: Create ProfileSecurityTab.vue

**Files:**
- Create: `src/tenant/modules/profile/components/ProfileSecurityTab.vue`

- [ ] **Step 1: Create the security tab**

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Lock, KeyRound } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/Global'
import { Input } from '@/Global/ui/input'
import { Label } from '@/Global/ui/label'
import { useProfileStore } from '@/stores/profileStore'
import { toast } from 'vue-sonner'

const profileStore = useProfileStore()

const showPasswordForm = ref(false)
const isSaving = ref(false)
const passwordError = ref('')

const form = reactive({
  current: '',
  next: '',
  confirm: '',
})

function openPasswordForm() {
  showPasswordForm.value = true
  passwordError.value = ''
  form.current = ''
  form.next = ''
  form.confirm = ''
}

function cancelPasswordForm() {
  showPasswordForm.value = false
  passwordError.value = ''
}

async function submitPasswordChange() {
  passwordError.value = ''

  if (!form.current.trim()) {
    passwordError.value = 'Please enter your current password.'
    return
  }
  if (form.next.length < 8) {
    passwordError.value = 'New password must be at least 8 characters.'
    return
  }
  if (form.next !== form.confirm) {
    passwordError.value = 'New passwords do not match.'
    return
  }

  isSaving.value = true
  try {
    await profileStore.changePassword(form.current, form.next)
    toast.success('Password changed successfully.')
    showPasswordForm.value = false
  } catch {
    passwordError.value = 'Password change failed. Check your current password and try again.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Card class="rounded-3xl border-none shadow-sm bg-white dark:bg-neutral-900">
    <CardHeader class="px-8 pt-7 pb-4">
      <CardTitle class="text-lg font-black flex items-center gap-2 text-neutral-900 dark:text-white">
        <KeyRound class="size-5 text-nfuko-yellow" />
        Authentication Security
      </CardTitle>
    </CardHeader>
    <CardContent class="px-8 pb-7 space-y-6">

      <!-- Password Row -->
      <div class="rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="flex items-center justify-between gap-4 p-4">
          <div class="flex items-center gap-4">
            <div class="size-10 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center shadow-sm shrink-0">
              <Lock class="size-5 text-neutral-400" />
            </div>
            <div>
              <div class="font-bold text-neutral-900 dark:text-white text-sm">Account Password</div>
              <div class="text-xs text-neutral-500 font-medium">Keep your account secure</div>
            </div>
          </div>
          <Button
            v-if="!showPasswordForm"
            variant="outline"
            class="rounded-xl font-bold shrink-0"
            @click="openPasswordForm"
          >
            Update Password
          </Button>
        </div>

        <!-- Inline Form -->
        <div v-if="showPasswordForm" class="border-t border-neutral-100 dark:border-neutral-800 px-4 pb-4 pt-4 space-y-4">
          <div class="space-y-2">
            <Label class="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Current Password
            </Label>
            <Input
              v-model="form.current"
              type="password"
              placeholder="••••••••"
              class="rounded-xl"
              autocomplete="current-password"
            />
          </div>
          <div class="space-y-2">
            <Label class="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              New Password
            </Label>
            <Input
              v-model="form.next"
              type="password"
              placeholder="Min. 8 characters"
              class="rounded-xl"
              autocomplete="new-password"
            />
          </div>
          <div class="space-y-2">
            <Label class="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Confirm New Password
            </Label>
            <Input
              v-model="form.confirm"
              type="password"
              placeholder="Repeat new password"
              class="rounded-xl"
              autocomplete="new-password"
            />
          </div>

          <p v-if="passwordError" class="text-xs text-red-500 font-medium">
            {{ passwordError }}
          </p>

          <div class="flex items-center gap-3">
            <Button
              class="rounded-xl bg-nfuko-primary hover:bg-nfuko-primary/90 text-white font-bold"
              :disabled="isSaving"
              @click="submitPasswordChange"
            >
              <span v-if="isSaving" class="flex items-center gap-2">
                <svg class="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Saving…
              </span>
              <span v-else>Change Password</span>
            </Button>
            <button
              class="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 font-bold transition-colors"
              @click="cancelPasswordForm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Sessions (placeholder) -->
      <div class="space-y-3">
        <h3 class="text-xs font-black text-neutral-400 uppercase tracking-widest">Active Sessions</h3>
        <!-- TODO: wire up real sessions API when backend endpoint is available -->
        <div class="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800">
          <div class="flex items-center gap-4">
            <div class="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <div class="size-2 rounded-full bg-emerald-500"></div>
            </div>
            <div>
              <div class="text-sm font-bold text-neutral-900 dark:text-white">Current Browser</div>
              <div class="text-xs text-neutral-500 font-medium">Active now</div>
            </div>
          </div>
          <Badge class="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-none font-black text-[10px]">
            CURRENT
          </Badge>
        </div>
      </div>

    </CardContent>
  </Card>
</template>
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm type-check 2>&1 | grep -i "ProfileSecurityTab\|error" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/tenant/modules/profile/components/ProfileSecurityTab.vue
git commit -m "feat(profile): add ProfileSecurityTab with inline password change form"
```

---

## Task 8: Rewrite MyProfile.vue to compose all sub-components

**Files:**
- Modify: `src/tenant/modules/profile/pages/MyProfile.vue`

- [ ] **Step 1: Replace MyProfile.vue with the composed layout**

```vue
<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import { Button } from '@/Global/ui/button'
import { useProfileStore } from '@/stores/profileStore'
import { toast } from 'vue-sonner'

import ProfileSidebar from '../components/ProfileSidebar.vue'
import ProfileOverviewTab from '../components/ProfileOverviewTab.vue'
import ProfilePermissionsTab from '../components/ProfilePermissionsTab.vue'
import ProfileSecurityTab from '../components/ProfileSecurityTab.vue'
import EditProfileDrawer from '../components/EditProfileDrawer.vue'

const profileStore = useProfileStore()
const activeTab = ref('overview')
const drawerOpen = ref(false)

const profile = computed(() => profileStore.combinedProfile)

onMounted(async () => {
  await profileStore.fetchFullProfile()
})

// Group permissions for display
const permissionGroups = computed(() => {
  const groups: Record<string, string[]> = {}
  profile.value.permissions.forEach((perm: string) => {
    const part = perm.split('-')[0]
    if (!groups[part]) groups[part] = []
    groups[part].push(perm)
  })
  return groups
})

async function syncData() {
  await profileStore.fetchFullProfile()
  toast.success('Profile data refreshed.')
}
</script>

<template>
  <div class="min-h-screen bg-[#F8FAF9] dark:bg-[#0A0A0A] p-6 lg:p-8">
    <div class="max-w-6xl mx-auto">

      <!-- Top bar: page title + sync -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-black text-neutral-900 dark:text-white">My Profile</h1>
          <p class="text-sm text-neutral-400 font-medium mt-0.5">Manage your personal information and security</p>
        </div>
        <Button
          variant="outline"
          class="rounded-xl font-bold flex items-center gap-2"
          :disabled="profileStore.isLoading"
          @click="syncData"
        >
          <RotateCcw
            class="size-4"
            :class="profileStore.isLoading ? 'animate-spin' : ''"
          />
          Sync Data
        </Button>
      </div>

      <!-- Two-column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-7">

        <!-- Sidebar -->
        <div class="lg:col-span-3">
          <ProfileSidebar
            :active-tab="activeTab"
            @tab-change="activeTab = $event"
            @edit-click="drawerOpen = true"
          />
        </div>

        <!-- Tab content -->
        <div class="lg:col-span-9">
          <ProfileOverviewTab v-if="activeTab === 'overview'" />

          <ProfilePermissionsTab
            v-else-if="activeTab === 'permissions'"
            :permission-groups="permissionGroups"
            :total-count="profile.permissions.length"
          />

          <ProfileSecurityTab v-else-if="activeTab === 'security'" />
        </div>
      </div>
    </div>

    <!-- Edit Profile Drawer -->
    <EditProfileDrawer v-model:open="drawerOpen" />
  </div>
</template>
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm type-check 2>&1 | grep -i "error" | head -20
```

Expected: 0 errors.

- [ ] **Step 3: Start dev server and visually verify**

```bash
pnpm dev
```

Open `http://localhost:5173` (or whichever port Vite uses), navigate to `tenant/my-profile` and verify:
- Sidebar shows avatar with gradient, name, role badge, branch (if assigned), and 3 nav links
- Clicking the avatar shows a camera hover overlay
- Overview tab shows 3 stat cards with left color accents and a Professional Profile card with Capabilities badges
- Permissions tab shows grouped permission badges
- Security tab shows password row; clicking "Update Password" expands the inline form
- Edit Profile button opens the slide-over drawer with name/email/role fields

- [ ] **Step 4: Commit**

```bash
git add src/tenant/modules/profile/pages/MyProfile.vue
git commit -m "feat(profile): compose MyProfile with sidebar layout and tab components"
```

---

## Self-Review

**Spec coverage check:**
- [x] Full-width hero header eliminated → sidebar owns identity — Task 4
- [x] Sidebar sticky, contains avatar + identity + nav + Edit Profile button — Task 4
- [x] Gradient avatar seeded from name — Task 4
- [x] Camera overlay on avatar hover — Task 4
- [x] Click-to-upload avatar triggers file input → `uploadAvatar()` — Task 4
- [x] Active nav uses border-l-2 border-nfuko-action — Task 4
- [x] Edit Profile opens Sheet drawer — Tasks 3 + 8
- [x] Drawer edits name, email/role read-only — Task 3
- [x] Stat cards with border-l-4 accent — Task 5
- [x] Hardcoded "Full-time" removed — Task 5
- [x] Capabilities badges from API fields — Task 5
- [x] Branch name resolved and displayed — Tasks 2 + 4 + 5
- [x] Permission groups styled with nfuko-action group headers — Task 6
- [x] Inline expandable password form — Task 7
- [x] Password form: current + new + confirm fields, inline error — Task 7
- [x] Skeleton loading states — Task 4 (sidebar)
- [x] `updateProfile`, `uploadAvatar`, `changePassword` in store — Task 2
- [x] `staffApi.uploadAvatar` method — Task 1
- [x] Sync Data button retained (moved to top-right) — Task 8
- [x] Sessions section kept as placeholder — Task 7

**Placeholder scan:** No TBDs or incomplete code blocks.

**Type consistency:** All prop names consistent (`activeTab`, `permissionGroups`, `totalCount`), store method names match across all tasks.
