<template>
    <div>
        <!-- {{ data }} -->
        <div class="flex justify-start items-center gap-3 mb-4 no-print m-4">
            <select v-model="selectedType" class="border border-gray-300 rounded-lg px-3 py-2 text-sm f  ">
                <option value="all">All Transactions</option>
                <option v-for="type in types" :key="type" :value="type">
                    {{ formatType(type) }}
                </option>
            </select>

            <button @click="printTransactions"
                class="flex items-center gap-2 bg-n-600 text-black px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-n-700 transition">


                Print
            </button>
        </div>
        <MemberTransactionsTab
        :showTable="true"
         :formatDateTime="formatDateTime" :formatDate="formatDate"
            :formatCurrency="formatCurrency" :transactions="filteredCollection" mode="all"
            action-color="bg-[#16a34a]" />

        <div id="print-area" class="bg-white text-gray-800 px-2" v-if="showTransactionTable">
            <div class="text-center border-b pb-4 mb-6">
                <h1 class="text-2xl font-bold tracking-wide">Member Statement</h1>
                <p class="text-sm text-gray-500 mt-1">
                    {{ selectedType === 'all' ? 'All Transactions' : formatType(selectedType) }}
                </p>
            </div>

            <div class="flex justify-between text-sm mb-6">
                <div>
                    <p><span class="font-semibold">Generated:</span> {{ new Date().toLocaleDateString() }}</p>
                </div>
                <!-- <div class="text-right">
                    <p><span class="font-semibold">Currency:</span> UGX</p>
                </div> -->
                <div class="text-right">
                    <p><span class="font-semibold">Account Balance:</span> {{ formatCurrency(profileDetails.details.total_balance) }}</p>
                </div>
            </div>

            <div class="overflow-hidden border rounded-lg">
                <table class="w-full text-sm ">
                    <thead class="bg-gray-100 text-gray-700 uppercase text-xs">
                        <tr>
                            <th class="px-2 py-3 text-left">Date</th>
                            <th class="px-2 py-3 text-left">Type</th>
                            <th class="px-2 py-3 text-right">Amount</th>
                            <th class="px-2 py-3 text-right">Charge</th>
                            <th class="px-2 py-3 text-left">Narration</th>
                        </tr>
                    </thead>

                    <tbody class="divide-y">
                        <tr v-for="item in filteredCollection" :key="item.id" class="hover:bg-gray-50">
                            <td class="px-1 py-1">
                                {{ formatDateSafe(item.transaction_date) }}
                            </td>

                            <td class="px-1 py-1 ">
                                {{ formatType(item.type) }}
                            </td>

                            <td class="px-1 py-1 text-right">
                                {{ formatCurrency(item.amount) }}
                            </td>

                            <td class="px-1 py-1 text-right text-red-500">
                                {{ formatCurrency(item.charge_amount) }}
                            </td>

                            <td class="px-1 py-1 text-gray-600 clamp-1">
                                {{ item.narration }}
                            </td>
                        </tr>
                    </tbody>

                    <tfoot class="bg-gray-50 border-t">
                        <tr>
                            <td colspan="2" class="p-2 font-semibold">
                                Total
                            </td>

                            <td class="px-4 py-3 text-right font-bold text-n-600">
                                {{ formatCurrency(totalAmount) }}
                            </td>

                            <td class="px-4 py-3 text-right font-bold text-red-600">
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

interface Transaction {
    id: number
    type: string
    amount: string
    charge_amount?: string
    narration?: string
    transaction_date?: string
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

const selectedType = ref('all')
const showTransactionTable = ref(false)

const collection = computed(() => props.data?.transactions ?? [])

const types = computed(() => {
    const unique = new Set(collection.value.map(t => t.type))
    return Array.from(unique)
})

const filteredCollection = computed(() => {
    if (selectedType.value === 'all') return collection.value
    return collection.value.filter(t => t.type === selectedType.value)
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