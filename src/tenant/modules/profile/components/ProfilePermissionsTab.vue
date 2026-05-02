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
