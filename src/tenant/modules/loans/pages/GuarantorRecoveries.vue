<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Check, X, Banknote, RotateCcw } from 'lucide-vue-next'
import { Modal, Spinner, formatMoneyValue } from '@/Global'
import { notify } from '@/Global/Toasters'
import { useTenantUserStore } from '@/stores/tenantUserStore'
import { loanApplicationsApi } from '@/tenant/apis/loans'
import type { GuarantorRecovery } from '@/tenant/apis/loans/loanApplicationsApi'

// Recoveries of defaulted loans from guarantors: proposals waiting for a second
// staff member's approval, and the recovery loans borrowers then repay to their
// guarantors. Repayments recorded here are paid into the guarantors' savings.
type Tab = 'pending' | 'open' | 'closed'

const tab = ref<Tab>('pending')
const rows = ref<GuarantorRecovery[]>([])
const loading = ref(false)
const busyId = ref<number | null>(null)
const userStore = useTenantUserStore()
if (!userStore.user) userStore.load()
// The proposer cannot approve their own recovery; the server enforces this too.
const currentUserId = computed(() => Number(userStore.user?.id ?? 0))

const tabs: { key: Tab; label: string }[] = [
  { key: 'pending', label: 'Waiting for approval' },
  { key: 'open', label: 'Recovery loans being repaid' },
  { key: 'closed', label: 'Settled & rejected' },
]

async function load() {
  loading.value = true
  try {
    if (tab.value === 'pending') {
      rows.value = (
        await loanApplicationsApi.guarantorRecoveries({ status: 'pending_approval' })
      ).data.data
    } else if (tab.value === 'open') {
      rows.value = (
        await loanApplicationsApi.guarantorRecoveries({ recovery_loan_status: 'open' })
      ).data.data
    } else {
      const [settled, rejected] = await Promise.all([
        loanApplicationsApi.guarantorRecoveries({ recovery_loan_status: 'settled' }),
        loanApplicationsApi.guarantorRecoveries({ status: 'rejected' }),
      ])
      rows.value = [...settled.data.data, ...rejected.data.data].sort((a, b) => b.id - a.id)
    }
  } catch {
    notify({ type: 'error', msg: 'Could not load recoveries.' })
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(tab, load)

function errorMessage(err: unknown, fallback: string) {
  const data = (
    err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
  )?.response?.data
  return (
    Object.values(data?.errors ?? {})
      .flat()
      .join(' ') ||
    data?.message ||
    fallback
  )
}

async function approve(r: GuarantorRecovery) {
  busyId.value = r.id
  try {
    const res = await loanApplicationsApi.approveGuarantorRecovery(r.id)
    notify({ type: 'success', msg: res.data.message })
    await load()
  } catch (err) {
    notify({ type: 'error', msg: errorMessage(err, 'Could not approve the recovery.') })
  } finally {
    busyId.value = null
  }
}

// ─── Reject ───────────────────────────────────────────────────────────────────
const rejectOpen = ref(false)
const rejecting = ref<GuarantorRecovery | null>(null)
const rejectReason = ref('')

function openReject(r: GuarantorRecovery) {
  rejecting.value = r
  rejectReason.value = ''
  rejectOpen.value = true
}

async function saveReject() {
  const r = rejecting.value
  if (!r) return
  if (rejectReason.value.trim().length < 3) {
    notify({ type: 'error', msg: 'Give a reason for rejecting it.' })
    return
  }
  try {
    await loanApplicationsApi.rejectGuarantorRecovery(r.id, rejectReason.value.trim())
    notify({ type: 'success', msg: 'Recovery rejected.' })
    await load()
  } catch (err) {
    notify({ type: 'error', msg: errorMessage(err, 'Could not reject the recovery.') })
  }
}

// ─── Record a repayment of a recovery loan ────────────────────────────────────
const repayOpen = ref(false)
const repaying = ref<GuarantorRecovery | null>(null)
const repayForm = ref({ amount: '', payment_mode: 'cash', payment_date: '', reference: '' })

function openRepay(r: GuarantorRecovery) {
  repaying.value = r
  repayForm.value = {
    amount: String(r.recovery_loan?.next_due_amount ?? ''),
    payment_mode: 'cash',
    payment_date: new Date().toISOString().slice(0, 10),
    reference: '',
  }
  repayOpen.value = true
}

async function saveRepay() {
  const r = repaying.value
  const amount = Number(repayForm.value.amount.replace(/,/g, ''))
  if (!r || !(amount > 0)) {
    notify({ type: 'error', msg: 'Enter the amount received.' })
    return
  }
  try {
    const res = await loanApplicationsApi.repayGuarantorRecovery(r.id, {
      amount,
      payment_mode: repayForm.value.payment_mode,
      payment_date: repayForm.value.payment_date || undefined,
      reference: repayForm.value.reference || undefined,
    })
    notify({ type: 'success', msg: res.data.message })
    await load()
  } catch (err) {
    notify({ type: 'error', msg: errorMessage(err, 'Could not record the repayment.') })
  }
}

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Guarantor Recoveries</h1>
        <p class="mt-1 text-sm text-neutral-500">
          Defaulted loans recovered from the borrower's and guarantors' savings, and what borrowers
          owe their guarantors afterwards. A recovery is proposed from the loan's page and approved
          here by someone else.
        </p>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
        :disabled="loading"
        @click="load"
      >
        <RotateCcw class="h-4 w-4" /> Refresh
      </button>
    </div>

    <nav class="flex gap-2 border-b border-neutral-100 dark:border-neutral-800">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        class="-mb-px border-b-2 px-3 py-2 text-sm font-medium"
        :class="
          tab === t.key
            ? 'border-emerald-600 text-emerald-700'
            : 'border-transparent text-neutral-500 hover:text-neutral-700'
        "
        @click="tab = t.key"
      >
        {{ t.label }}
      </button>
    </nav>

    <div v-if="loading" class="flex justify-center py-16"><Spinner /></div>
    <p v-else-if="!rows.length" class="py-10 text-center text-sm text-neutral-500">Nothing here.</p>

    <div v-else class="space-y-4">
      <div
        v-for="r in rows"
        :key="r.id"
        class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-semibold">{{ r.code }}</span>
              <RouterLink
                :to="{ name: 'tenant-loan-account', params: { id: r.loan_id } }"
                class="text-sm text-nfuko-action hover:underline"
              >
                Loan {{ r.loan_no }}
              </RouterLink>
            </div>
            <div class="text-xs text-neutral-500">
              {{ r.borrower_name }} · proposed by {{ r.initiated_by ?? '—' }} on
              {{ formatDate(r.initiated_at) }}
              <template v-if="r.approved_by"> · approved by {{ r.approved_by }}</template>
            </div>
            <p v-if="r.notes" class="mt-1 text-xs italic text-neutral-500">“{{ r.notes }}”</p>
            <p v-if="r.rejection_reason" class="mt-1 text-xs text-red-600">
              Rejected: {{ r.rejection_reason }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <template v-if="r.status === 'pending_approval'">
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                :disabled="busyId === r.id || r.initiated_by_id === currentUserId"
                :title="
                  r.initiated_by_id === currentUserId
                    ? 'Someone other than the proposer must approve it'
                    : 'Take the money from savings now'
                "
                @click="approve(r)"
              >
                <Check class="h-3.5 w-3.5" /> {{ busyId === r.id ? 'Approving…' : 'Approve' }}
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                @click="openReject(r)"
              >
                <X class="h-3.5 w-3.5" /> Reject
              </button>
            </template>
            <button
              v-else-if="r.recovery_loan?.status === 'open'"
              type="button"
              class="inline-flex items-center gap-1 rounded-xl bg-nfuko-action px-3 py-1.5 text-xs font-medium text-white"
              @click="openRepay(r)"
            >
              <Banknote class="h-3.5 w-3.5" /> Record repayment
            </button>
          </div>
        </div>

        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <h4 class="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {{ r.status === 'pending_approval' ? 'Would take' : 'Took' }}
            </h4>
            <ul class="space-y-1 text-sm">
              <li v-for="line in r.lines" :key="line.id" class="flex justify-between gap-2">
                <span>
                  {{ line.name ?? '—' }}
                  <span class="text-xs text-neutral-400">
                    · {{ line.source === 'borrower' ? 'own savings' : 'guarantor' }} ·
                    {{ line.account_no }}
                  </span>
                </span>
                <span class="font-medium">{{ formatMoneyValue(line.amount) }}</span>
              </li>
            </ul>
          </div>

          <div
            v-if="r.recovery_loan"
            class="rounded-xl bg-neutral-50 p-3 text-sm dark:bg-neutral-800"
          >
            <h4 class="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Recovery loan owed to guarantors
            </h4>
            <div class="flex justify-between">
              <span>Repaid</span>
              <span
                >{{ formatMoneyValue(r.recovery_loan.repaid) }} of
                {{ formatMoneyValue(r.guarantor_amount) }}</span
              >
            </div>
            <div class="flex justify-between font-semibold">
              <span>Still owed</span><span>{{ r.recovery_loan.outstanding_formatted }}</span>
            </div>
            <div v-if="r.recovery_loan.overdue > 0" class="flex justify-between text-red-600">
              <span>Overdue</span><span>{{ formatMoneyValue(r.recovery_loan.overdue) }}</span>
            </div>
            <div
              v-if="r.recovery_loan.next_due_date"
              class="flex justify-between text-xs text-neutral-500"
            >
              <span>Next instalment</span>
              <span
                >{{ formatMoneyValue(r.recovery_loan.next_due_amount ?? 0) }} on
                {{ formatDate(r.recovery_loan.next_due_date) }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <Modal v-model="rejectOpen" title="Reject recovery" action-text="Reject" @submit="saveReject">
      <template #body>
        <label class="text-xs font-medium text-neutral-600">Why is it being rejected?</label>
        <textarea
          v-model="rejectReason"
          rows="3"
          maxlength="1000"
          class="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
        />
      </template>
    </Modal>

    <Modal
      v-model="repayOpen"
      title="Record repayment to guarantors"
      action-text="Record"
      @submit="saveRepay"
    >
      <template #body>
        <div class="space-y-3 text-sm">
          <p class="text-xs text-neutral-500">
            Paid into the guarantors' savings in proportion to what each is still owed ({{
              repaying?.recovery_loan?.outstanding_formatted
            }}
            in all).
          </p>
          <div>
            <label class="text-xs font-medium text-neutral-600">Amount received</label>
            <input
              v-model="repayForm.amount"
              inputmode="decimal"
              class="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium text-neutral-600">Paid by</label>
              <select
                v-model="repayForm.payment_mode"
                class="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="mobile_money">Mobile money</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-medium text-neutral-600">Date</label>
              <input
                v-model="repayForm.payment_date"
                type="date"
                class="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label class="text-xs font-medium text-neutral-600">Reference (optional)</label>
            <input
              v-model="repayForm.reference"
              maxlength="100"
              class="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
            />
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>
