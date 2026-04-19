<script setup lang="ts">
import { ref } from 'vue'
import { X, ArrowLeft, RotateCcw, ArrowRightLeft, Banknote } from 'lucide-vue-next'
import { savingsAccountsApi } from '@/tenant/apis/savingsAccounts/savingsAccountsApi'
import { toast } from 'vue-sonner'

import { type SavingsAccount } from '../types'

interface Account { id: number; account_no: string; maturity_date: string | null }

const emit = defineEmits<{ success: [] }>()

const open = ref(false)
const processing = ref(false)
const account = ref<Account | null>(null)
const selectedAction = ref<'rollover' | 'convert' | 'close' | ''>('')

const actions = [
  {
    key: 'rollover' as const,
    label: 'Rollover',
    description: 'Reinvest principal + accrued interest for the same tenor.',
    icon: RotateCcw,
    color: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300',
    active: 'ring-2 ring-blue-400',
  },
  {
    key: 'convert' as const,
    label: 'Convert to Savings',
    description: 'Move principal + interest to the member\'s savings account.',
    icon: ArrowRightLeft,
    color: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300',
    active: 'ring-2 ring-amber-400',
  },
  {
    key: 'close' as const,
    label: 'Withdraw & Close',
    description: 'Pay out principal + interest and close the FD account.',
    icon: Banknote,
    color: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300',
    active: 'ring-2 ring-green-400',
  },
]

function openDrawer(acc: Account) {
  account.value = acc
  selectedAction.value = ''
  open.value = true
}

function close() {
  open.value = false
  account.value = null
}

async function submit() {
  if (!selectedAction.value || !account.value) return
  processing.value = true
  try {
    await savingsAccountsApi.processMaturity(account.value.id, { action: selectedAction.value })
    toast.success('Maturity processed successfully.')
    emit('success')
    close()
  } catch (err: unknown) {
    const errorMsg = (err as any)?.response?.data?.message ?? 'Failed to process maturity.'
    toast.error(errorMsg)
  } finally {
    processing.value = false
  }
}

defineExpose({ openDrawer })
</script>

<template>
  <Transition name="drawer-fade">
    <div v-if="open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close" />
      <Transition name="drawer-slide">
        <aside
          v-if="open"
          class="absolute right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
          role="dialog" aria-label="Process FD Maturity"
        >
        <div class="flex h-full flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
            <div class="flex items-center gap-3">
              <button type="button" @click="close"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors dark:hover:bg-neutral-800">
                <ArrowLeft class="h-4 w-4" />
              </button>
              <div>
                <h3 class="text-[15px] font-bold text-neutral-900 dark:text-white">Process Maturity</h3>
                <p class="text-xs text-neutral-500">{{ account?.account_no }}</p>
              </div>
            </div>
            <button type="button" @click="close"
              class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors dark:hover:bg-neutral-800">
              <X class="h-4 w-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <p v-if="account?.maturity_date" class="text-sm text-neutral-500 dark:text-neutral-400">
              Matured on <span class="font-medium text-neutral-700 dark:text-neutral-200">{{ account.maturity_date }}</span>
            </p>

            <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Choose an action:</p>

            <div class="space-y-3">
              <button
                v-for="action in actions" :key="action.key"
                type="button"
                @click="selectedAction = action.key"
                :class="[
                  'w-full rounded-xl border p-4 text-left transition-all',
                  action.color,
                  selectedAction === action.key ? action.active : '',
                ]"
              >
                <div class="flex items-center gap-3">
                  <component :is="action.icon" class="h-5 w-5 shrink-0" />
                  <div>
                    <p class="text-sm font-semibold">{{ action.label }}</p>
                    <p class="text-xs opacity-80">{{ action.description }}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
            <button
              type="button" @click="submit"
              :disabled="!selectedAction || processing"
              class="w-full rounded-lg bg-nfuko-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed dark:bg-nfuko-yellow dark:text-neutral-900"
            >
              {{ processing ? 'Processing...' : 'Confirm' }}
            </button>
          </div>
        </div>
      </aside>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.2s ease; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active, .drawer-slide-leave-active { transition: transform 0.25s ease; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }
</style>
