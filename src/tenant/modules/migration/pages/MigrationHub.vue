<script setup lang="ts">
import { useRouter } from 'vue-router'
import { DatabaseZap, Wallet, ArrowRight, CheckCircle2 } from 'lucide-vue-next'

const router = useRouter()

const steps = [
  {
    step: 1,
    icon: DatabaseZap,
    title: 'Import Members',
    description: 'Bring all members over from the old system with their personal details, phone numbers, and member numbers.',
    done: true,
    route: '/tenant/members',
    action: 'View Members',
  },
  {
    step: 2,
    icon: Wallet,
    title: 'Import Opening Balances',
    description: 'Set the correct savings balance for each member account as it stood in the old system on the cut-over date.',
    done: false,
    route: '/tenant/migration/opening-balances',
    action: 'Start Import',
  },
  {
    step: 3,
    icon: Wallet,
    title: 'Import Transaction History',
    description: 'Upload individual deposits and withdrawals so each account\'s history is preserved. A running balance column lets you spot errors before uploading.',
    done: false,
    route: '/tenant/migration/transactions',
    action: 'Start Import',
  },
]
</script>

<template>
  <div class="flex flex-col gap-6 p-6 max-w-3xl">
    <div>
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Data Migration</h1>
      <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Follow the steps below in order to migrate member data from your previous system.
      </p>
    </div>

    <div class="flex flex-col gap-4">
      <div v-for="item in steps" :key="item.step"
        class="flex items-start gap-5 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

        <!-- Step number / done indicator -->
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          :class="item.done ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-nfuko-primary/10 text-nfuko-primary'">
          <CheckCircle2 v-if="item.done" class="h-5 w-5" />
          <component :is="item.icon" v-else class="h-5 w-5" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold uppercase tracking-widest text-neutral-400">Step {{ item.step }}</span>
            <span v-if="item.done"
              class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/20 dark:text-green-400">
              Completed
            </span>
          </div>
          <h2 class="mt-0.5 text-base font-semibold text-neutral-900 dark:text-white">{{ item.title }}</h2>
          <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{{ item.description }}</p>
        </div>

        <button @click="router.push(item.route)"
          class="inline-flex shrink-0 items-center gap-2 rounded-lg bg-nfuko-primary px-4 py-2 text-sm font-semibold text-white hover:bg-nfuko-primary/90 transition-colors">
          {{ item.action }}
          <ArrowRight class="h-4 w-4" />
        </button>
      </div>
    </div>

    <p class="text-xs text-neutral-400 dark:text-neutral-600">
      This section is intended for the initial system setup. You can hide it from the sidebar once migration is complete via Organisation Settings.
    </p>
  </div>
</template>
