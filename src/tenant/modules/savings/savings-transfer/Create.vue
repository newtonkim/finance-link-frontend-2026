<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Form, getSystemSetting, pickAsettingKeyValue,UploadLogo,formatCurrency } from '@/Global'; 
import { ArrowLeftRight, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-vue-next'
 const  props = defineProps({
  data: {
    type: Object,
    default: {},
  },
}),fields = ref([ 
  {
    label: 'Transafer Date',
    name: 'transfer_date',
    type: 'date',
    required: true,
    placeholder: 'Enter transfer date', 
  },
  {
    label: 'select From',
    name: 'from',
    type: 'select', 
    required: true, 
    placeholder: 'Enter account from',
    url:"group-account-savings/savings-accounts-drop-down-list",
        dataOnMount: true,},
   {
    label: 'select to',
    name: 'to',
    type: 'select', 
    required: true, 
    placeholder: 'Enter account to',
        url:"group-account-savings/savings-accounts-drop-down-list",
        dataOnMount: true, 
  },
  {
    label: 'Amount To Transfer',
    name: 'amount',
    type: 'money',
    required: true, 
    suffix: 'UGX',
    placeholder: 'Enter amount to transfer',
  },
  {
    label: 'norration',
    name: 'norration',
    type: 'textarea',
    required: true, 
    porefix: 'UGX',
    placeholder: 'Enter amount to transfer',
    rows:"10"
  },
]),transferState = computed(() => {
  const get = (name: string) => fields.value.find(f => f.name === name)
  return {
    from: get('from')?.selected,
    to: get('to')?.selected,
    amount: get('amount')?.value
  }
})
</script>
<template>
    <div class="">
        <div class="mb-6 flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl  bg-nfuko-primary/10">
                <ArrowLeftRight class="h-5 w-5  text-nfuko-primary" />
            </div>
            <div>
                <h1 class="text-xl font-bold text-neutral-900">Fund Transfer</h1>
                <p class="text-[13px] text-neutral-500">Move funds between savings accounts</p>
            </div>
            <button @click="fetchAccounts" :disabled="loadingAccounts"
                class="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-neutral-500 hover:bg-neutral-200 transition-all disabled:opacity-50">
                <RefreshCw :size="13" :class="loadingAccounts ? 'animate-spin' : ''" />
                Refresh
            </button>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div class="lg:col-span-2 p-4 bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
    <Form :action="data?.action" parentStyle="grid  grid-cols-1 gap-4  " v-model:form="fields" /> 
</div>
            <div class="space-y-4">
                <div class="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5 space-y-4">
                    <h3 class="text-[13px] font-bold text-neutral-700 uppercase tracking-wider">How it works</h3>
                    <div class="space-y-3">
                        <div class="flex items-start gap-3">
                            <div class="w-6 h-6 rounded-full  bg-nfuko-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                            <p class="text-[12px] text-neutral-500 leading-relaxed">Select the source account to transfer <strong class="text-neutral-700">from</strong>.</p>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="w-6 h-6 rounded-full  bg-nfuko-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                            <p class="text-[12px] text-neutral-500 leading-relaxed">Select the destination account to transfer <strong class="text-neutral-700">to</strong>.</p>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="w-6 h-6 rounded-full  bg-nfuko-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                            <p class="text-[12px] text-neutral-500 leading-relaxed">Enter the amount and submit. Both accounts update instantly.</p>
                        </div>
                    </div>
                </div>
      <div v-if="transferState.from?.id && transferState.to?.id && Number(transferState.amount) > 0 && !amountError"
  class="bg-white rounded-2xl shadow-sm border border-nfuko-primary-200 p-5">
  <div class="flex items-center gap-2 mb-4">
    <div class="flex items-center justify-center w-7 h-7 rounded-full bg-nfuko-primary-100">
      <CheckCircle2 class="h-4 w-4 text-nfuko-primary-600" />
    </div>
    <h3 class="text-[13px] font-bold text-nfuko-primary-700 uppercase tracking-wider">
      Transfer Preview
    </h3>
  </div>
  <div class="space-y-3 text-[13px]">
    <div class="flex items-center justify-between">
      <span class="text-neutral-500">From</span>
      <span class="font-semibold text-neutral-800 text-right max-w-[60%] truncate">
        {{ transferState.from?.name }}
      </span>
    </div>
    <div class="border-t border-dashed border-neutral-200"></div>
    <div class="flex items-center justify-between">
      <span class="text-neutral-500">To</span>
      <span class="font-semibold text-neutral-800 text-right max-w-[60%] truncate">
        {{ transferState.to?.name }}
      </span>
    </div>
    <div class="border-t border-dashed border-neutral-200"></div>
    <div class="flex items-center justify-between pt-1">
      <span class="text-neutral-500">Amount</span>
      <span class="font-bold text-[16px] text-emerald-700 font-mono">
        {{ formatCurrency(Number(transferState.amount)) }}
      </span>
    </div>
  </div>
  <div class="mt-4 text-[11px] text-neutral-400 flex items-center gap-1">
    <span>✔</span>
    <span>Funds will be transferred instantly</span>
  </div>
</div>
            </div>
        </div>
    </div>
</template>
