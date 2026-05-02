<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import { Button } from '@/Global'
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
  await profileStore.fetchFullProfile(true)
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
