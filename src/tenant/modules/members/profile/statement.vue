<template>
  <div>
    <div class="flex justify-start items-center gap-3 my-4 no-print  ">
   <div class="w-1/5">
       <MultiSearchableSelect v-model="selectedType" :options="types.map((type) => ({ id: type, name: formatType(type) }))" class=" ">
       
      </MultiSearchableSelect>
   </div>

      <button @click="printTransactions"
        class="flex items-center gap-2 bg-n-600 text-black px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-n-700 transition">


        Print
      </button>
    </div>
    <MemberTransactionsTab :showTable="true" :formatDateTime="formatDateTime" :formatDate="formatDate"
      :formatCurrency="formatCurrency" :transactions="filteredCollection" mode="all" action-color="bg-[#16a34a]" />

    <div id="print-area" v-if="showTransactionTable" class=" text-gray-800 p-2 border border-gray-100">
      <div class="text-center border-b pb-5 mb-6">
        <h1 class="text-3xl font-semibold tracking-tight text-gray-900">
          Member Statement
        </h1>
     
        <p class="text-sm text-gray-500 mt-2">
          {{ !selectedType.length ? 'All Transactions' : formatType(selectedType.join(', ')) }}
        </p>
      </div>

      <div class="flex justify-between items-center text-sm mb-6">
        <div class="space-y-1">
          <p>
            <span class="text-gray-500">Generated:</span>
            <span class="font-medium text-gray-700">
              {{ new Date().toLocaleDateString() }}
            </span>
          </p>
        </div>

        <div class="text-right space-y-1">
          <p>
            <span class="text-gray-900 text-lg font-semibold">Account Balance : </span>
            <span class="ftext-sm  text-nfuko-action-600">
              {{ formatCurrency(profileDetails.details.total_balance) }}
            </span>
          </p>
        </div>
      </div>

      <div class="">
        <table class="w-full text-sm table auto ">
          <thead class="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide border-b border-gray-100">
            <tr>
              <th class="px-1 py-1 text-left">Date</th>
              <th class="px-1 py-1 text-left">Type</th>
              <th class="px-1 py-1 text-right">Amount</th>
              <th class="px-1 py-1 text-right">Before Transaction balance</th>
              <th class="px-1 py-1 text-right">Charge</th>
              <th class="px-1 py-1 text-left">Narration</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <tr v-for="item in filteredCollection" :key="item.id" class="hover:bg-gray-50 transition">
              <td class="px-1 py-1 text-gray-700">
                {{ formatDateSafe(item.transaction_date) }}
              </td>

              <td class="px-1 py-1 font-medium text-gray-800">
                {{ formatType(item.type) }}
              </td>

              <td class="px-1 py-1 text-right font-semibold text-gray-900">
                {{ formatCurrency(item.amount) }}
              </td>
              <td class="px-1 py-1 text-right font-semibold text-gray-900">
                {{ formatCurrency(item?.running_balance) }}
              </td>

              <td class="px-1 py-1 text-right font-medium text-red-500">
                {{ formatCurrency(item.charge_amount) }}
              </td>

              <td class="px-1 py-1 text-gray-500 max-w-[200px]  ">
                {{ item.narration }}
              </td>
            </tr>
          </tbody>

          <tfoot class="bg-gray-50 border-t">
            <tr>
              <td colspan="2" class="px-1 py-1 font-semibold text-gray-700">
                Total
              </td>

              <td class="px-1 py-1 text-right font-bold text-gray-900">
                {{ formatCurrency(totalAmount) }}
              </td>

              <td class="px-1 py-1 text-right font-bold text-red-600">
                {{ formatCurrency(totalCharges) }}
              </td>

              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="mt-6 text-xs text-gray-400 text-center">
        <p>This is a system-generated statement.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MemberTransactionsTab from './MemberTransactionsTab.vue'
import { formatCurrency, printElementId } from '@/Global'
import MultiSearchableSelect from '@/Global/MultiSearchableSelect.vue'

interface Transaction {
  id: number
  type: string
  amount: string
  charge_amount?: string
  narration?: string
  transaction_date?: string
  running_balance?: string
}

interface DataType {
  transactions?: Transaction[]
}

const props = defineProps<{
  data?: DataType,
  profileDetails: any
  formatDate?: (date: string) => string
  formatDateTime?: (date: string) => string
  // formatCurrency?: (amount: number) => string
}>()

const selectedType = ref<(string | number)[]>([])
const showTransactionTable = ref(false)

const collection = computed(() => props.data?.transactions ?? [])

const types = computed(() => {
  const unique = new Set(collection.value.map(t => t.type))
  return Array.from(unique)
})

const filteredCollection = computed(() => {
  if (!selectedType.value.length) return collection.value
  return collection.value.filter(t => selectedType.value.includes(t.type))
})

const totalAmount = computed(() => {
  return filteredCollection.value.reduce((sum, t) => {
    return sum + Number(t.amount || 0)
  }, 0)
})

const totalCharges = computed(() => {
  return filteredCollection.value.reduce((sum, t) => {
    return sum + Number(t.charge_amount || 0)
  }, 0)
})

const formatType = (type: string) => {
  return type.replace(/-/g, ' ')
}


const formatDateSafe = (date?: string) => {
  return props.formatDate ? props.formatDate(date || '') : date
}

const printTransactions = () => {
  showTransactionTable.value = true
  setTimeout(() => {
    printElementId('print-area')
    showTransactionTable.value = false
  })
}



</script>