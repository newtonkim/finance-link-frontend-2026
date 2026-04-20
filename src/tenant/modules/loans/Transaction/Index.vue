<template>
  <TableDrawer ref="drawer" :showAddButton="false" drawerWidth="w-4/5" :url="tableUrl" state="loanTransactionList"
    :drawerTitle="drawerTitle" :columns="columns" :showTableAction="false">
    <template #header-action>
      <PainPageHeader title="Loan Transactions" dec="Manage and track member loan transactions" />
    </template>
    <template #loan_no="{ item }">
      <CopyData :show="item?.loan_no" :copy="item?.loan_no">
        <template #text>
          <button @click="navigateToLoanDetails(item)"
            class="font-semibold text-nfuko-action text-sm dark:text-white">
            {{ item?.loan_no }}
          </button>
        </template>
      </CopyData>
    </template>
    <template #searchSideAction>
      <StatusButtonsHorizontal v-model="statusFilter" :filters="filters" />
    </template>
  </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter(),
  statusFilter = ref<'all' | 'Cash' | 'Cheque' | 'committee_voting'>('all'),
  drawerTitle = ref('Loan Transactions'),
  filters = ['all', 'Cash', 'Cheque', 'committee_voting'],
  tableUrl = computed(() => {
    return `/loan-applications/transactions?status=${statusFilter.value}`
  });
const columns = [
  { key: 'pay_reference', label: 'Reference Code', sticky: 'left', width: '14em', copy: true },
  { key: 'loan_no', label: 'Loan Code', sticky: 'left', width: '14em', copy: true },
  { key: 'product_name', label: 'Product' },
  { key: 'member_name', label: 'Member Name' },
  { key: 'amount_paid', label: 'Amount Paid', type: 'money' },
  { key: 'payment_method', label: 'Method', type: 'status' },
  { key: 'payment_date', label: 'Payment Date', type: 'date', width: '10em',onSearch:{type:'date-range'} },
  { key: 'created_at', label: 'Created At', type: 'date', width: '10em' }
]
function navigateToLoanDetails(item: any) {
  if (!item?.application_id) return
  router.push(`loan-applications/${item.application_id}`)
}
</script>