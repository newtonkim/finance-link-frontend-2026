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
