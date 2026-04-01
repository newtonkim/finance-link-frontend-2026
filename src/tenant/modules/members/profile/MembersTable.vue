<script setup lang="ts">
import { Eye, Pencil, Trash2 } from 'lucide-vue-next'
import type { Member } from '../composables/useMembers'

defineProps<{
  members: Member[]
  loading: boolean
  meta: { current_page: number; last_page: number; per_page: number; total: number }
  pages: number[]
}>()

const emit = defineEmits<{
  view: [member: Member]
  edit: [member: Member]
  delete: [member: Member]
  paginate: [page: number]
}>()

function statusClass(status: string) {
  if (status === 'active')   return 'bg-green-100 text-green-700'
  if (status === 'pending')  return 'bg-amber-100 text-amber-700'
  if (status === 'rejected') return 'bg-red-100 text-red-600'
  return 'bg-neutral-100 text-neutral-500'
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-100 dark:border-neutral-800">
            <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400 col-member">Member #</th>
            <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400 col-name">Full Name</th>
            <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400 col-phone">Phone</th>
            <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400 col-email">Email</th>
            <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400 col-gender">Gender</th>
            <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400 col-status">Status</th>
            <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400 col-joined">Joined</th>
            <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400 text-right col-actions no-print">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
          <template v-if="loading">
            <tr v-for="i in 6" :key="i" class="animate-pulse">
              <td v-for="j in 8" :key="j" class="px-6 py-4">
                <div class="h-4 rounded bg-neutral-100 dark:bg-neutral-800" :class="j === 2 ? 'w-32' : 'w-20'" />
              </td>
            </tr>
          </template>
          <tr v-else-if="members.length === 0">
            <td colspan="8" class="px-6 py-16 text-center text-sm text-neutral-400">No members found.</td>
          </tr>
          <tr v-else v-for="member in members" :key="member.id"
            class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
            <td class="px-6 py-4 font-mono text-xs text-neutral-500 col-member">{{ member.member_number }}</td>
            <td class="px-6 py-4 col-name">
              <div class="flex items-center gap-3">
                <div class="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-nfuko-primary/10 member-avatar">
                  <img v-if="member.avatar_url" :src="member.avatar_url" :alt="member.name" class="h-full w-full object-cover" />
                  <div v-else class="flex h-full w-full items-center justify-center text-sm font-bold text-nfuko-primary">
                    {{ member.name.charAt(0).toUpperCase() }}
                  </div>
                </div>
                <span class="font-medium text-neutral-900 dark:text-white">{{ member.name }}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400 col-phone">{{ member.phone }}</td>
            <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400 col-email">{{ member.email ?? '—' }}</td>
            <td class="px-6 py-4 capitalize text-neutral-600 dark:text-neutral-400 col-gender">{{ member.gender }}</td>
            <td class="px-6 py-4 col-status">
              <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize" :class="statusClass(member.status)">
                {{ member.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-neutral-500 dark:text-neutral-400 col-joined">{{ formatDate(member.joined_at) }}</td>
            <td class="px-6 py-4 text-right col-actions no-print">
              <div class="inline-flex items-center gap-1.5">
                <button @click="emit('view', member)"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-[#c7d7f5] bg-[#eef3fd] px-3 py-1.5 text-xs font-semibold text-[#4f6cad] hover:bg-[#dce8fb] transition-colors">
                  <Eye class="h-3.5 w-3.5" /> View
                </button>
                <button @click="emit('edit', member)"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-[#c7d7f5] bg-[#eef3fd] px-3 py-1.5 text-xs font-semibold text-[#4f6cad] hover:bg-[#dce8fb] transition-colors">
                  <Pencil class="h-3.5 w-3.5" /> Edit
                </button>
                <button @click="emit('delete', member)"
                  class="flex items-center justify-center rounded-lg border border-red-100 bg-red-50 p-1.5 text-red-500 hover:bg-red-100 transition-colors">
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="meta.last_page > 1"
      class="flex items-center justify-between border-t border-neutral-100 px-6 py-3 dark:border-neutral-800 no-print">
      <p class="text-xs text-neutral-400">
        Showing page {{ meta.current_page }} of {{ meta.last_page }} ({{ meta.total }} members)
      </p>
      <div class="flex gap-1">
        <button v-for="page in pages" :key="page" @click="emit('paginate', page)"
          class="h-8 w-8 rounded-lg text-xs font-medium transition-colors"
          :class="page === meta.current_page ? 'bg-nfuko-primary text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'">
          {{ page }}
        </button>
      </div>
    </div>
  </div>
</template>
