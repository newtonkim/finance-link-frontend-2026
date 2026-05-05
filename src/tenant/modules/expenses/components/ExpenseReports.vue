<template>
  <div class="p-6 h-full overflow-y-auto bg-neutral-50 dark:bg-neutral-950">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">Compliance Reports</h2>
        <p class="text-sm text-neutral-500 font-medium italic">SACCO Fiscal Transparency & Audit Suite</p>
      </div>
      
      <div class="flex items-center gap-4 bg-white dark:bg-neutral-800 p-2 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
        <div class="flex items-center gap-2 px-3 border-r border-neutral-100 dark:border-neutral-700">
          <Calendar class="w-4 h-4 text-neutral-400" />
          <input 
            type="month" 
            v-model="selectedPeriod" 
            class="bg-transparent border-none text-xs font-black focus:ring-0 uppercase cursor-pointer"
          />
        </div>
        <div class="flex p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg gap-1">
          <select v-model="activeTab" class="bg-transparent border-none text-[10px] font-black focus:ring-0 uppercase pr-8">
            <option v-for="tab in tabs" :key="tab.id" :value="tab.id">{{ tab.label }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Report Content -->
    <div v-if="loading" class="flex flex-col items-center justify-center h-64">
      <div class="w-8 h-8 border-4 border-nfuko-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="text-xs font-bold text-neutral-400 animate-pulse">GENERATING COMPLIANCE DATA...</p>
    </div>

    <div v-else class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <!-- 1. Expense Ledger -->
      <div v-if="activeTab === 'ledger'" class="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <BookOpen class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-neutral-900 dark:text-white">Expense General Ledger</h3>
              <p class="text-[10px] text-neutral-500 font-medium">Detailed transaction audit for {{ selectedPeriod }}</p>
            </div>
          </div>
          <button @click="exportToCSV" class="text-[10px] font-black text-nfuko-primary hover:underline uppercase tracking-widest">
            Export CSV
          </button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-neutral-50 dark:bg-neutral-900 text-[10px] font-black text-neutral-500 uppercase tracking-wider">
              <tr>
                <th class="px-6 py-4">Date</th>
                <th class="px-6 py-4">Account</th>
                <th class="px-6 py-4">Ref #</th>
                <th class="px-6 py-4">Vendor</th>
                <th class="px-6 py-4 text-right">Debit</th>
                <th class="px-6 py-4 text-right">Credit</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700">
              <tr v-for="(row, idx) in ledgerData" :key="idx" class="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 transition-colors">
                <td class="px-6 py-4 font-mono text-[10px]">{{ row.payment_date }}</td>
                <td class="px-6 py-4">
                  <p class="font-bold text-neutral-900 dark:text-white">{{ row.account_name }}</p>
                  <p class="font-mono text-[10px] text-neutral-400">{{ row.account_code }}</p>
                </td>
                <td class="px-6 py-4 font-mono text-[10px] text-neutral-500">{{ row.reference_no }}</td>
                <td class="px-6 py-4 font-bold text-neutral-700 dark:text-neutral-200">{{ row.vendor }}</td>
                <td class="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                  {{ row.debit > 0 ? row.debit.toLocaleString() : '-' }}
                </td>
                <td class="px-6 py-4 text-right font-mono font-bold text-rose-600">
                  {{ row.credit > 0 ? row.credit.toLocaleString() : '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 2. Budget Variance -->
      <div v-if="activeTab === 'variance'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="item in varianceData" :key="item.category" class="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group hover:border-nfuko-primary transition-all duration-300">
          <div :class="[
            'absolute top-0 left-0 w-full h-1 transition-all duration-300',
            item.utilisation_pct > 100 ? 'bg-rose-500' : item.utilisation_pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
          ]"></div>
          
          <div class="flex justify-between items-start mb-4">
            <h4 class="text-sm font-black text-neutral-900 dark:text-white uppercase">{{ item.category }}</h4>
            <Badge :variant="item.utilisation_pct > 100 ? 'destructive' : 'secondary'" class="text-[10px] font-black">
              {{ item.utilisation_pct }}%
            </Badge>
          </div>

          <div class="space-y-4">
            <div class="flex justify-between text-[10px] font-bold">
              <span class="text-neutral-400 uppercase">Budgeted</span>
              <span class="text-neutral-900 dark:text-white font-mono uppercase">UGX {{ item.budget.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-[10px] font-bold">
              <span class="text-neutral-400 uppercase">Actual Spend</span>
              <span class="text-neutral-900 dark:text-white font-mono uppercase">UGX {{ item.actual.toLocaleString() }}</span>
            </div>
            
            <div class="h-1.5 w-full bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
              <div 
                :class="['h-full rounded-full transition-all duration-1000', item.utilisation_pct > 100 ? 'bg-rose-500' : 'bg-emerald-500']"
                :style="{ width: `${Math.min(item.utilisation_pct, 100)}%` }"
              ></div>
            </div>

            <div class="flex justify-between items-center pt-2">
              <span class="text-[10px] font-black uppercase" :class="item.variance < 0 ? 'text-rose-500' : 'text-emerald-500'">
                {{ item.variance < 0 ? 'OVER BUDGET' : 'REMAINING' }}
              </span>
              <span class="text-xs font-black font-mono" :class="item.variance < 0 ? 'text-rose-600' : 'text-emerald-600'">
                {{ Math.abs(item.variance).toLocaleString() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Branch Breakdown -->
      <div v-if="activeTab === 'branch'" class="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
        <div class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="branch in branchData" :key="branch.branch" class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <h4 class="text-[10px] font-black text-neutral-400 uppercase mb-2">{{ branch.branch }}</h4>
            <div class="flex items-end justify-between">
              <p class="text-lg font-black text-neutral-900 dark:text-white">UGX {{ branch.total_amount.toLocaleString() }}</p>
              <span class="text-[10px] font-black text-nfuko-primary">{{ branch.percentage_contribution }}%</span>
            </div>
            <p class="text-[10px] text-neutral-500 mt-1 font-bold">{{ branch.transaction_count }} TRANSACTIONS</p>
          </div>
        </div>
      </div>

      <!-- 4. I&E Extract -->
      <div v-if="activeTab === 'ie'" class="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <h3 class="text-sm font-black text-neutral-900 uppercase">Income & Expenditure Extract (Expenses Only)</h3>
          <span class="text-[10px] font-black text-neutral-400 uppercase">FY {{ selectedPeriod.split('-')[0] }}</span>
        </div>
        <div class="p-6">
          <div v-for="row in ieData" :key="row.account_code" class="flex justify-between py-3 border-b border-neutral-50 last:border-0">
            <div>
              <p class="text-xs font-bold text-neutral-700">{{ row.expense_line }}</p>
              <p class="text-[10px] text-neutral-400 font-mono">{{ row.account_code }}</p>
            </div>
            <p class="text-sm font-black text-neutral-900 font-mono">UGX {{ row.total_annual_spend.toLocaleString() }}</p>
          </div>
        </div>
      </div>

      <!-- 5. Trial Balance -->
      <div v-if="activeTab === 'tb'" class="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-neutral-100 bg-neutral-50/50">
          <h3 class="text-sm font-black text-neutral-900 uppercase">Expense Account Closing Balances</h3>
        </div>
        <div class="p-6">
          <table class="w-full text-left text-xs">
            <thead class="text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100">
              <tr>
                <th class="py-4">Account Code</th>
                <th class="py-4">Account Name</th>
                <th class="py-4 text-right">Balance (Debit)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50">
              <tr v-for="row in tbData" :key="row.code">
                <td class="py-4 font-mono font-bold text-neutral-500">{{ row.code }}</td>
                <td class="py-4 font-black text-neutral-900">{{ row.name }}</td>
                <td class="py-4 text-right font-mono font-black text-nfuko-primary">UGX {{ row.closing_balance.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 6. Unreconciled Items -->
      <div v-if="activeTab === 'reconciliation'" class="bg-white dark:bg-neutral-800 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm overflow-hidden">
        <div class="p-6 bg-rose-50 dark:bg-rose-900/10 border-b border-rose-100 dark:border-rose-900/30 flex items-center gap-4">
          <div class="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-xl text-rose-600">
            <AlertCircle class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-lg font-black text-rose-900 dark:text-rose-300">Unreconciled Items (> 7 Days)</h3>
            <p class="text-xs text-rose-700 dark:text-rose-400 font-medium italic">Expenses requiring urgent bank matching.</p>
          </div>
        </div>
        <div v-if="unreconciledData.length === 0" class="p-12 text-center">
          <CheckCircle2 class="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-20" />
          <p class="text-sm font-bold text-neutral-400 uppercase tracking-widest">Reconciliation Complete</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-neutral-50 dark:bg-neutral-900 text-[10px] font-black text-neutral-500 uppercase">
              <tr>
                <th class="px-6 py-4">Ref #</th>
                <th class="px-6 py-4">Vendor</th>
                <th class="px-6 py-4">Date</th>
                <th class="px-6 py-4 text-right">Amount</th>
                <th class="px-6 py-4 text-center">Outstanding</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700">
              <tr v-for="item in unreconciledData" :key="item.reference_no" class="hover:bg-rose-50/20 transition-colors">
                <td class="px-6 py-4 font-mono font-bold">{{ item.reference_no }}</td>
                <td class="px-6 py-4">
                  <p class="font-bold text-neutral-900 dark:text-white">{{ item.vendor }}</p>
                  <p class="text-[10px] text-neutral-400">{{ item.payment_method }}</p>
                </td>
                <td class="px-6 py-4 text-neutral-500 font-mono text-[10px]">{{ item.payment_date }}</td>
                <td class="px-6 py-4 text-right font-black text-neutral-900 dark:text-white">UGX {{ item.amount.toLocaleString() }}</td>
                <td class="px-6 py-4 text-center">
                  <Badge variant="destructive" class="text-[10px] font-black">
                    {{ item.days_outstanding }} DAYS
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Calendar, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import { Badge } from '@/Global'
import { useExpenseApi } from '@/tenant/apis/expenses/expenseApi'

const { 
  getExpenseLedger, 
  getBudgetVariance, 
  getUnreconciledExpenses, 
  getBranchBreakdown, 
  getIEExtract, 
  getTBContribution 
} = useExpenseApi()

const selectedPeriod = ref<string>(new Date().toISOString().slice(0, 7))
const activeTab = ref<string>('ledger')
const loading = ref<boolean>(false)

const tabs = [
  { id: 'ledger', label: 'Expense Ledger' },
  { id: 'variance', label: 'Budget Variance' },
  { id: 'branch', label: 'Expense by Branch' },
  { id: 'reconciliation', label: 'Unreconciled Items' },
  { id: 'ie', label: 'I&E Extract' },
  { id: 'tb', label: 'Trial Balance' },
]

const ledgerData = ref<any[]>([])
const varianceData = ref<any[]>([])
const unreconciledData = ref<any[]>([])
const branchData = ref<any[]>([])
const ieData = ref<any[]>([])
const tbData = ref<any[]>([])

async function fetchData() {
  loading.value = true
  try {
    const period = selectedPeriod.value
    const year = period.split('-')[0]
    const asOf = `${period}-28` // Approximate end of month
    
    if (activeTab.value === 'ledger') {
      const res = await getExpenseLedger(period) as any
      ledgerData.value = res?.data || res || []
    } else if (activeTab.value === 'variance') {
      const res = await getBudgetVariance(year, period) as any
      varianceData.value = res?.data || res || []
    } else if (activeTab.value === 'reconciliation') {
      const res = await getUnreconciledExpenses() as any
      unreconciledData.value = res?.data || res || []
    } else if (activeTab.value === 'branch') {
      const res = await getBranchBreakdown(period) as any
      branchData.value = res?.data || res || []
    } else if (activeTab.value === 'ie') {
      const res = await getIEExtract(year) as any
      ieData.value = res?.data || res || []
    } else if (activeTab.value === 'tb') {
      const res = await getTBContribution(asOf) as any
      tbData.value = res?.data || res || []
    }
  } catch (error) {
    console.error('Failed to fetch report data:', error)
  } finally {
    loading.value = false
  }
}

function exportToCSV() {
  let data = []
  let filename = `Expense_Report_${activeTab.value}_${selectedPeriod.value}.csv`
  
  if (activeTab.value === 'ledger') data = ledgerData.value
  else if (activeTab.value === 'variance') data = varianceData.value
  else if (activeTab.value === 'branch') data = branchData.value
  else if (activeTab.value === 'ie') data = ieData.value
  else if (activeTab.value === 'tb') data = tbData.value
  else data = unreconciledData.value
  
  if (data.length === 0) return
  
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => Object.values(row).join(',')).join('\n')
  const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(fetchData)
watch([selectedPeriod, activeTab], fetchData)
</script>
