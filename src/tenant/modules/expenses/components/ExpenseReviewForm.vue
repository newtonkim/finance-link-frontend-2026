<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CheckCircle, XCircle, HelpCircle, Clock, FileText, User, ShieldAlert, AlertTriangle } from 'lucide-vue-next'
import { pomPinia } from 'septor-store'

const store = pomPinia()
const currentUserId = (store as any).user?.id;

const props = defineProps<{
  data: any
}>()

const emit = defineEmits(['approve', 'reject', 'query'])

const comments = ref('')

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getActionClass = (action: string) => {
  const classes: Record<string, string> = {
    'submitted': 'text-blue-600 bg-blue-50 border-blue-100',
    'approved': 'text-emerald-600 bg-emerald-50 border-emerald-100',
    'rejected': 'text-rose-600 bg-rose-50 border-rose-100',
    'queried': 'text-amber-600 bg-amber-50 border-amber-100',
  }
  return classes[action] || 'text-neutral-600 bg-neutral-50 border-neutral-100'
}
</script>

<template>
  <div class="space-y-8 pb-20">
    <!-- Expense Summary -->
    <div class="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
      <div class="flex justify-between items-start mb-6">
        <div>
          <h2 class="text-xl font-black text-neutral-900 dark:text-white">{{ data.title }}</h2>
          <p class="text-sm text-neutral-500 font-medium">Ref: {{ data.reference_no || 'N/A' }}</p>
        </div>
        <div class="text-right">
          <p class="text-2xl font-black text-nfuko-primary dark:text-nfuko-yellow">UGX {{ Number(data.amount).toLocaleString() }}</p>
          <p class="text-xs font-bold text-neutral-400 uppercase tracking-widest">{{ data.category_name }}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6 py-4 border-t border-b border-dashed border-neutral-100 dark:border-neutral-800">
        <div>
          <p class="text-[10px] font-bold text-neutral-400 uppercase mb-1">Requester</p>
          <div class="flex items-center gap-2">
            <User class="w-4 h-4 text-neutral-400" />
            <span class="text-sm font-bold text-neutral-700 dark:text-neutral-300">{{ data.created_by_name || 'System' }}</span>
          </div>
        </div>
        <div>
          <p class="text-[10px] font-bold text-neutral-400 uppercase mb-1">Date Requested</p>
          <div class="flex items-center gap-2">
            <Clock class="w-4 h-4 text-neutral-400" />
            <span class="text-sm font-bold text-neutral-700 dark:text-neutral-300">{{ formatDate(data.created_at) }}</span>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <p class="text-[10px] font-bold text-neutral-400 uppercase mb-2">Description</p>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl italic">
          "{{ data.description }}"
        </p>
      </div>
      
      <!-- Budget Utilization Warning -->
      <div v-if="data.is_over_budget" class="mt-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
        <AlertTriangle class="w-5 h-5 text-rose-600 flex-shrink-0" />
        <div>
          <h4 class="text-xs font-black text-rose-800 dark:text-rose-300 uppercase tracking-wider">Budget Over-Utilization Alert</h4>
          <p class="text-xs text-rose-700 dark:text-rose-400 mt-1 leading-relaxed">
            This expense exceeds the allocated budget for <strong>{{ data.category_name }}</strong>. 
            Proceeding with approval requires explicit justification under the SACCO financial override policy.
          </p>
        </div>
      </div>
    </div>

    <!-- Approval Timeline -->
    <div>
      <div class="flex items-center gap-2 mb-4 px-2">
        <FileText class="w-4 h-4 text-neutral-400" />
        <h3 class="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Approval History</h3>
      </div>
      
      <div class="space-y-4">
        <div v-for="(history, index) in data.approval_history" :key="index" class="relative pl-8 before:content-[''] before:absolute before:left-3 before:top-8 before:bottom-0 before:w-0.5 before:bg-neutral-100 dark:before:bg-neutral-800 last:before:hidden">
          <div :class="[
            'absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white dark:bg-neutral-900 z-10',
            getActionClass(history.action).split(' ')[2]
          ]">
            <CheckCircle v-if="history.action === 'approved'" class="w-3 h-3 text-emerald-500" />
            <XCircle v-else-if="history.action === 'rejected'" class="w-3 h-3 text-rose-500" />
            <HelpCircle v-else-if="history.action === 'queried'" class="w-3 h-3 text-amber-500" />
            <Clock v-else class="w-3 h-3 text-blue-500" />
          </div>
          
          <div :class="['p-4 rounded-2xl border transition-all', getActionClass(history.action)]">
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs font-black uppercase tracking-tight">{{ history.action }}</span>
              <span class="text-[10px] font-medium opacity-60">{{ formatDate(history.created_at) }}</span>
            </div>
            <p class="text-sm font-bold mb-1">{{ history.user_name }}</p>
            <p v-if="history.comments" class="text-xs italic opacity-80">"{{ history.comments }}"</p>
          </div>
        </div>

        <div v-if="!data.approval_history || data.approval_history.length === 0" class="text-center py-8 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
          <p class="text-xs text-neutral-400">No approval history found.</p>
        </div>
      </div>
    </div>

    <!-- Review Action Box -->
    <div v-if="data.created_by !== currentUserId" class="space-y-4">
      <div class="flex items-center gap-2 mb-2 px-2">
        <HelpCircle class="w-4 h-4 text-neutral-400" />
        <h3 class="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Your Decision</h3>
      </div>
      
      <textarea 
        v-model="comments" 
        placeholder="Add comments (Required for Reject/Query)..."
        class="w-full h-24 p-4 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl focus:ring-2 focus:ring-nfuko-primary/20 focus:border-nfuko-primary outline-none transition-all dark:text-white"
      ></textarea>

      <div class="flex gap-3 pt-2">
        <button 
          @click="$emit('reject', comments)" 
          :disabled="!comments"
          class="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle class="w-4 h-4" /> Reject
        </button>
        <button 
          @click="$emit('query', comments)" 
          :disabled="!comments"
          class="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HelpCircle class="w-4 h-4" /> Query
        </button>
        <button 
          @click="$emit('approve', comments)" 
          class="flex-[1.5] flex items-center justify-center gap-2 py-3 px-4 bg-nfuko-primary text-white hover:bg-[#002e35] rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
        >
          <CheckCircle class="w-4 h-4" /> Approve Expense
        </button>
      </div>
    </div>

    <!-- Segregation of Duties Warning -->
    <div v-else class="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col items-center text-center gap-3">
      <div class="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
        <ShieldAlert class="w-6 h-6 text-amber-600" />
      </div>
      <div class="max-w-xs">
        <h4 class="text-sm font-bold text-neutral-900 dark:text-white">Segregation of Duties</h4>
        <p class="text-xs text-neutral-500 mt-1">You created this expense. To ensure financial compliance, another authorized user must perform the approval.</p>
      </div>
    </div>
  </div>
</template>
