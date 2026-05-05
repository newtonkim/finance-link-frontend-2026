<template>
  <div class="space-y-6">
    <div class="p-4 bg-nfuko-primary/5 rounded-xl border border-nfuko-primary/10">
      <div class="flex justify-between items-center mb-2">
        <span class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Amount to Pay</span>
        <span class="text-lg font-bold text-nfuko-primary">{{ data.amount_formatted }}</span>
      </div>
      <p class="text-sm text-neutral-600">{{ data.title }}</p>
    </div>

    <div class="space-y-4">
      <div class="space-y-2">
        <Label>Amount</Label>
        <Input type="number" v-model="form.amount" required min="0.01" step="0.01" />
      </div>

      <div class="relative z-50">
        <SearchableSelect 
          label="Bank/Cash Account" 
          v-model="form.chart_of_account_id"
          url="/chart-of-accounts?type=Asset&is_postable=true"
          placeholder="Select source of funds" 
          method="get" 
          :required="true" 
        />
      </div>

      <div class="grid grid-cols-2 gap-4 relative z-0">
        <div class="space-y-2">
          <Label>Payment Date</Label>
          <Input type="date" v-model="form.payment_date" required />
        </div>
        <div class="space-y-2">
          <Label>Reference #</Label>
          <Input v-model="form.reference_no" placeholder="Cheque/TXN ID" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { SearchableSelect, Label, Input } from '@/Global'

const props = defineProps<{
  data: any
  form: any
}>()

const emit = defineEmits(['update:form'])

onMounted(() => {
  // Pre-fill today's date
  props.form.payment_date = new Date().toISOString().split('T')[0]
  if (!props.form.amount) {
    props.form.amount = props.data.amount
  }
})
</script>
