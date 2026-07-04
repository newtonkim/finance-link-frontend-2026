<script setup lang="ts">
import { computed } from 'vue'
import { Eye, Pencil, Trash2, Users, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { Member } from '../composables/useMembers'

const props = defineProps<{
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

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?'
}

// Status drives a coloured dot + label; active members also get a gold avatar ring.
function statusMeta(status: string) {
  const s = (status || '').toLowerCase()
  if (s === 'active') return { dot: 'bg-emerald-500', text: 'text-emerald-700', ring: true }
  if (s === 'pending') return { dot: 'bg-amber-500', text: 'text-amber-700', ring: false }
  if (s === 'rejected') return { dot: 'bg-rose-500', text: 'text-rose-600', ring: false }
  if (['inactive', 'suspended', 'dormant', 'closed'].includes(s)) return { dot: 'bg-slate-400', text: 'text-slate-500', ring: false }
  return { dot: 'bg-slate-400', text: 'text-slate-500', ring: false }
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const rangeFrom = computed(() => (props.meta.total === 0 ? 0 : (props.meta.current_page - 1) * props.meta.per_page + 1))
const rangeTo = computed(() => Math.min(props.meta.current_page * props.meta.per_page, props.meta.total))
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <!-- ── Desktop table ─────────────────────────────────────────────── -->
    <div class="hidden overflow-x-auto md:block">
      <table class="w-full min-w-220 text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-200 bg-neutral-50/70 text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/40">
            <th class="px-6 py-3.5">Member</th>
            <th class="px-6 py-3.5">Contact</th>
            <th class="px-6 py-3.5">Type</th>
            <th class="px-6 py-3.5">Status</th>
            <th class="px-6 py-3.5">Joined</th>
            <th class="px-6 py-3.5 text-right no-print">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
          <!-- Loading -->
          <template v-if="loading">
            <tr v-for="i in 6" :key="i" class="animate-pulse">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800"></div>
                  <div class="space-y-2"><div class="h-3 w-32 rounded bg-neutral-100 dark:bg-neutral-800"></div><div class="h-2.5 w-20 rounded bg-neutral-100 dark:bg-neutral-800"></div></div>
                </div>
              </td>
              <td v-for="j in 5" :key="j" class="px-6 py-4"><div class="h-3 w-20 rounded bg-neutral-100 dark:bg-neutral-800"></div></td>
            </tr>
          </template>

          <!-- Empty -->
          <tr v-else-if="members.length === 0">
            <td colspan="6" class="px-6 py-16">
              <div class="mx-auto flex max-w-xs flex-col items-center text-center">
                <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                  <Users class="h-6 w-6" />
                </div>
                <p class="text-sm font-bold text-neutral-700 dark:text-neutral-200">No members found</p>
                <p class="mt-1 text-xs text-neutral-500">Adjust your search, or add a new member to get started.</p>
              </div>
            </td>
          </tr>

          <!-- Rows -->
          <tr v-else v-for="member in members" :key="member.id"
            class="group relative cursor-pointer transition-colors hover:bg-[#052659]/3"
            @click="emit('view', member)">
            <!-- Identity -->
            <td class="relative px-6 py-4">
              <span class="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-[#cda434] transition-transform group-hover:scale-y-100"></span>
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#052659]/10 ring-2 ring-offset-1"
                  :class="statusMeta(member.status).ring ? 'ring-[#cda434]' : 'ring-neutral-200 dark:ring-neutral-700'">
                  <img v-if="member.avatar_url" :src="member.avatar_url" :alt="member.name" class="h-full w-full object-cover" />
                  <div v-else class="flex h-full w-full items-center justify-center text-xs font-black text-[#052659] dark:text-white">
                    {{ initials(member.name) }}
                  </div>
                </div>
                <div class="min-w-0">
                  <div class="truncate font-bold text-neutral-900 dark:text-white">{{ member.name }}</div>
                  <div class="mt-0.5 flex items-center gap-2">
                    <span class="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-neutral-500 dark:bg-neutral-800">{{ member.member_number }}</span>
                    <span v-if="member.email" class="truncate text-[11px] text-neutral-400">{{ member.email }}</span>
                  </div>
                </div>
              </div>
            </td>
            <!-- Contact -->
            <td class="px-6 py-4">
              <div class="font-medium text-neutral-700 dark:text-neutral-300">{{ member.phone || '—' }}</div>
              <div class="mt-0.5 text-[11px] capitalize text-neutral-400">{{ member.nationality || member.gender || '' }}</div>
            </td>
            <!-- Type -->
            <td class="px-6 py-4">
              <span class="inline-flex rounded-md bg-[#052659]/5 px-2 py-1 text-[11px] font-bold capitalize text-[#052659] ring-1 ring-inset ring-[#052659]/10 dark:bg-white/5 dark:text-neutral-200">
                {{ member.member_type || 'member' }}
              </span>
            </td>
            <!-- Status -->
            <td class="px-6 py-4">
              <span class="inline-flex items-center gap-1.5 text-xs font-semibold capitalize" :class="statusMeta(member.status).text">
                <span class="h-2 w-2 rounded-full" :class="statusMeta(member.status).dot"></span>
                {{ member.status }}
              </span>
            </td>
            <!-- Joined -->
            <td class="px-6 py-4 text-neutral-500 dark:text-neutral-400">{{ formatDate(member.joined_at) }}</td>
            <!-- Actions -->
            <td class="px-6 py-4 text-right no-print" @click.stop>
              <div class="inline-flex items-center gap-1">
                <button @click="emit('view', member)" title="View member"
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-[#052659] transition hover:bg-[#052659] hover:text-white">
                  <Eye class="h-4 w-4" />
                </button>
                <button @click="emit('edit', member)" title="Edit member"
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800">
                  <Pencil class="h-4 w-4" />
                </button>
                <button @click="emit('delete', member)" title="Delete member"
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Mobile cards ──────────────────────────────────────────────── -->
    <div class="divide-y divide-neutral-100 md:hidden dark:divide-neutral-800">
      <template v-if="loading">
        <div v-for="i in 4" :key="i" class="flex animate-pulse items-center gap-3 p-4">
          <div class="h-11 w-11 rounded-full bg-neutral-100 dark:bg-neutral-800"></div>
          <div class="flex-1 space-y-2"><div class="h-3 w-2/3 rounded bg-neutral-100 dark:bg-neutral-800"></div><div class="h-2.5 w-1/3 rounded bg-neutral-100 dark:bg-neutral-800"></div></div>
        </div>
      </template>
      <div v-else-if="members.length === 0" class="p-10 text-center">
        <p class="text-sm font-bold text-neutral-700 dark:text-neutral-200">No members found</p>
        <p class="mt-1 text-xs text-neutral-500">Adjust your search, or add a new member.</p>
      </div>
      <button v-else v-for="member in members" :key="member.id" @click="emit('view', member)"
        class="flex w-full items-center gap-3 p-4 text-left transition hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
        <div class="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#052659]/10 ring-2"
          :class="statusMeta(member.status).ring ? 'ring-[#cda434]' : 'ring-neutral-200 dark:ring-neutral-700'">
          <img v-if="member.avatar_url" :src="member.avatar_url" :alt="member.name" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center text-sm font-black text-[#052659] dark:text-white">{{ initials(member.name) }}</div>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <span class="truncate font-bold text-neutral-900 dark:text-white">{{ member.name }}</span>
            <span class="inline-flex items-center gap-1 text-[11px] font-semibold capitalize" :class="statusMeta(member.status).text">
              <span class="h-1.5 w-1.5 rounded-full" :class="statusMeta(member.status).dot"></span>{{ member.status }}
            </span>
          </div>
          <div class="mt-0.5 truncate text-xs text-neutral-500">
            <span class="font-mono">{{ member.member_number }}</span> · {{ member.phone || 'No phone' }}
          </div>
        </div>
      </button>
    </div>

    <!-- ── Footer / paginator ────────────────────────────────────────── -->
    <div v-if="!loading && members.length"
      class="flex flex-col items-center justify-between gap-3 border-t border-neutral-100 px-6 py-3 sm:flex-row dark:border-neutral-800 no-print">
      <p class="text-xs font-medium text-neutral-500">
        Showing <span class="font-bold text-neutral-700 dark:text-neutral-300">{{ rangeFrom }}–{{ rangeTo }}</span>
        of <span class="font-bold text-neutral-700 dark:text-neutral-300">{{ meta.total }}</span> members
      </p>
      <div v-if="meta.last_page > 1" class="flex items-center gap-1">
        <button :disabled="meta.current_page === 1" @click="emit('paginate', meta.current_page - 1)"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-neutral-800">
          <ChevronLeft class="h-4 w-4" />
        </button>
        <button v-for="page in pages" :key="page" @click="emit('paginate', page)"
          class="h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition-colors"
          :class="page === meta.current_page ? 'bg-[#052659] text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'">
          {{ page }}
        </button>
        <button :disabled="meta.current_page === meta.last_page" @click="emit('paginate', meta.current_page + 1)"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-neutral-800">
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>
