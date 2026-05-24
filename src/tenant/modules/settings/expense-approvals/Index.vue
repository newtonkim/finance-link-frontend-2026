<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { tenantClient } from '@/tenant/apis/tenantClient'
import { CheckCircle, AlertCircle, RefreshCw, Trash2, ArrowLeft, Plus } from 'lucide-vue-next'
import { PainPageHeader } from '@/Global'

interface Threshold {
  level: number
  min_amount: number
  max_amount: number | null
  required_role: string
}

const thresholds = ref<Threshold[]>([
  { level: 1, min_amount: 0, max_amount: 500000, required_role: 'accountant' },
  { level: 2, min_amount: 500001, max_amount: 2000000, required_role: 'branch_manager' },
  { level: 3, min_amount: 2000001, max_amount: 5000000, required_role: 'admin' },
  { level: 4, min_amount: 5000001, max_amount: 10000000, required_role: 'treasurer' },
  { level: 5, min_amount: 10000001, max_amount: null, required_role: 'board' },
])

const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const message = ref({ text: '', type: '' })

const fetchThresholds = async () => {
  loading.value = true
  try {
    const response = await tenantClient.get('/expenses/thresholds')
    if (response.data?.data && response.data.data.length > 0) {
      thresholds.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to fetch thresholds', error)
  } finally {
    loading.value = false
  }
}

const saveThresholds = async () => {
  saving.value = true
  message.value = { text: '', type: '' }
  try {
    await tenantClient.put('/expenses/thresholds', {
      thresholds: thresholds.value
    })
    message.value = { text: 'Thresholds updated successfully.', type: 'success' }
    setTimeout(() => { message.value.text = '' }, 3000)
  } catch (error: any) {
    message.value = { 
      text: error.response?.data?.message || 'Failed to save thresholds.', 
      type: 'error' 
    }
  } finally {
    saving.value = false
  }
}

const addLevel = () => {
  const newLevel = thresholds.value.length + 1
  const lastMax = thresholds.value[thresholds.value.length - 1]?.max_amount || 0
  
  thresholds.value.push({
    level: newLevel,
    min_amount: Number(lastMax) + 1,
    max_amount: null,
    required_role: ''
  })
}

const removeLevel = (index: number) => {
  thresholds.value.splice(index, 1)
  // Re-index levels
  thresholds.value.forEach((t, i) => {
    t.level = i + 1
  })
}

onMounted(() => {
  fetchThresholds()
})
</script>

<template>
  <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
    <div class="flex items-center gap-3">
      <button @click="router.push('/tenant/settings/expense-management')" class="flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-nfuko-primary dark:hover:text-nfuko-yellow transition-colors">
        <ArrowLeft class="w-4 h-4" />
        Back
      </button>
    </div>
    <PainPageHeader 
      title="Expense Approvals Settings" 
      dec="Configure multi-level approval rules based on expense amounts and staff roles." 
    />

    <div class="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6">
      
      <!-- Feedback Message -->
      <div v-if="message.text" :class="message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'" class="p-3 mb-4 rounded-lg flex items-center gap-2">
        <CheckCircle v-if="message.type === 'success'" class="w-5 h-5" />
        <AlertCircle v-else class="w-5 h-5" />
        <span class="text-sm font-medium">{{ message.text }}</span>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <RefreshCw class="w-8 h-8 text-nfuko-primary animate-spin" />
      </div>

      <div v-else class="space-y-6">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-neutral-200 dark:border-neutral-700">
                <th class="py-3 px-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Level</th>
                <th class="py-3 px-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Min Amount</th>
                <th class="py-3 px-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Max Amount (Leave empty for ∞)</th>
                <th class="py-3 px-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Required Role</th>
                <th class="py-3 px-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(threshold, index) in thresholds" :key="threshold.level" class="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <td class="py-3 px-4 font-medium text-neutral-900 dark:text-white">Level {{ threshold.level }}</td>
                <td class="py-3 px-4">
                  <input type="number" v-model="threshold.min_amount" class="w-full p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" />
                </td>
                <td class="py-3 px-4">
                  <input type="number" v-model="threshold.max_amount" class="w-full p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="Infinity" />
                </td>
                <td class="py-3 px-4">
                  <!-- In a real scenario, this would be a select dropdown of actual roles -->
                  <input type="text" v-model="threshold.required_role" class="w-full p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="e.g. branch_manager" />
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <button @click="removeLevel(index)" class="text-rose-500 hover:text-rose-700 transition-colors disabled:opacity-30" :disabled="thresholds.length <= 1" title="Delete">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between mt-4">
          <button @click="addLevel" class="bg-nfuko-primary text-white dark:bg-nfuko-yellow dark:text-[#1d4780] px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-[#002e35] dark:hover:bg-[#b8973f] flex items-center gap-2 transition-all text-sm">
            <Plus class="w-4 h-4" />
            Add Approval Level
          </button>
          
          <button @click="saveThresholds" :disabled="saving" class="bg-nfuko-primary text-white dark:bg-nfuko-yellow dark:text-[#1d4780] px-6 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-[#002e35] dark:hover:bg-[#b8973f] disabled:opacity-70 flex items-center gap-2 transition-all">
            <RefreshCw v-if="saving" class="w-4 h-4 animate-spin" />
            Save Configuration
          </button>
        </div>

      </div>
    </div>
  </div>
</template>
