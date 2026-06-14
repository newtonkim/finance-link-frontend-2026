<script setup lang="ts">
import { computed } from 'vue'
import { Mail, ShieldCheck, CalendarDays, Hash, Clock } from 'lucide-vue-next'

const props = defineProps<{ data: Record<string, any> }>()

function initials(name: string) {
  if (!name) return '?'
  return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
}

const statusStyles = computed(() => {
  const map: Record<string, { badge: string; dot: string; label: string }> = {
    active:    { badge: 'bg-green-50 text-green-700 border-green-200',        dot: 'bg-green-500',   label: 'Active' },
    trial:     { badge: 'bg-amber-50 text-amber-700 border-amber-200',        dot: 'bg-amber-500',   label: 'Trial' },
    suspended: { badge: 'bg-red-50 text-red-700 border-red-200',              dot: 'bg-red-500',     label: 'Suspended' },
    expired:   { badge: 'bg-neutral-100 text-neutral-500 border-neutral-200', dot: 'bg-neutral-400', label: 'Expired' },
  }
  return map[props.data.status] ?? map.expired
})

function fmtDate(v: any) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
function fmtTime(v: any) {
  if (!v) return ''
  return new Date(v).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="space-y-4 px-1 pb-6">

    <!-- ── Profile card ─────────────────────────────────── -->
    <div class="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">

      <!-- Sidebar-toned gradient bar -->
      <div class="h-20 relative" style="background: linear-gradient(to right, #0c1427, #0050D8)">
        <div class="absolute -bottom-8 left-6">
          <div
            class="size-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg ring-4 ring-white dark:ring-neutral-900"
            style="background-color: #0c1427"
          >
            {{ initials(data.staff_fall_name) }}
          </div>
        </div>
      </div>

      <!-- Name / meta -->
      <div class="pt-12 pb-5 px-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-black text-neutral-900 dark:text-white leading-tight">
              {{ data.staff_fall_name ?? '—' }}
            </h2>
            <div class="flex items-center gap-1.5 mt-1 text-sm font-medium text-neutral-500">
              <Mail class="size-3.5" />
              {{ data.staff_email ?? '—' }}
            </div>
          </div>

          <span :class="['inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black border shrink-0 mt-1', statusStyles.badge]">
            <span :class="['size-2 rounded-full', statusStyles.dot]" />
            {{ statusStyles.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Role & access ──────────────────────────────── -->
    <div class="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      <div class="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
        <h3 class="text-sm font-black text-neutral-800 dark:text-neutral-100">Access & Role</h3>
        <p class="text-xs text-neutral-400 mt-0.5">Permissions assigned to this user</p>
      </div>

      <div class="p-5 flex items-center gap-4">
        <div
          class="size-12 rounded-xl flex items-center justify-center shrink-0"
          style="background-color: rgba(0,80,216,0.08)"
        >
          <ShieldCheck class="size-6 text-nfuko-primary" />
        </div>
        <div>
          <p class="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">System Role</p>
          <p class="text-base font-black text-neutral-800 dark:text-neutral-100 capitalize">
            {{ data.system_role ?? 'No role assigned' }}
          </p>
        </div>
        <span
          class="ml-auto inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-nfuko-primary capitalize"
          style="background-color: rgba(0,80,216,0.08)"
        >
          <ShieldCheck class="size-3.5" />
          {{ data.system_role ?? '—' }}
        </span>
      </div>
    </div>

    <!-- ── Account info ─────────────────────────────── -->
    <div class="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      <div class="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
        <h3 class="text-sm font-black text-neutral-800 dark:text-neutral-100">Account Info</h3>
      </div>

      <div class="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800">
        <div class="px-5 py-4">
          <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-2">
            <Hash class="size-3" />
            User ID
          </div>
          <p class="text-sm font-black text-neutral-700 dark:text-neutral-200 truncate">{{ data.id ?? '—' }}</p>
        </div>

        <div class="px-5 py-4 bg-neutral-50 dark:bg-neutral-800/40">
          <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-2">
            <Clock class="size-3" />
            Account Status
          </div>
          <p class="text-sm font-black text-neutral-700 dark:text-neutral-200 capitalize">
            {{ data.status ?? '—' }}
          </p>
        </div>

        <div class="px-5 py-4">
          <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-2">
            <CalendarDays class="size-3" />
            Date Joined
          </div>
          <p class="text-sm font-bold text-neutral-700 dark:text-neutral-200">{{ fmtDate(data.created_at) }}</p>
          <p class="text-[11px] text-neutral-400 mt-0.5">{{ fmtTime(data.created_at) }}</p>
        </div>
      </div>
    </div>

  </div>
</template>
