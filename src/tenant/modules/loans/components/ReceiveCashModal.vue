<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Calendar, User, Banknote, FileText, CheckCircle2, Loader2 } from 'lucide-vue-next'
import { formatMoneyValue, normalizeAmountInput, formatAmountInput, parseAmountInput } from '@/Global'

const props = defineProps<{
  open: boolean
  posting: boolean
  tellerName: string
  borrowerName: string
  installmentAmount: number | string
  currency: string
  allocationOrderLabel?: string
  allocationOrderSequence?: string
  penaltyCharges?: number | string
  pendingInterest?: number | string
  pendingPrincipal?: number | string
}>()

const emit = defineEmits<{
  close: []
  submit: [
    data: {
      amount: number
      penalty_charges: number
      interest: number
      principal: number
      payment_date: string
      description: string
    },
  ]
}>()

const state = ref<'entry' | 'success'>('entry')

const form = ref({
  payment_date: new Date().toISOString().split('T')[0] ?? '',
  amount: Number(props.installmentAmount),
  penalty_charges: Number(props.penaltyCharges) || 0,
  interest: Number(props.pendingInterest) || 0,
  principal: Number(props.pendingPrincipal) || 0,
  description: '',
})

// ── Money input helpers ─────────────────────────────────────────────────────
function toMoney(v: number): string {
  return formatAmountInput(v)
}

function parseMoney(v: string): number {
  return parseAmountInput(v) || 0
}

function makeMoneyInput(
  getRaw: () => number,
  setRaw: (v: number) => void,
  onCommit?: (v: number) => void,
) {
  const display = ref(toMoney(getRaw()))

  function onFocus() {
    const raw = getRaw()
    display.value = raw === 0 ? '' : String(raw)
  }

  function onBlur() {
    const parsed = parseMoney(display.value)
    setRaw(parsed)
    display.value = toMoney(parsed)
    onCommit?.(parsed)
  }

  function onInput(e: Event) {
    display.value = (e.target as HTMLInputElement).value
  }

  return { display, onFocus, onBlur, onInput }
}

// ── Auto-allocation ─────────────────────────────────────────────────────────
// Maps allocation sequence labels to their form key, pending max, and display ref.
// Populated after the inputs are created below.
type AllocField = { formKey: 'penalty_charges' | 'interest' | 'principal'; max: () => number; input: { display: ReturnType<typeof ref<string>> } }

const ALLOC_MAP: Record<string, AllocField> = {}   // filled after inputs are created

function autoAllocate(totalAmount: number) {
  const seq   = props.allocationOrderSequence || 'Penalties & Charges -> Interest -> Principal'
  const order = seq.split(' -> ').map((s) => s.trim())

  let remaining = totalAmount

  for (const label of order) {
    const field = ALLOC_MAP[label]
    if (!field) continue
    const allocated = Math.min(remaining, field.max())
    form.value[field.formKey]    = allocated
    field.input.display.value    = toMoney(allocated)
    remaining                    = Math.max(0, remaining - allocated)
  }
}

const amountInput    = makeMoneyInput(
  () => form.value.amount,
  (v) => { form.value.amount = v },
  (v) => autoAllocate(v),          // re-distribute whenever amount is committed
)
const penaltyInput   = makeMoneyInput(() => form.value.penalty_charges, (v) => { form.value.penalty_charges = v })
const interestInput  = makeMoneyInput(() => form.value.interest,        (v) => { form.value.interest = v })
const principalInput = makeMoneyInput(() => form.value.principal,       (v) => { form.value.principal = v })

// Wire up the allocation map now that inputs exist
ALLOC_MAP['Penalties & Charges'] = {
  formKey: 'penalty_charges',
  max: () => Number(props.penaltyCharges) || 0,
  input: penaltyInput,
}
ALLOC_MAP['Interest'] = {
  formKey: 'interest',
  max: () => Number(props.pendingInterest) || 0,
  input: interestInput,
}
ALLOC_MAP['Principal'] = {
  formKey: 'principal',
  max: () => Number(props.pendingPrincipal) || 0,
  input: principalInput,
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      form.value.amount          = Number(props.installmentAmount)
      form.value.penalty_charges = Number(props.penaltyCharges) || 0
      form.value.interest        = Number(props.pendingInterest) || 0
      form.value.principal       = Number(props.pendingPrincipal) || 0
      form.value.payment_date    = new Date().toISOString().split('T')[0] ?? ''
      form.value.description     = ''
      state.value               = 'entry'
      amountInput.display.value = toMoney(form.value.amount)
      // auto-allocate on open so sub-fields always reflect the current amount
      autoAllocate(form.value.amount)
    }
  },
)

const allocationSequenceItems = computed(() => {
  const seq = props.allocationOrderSequence || 'Penalties & Charges -> Interest -> Principal'
  return seq.split(' -> ')
})

const allocationFields = computed(() => {
  const seq = props.allocationOrderSequence || 'Penalties & Charges -> Interest -> Principal'
  const parts = seq.split(' -> ')
  return parts.map((part, index) => ({
    label: part.trim(),
    order: `${index + 1}${getOrdinalSuffix(index + 1)}`,
  }))
})

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] ?? s[v] ?? s[0] ?? 'th'
}

const showPenaltyField = computed(() => {
  const seq = props.allocationOrderSequence || 'Penalties & Charges -> Interest -> Principal'
  return seq.startsWith('Penalties & Charges')
})

const showInterestField = computed(() => {
  const seq = props.allocationOrderSequence || 'Penalties & Charges -> Interest -> Principal'
  return seq.includes('Interest') || seq.split(' -> ')[0] === 'Interest'
})

const showPrincipalField = computed(() => {
  const seq = props.allocationOrderSequence || 'Penalties & Charges -> Interest -> Principal'
  return seq.includes('Principal') && seq.split(' -> ')[0] !== 'Principal'
})


const allocationTotal = computed(() =>
  Number(form.value.interest) + Number(form.value.principal) + Number(form.value.penalty_charges),
)

const allocationExceedsAmount = computed(() =>
  allocationTotal.value > Number(form.value.amount),
)

function handleSubmit() {
  if (allocationExceedsAmount.value) return
  emit('submit', {
    amount: form.value.amount,
    penalty_charges: form.value.penalty_charges,
    interest: form.value.interest,
    principal: form.value.principal,
    payment_date: form.value.payment_date,
    description: form.value.description,
  })
}

// Exposed to parent to trigger success view
function setSuccess() {
  state.value = 'success'
}

defineExpose({
  setSuccess,
  reset: () => {
    state.value = 'entry'
  },
})

function fmt(v: number | string | null | undefined) {
  if (v == null || v === '') return '—'
  return formatMoneyValue(v)
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        @mousedown.self="state === 'entry' ? emit('close') : null"
      />
    </Transition>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="open" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          class="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          <!-- ENTRY STATE -->
          <template v-if="state === 'entry'">
            <!-- Header -->
            <div
              class="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800"
            >
              <h2 class="text-xl font-bold text-neutral-800 dark:text-white">
                Receive Cash Transaction
              </h2>
              <button
                class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1"
                @click="emit('close')"
              >
                <X class="h-6 w-6" />
              </button>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-6">
              <div
                class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-800/50 dark:bg-emerald-900/20"
              >
                <p
                  class="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300"
                >
                  Repayment Allocation Order
                </p>
                <p class="mt-1 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  {{ allocationOrderLabel ?? 'Default Allocation Order' }}
                </p>
                <div class="mt-3 space-y-2">
                  <p class="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Allocation Sequence:
                  </p>
                  <div class="flex flex-wrap items-center gap-1.5 text-xs">
                    <template v-for="(item, index) in allocationSequenceItems" :key="index">
                      <span
                        class="rounded-md bg-emerald-100 px-2 py-1 font-medium text-emerald-700 dark:bg-emerald-800/50 dark:text-emerald-300"
                      >
                        {{ item }}
                      </span>
                      <span
                        v-if="index < allocationSequenceItems.length - 1"
                        class="text-emerald-500"
                        >→</span
                      >
                    </template>
                  </div>
                </div>
                <div class="mt-3 space-y-1.5">
                  <p class="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    How amounts will be applied:
                  </p>
                  <div class="space-y-1">
                    <div
                      v-for="(field, idx) in allocationFields"
                      :key="idx"
                      class="flex items-center justify-between rounded-md bg-emerald-100/50 px-2.5 py-1.5 text-xs dark:bg-emerald-800/30"
                    >
                      <span class="text-emerald-800 dark:text-emerald-200">{{ field.label }}</span>
                      <span class="font-medium text-emerald-700 dark:text-emerald-300">{{
                        field.order
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Date -->
                <div class="space-y-1.5">
                  <label
                    class="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-2"
                  >
                    <Calendar class="h-4 w-4" /> Date
                  </label>
                  <input
                    v-model="form.payment_date"
                    type="date"
                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>

                <!-- Officer (Disabled) -->
                <div class="space-y-1.5">
                  <label
                    class="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400"
                  >
                    <User class="h-4 w-4" /> Officer
                  </label>
                  <input
                    type="text"
                    :value="tellerName"
                    disabled
                    class="w-full cursor-not-allowed rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-black/20 dark:text-neutral-400"
                  />
                </div>

                <!-- Amount -->
                <div class="space-y-1.5">
                  <label
                    class="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400"
                  >
                    <Banknote class="h-4 w-4" /> Amount
                  </label>
                  <div class="relative">
                    <span
                      class="absolute left-3 top-1/2 text-xs font-bold -translate-y-1/2 text-neutral-400"
                      >{{ currency }}</span
                    >
                    <input
                      type="text"
                      inputmode="decimal"
                      :value="amountInput.display.value"
                      class="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-12 pr-3 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      @focus="amountInput.onFocus"
                      @blur="amountInput.onBlur"
                      @input="amountInput.onInput"
                    />
                  </div>
                </div>

                <!-- Member Name (Disabled) -->
                <div class="space-y-1.5">
                  <label
                    class="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400"
                  >
                    <User class="h-4 w-4" /> Member Name
                  </label>
                  <input
                    type="text"
                    :value="borrowerName"
                    disabled
                    class="w-full cursor-not-allowed rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 text-sm font-semibold uppercase text-neutral-500 dark:border-neutral-800 dark:bg-black/20 dark:text-neutral-400"
                  />
                </div>

                <!-- Right column: Penalty, Interest, Principal (stacked) -->
                <div class="flex flex-col gap-4">
                  <!-- Penalty & Charges -->
                  <div v-if="showPenaltyField" class="space-y-1.5">
                    <label
                      class="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400"
                    >
                      <Banknote class="h-4 w-4" /> Penalty & Charges
                    </label>
                    <div class="relative">
                      <span
                        class="absolute left-3 top-1/2 text-xs font-bold -translate-y-1/2 text-neutral-400"
                        >{{ currency }}</span
                      >
                      <input
                        type="text"
                        inputmode="decimal"
                        :value="penaltyInput.display.value"
                        :class="allocationExceedsAmount
                          ? 'w-full rounded-lg border border-red-400 bg-white py-2.5 pl-12 pr-3 text-sm font-bold outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-red-600 dark:bg-neutral-800 dark:text-white'
                          : 'w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-12 pr-3 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'"
                        @focus="penaltyInput.onFocus"
                        @blur="penaltyInput.onBlur"
                        @input="penaltyInput.onInput"
                      />
                    </div>
                  </div>

                  <!-- Interest -->
                  <div v-if="showInterestField" class="space-y-1.5">
                    <label
                      class="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400"
                    >
                      <Banknote class="h-4 w-4" /> Interest
                    </label>
                    <div class="relative">
                      <span
                        class="absolute left-3 top-1/2 text-xs font-bold -translate-y-1/2 text-neutral-400"
                        >{{ currency }}</span
                      >
                      <input
                        type="text"
                        inputmode="decimal"
                        :value="interestInput.display.value"
                        :class="allocationExceedsAmount
                          ? 'w-full rounded-lg border border-red-400 bg-white py-2.5 pl-12 pr-3 text-sm font-bold outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-red-600 dark:bg-neutral-800 dark:text-white'
                          : 'w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-12 pr-3 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'"
                        @focus="interestInput.onFocus"
                        @blur="interestInput.onBlur"
                        @input="interestInput.onInput"
                      />
                    </div>
                  </div>

                  <!-- Principal -->
                  <div v-if="showPrincipalField" class="space-y-1.5">
                    <label
                      class="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400"
                    >
                      <Banknote class="h-4 w-4" /> Principal
                    </label>
                    <div class="relative">
                      <span
                        class="absolute left-3 top-1/2 text-xs font-bold -translate-y-1/2 text-neutral-400"
                        >{{ currency }}</span
                      >
                      <input
                        type="text"
                        inputmode="decimal"
                        :value="principalInput.display.value"
                        :class="allocationExceedsAmount
                          ? 'w-full rounded-lg border border-red-400 bg-white py-2.5 pl-12 pr-3 text-sm font-bold outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-red-600 dark:bg-neutral-800 dark:text-white'
                          : 'w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-12 pr-3 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'"
                        @focus="principalInput.onFocus"
                        @blur="principalInput.onBlur"
                        @input="principalInput.onInput"
                      />
                    </div>
                  </div>

                  <!-- Allocation exceeded warning -->
                  <div v-if="allocationExceedsAmount" class="rounded-lg border border-red-200 bg-red-50 px-3 py-3 dark:border-red-800/50 dark:bg-red-900/20">
                    <p class="text-xs font-semibold text-red-600 dark:text-red-400">Total allocation exceeds the amount</p>
                    <p class="mt-0.5 text-xs text-red-500 dark:text-red-400">
                      Interest + Principal + Penalty & Charges =
                      <span class="font-bold">{{ fmt(allocationTotal) }}</span> —
                      must not exceed <span class="font-bold">{{ fmt(form.amount) }}</span>.
                    </p>
                  </div>
                </div>

                <!-- Transaction Description -->
                <div class="row-span-2 space-y-1.5">
                  <label
                    class="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400"
                  >
                    <FileText class="h-4 w-4" /> Transaction Description
                    <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    v-model="form.description"
                    rows="5"
                    placeholder="Enter Transaction Description"
                    class="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="flex items-center justify-center gap-4 border-t border-neutral-100 p-6 dark:border-neutral-800"
            >
              <button
                class="min-w-[140px] rounded-lg bg-neutral-500 px-6 py-3 font-bold text-white transition-colors hover:bg-neutral-600"
                @click="emit('close')"
              >
                Cancel
              </button>
              <button
                class="flex min-w-[180px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="posting || !form.description.trim() || allocationExceedsAmount"
                @click="handleSubmit"
              >
                <Loader2 v-if="posting" class="h-5 w-5 animate-spin" />
                Receive Cash
              </button>
            </div>
          </template>

          <!-- SUCCESS STATE -->
          <div
            v-else
            class="p-10 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-300"
          >
            <div class="relative">
              <div class="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25"></div>
              <div
                class="relative bg-white rounded-full p-4 border-[6px] border-green-50 shadow-sm"
              >
                <div class="bg-green-100/50 rounded-full p-4">
                  <CheckCircle2 class="h-16 w-16 text-green-500" stroke-width="1.5" />
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <h2 class="text-4xl font-extrabold text-neutral-800 dark:text-white leading-tight">
                Payment Received Successfully!
              </h2>
              <p
                class="text-lg text-neutral-500 dark:text-neutral-400 font-medium max-w-sm mx-auto"
              >
                You have successfully recorded the payment.
              </p>
            </div>

            <button
              class="min-w-[120px] px-8 py-3 rounded-lg bg-[#7A69E5] text-white font-bold text-lg hover:bg-[#6857cc] transition-all shadow-lg hover:shadow-xl active:scale-95"
              @click="emit('close')"
            >
              Okay
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
