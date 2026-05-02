<script setup lang="ts">
import { computed, ref } from 'vue'
import { User, ShieldCheck, Lock, Camera, MapPin } from 'lucide-vue-next'
import { Button, Badge, Skeleton, Separator } from '@/Global'
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
                class="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl"
              >
                <svg class="animate-spin size-6 text-white" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              </div>

              <!-- Hover darken overlay -->
              <div
                v-else
                class="absolute inset-0 bg-black/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>

            <!-- Permanent camera badge (always visible) -->
            <button
              v-if="!profileStore.isUploadingAvatar"
              class="absolute -bottom-2 -right-2 size-7 rounded-full bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-md hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              title="Upload photo"
              @click.stop="triggerAvatarUpload"
            >
              <Camera class="size-3.5 text-neutral-600 dark:text-neutral-300" />
            </button>

            <!-- Active status dot (only when not uploading) -->
            <span
              v-if="profileStore.isUploadingAvatar"
              class="absolute -top-1 -right-1 size-4 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center"
            >
              <svg class="animate-spin size-3 text-nfuko-primary" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            </span>
            <span
              v-else
              class="absolute -top-1 -right-1 size-3.5 rounded-full border-2 border-white dark:border-neutral-900"
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
