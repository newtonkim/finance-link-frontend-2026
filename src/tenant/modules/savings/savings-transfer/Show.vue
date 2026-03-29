<script setup>
import { DetailsTable } from '@/Global'
import { onMounted, ref } from 'vue'
const loading = ref(true)
const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})
const columns = [
  {
    header: 'Transfer Details',
    type: 'Descriptions',
    column: 3,
    list: [
      { key: 'code', label: 'code' },
      { key: 'member_name', label: 'memeber name' },
      { key: 'transfer_amount', label: 'transfer' },
      { key: 'status', label: 'status', type: 'status' },
      { key: 'account_balance', label: 'balance' },
      { key: 'transfer_to_product', label: 'to' },
      { key: 'transfer_from_product', label: 'from' },
      { key: 'notation', label: 'notation' },
      { key: 'created_at', label: 'created', type: 'dateTime' },
    ],
  },
  {
    header: 'Transfer Transactions',
    type: 'Table',
    column: [
      { key: 'created_by', label: 'created by', sticky: 'left' },
      { key: 'reference', label: 'reference', sticky: 'left', copy: '1' },
      { key: 'transaction_date', label: 'transaction date', width: '10em' },
      { key: 'branch_details', label: 'branch', width: '10em' },
      { key: 'completed_at', label: 'completed at', width: '10em' },
      { key: 'created_at', label: 'created at', sticky: 'right', width: '10em', type: 'dateTime' },
    ],
    list: [],
  },
]
async function prepareTheFeaturesData() {
  loading.value = true
  if (props.data.transactionList)
    props.data.transactionList.forEach((element) => {
      columns[1].list.push({
        created_at: element.created_at,
        reference: element.reference,
        transaction_date: element.transaction_date,
        created_by: element.created_by,
        completed_at: element.completed_at,
        branch_details: element.branch_details,
      })
    })
  loading.value = false
}
onMounted(async () => {
  await prepareTheFeaturesData()
})
</script>

<template>
  <div v-if="loading">Loading...</div>
  <DetailsTable v-else :data="data" :columns="columns" />
</template>
