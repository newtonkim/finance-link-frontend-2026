<script setup lang="ts">
import { AlertTriangle, CheckCircle2 } from 'lucide-vue-next'
import type { LoanAppliedCharge, LoanScheduleEntry } from '@/tenant/apis/loans/loansApi'

interface ProductCharge {
  id: number
  name: string
  charge_type: string
  value: string | number
}

const props = defineProps<{
  currency: string
  disbursementCharges: LoanAppliedCharge[]
  repaymentCharges: LoanAppliedCharge[]
  totalChargesAmount: number
  totalChargesCollected: number
  totalChargesRemaining: number
  arrearsRows: LoanScheduleEntry[]
  totalPenaltyAccrued: number
  totalPenaltyPaid: number
  totalPenaltyOutstanding: number
  totalProductCharges: number
  penaltyRuleLabel: string | null
  chargeDeductionMode?: string | null
  appliedChargesLength: number
  productCharges: ProductCharge[]
  fmt: (v: number | string | null | undefined) => string
  fmtDate: (d: string | null | undefined) => string
}>()
</script>

<template>
  <div class="space-y-6">
    <!-- Charge Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        class="rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/40"
      >
        <p class="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
          Total Applied Charges
        </p>
        <p class="mt-1 text-base font-bold text-neutral-900 dark:text-white">
          {{ currency }} {{ fmt(totalChargesAmount) }}
        </p>
      </div>
      <div
        class="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 dark:border-emerald-900/30 dark:bg-emerald-900/10"
      >
        <p class="text-[10px] font-semibold uppercase tracking-wide text-emerald-500">
          Charges Collected
        </p>
        <p class="mt-1 text-base font-bold text-emerald-700 dark:text-emerald-400">
          {{ currency }} {{ fmt(totalChargesCollected) }}
        </p>
      </div>
      <div
        class="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 dark:border-amber-900/30 dark:bg-amber-900/10"
      >
        <p class="text-[10px] font-semibold uppercase tracking-wide text-amber-500">
          Charges Outstanding
        </p>
        <p class="mt-1 text-base font-bold text-amber-700 dark:text-amber-400">
          {{ currency }} {{ fmt(totalChargesRemaining) }}
        </p>
      </div>
      <div
        class="rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 dark:border-red-900/30 dark:bg-red-900/10"
      >
        <p class="text-[10px] font-semibold uppercase tracking-wide text-red-500">
          Penalty Balance
        </p>
        <p class="mt-1 text-base font-bold text-red-700 dark:text-red-400">
          {{ currency }} {{ fmt(totalPenaltyOutstanding) }}
        </p>
      </div>
    </div>

    <!-- ── Product Charges & Fees ── -->
    <div v-if="productCharges.length" class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
          Product Charges & Fees
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-[13px]">
          <thead
            class="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-800"
          >
            <tr>
              <th class="px-4 py-3 text-left font-bold text-neutral-900 dark:text-neutral-100">Charge Name</th>
              <th class="px-4 py-3 text-left font-bold text-neutral-900 dark:text-neutral-100">Type</th>
              <th class="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr
              v-for="charge in productCharges"
              :key="charge.id"
              class="even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <td class="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                {{ charge.name }}
              </td>
              <td class="px-4 py-3 capitalize text-neutral-500">
                {{ charge.charge_type?.replace(/_/g, ' ') }}
              </td>
              <td class="px-4 py-2.5 text-right font-medium">
                <template v-if="charge.charge_type === 'flat'">
                  {{ currency }} {{ fmt(charge.value) }}
                </template>
                <template v-else-if="charge.charge_type === 'percentage'">
                  {{ charge.value }}%
                </template>
                <template v-else>
                  {{ charge.value }}
                </template>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="productCharges.length">
            <tr
              class="bg-neutral-50/50 dark:bg-neutral-800/30 font-bold border-t border-neutral-100 dark:border-neutral-800"
            >
              <td class="px-4 py-2.5 text-left" colspan="2">Sum Total</td>
              <td class="px-4 py-2.5 text-right">
                {{ currency }} {{ fmt(totalProductCharges) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ── On-Disbursement Charges ── -->
    <div v-if="disbursementCharges.length" class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
          Disbursement Charges
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-[13px]">
          <thead
            class="bg-neutral-50/80 dark:bg-neutral-800/60 font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-[11px] border-b border-neutral-100 dark:border-neutral-800"
          >
            <tr>
              <th class="px-4 py-2.5 text-left">Charge</th>
              <th class="px-4 py-2.5 text-left">Type</th>
              <th class="px-4 py-2.5 text-right">Amount</th>
              <th class="px-4 py-2.5 text-right">Collected</th>
              <th class="px-4 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr
              v-for="charge in disbursementCharges"
              :key="charge.id"
              class="even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
              :class="charge.is_waived ? 'opacity-50' : ''"
            >
              <td class="px-4 py-2.5 font-medium text-neutral-800 dark:text-neutral-200">
                {{ charge.name }}
                <span v-if="charge.is_mandatory" class="ml-1 text-[10px] text-neutral-400"
                  >(mandatory)</span
                >
              </td>
              <td class="px-4 py-2.5 capitalize text-neutral-500">{{ charge.charge_type }}</td>
              <td class="px-4 py-2.5 text-right">
                {{ currency }} {{ fmt(charge.charge_amount) }}
              </td>
              <td class="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400">
                {{ currency }} {{ fmt(charge.used_amount) }}
              </td>
              <td class="px-4 py-2.5 text-center">
                <span
                  v-if="charge.is_waived"
                  class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                  >Waived</span
                >
                <span
                  v-else
                  class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  >Collected</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        v-if="chargeDeductionMode"
        class="mt-2 text-[11px] text-neutral-400 dark:text-neutral-500"
      >
        Method:
        <span class="font-medium text-neutral-600 dark:text-neutral-300">{{
          chargeDeductionMode === 'deduct_from_principal'
            ? 'Deducted from principal'
            : chargeDeductionMode === 'debit_savings'
              ? 'Debited from savings account'
              : chargeDeductionMode === 'pay_cash'
                ? 'Paid in cash'
                : chargeDeductionMode === 'capitalize'
                  ? 'Capitalized into loan balance'
                  : chargeDeductionMode
        }}</span>
      </p>
    </div>

    <!-- ── On-Repayment Charges ── -->
    <div v-if="repaymentCharges.length" class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
          Repayment Charges
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-[13px]">
          <thead
            class="bg-neutral-50/80 dark:bg-neutral-800/60 font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-[11px] border-b border-neutral-100 dark:border-neutral-800"
          >
            <tr>
              <th class="px-4 py-2.5 text-left">Charge</th>
              <th class="px-4 py-2.5 text-left">Type</th>
              <th class="px-4 py-2.5 text-right">Total Amount</th>
              <th class="px-4 py-2.5 text-right">Collected</th>
              <th class="px-4 py-2.5 text-right">Remaining</th>
              <th class="px-4 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr
              v-for="charge in repaymentCharges"
              :key="charge.id"
              class="even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
              :class="charge.is_waived ? 'opacity-50' : ''"
            >
              <td class="px-4 py-2.5 font-medium text-neutral-800 dark:text-neutral-200">
                {{ charge.name }}
              </td>
              <td class="px-4 py-2.5 capitalize text-neutral-500">{{ charge.charge_type }}</td>
              <td class="px-4 py-2.5 text-right">
                {{ currency }} {{ fmt(charge.charge_amount) }}
              </td>
              <td class="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400">
                {{ currency }} {{ fmt(charge.used_amount) }}
              </td>
              <td
                class="px-4 py-2.5 text-right"
                :class="
                  charge.remaining_amount > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-neutral-400'
                "
              >
                {{
                  charge.remaining_amount > 0
                    ? `${currency} ${fmt(charge.remaining_amount)}`
                    : '—'
                }}
              </td>
              <td class="px-4 py-2.5 text-center">
                <span
                  v-if="charge.is_waived"
                  class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                  >Waived</span
                >
                <span
                  v-else-if="charge.remaining_amount <= 0"
                  class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  >Collected</span
                >
                <span
                  v-else
                  class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  >Pending</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Empty state for charges ── -->
    <div
      v-if="!appliedChargesLength"
      class="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 py-10 text-neutral-400 gap-2 dark:border-neutral-700"
    >
      <AlertTriangle class="h-7 w-7" />
      <p class="text-sm">No charges applied to this loan.</p>
    </div>

    <!-- ── Penalty Timeline ── -->
    <div v-if="arrearsRows.length" class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 flex items-center justify-between">
        <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
          Penalty Timeline
        </h3>
        <span
          v-if="penaltyRuleLabel"
          class="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
        >
          Arrears Rule: {{ penaltyRuleLabel }}
        </span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-[13px]">
          <thead
            class="bg-neutral-50/80 dark:bg-neutral-800/60 font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-[11px] border-b border-neutral-100 dark:border-neutral-800"
          >
            <tr>
              <th class="px-4 py-3 text-left">#</th>
              <th class="px-4 py-3 text-left">Due Date</th>
              <th class="px-4 py-3 text-right">Arrears Days</th>
              <th class="px-4 py-3 text-right">Principal Outstanding</th>
              <th class="px-4 py-3 text-right">Penalty Accrued</th>
              <th class="px-4 py-3 text-right">Penalty Paid</th>
              <th class="px-4 py-3 text-right">Penalty Due</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr
              v-for="row in arrearsRows"
              :key="row.id"
              class="even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <td class="px-4 py-2.5 text-neutral-500">{{ row.installment_no }}</td>
              <td class="px-4 py-2.5 text-neutral-700 dark:text-neutral-300">
                {{ fmtDate(row.due_date) }}
              </td>
              <td class="px-4 py-2.5 text-right">
                <span class="font-semibold text-red-600 dark:text-red-400">{{
                  row.days_overdue || 0
                }}</span>
              </td>
              <td class="px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-400">
                {{ currency }} {{ fmt(row.outstanding_balance) }}
              </td>
              <td class="px-4 py-2.5 text-right font-medium text-red-600 dark:text-red-400">
                {{ Number(row.penalty_due) > 0 ? `${currency} ${fmt(row.penalty_due)}` : '—' }}
              </td>
              <td class="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400">
                {{
                  Number(row.penalty_paid) > 0 ? `${currency} ${fmt(row.penalty_paid)}` : '—'
                }}
              </td>
              <td
                class="px-4 py-2.5 text-right font-semibold"
                :class="
                  Number(row.penalty_due) - Number(row.penalty_paid) > 0
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-neutral-400'
                "
              >
                {{
                  Number(row.penalty_due) - Number(row.penalty_paid) > 0
                    ? `${currency} ${fmt(Number(row.penalty_due) - Number(row.penalty_paid))}`
                    : '—'
                }}
              </td>
            </tr>
          </tbody>
          <tfoot
            class="bg-neutral-50 dark:bg-neutral-800/60 border-t border-neutral-200 dark:border-neutral-700 font-semibold text-xs"
          >
            <tr>
              <td colspan="4" class="px-4 py-2.5 text-neutral-700 dark:text-neutral-300">
                Totals
              </td>
              <td class="px-4 py-2.5 text-right text-red-600">
                {{ currency }} {{ fmt(totalPenaltyAccrued) }}
              </td>
              <td class="px-4 py-2.5 text-right text-emerald-600">
                {{ currency }} {{ fmt(totalPenaltyPaid) }}
              </td>
              <td class="px-4 py-2.5 text-right text-red-700">
                {{ currency }} {{ fmt(totalPenaltyOutstanding) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    <div
      v-else
      class="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 py-8 text-neutral-400 gap-2 dark:border-neutral-700"
    >
      <CheckCircle2 class="h-7 w-7 text-emerald-400" />
      <p class="text-sm">No arrears installments — no penalties accrued.</p>
    </div>
  </div>
</template>
