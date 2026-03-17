<script setup lang="ts">
import { Eye, Pencil, Trash2 } from 'lucide-vue-next'

interface SavingsAccount {
  id: number
  account_no: string
  account_type: string
  balance: string
  status: string
  member: { id: number; name: string; member_number: string } | null
  savings_product: { id: number; name: string } | null
}
interface Meta { current_page: number; last_page: number; total: number }

const props = defineProps<{
  accounts: SavingsAccount[]
  meta: Meta
  loading: boolean
  currency: string
  formatBalance: (v: string | number) => string
  statusClass: (s: string) => string
}>()

const emit = defineEmits<{
  view: [account: SavingsAccount]
  edit: [account: SavingsAccount]
  delete: [account: SavingsAccount]
  page: [page: number]
}>()

const pages = () => Array.from({ length: props.meta.last_page }, (_, i) => i + 1)
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-neutral-100 dark:border-neutral-800">
            <th class="px-6 py-4 text-left font-semibold text-neutral-800 dark:text-white">Account No</th>
            <th class="px-6 py-4 text-left font-semibold text-neutral-800 dark:text-white">Member</th>
            <th class="px-6 py-4 text-left font-semibold text-neutral-800 dark:text-white">Savings Product Type</th>
            <th class="px-6 py-4 text-right font-semibold text-neutral-800 dark:text-white">Balance</th>
            <th class="px-6 py-4 text-left font-semibold text-neutral-800 dark:text-white">Status</th>
            <th class="px-6 py-4 text-right font-semibold text-neutral-800 dark:text-white">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
          <!-- Loading -->
          <template v-if="loading">
            <tr v-for="i in 5" :key="i" class="animate-pulse">
              <td v-for="j in 6" :key="j" class="px-6 py-5">
                <div class="h-4 rounded bg-neutral-100 dark:bg-neutral-800" :class="j === 3 ? 'w-40' : 'w-24'" />
              </td>
            </tr>
          </template>

          <!-- Empty -->
          <tr v-else-if="accounts.length === 0">
            <td colspan="6" class="px-6 py-16 text-center text-sm text-neutral-400">
              No savings accounts found.
            </td>
          </tr>

          <!-- Rows -->
          <tr
            v-else
            v-for="account in accounts"
            :key="account.id"
            class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
          >
            <td class="px-6 py-4">
              <div class="font-semibold text-neutral-900 dark:text-white">{{ account.account_no }}</div>
              <div class="text-[11px] uppercase tracking-wide text-neutral-400">{{ account.account_type }}</div>
            </td>
            <td class="px-6 py-4">
              <div class="font-medium text-neutral-800 dark:text-neutral-200">{{ account.member?.name ?? '—' }}</div>
              <div class="text-[11px] text-neutral-400">{{ account.member?.member_number ?? '' }}</div>
            </td>
            <td class="px-6 py-4">
              <span v-if="account.savings_product" class="inline-flex rounded-full border border-[#3ab88a]/30 bg-[#3ab88a]/10 px-3 py-1 text-xs font-semibold text-[#3ab88a]">
                {{ account.savings_product.name }}
              </span>
              <span v-else class="text-neutral-400">—</span>
            </td>
            <td class="px-6 py-4 text-right font-semibold text-[#3ab88a]">
              {{ currency }} {{ formatBalance(account.balance) }}
            </td>
            <td class="px-6 py-4">
              <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize" :class="statusClass(account.status)">
                {{ account.status }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center justify-end gap-1">
                <button
                  @click="emit('view', account)"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-[#c7d7f5] bg-[#eef3fd] px-3 py-1.5 text-xs font-semibold text-[#4f6cad] hover:bg-[#dce8fb] transition-colors"
                >
                  <Eye class="h-3.5 w-3.5" />
                  View
                </button>
                <button
                  @click="emit('edit', account)"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-[#c7d7f5] bg-[#eef3fd] px-3 py-1.5 text-xs font-semibold text-[#4f6cad] hover:bg-[#dce8fb] transition-colors"
                >
                  <Pencil class="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  @click="emit('delete', account)"
                  class="flex items-center justify-center rounded-lg border border-red-100 bg-red-50 p-1.5 text-red-500 hover:bg-red-100 transition-colors"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="flex items-center justify-between border-t border-neutral-100 px-6 py-3 dark:border-neutral-800">
      <p class="text-xs text-neutral-400">
        Page {{ meta.current_page }} of {{ meta.last_page }} ({{ meta.total }} accounts)
      </p>
      <div class="flex gap-1">
        <button
          v-for="page in pages()"
          :key="page"
          @click="emit('page', page)"
          class="h-8 w-8 rounded-lg text-xs font-medium transition-colors"
          :class="page === meta.current_page ? 'bg-nfuko-primary text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'"
        >
          {{ page }}
        </button>
      </div>
    </div>
  </div>
</template>
