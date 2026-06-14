<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white">
    <!-- Header -->
    <div class="px-6 pt-6 pb-5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-400">
            <button class="hover:underline font-semibold" style="color:#052659" @click="router.push('/central/licenses')">Admin</button>
            <span>/</span>
            <span class="text-neutral-600 dark:text-neutral-300 font-semibold">Payment Plan</span>
          </div>
          <h1 class="text-3xl font-black tracking-tight">Renew License Subscription</h1>
          <p class="mt-1.5 text-sm text-neutral-500">
            Choose a payment method to renew this tenant subscription and keep access active.
          </p>
        </div>
        <div class="flex gap-3">
          <button
            class="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-5 py-2.5 text-sm font-bold text-neutral-700 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            @click="toggleInvoices"
          >
            <ReceiptText class="size-4" />
            View Invoices
          </button>
          <button
            class="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
            style="background:#052659"
            :disabled="submitting || loading"
            @click="confirmRenewal"
          >
            <CheckCircle2 class="size-4" />
            Confirm Renewal
          </button>
        </div>
      </div>
    </div>

    <div class="px-6 py-6">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-24 text-sm text-neutral-400">
        <div class="flex flex-col items-center gap-3">
          <div class="size-8 rounded-full border-2 border-t-transparent animate-spin" style="border-color:#052659;border-top-color:transparent" />
          <span>Loading renewal details...</span>
        </div>
      </div>

      <template v-else>
        <!-- Summary cards -->
        <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="flex items-center gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
            <div class="flex size-14 shrink-0 items-center justify-center rounded-full" style="background:rgba(5,38,89,0.08)">
              <Crown class="size-6" style="color:#052659" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400">Current Plan</p>
              <p class="mt-1 truncate text-lg font-black">{{ preview.plan_name || '-' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
            <div class="flex size-14 shrink-0 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-300">
              <CalendarDays class="size-6" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400">Renewal Period</p>
              <p class="mt-1 truncate text-lg font-black">{{ renewalPeriod }}</p>
            </div>
          </div>
          <div class="flex items-center gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
            <div class="flex size-14 shrink-0 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-500 dark:text-orange-300">
              <Clock3 class="size-6" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400">Next Billing Date</p>
              <p class="mt-1 truncate text-lg font-black">{{ formatDate(preview.next_billing_date) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
            <div class="flex size-14 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-300">
              <WalletCards class="size-6" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400">Amount Due</p>
              <p class="mt-1 truncate text-lg font-black text-red-500">{{ formatMoney(preview.total) }}</p>
            </div>
          </div>
        </div>

        <!-- Main grid -->
        <div class="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <!-- Payment method panel -->
          <section class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 class="text-xl font-black tracking-tight">Select Payment Method</h2>

            <!-- Method tabs -->
            <div class="mt-5 flex gap-2">
              <button
                v-for="method in paymentMethods"
                :key="method.value"
                type="button"
                :class="[
                  'flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-150',
                  form.payment_method === method.value
                    ? 'text-white shadow-sm'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700',
                ]"
                :style="form.payment_method === method.value ? 'background:#052659' : ''"
                @click="selectPaymentMethod(method.value)"
              >
                <component :is="method.icon" class="size-4" />
                {{ method.label }}
              </button>
            </div>

            <!-- Provider pills -->
            <div class="mt-5">
              <p class="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2.5">Provider</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="p in currentProviders"
                  :key="p.value"
                  type="button"
                  :class="[
                    'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold border-2 transition-all duration-150',
                    form.provider === p.value
                      ? 'dark:bg-[rgba(5,38,89,0.3)] dark:text-blue-200'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300',
                  ]"
                  :style="form.provider === p.value
                    ? 'border-color:#052659;background:rgba(5,38,89,0.05);color:#052659'
                    : ''"
                  @click="form.provider = p.value"
                >
                  <span :class="['text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none', p.badgeClass]">
                    {{ p.badge }}
                  </span>
                  {{ p.label }}
                </button>
              </div>
            </div>

            <!-- ── Mobile Money / Bank fields ─────────────────── -->
            <template v-if="form.payment_method !== 'card'">
              <div class="mt-5 grid gap-4 md:grid-cols-2">

                <!-- Amount (editable) -->
                <label class="flex flex-col gap-1.5">
                  <span class="text-xs font-bold uppercase tracking-wide text-neutral-400">Amount to Pay</span>
                  <div class="field flex items-center gap-0 p-0 overflow-hidden">
                    <span class="px-3 py-3.25 text-sm font-bold text-neutral-400 border-r border-neutral-200 dark:border-neutral-700 shrink-0 bg-neutral-50 dark:bg-neutral-800/60 select-none">
                      {{ currencySymbol }}
                    </span>
                    <input
                      v-model="form.custom_amount"
                      type="number"
                      min="0"
                      :step="amountStep"
                      class="flex-1 px-3 py-3.25 text-sm font-black bg-transparent outline-none"
                      style="color:#052659"
                      placeholder="0"
                    />
                  </div>
                </label>

                <!-- Phone number (mobile money with +256 prefix) or account number (bank) -->
                <label class="flex flex-col gap-1.5">
                  <span class="text-xs font-bold uppercase tracking-wide text-neutral-400">
                    {{ form.payment_method === 'bank' ? 'Account Number' : 'Phone Number' }}
                  </span>

                  <!-- Mobile money: Uganda flag + +256 prefix -->
                  <div v-if="form.payment_method === 'mobile_money'" class="field flex items-center gap-0 p-0 overflow-hidden">
                    <div class="flex items-center gap-1.5 px-3 py-3.25 border-r border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 shrink-0 select-none">
                      <span class="text-base leading-none">🇺🇬</span>
                      <span class="text-sm font-bold text-neutral-600 dark:text-neutral-300">+256</span>
                    </div>
                    <input
                      v-model="phoneDigits"
                      class="flex-1 px-3 py-3.25 text-sm font-semibold bg-transparent outline-none"
                      type="tel"
                      inputmode="numeric"
                      placeholder="7XX XXX XXX"
                      maxlength="9"
                    />
                  </div>

                  <!-- Bank: plain account number -->
                  <input
                    v-else
                    v-model="form.phone_number"
                    class="field"
                    type="text"
                    placeholder="e.g. 0001234567890"
                  />
                </label>

                <label class="flex flex-col gap-1.5 md:col-span-2">
                  <span class="text-xs font-bold uppercase tracking-wide text-neutral-400">Account Name</span>
                  <input v-model="form.account_name" class="field" placeholder="e.g. John Doe" />
                </label>
              </div>
            </template>

            <!-- ── Card fields ─────────────────────────────────── -->
            <template v-else>
              <div class="mt-5 grid gap-4">

                <!-- Card number -->
                <label class="flex flex-col gap-1.5">
                  <span class="text-xs font-bold uppercase tracking-wide text-neutral-400">Card Number</span>
                  <div class="field flex items-center gap-0 p-0 overflow-hidden">
                    <div class="px-3 py-3.25 bg-neutral-50 dark:bg-neutral-800/60 border-r border-neutral-200 dark:border-neutral-700 shrink-0">
                      <CreditCardIcon class="size-4 text-neutral-400" />
                    </div>
                    <input
                      :value="form.card_number"
                      @input="onCardNumberInput"
                      class="flex-1 px-3 py-3.25 text-sm font-mono font-bold tracking-widest bg-transparent outline-none"
                      placeholder="1234  5678  9012  3456"
                      maxlength="19"
                      inputmode="numeric"
                      autocomplete="cc-number"
                    />
                  </div>
                </label>

                <!-- Cardholder name -->
                <label class="flex flex-col gap-1.5">
                  <span class="text-xs font-bold uppercase tracking-wide text-neutral-400">Cardholder Name</span>
                  <input
                    v-model="form.card_name"
                    class="field"
                    placeholder="e.g. John Doe"
                    autocomplete="cc-name"
                  />
                </label>

                <!-- Expiry + CVV row -->
                <div class="grid grid-cols-2 gap-4">
                  <label class="flex flex-col gap-1.5">
                    <span class="text-xs font-bold uppercase tracking-wide text-neutral-400">Expiry Date</span>
                    <input
                      :value="form.card_expiry"
                      @input="onExpiryInput"
                      class="field text-center font-mono font-bold tracking-widest"
                      placeholder="MM / YY"
                      maxlength="5"
                      inputmode="numeric"
                      autocomplete="cc-exp"
                    />
                  </label>

                  <label class="flex flex-col gap-1.5">
                    <span class="text-xs font-bold uppercase tracking-wide text-neutral-400">CVV / CVC</span>
                    <div class="field flex items-center gap-0 p-0 overflow-hidden">
                      <input
                        v-model="form.card_cvv"
                        class="flex-1 pl-4 py-3.25 text-sm font-mono font-bold tracking-[0.3em] bg-transparent outline-none"
                        placeholder="•••"
                        maxlength="4"
                        inputmode="numeric"
                        type="password"
                        autocomplete="cc-csc"
                      />
                      <LockKeyhole class="size-3.5 text-neutral-300 shrink-0 mr-3" />
                    </div>
                  </label>
                </div>

                <!-- Amount (editable, full-width for card) -->
                <label class="flex flex-col gap-1.5">
                  <span class="text-xs font-bold uppercase tracking-wide text-neutral-400">Amount to Pay</span>
                  <div class="field flex items-center gap-0 p-0 overflow-hidden">
                    <span class="px-3 py-3.25 text-sm font-bold text-neutral-400 border-r border-neutral-200 dark:border-neutral-700 shrink-0 bg-neutral-50 dark:bg-neutral-800/60 select-none">
                      {{ currencySymbol }}
                    </span>
                    <input
                      v-model="form.custom_amount"
                      type="number"
                      min="0"
                      :step="amountStep"
                      class="flex-1 px-3 py-3.25 text-sm font-black bg-transparent outline-none"
                      style="color:#052659"
                      placeholder="0"
                    />
                  </div>
                </label>

                <!-- Charge currency (card can present in any enabled currency) -->
                <label class="flex flex-col gap-1.5">
                  <span class="text-xs font-bold uppercase tracking-wide text-neutral-400">Charge Currency</span>
                  <select v-model="chargeCurrency" class="field">
                    <option v-for="code in chargeCurrencyOptions" :key="code" :value="code">
                      {{ code }}{{ code === baseCurrency ? ' — settlement currency' : '' }}
                    </option>
                  </select>
                  <span v-if="isConvertedCharge" class="text-xs text-neutral-500">
                    Customer is charged <b style="color:#052659">≈ {{ money(chargeEstimate, chargeCurrency) }}</b>
                    · {{ fxRateLabel }} · settles as {{ money(effectiveAmount, baseCurrency) }}
                  </span>
                  <span v-else class="text-xs text-neutral-400">
                    Charged in the platform settlement currency — no conversion.
                  </span>
                </label>

              </div>
            </template>

            <!-- Save method checkbox -->
            <label class="mt-4 flex items-center gap-3 cursor-pointer select-none">
              <div
                class="relative flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors"
                :class="form.save_payment_method ? '' : 'border-neutral-300 dark:border-neutral-600'"
                :style="form.save_payment_method ? 'background:#052659;border-color:#052659' : ''"
                @click="form.save_payment_method = !form.save_payment_method"
              >
                <svg v-if="form.save_payment_method" class="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">Save this payment method for future renewals</span>
            </label>

            <!-- Footer row -->
            <div class="mt-6 border-t border-neutral-100 dark:border-neutral-800 pt-5 flex flex-wrap items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="flex size-9 shrink-0 items-center justify-center rounded-full" style="background:rgba(5,38,89,0.08)">
                  <LockKeyhole class="size-4" style="color:#052659" />
                </div>
                <div class="text-xs text-neutral-500 leading-relaxed">
                  <p class="font-bold text-neutral-700 dark:text-neutral-300">Secure Payment</p>
                  <p>Payments are encrypted and securely processed.</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <button
                  class="rounded-xl px-5 py-2.5 text-sm font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  @click="router.push('/central/licenses')"
                >
                  Cancel
                </button>
                <button
                  class="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
                  style="background:#052659"
                  :disabled="submitting"
                  @click="confirmRenewal"
                >
                  <LockKeyhole class="size-4" />
                  {{ submitting ? 'Processing...' : `Pay ${formatMoney(effectiveAmount)}` }}
                </button>
              </div>
            </div>
          </section>

          <!-- Order summary panel -->
          <aside class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <h2 class="text-xl font-black tracking-tight">Order Summary</h2>
              <span :class="['inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold', statusBadgeClass]">
                <div class="size-1.5 rounded-full bg-current opacity-70" />
                Current License {{ preview.status_label || 'Active' }}
              </span>
            </div>

            <!-- Plan highlight box -->
            <div class="mt-4 rounded-xl border p-4 flex items-center justify-between gap-3"
              style="border-color:rgba(5,38,89,0.15);background:linear-gradient(to right,rgba(5,38,89,0.04),rgba(5,38,89,0.02))">
              <div class="flex items-center gap-3">
                <div class="flex size-10 shrink-0 items-center justify-center rounded-full" style="background:rgba(5,38,89,0.1)">
                  <Crown class="size-5" style="color:#052659" />
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide" style="color:rgba(5,38,89,0.55)">License Plan</p>
                  <p class="text-base font-black" style="color:#052659">{{ preview.plan_name || '-' }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Per {{ billingCycleLabel }}</p>
                <p class="text-base font-black" style="color:#052659">{{ formatMoney(preview.subtotal) }}</p>
              </div>
            </div>

            <!-- Plan selector (upgrade / downgrade) -->
            <div class="mt-4">
              <div class="flex items-center justify-between gap-2 mb-1.5">
                <label class="block text-xs font-bold uppercase tracking-wide text-neutral-400">Change Plan</label>
                <span v-if="previewBusy" class="text-[11px] font-semibold text-neutral-400">Updating…</span>
              </div>
              <select v-model="selectedPlanId" @change="onPlanChange" class="field" :disabled="previewBusy">
                <option v-for="p in plans" :key="p.id" :value="p.id">
                  {{ titleCase(p.name) }} — {{ money(p.cost, 'USD') }} / {{ p.billing_type }}
                </option>
              </select>
              <p v-if="isConvertedFromUsd" class="mt-1 text-[11px] text-neutral-400">
                Plan prices are in USD · settled in {{ baseCurrency }} at {{ usdRateLabel }}
              </p>
              <p v-if="planChanged" class="mt-1.5 text-xs font-bold" :class="planChangeClass">
                {{ planChangeLabel }} <span class="font-medium text-neutral-400">(was {{ titleCase(originalPlanName) }})</span>
              </p>
            </div>

            <dl class="mt-5 space-y-3.5">
              <div class="flex items-center justify-between gap-4 text-sm">
                <dt class="text-neutral-500 font-medium">Tenant</dt>
                <dd class="font-bold text-right truncate max-w-[55%]">{{ preview.tenant || '-' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4 text-sm">
                <dt class="text-neutral-500 font-medium">Billing Cycle</dt>
                <dd class="font-bold text-right capitalize">{{ billingCycleLabel }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4 text-sm">
                <dt class="text-neutral-500 font-medium">Renewal Start</dt>
                <dd class="font-bold text-right">{{ formatDate(preview.renewal_start) }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4 text-sm">
                <dt class="text-neutral-500 font-medium">Renewal End</dt>
                <dd class="font-bold text-right">{{ formatDate(preview.renewal_end) }}</dd>
              </div>
            </dl>

            <div class="my-5 border-t border-dashed border-neutral-200 dark:border-neutral-700" />

            <dl class="space-y-3 text-sm">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-neutral-500 font-medium">Subtotal</dt>
                <dd class="font-bold">{{ formatMoney(preview.subtotal) }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-neutral-500 font-medium">Service Fee</dt>
                <dd class="font-bold">{{ formatMoney(preview.service_fee) }}</dd>
              </div>
            </dl>

            <div class="my-5 border-t border-neutral-200 dark:border-neutral-700" />

            <div class="flex items-center justify-between">
              <span class="text-base font-black">Total</span>
              <span class="text-xl font-black" style="color:#052659">{{ formatMoney(effectiveAmount) }}</span>
            </div>

            <div v-if="form.payment_method === 'card' && isConvertedCharge"
              class="mt-2 flex items-center justify-between text-sm">
              <span class="text-neutral-500 font-medium">Charged in {{ chargeCurrency }}</span>
              <span class="font-bold">≈ {{ money(chargeEstimate, chargeCurrency) }}</span>
            </div>

            <div class="mt-5 flex gap-3 rounded-xl border p-4 text-sm"
              style="border-color:rgba(5,38,89,0.15);background:rgba(5,38,89,0.04)">
              <Info class="mt-0.5 size-4 shrink-0" style="color:#052659" />
              <span class="font-semibold" style="color:#052659">Your subscription will renew immediately after successful payment.</span>
            </div>

            <!-- Invoices panel -->
            <div v-if="showInvoices" class="mt-5 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div class="flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <h3 class="text-sm font-black">Recent Invoices</h3>
                <button class="text-xs font-bold text-neutral-400 hover:text-neutral-600" @click="showInvoices = false">Hide</button>
              </div>
              <div v-if="loadingInvoices" class="p-4 text-sm text-neutral-400 text-center">Loading invoices...</div>
              <div v-else-if="!invoices.length" class="p-4 text-sm text-neutral-400 text-center">No invoices found.</div>
              <div v-else class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <div v-for="invoice in invoices" :key="invoice.id" class="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div class="min-w-0">
                    <p class="font-bold truncate">{{ invoice.invoice_number }}</p>
                    <p class="text-xs text-neutral-400 mt-0.5">{{ formatDate(invoice.paid_at || invoice.due_at) }}</p>
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    <div class="text-right">
                      <p class="font-black">{{ formatMoney(invoice.total) }}</p>
                      <span class="text-xs font-bold text-green-600">{{ invoice.status }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        class="flex size-8 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-[#052659] hover:text-[#052659] disabled:opacity-50 transition-colors"
                        title="Download invoice PDF"
                        :disabled="invoiceBusy === invoice.id"
                        @click="downloadInvoice(invoice)"
                      >
                        <Download class="size-4" />
                      </button>
                      <button
                        type="button"
                        class="flex size-8 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-[#052659] hover:text-[#052659] disabled:opacity-50 transition-colors"
                        title="Email invoice"
                        :disabled="invoiceBusy === invoice.id"
                        @click="emailInvoice(invoice)"
                      >
                        <Mail class="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pomPinia } from 'septor-store'
import {
  Banknote, CalendarDays, CheckCircle2, Clock3, Crown,
  CreditCard as CreditCardIcon, Download, Info, LockKeyhole, Mail, ReceiptText, Smartphone, WalletCards,
} from 'lucide-vue-next'
import { fetchTableData } from '@/Global/landingLayout/util'
import { notify } from '@/Global/Toasters/ToastMsg'
import { apiClient } from '@/central/api/client'
import { centralCurrencyApi } from '@/central/modules/apis/Settings'

// Reference rates per 1 USD — fallback when the live feed is unavailable.
const FX_FALLBACK: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 157.18, CHF: 0.8991, CAD: 1.3614,
  AUD: 1.5274, CNY: 7.2584, INR: 83.92, KES: 129.5, UGX: 3735, TZS: 2605,
  RWF: 1304, ZAR: 18.12, NGN: 1487, GHS: 15.28, AED: 3.6725, SAR: 3.75,
}
const ZERO_DECIMAL_CURRENCIES = ['UGX', 'JPY', 'RWF', 'TZS']

const route = useRoute()
const router = useRouter()
const Store = pomPinia() as any

const loading = ref(true)
const submitting = ref(false)
const loadingInvoices = ref(false)
const preview = ref<Record<string, any>>({})
const invoices = ref<any[]>([])
const showInvoices = ref(false)
const invoiceBusy = ref<string | number | null>(null)

// Plan upgrade / downgrade on renewal
const plans = ref<any[]>([])
const selectedPlanId = ref<string | number | null>(null)
const originalPlanId = ref<string | number | null>(null)
const originalPlanName = ref('')
const originalTotal = ref<number | null>(null)
const previewBusy = ref(false)

// Separate digits ref so we can show +256 prefix in the UI
const phoneDigits = ref('')

const form = reactive({
  payment_method: 'mobile_money',
  provider: 'mtn',
  phone_number: '',
  account_name: '',
  save_payment_method: true,
  custom_amount: null as number | null,
  // Card-specific
  card_number: '',
  card_name: '',
  card_expiry: '',
  card_cvv: '',
})

// Sync full phone number from digits + Uganda prefix
watch(phoneDigits, (v) => {
  form.phone_number = `+256${v.replace(/\D/g, '')}`
})

const paymentMethods = [
  { label: 'Mobile Money', value: 'mobile_money', icon: Smartphone },
  { label: 'Card',         value: 'card',         icon: CreditCardIcon },
  { label: 'Bank',         value: 'bank',         icon: Banknote },
]

const allProviders: Record<string, Array<{ value: string; label: string; badge: string; badgeClass: string }>> = {
  mobile_money: [
    { value: 'mtn',    label: 'MTN Mobile Money', badge: 'MTN',    badgeClass: 'bg-yellow-400 text-yellow-900' },
    { value: 'airtel', label: 'Airtel',            badge: 'Airtel', badgeClass: 'bg-red-500 text-white' },
  ],
  card: [
    { value: 'visa',       label: 'Visa',       badge: 'VISA', badgeClass: 'bg-[#052659] text-white' },
    { value: 'mastercard', label: 'Mastercard', badge: 'MC',   badgeClass: 'bg-orange-500 text-white' },
  ],
  bank: [
    { value: 'bank', label: 'Bank Transfer', badge: 'BNK', badgeClass: 'bg-neutral-700 text-white' },
  ],
}

const currentProviders = computed(() => allProviders[form.payment_method] ?? [])

// Amount shown in the summary / pay button — custom override or plan total
const effectiveAmount = computed(() =>
  form.custom_amount && form.custom_amount > 0 ? form.custom_amount : (preview.value.total ?? 0)
)

// Settlement (base) currency — what the plan is priced/settled in. The amount
// input prefix must match this, not a hardcoded "$".
const currencyCode = computed(() => preview.value.currency || 'USD')
const currencySymbol = computed(() => (currencyCode.value === 'USD' ? '$' : currencyCode.value))
const amountStep = computed(() => (currencyCode.value === 'USD' ? '0.01' : '1'))

// Multi-currency presentment for card payments. Mobile money/bank settle in the
// base currency; a card can be charged in any enabled currency, converted from
// the base amount at a snapshot rate (the server is authoritative — this is an
// estimate shown to the admin before charging).
const enabledCurrencies = ref<string[]>([])
const baseCurrency = computed(() => (preview.value.base_currency || preview.value.currency || 'UGX').toUpperCase())
const chargeCurrency = ref('UGX')
const rates = ref<Record<string, number>>({ ...FX_FALLBACK })

const chargeCurrencyOptions = computed(() => {
  const list = enabledCurrencies.value.length ? [...enabledCurrencies.value] : [baseCurrency.value]
  if (!list.includes(baseCurrency.value)) list.unshift(baseCurrency.value)
  return list
})
const chargeRate = computed(() => {
  const b = rates.value[baseCurrency.value] || 0
  const c = rates.value[chargeCurrency.value] || 0
  return b > 0 && c > 0 ? c / b : 1
})
const chargeEstimate = computed(() => Number(effectiveAmount.value || 0) * chargeRate.value)
const isConvertedCharge = computed(() => chargeCurrency.value !== baseCurrency.value)
const fxRateLabel = computed(() => {
  const rate = chargeRate.value
  const pretty = rate.toLocaleString('en-US', { maximumFractionDigits: 6 })
  return `1 ${baseCurrency.value} = ${pretty} ${chargeCurrency.value}`
})

function money(value: any, currency: string) {
  const amount = Number(value ?? 0)
  const decimals = ZERO_DECIMAL_CURRENCIES.includes(currency) ? 0 : 2
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

function titleCase(text: string) {
  return (text ?? '').replace(/\b\w/g, (c) => c.toUpperCase())
}

// Compare the picked plan against what the tenant was on.
const planChanged = computed(() => originalPlanId.value != null && selectedPlanId.value != originalPlanId.value)
const planDelta = computed(() => Number(preview.value.total ?? 0) - Number(originalTotal.value ?? 0))
const planChangeLabel = computed(() => {
  if (!planChanged.value) return ''
  if (planDelta.value > 0) return `Upgrade · +${money(planDelta.value, baseCurrency.value)} per ${preview.value.billing_cycle ?? 'cycle'}`
  if (planDelta.value < 0) return `Downgrade · −${money(Math.abs(planDelta.value), baseCurrency.value)} per ${preview.value.billing_cycle ?? 'cycle'}`
  return 'Same price'
})
const planChangeClass = computed(() =>
  planDelta.value > 0 ? 'text-emerald-600' : planDelta.value < 0 ? 'text-amber-600' : 'text-neutral-400'
)

// Plans are priced in USD and settled in the platform base currency.
const isConvertedFromUsd = computed(() => baseCurrency.value !== 'USD')
const usdRateLabel = computed(() => {
  const rate = (rates.value[baseCurrency.value] || 1) / (rates.value.USD || 1)
  return `1 USD = ${rate.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${baseCurrency.value}`
})

async function loadCurrencySettings() {
  try {
    const res = await centralCurrencyApi().show()
    const payload = res?.data?.payload?.data ?? res?.data?.payload ?? res?.data?.data ?? {}
    const enabled = Array.isArray(payload.enabled_currencies) ? payload.enabled_currencies.map((c: string) => c.toUpperCase()) : []
    enabledCurrencies.value = enabled.length ? enabled : [baseCurrency.value]
  } catch {
    enabledCurrencies.value = [baseCurrency.value]
  }
  chargeCurrency.value = baseCurrency.value
}

async function fetchRates() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    const data = await res.json()
    if (data?.result === 'success' && data.rates) {
      const next: Record<string, number> = { ...FX_FALLBACK }
      for (const code of Object.keys(next)) next[code] = data.rates[code] ?? next[code]
      rates.value = next
    }
  } catch { /* keep fallback rates */ }
}

function selectPaymentMethod(method: string) {
  form.payment_method = method
  form.provider = allProviders[method]?.[0]?.value ?? ''
  // reset inputs when switching method
  phoneDigits.value = ''
  form.card_number = ''
  form.card_name   = ''
  form.card_expiry = ''
  form.card_cvv    = ''
}

watch(currentProviders, (providers) => {
  if (!providers.find((p) => p.value === form.provider)) {
    form.provider = providers[0]?.value ?? ''
  }
})

// Format card number as groups of 4
function onCardNumberInput(e: Event) {
  const input = e.target as HTMLInputElement
  const raw       = input.value.replace(/\D/g, '').slice(0, 16)
  const formatted = raw.replace(/(.{4})/g, '$1 ').trim()
  form.card_number = formatted
  input.value      = formatted
}

// Format expiry as MM/YY
function onExpiryInput(e: Event) {
  const input = e.target as HTMLInputElement
  let raw = input.value.replace(/\D/g, '').slice(0, 4)
  if (raw.length >= 3) raw = raw.slice(0, 2) + '/' + raw.slice(2)
  form.card_expiry = raw
  input.value      = raw
}

const statusBadgeClass = computed(() => {
  const s = (preview.value.status_label ?? '').toLowerCase()
  if (s === 'active')    return 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300'
  if (s === 'trial')     return 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300'
  if (s === 'expired')   return 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
  if (s === 'in grace')  return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
  if (s === 'suspended') return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
  return 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300'
})

const renewalPeriod = computed(() => {
  const months = Number(preview.value.renewal_months ?? 0)
  return months > 0 ? `${months} ${months === 1 ? 'Month' : 'Months'}` : 'Custom'
})

const billingCycleLabel = computed(() => {
  const cycle = `${preview.value.billing_cycle ?? ''}`.replace(/_/g, ' ')
  return cycle ? cycle.charAt(0).toUpperCase() + cycle.slice(1) : '-'
})

async function loadPreview() {
  loading.value = true
  const res = await fetchTableData({
    data:  { id: route.params.id },
    props: { state: 'licenseRenewalPreview', url: 'central/licenses/renewal-preview', reload: false, time: 0 },
    Store,
  })
  preview.value       = res?.payload ?? {}
  form.custom_amount  = Number(res?.payload?.total ?? 0) || null
  selectedPlanId.value = res?.payload?.plan_id ?? null
  // Snapshot what the tenant was on, to flag upgrades / downgrades.
  originalPlanId.value   = res?.payload?.plan_id ?? null
  originalPlanName.value = res?.payload?.plan_name ?? ''
  originalTotal.value    = Number(res?.payload?.total ?? 0)
  loading.value       = false
}

async function loadPlans() {
  const res = await fetchTableData({
    data:  {},
    props: { state: 'centralPlansDropdown', url: 'central/global/plans-drop-down', reload: false, time: 0 },
    Store,
  })
  plans.value = res?.payload?.data ?? res?.payload ?? []
}

// Re-price the renewal when the admin upgrades / downgrades the plan.
async function onPlanChange() {
  if (!selectedPlanId.value) return
  previewBusy.value = true
  const res = await fetchTableData({
    data:  { id: route.params.id, plan_id: selectedPlanId.value },
    props: { state: 'licenseRenewalPreview', url: 'central/licenses/renewal-preview', reload: false, time: 0 },
    Store,
  })
  if (res?.payload) {
    preview.value      = res.payload
    form.custom_amount = Number(res.payload.total ?? 0) || null
  }
  previewBusy.value = false
}

async function toggleInvoices() {
  if (showInvoices.value) { showInvoices.value = false; return }
  showInvoices.value = true
  if (invoices.value.length) return
  loadingInvoices.value = true
  const res = await fetchTableData({
    data:  { id: route.params.id },
    props: { state: 'licenseRenewalInvoices', url: 'central/licenses/invoices', reload: false, time: 0 },
    Store,
  })
  invoices.value        = res?.payload ?? []
  loadingInvoices.value = false
}

async function downloadInvoice(invoice: any) {
  invoiceBusy.value = invoice.id
  try {
    const res = await apiClient.post(
      'central/licenses/invoice/download',
      { invoice_id: invoice.id },
      { responseType: 'blob' },
    )
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${invoice.invoice_number ?? 'invoice'}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch {
    notify({ msg: 'Failed to download invoice.', type: 'error' })
  } finally {
    invoiceBusy.value = null
  }
}

async function emailInvoice(invoice: any) {
  const email = window.prompt('Send this invoice to which email address?')
  if (!email) return

  invoiceBusy.value = invoice.id
  try {
    const res = await apiClient.post('central/licenses/invoice/email', {
      invoice_id: invoice.id,
      email,
    })
    notify({ msg: res?.data?.payload?.message ?? `Invoice emailed to ${email}.`, type: 'success' })
  } catch (err: any) {
    notify({ msg: err?.response?.data?.message ?? 'Failed to email invoice.', type: 'error' })
  } finally {
    invoiceBusy.value = null
  }
}

async function confirmRenewal() {
  if (!form.provider) {
    notify({ msg: 'Please select a provider.', type: 'error' })
    return
  }
  submitting.value = true

  const payload: Record<string, any> = {
    id:                  route.params.id,
    plan_id:             preview.value.plan_id,
    billing_cycle:       preview.value.billing_cycle,
    payment_method:      form.payment_method,
    provider:            form.provider,
    save_payment_method: form.save_payment_method,
    amount:              effectiveAmount.value,
  }

  if (form.payment_method === 'card') {
    payload.currency    = chargeCurrency.value
    payload.card_number = form.card_number.replace(/\s/g, '')
    payload.card_name   = form.card_name
    payload.card_expiry = form.card_expiry
    payload.card_cvv    = form.card_cvv
  } else {
    payload.phone_number  = form.phone_number
    payload.account_name  = form.account_name
  }

  // 1) Create the renewal invoice + pending payment.
  const res = await fetchTableData({
    data:  payload,
    props: { state: 'licenseRenewalSubmit', url: 'central/licenses/renew', reload: false, time: 0 },
    Store,
  })

  if (res?.error || res?.payload?.error || !res?.payload?.invoice_id) {
    submitting.value = false
    notify({ msg: res?.payload?.message ?? res?.error?.message ?? 'Failed to renew license.', type: 'error' })
    return
  }

  // 2) Confirm the payment so the license is activated immediately.
  // (Until a live payment gateway is wired in, the admin's confirmation is the
  //  approval — a real gateway would instead call confirm-payment on callback.)
  try {
    const confirm = await apiClient.post('central/licenses/confirm-payment', {
      invoice_id: res.payload.invoice_id,
      payment_id: res.payload.payment_id,
      approval_type: 'manual',
      provider_reference: `MANUAL-${res.payload.payment_id}`,
    })
    notify({
      msg: confirm?.data?.payload?.message ?? 'Payment confirmed — license activated.',
      type: 'success',
    })
    router.push('/central/licenses')
  } catch (err: any) {
    notify({
      msg: err?.response?.data?.message ?? 'Invoice created but payment confirmation failed. Confirm it from invoices.',
      type: 'error',
    })
  } finally {
    submitting.value = false
  }
}

function formatMoney(value: any) {
  const amount   = Number(value ?? 0)
  const currency = preview.value.currency || 'USD'
  if (!currency || currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${currency} ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function formatDate(value: any) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

onMounted(async () => {
  await loadPreview()
  await Promise.all([loadPlans(), loadCurrencySettings()])
  fetchRates()
})
</script>

<style scoped>
.field {
  width: 100%;
  border-radius: 0.75rem;
  border: 1.5px solid rgb(229 231 235);
  background: transparent;
  padding: 0.8125rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: inherit;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field:focus,
.field:focus-within {
  border-color: #052659;
  box-shadow: 0 0 0 3px rgba(5, 38, 89, 0.1);
}

.field input:focus {
  outline: none;
}

/* Remove number input spinners */
.field input[type='number']::-webkit-outer-spin-button,
.field input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.field input[type='number'] {
  -moz-appearance: textfield;
}

.dark .field {
  border-color: rgb(55 65 81);
}

.dark .field:focus,
.dark .field:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
</style>
