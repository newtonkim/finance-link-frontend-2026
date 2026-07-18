<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CheckCircle, XCircle, HelpCircle, Clock, FileText, User,
  ShieldAlert, AlertTriangle, Banknote, Calendar, Tag, CreditCard,
  Hash, Building2, Receipt
} from 'lucide-vue-next'
import { pomPinia } from 'septor-store'
import { Badge } from '@/Global'
import { licenseState } from '@/tenant/apis/licenseState'

const store = pomPinia()
const currentUserId = (store as any).user?.id

const props = defineProps<{ data: any }>()
const emit = defineEmits(['approve', 'reject', 'query'])

const comments = ref('')

const isSelfReview = computed(() => {
  return props.data?.created_by && currentUserId &&
    String(props.data.created_by) === String(currentUserId)
})

const statusConfig: Record<string, { label: string; class: string }> = {
  Draft:     { label: 'Draft',     class: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
  Submitted: { label: 'Submitted', class: 'bg-sky-50 text-sky-700 border-sky-200' },
  Pending:   { label: 'Pending',   class: 'bg-amber-50 text-amber-700 border-amber-200' },
  Queried:   { label: 'Queried',   class: 'bg-orange-50 text-orange-700 border-orange-200' },
  Approved:  { label: 'Approved',  class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Paid:      { label: 'Paid',      class: 'bg-blue-50 text-blue-700 border-blue-200' },
  Rejected:  { label: 'Rejected',  class: 'bg-rose-50 text-rose-700 border-rose-200' },
}

function statusClass(s: string) {
  return statusConfig[s]?.class ?? 'bg-neutral-50 text-neutral-400'
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function historyBubbleClass(action: string) {
  const map: Record<string, string> = {
    approved: 'border-emerald-300 bg-emerald-50',
    rejected: 'border-rose-300 bg-rose-50',
    queried:  'border-amber-300 bg-amber-50',
    submitted:'border-sky-300 bg-sky-50',
  }
  return map[action?.toLowerCase()] ?? 'border-neutral-200 bg-white dark:bg-neutral-900'
}

function historyTextClass(action: string) {
  const map: Record<string, string> = {
    approved: 'text-emerald-700',
    rejected: 'text-rose-700',
    queried:  'text-amber-700',
    submitted:'text-sky-700',
  }
  return map[action?.toLowerCase()] ?? 'text-neutral-600'
}
</script>

<template>
  <div class="space-y-6 pb-24 px-1">

    <!-- ── Header strip ─────────────────────────────────────── -->
    <div class="flex items-start justify-between gap-4 pt-2">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-black text-neutral-900 dark:text-white truncate">{{ data.title }}</h2>
        <div class="flex items-center gap-2 mt-1">
          <Hash class="w-3 h-3 text-neutral-400 flex-shrink-0" />
          <span class="text-xs font-mono text-neutral-400">{{ data.reference_no || 'No reference' }}</span>
        </div>
      </div>
      <div class="text-right flex-shrink-0">
        <p class="text-3xl font-black text-nfuko-primary dark:text-nfuko-yellow">
          UGX {{ Number(data.amount || 0).toLocaleString() }}
        </p>
        <span :class="['inline-block mt-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', statusClass(data.status)]">
          {{ data.status }}
        </span>
      </div>
    </div>

    <!-- ── Expense Details ───────────────────────────────────── -->
    <div class="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl divide-y divide-neutral-100 dark:divide-neutral-800 shadow-sm overflow-hidden">
      <div class="px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50">
        <p class="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Expense Details</p>
      </div>

      <div class="grid grid-cols-2 gap-0 divide-x divide-neutral-100 dark:divide-neutral-800">
        <!-- Category -->
        <div class="flex items-center gap-3 px-5 py-4">
          <div class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
            <Tag class="w-4 h-4 text-purple-500" />
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-bold text-neutral-400 uppercase">Category</p>
            <p class="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">{{ data.category_name || '—' }}</p>
          </div>
        </div>

        <!-- Payment Method -->
        <div class="flex items-center gap-3 px-5 py-4">
          <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
            <CreditCard class="w-4 h-4 text-blue-500" />
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-bold text-neutral-400 uppercase">Payment Method</p>
            <p class="text-sm font-bold text-neutral-800 dark:text-neutral-200 capitalize truncate">
              {{ (data.payment_method || '—').replace('_', ' ') }}
            </p>
          </div>
        </div>

        <!-- Vendor -->
        <div class="flex items-center gap-3 px-5 py-4">
          <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
            <Building2 class="w-4 h-4 text-amber-500" />
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-bold text-neutral-400 uppercase">Vendor / Recipient</p>
            <p class="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">{{ data.vendor_name || '—' }}</p>
          </div>
        </div>

        <!-- Transaction Date -->
        <div class="flex items-center gap-3 px-5 py-4">
          <div class="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0">
            <Calendar class="w-4 h-4 text-teal-500" />
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-bold text-neutral-400 uppercase">Transaction Date</p>
            <p class="text-sm font-bold text-neutral-800 dark:text-neutral-200">{{ data.transaction_date || '—' }}</p>
          </div>
        </div>

        <!-- Submitted by -->
        <div class="flex items-center gap-3 px-5 py-4">
          <div class="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
            <User class="w-4 h-4 text-neutral-500" />
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-bold text-neutral-400 uppercase">Submitted By</p>
            <p class="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">{{ data.created_by_name || 'System' }}</p>
          </div>
        </div>

        <!-- Date Submitted -->
        <div class="flex items-center gap-3 px-5 py-4">
          <div class="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
            <Clock class="w-4 h-4 text-neutral-500" />
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-bold text-neutral-400 uppercase">Date Submitted</p>
            <p class="text-sm font-bold text-neutral-800 dark:text-neutral-200">{{ formatDate(data.created_at) }}</p>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="px-5 py-4">
        <p class="text-[10px] font-bold text-neutral-400 uppercase mb-2">Narration / Description</p>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-xl italic">
          "{{ data.description || 'No description provided.' }}"
        </p>
      </div>

      <!-- Receipt attachment -->
      <div v-if="data.receipt_attachment" class="px-5 py-4 flex items-center gap-3">
        <Receipt class="w-4 h-4 text-neutral-400" />
        <a :href="data.receipt_attachment" target="_blank"
           class="text-sm font-bold text-nfuko-primary dark:text-nfuko-yellow underline underline-offset-2">
          View Attached Receipt
        </a>
      </div>
    </div>

    <!-- Over-budget warning -->
    <div v-if="data.is_over_budget"
         class="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
      <AlertTriangle class="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
      <div>
        <p class="text-xs font-black text-rose-800 dark:text-rose-300 uppercase tracking-wider">Budget Over-Utilization Alert</p>
        <p class="text-xs text-rose-700 dark:text-rose-400 mt-1 leading-relaxed">
          This expense exceeds the allocated budget for <strong>{{ data.category_name }}</strong>.
          Approval requires explicit justification under the SACCO financial override policy.
        </p>
      </div>
    </div>

    <!-- ── Decision Panel ────────────────────────────────────── -->
    <div class="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div class="flex items-center gap-2">
        <HelpCircle class="w-4 h-4 text-neutral-400" />
        <h3 class="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Your Decision</h3>
      </div>

      <!-- Self-review soft warning -->
      <div v-if="isSelfReview"
           class="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <ShieldAlert class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          <strong>Segregation of duties:</strong> You submitted this expense. Ensure a second authorised officer countersigns in the physical register.
        </p>
      </div>

      <textarea
        v-model="comments"
        :disabled="licenseState.readOnly"
        :title="licenseState.readOnly ? 'License expired — review decisions are disabled' : ''"
        placeholder="Add comments — required for Reject or Query..."
        rows="3"
        class="w-full p-4 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-nfuko-primary/20 focus:border-nfuko-primary outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50 dark:text-white resize-none"
      />

      <div class="grid grid-cols-3 gap-3">
        <button
          @click="emit('reject', comments)"
          :disabled="licenseState.readOnly || !comments.trim()"
          :title="licenseState.readOnly ? 'License expired — renew to reject expenses' : ''"
          class="flex items-center justify-center gap-2 py-3 px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <XCircle class="w-4 h-4" /> Reject
        </button>

        <button
          @click="emit('query', comments)"
          :disabled="licenseState.readOnly || !comments.trim()"
          :title="licenseState.readOnly ? 'License expired — renew to query expenses' : ''"
          class="flex items-center justify-center gap-2 py-3 px-3 bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <HelpCircle class="w-4 h-4" /> Query
        </button>

        <button
          @click="emit('approve', comments)"
          :disabled="licenseState.readOnly"
          :title="licenseState.readOnly ? 'License expired — renew to approve expenses' : ''"
          class="flex items-center justify-center gap-2 py-3 px-3 bg-nfuko-primary text-white hover:bg-[#002e35] rounded-xl font-bold text-sm shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
        >
          <CheckCircle class="w-4 h-4" /> Approve
        </button>
      </div>

      <p class="text-[10px] text-neutral-400 text-center">
        Reject and Query require a comment. Approval can proceed without one.
      </p>
    </div>

    <!-- ── Approval History ──────────────────────────────────── -->
    <div>
      <div class="flex items-center gap-2 mb-4 px-1">
        <FileText class="w-4 h-4 text-neutral-400" />
        <h3 class="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Approval History</h3>
        <span v-if="data.approval_history?.length"
              class="ml-auto text-[10px] font-black bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full">
          {{ data.approval_history.length }} action{{ data.approval_history.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div v-if="data.approval_history?.length" class="space-y-3">
        <div v-for="(h, i) in data.approval_history" :key="i"
             :class="['relative pl-10 pb-1', Number(i) < data.approval_history.length - 1 ? 'before:content-[\'\'] before:absolute before:left-[15px] before:top-8 before:bottom-0 before:w-0.5 before:bg-neutral-100 dark:before:bg-neutral-800' : '']">
          <div :class="['absolute left-0 top-1 w-7 h-7 rounded-full border-2 flex items-center justify-center z-10', historyBubbleClass(h.action)]">
            <CheckCircle v-if="h.action?.toLowerCase() === 'approved'" class="w-3.5 h-3.5 text-emerald-500" />
            <XCircle    v-else-if="h.action?.toLowerCase() === 'rejected'" class="w-3.5 h-3.5 text-rose-500" />
            <HelpCircle v-else-if="h.action?.toLowerCase() === 'queried'"  class="w-3.5 h-3.5 text-amber-500" />
            <Clock      v-else class="w-3.5 h-3.5 text-sky-500" />
          </div>

          <div class="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
            <div class="flex items-center justify-between mb-1">
              <span :class="['text-xs font-black uppercase tracking-tight', historyTextClass(h.action)]">
                {{ h.action }}
              </span>
              <span class="text-[10px] text-neutral-400 font-medium">{{ formatDate(h.created_at) }}</span>
            </div>
            <p class="text-sm font-bold text-neutral-700 dark:text-neutral-300">{{ h.user_name }}</p>
            <p v-if="h.comments" class="text-xs italic text-neutral-500 mt-1 leading-relaxed">"{{ h.comments }}"</p>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-10 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
        <Clock class="w-8 h-8 text-neutral-300 mx-auto mb-2" />
        <p class="text-xs font-bold text-neutral-400">No approval actions yet.</p>
        <p class="text-[10px] text-neutral-300 mt-1">This expense is awaiting first review.</p>
      </div>
    </div>

  </div>
</template>
