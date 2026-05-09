<template>
  <div class="space-y-6">
    <div class="p-4 bg-nfuko-primary/5 rounded-xl border border-nfuko-primary/10">
      <div class="flex justify-between items-center mb-2">
        <span class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Amount to Pay</span>
        <span class="text-lg font-bold text-nfuko-primary">UGX {{ Number(data.amount || 0).toLocaleString() }}</span>
      </div>
      <p class="text-sm text-neutral-600">{{ data.title }}</p>
    </div>

    <div class="space-y-4">
      <div class="space-y-2">
        <Label>Amount</Label>
        <Input type="number" v-model="form.amount" required min="0.01" step="0.01" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label>Payment Date</Label>
          <Input type="date" v-model="form.payment_date" required />
        </div>
        <div class="space-y-2">
          <Label>Reference #</Label>
          <div class="relative">
            <Input v-model="form.reference_no" placeholder="Cheque/TXN ID" class="pr-16" />
            <button
              type="button"
              @click="form.reference_no = generateRef()"
              title="Regenerate reference"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-nfuko-primary hover:text-nfuko-action uppercase tracking-wide"
            >
              Regen
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Source of Funds <span class="text-rose-500">*</span>
        </label>
        <div id="coa-dropdown-wrap" class="relative">
          <!-- trigger -->
          <button
            type="button"
            @click="openCoa()"
            class="w-full flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm transition hover:border-nfuko-primary focus:outline-none focus:ring-2 focus:ring-nfuko-primary/20"
          >
            <span v-if="selectedCoa" class="font-medium text-neutral-900 dark:text-white truncate">
              {{ selectedCoa.gl_code }} — {{ selectedCoa.name }}
            </span>
            <span v-else class="text-neutral-400">Select bank / cash account…</span>
            <ChevronDown class="w-4 h-4 text-neutral-400 flex-shrink-0 transition-transform" :class="{ 'rotate-180': coaOpen }" />
          </button>

          <!-- dropdown -->
          <div
            v-if="coaOpen"
            class="absolute z-[9999] mt-1 w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl"
          >
            <!-- search -->
            <div class="p-2 border-b border-neutral-100 dark:border-neutral-800">
              <div class="relative flex items-center">
                <Search class="absolute left-3 w-4 h-4 text-neutral-400" />
                <input
                  v-model="coaSearch"
                  ref="coaSearchInput"
                  type="text"
                  placeholder="Search by code or name…"
                  class="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-950 rounded-lg outline-none"
                  @click.stop
                />
              </div>
            </div>

            <!-- loading -->
            <div v-if="coaLoading" class="py-8 text-center text-xs text-neutral-400">Loading accounts…</div>

            <!-- options -->
            <ul v-else class="max-h-56 overflow-y-auto py-1">
              <li
                v-for="acc in filteredCoa"
                :key="acc.id"
                @click.stop="selectCoa(acc)"
                class="flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                :class="acc.id === form.chart_of_account_id ? 'bg-neutral-50 dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'"
              >
                <div class="min-w-0">
                  <span class="font-mono text-[11px] text-neutral-400 mr-2">{{ acc.gl_code }}</span>
                  <span class="truncate">{{ acc.name }}</span>
                </div>
                <Check v-if="acc.id === form.chart_of_account_id" class="w-4 h-4 text-nfuko-primary flex-shrink-0" />
              </li>
              <li v-if="filteredCoa.length === 0" class="px-4 py-8 text-center text-sm text-neutral-400">
                No accounts found
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { Label, Input } from '@/Global'
import { fetchTableData } from '@/Global/landingLayout/util'
import { ChevronDown, Search, Check } from 'lucide-vue-next'
import { pomPinia } from 'septor-store'

const Store = pomPinia()

const props = defineProps<{
  data: any
  form: any
}>()

const emit = defineEmits(['update:form'])

// ── COA dropdown state ────────────────────────────────────
const coaOpen = ref(false)
const coaSearch = ref('')
const coaLoading = ref(false)
const coaAccounts = ref<any[]>([])
const coaSearchInput = ref<HTMLInputElement | null>(null)

const filteredCoa = computed(() => {
  const q = coaSearch.value.toLowerCase().trim()
  if (!q) return coaAccounts.value
  return coaAccounts.value.filter(a =>
    a.name?.toLowerCase().includes(q) || a.gl_code?.toLowerCase().includes(q)
  )
})

const selectedCoa = computed(() =>
  coaAccounts.value.find(a => a.id === props.form.chart_of_account_id) ?? null
)

function selectCoa(acc: any) {
  props.form.chart_of_account_id = acc.id
  coaOpen.value = false
  coaSearch.value = ''
}

async function loadCoa() {
  if (coaAccounts.value.length) return
  coaLoading.value = true
  const res: any = await fetchTableData({
    data: null,
    Store,
    props: {
      url: '/chart-of-accounts?type=Asset&is_postable=true&list=true',
      method: 'get',
      state: 'coaAssetList',
      reload: true,
    },
  })
  const payload = res?.payload?.data ?? res?.payload ?? res?.data ?? []
  coaAccounts.value = Array.isArray(payload) ? payload : []
  coaLoading.value = false
}

// close on outside click
function handleOutsideClick(e: MouseEvent) {
  const el = document.getElementById('coa-dropdown-wrap')
  if (el && !el.contains(e.target as Node)) coaOpen.value = false
}

// open dropdown + focus search + load data
async function openCoa() {
  coaOpen.value = !coaOpen.value
  if (coaOpen.value) {
    await loadCoa()
    await nextTick()
    coaSearchInput.value?.focus()
  }
}

// ── Ref generation ─────────────────────────────────────────
function generateRef(): string {
  const d = new Date()
  const yy = String(d.getFullYear()).slice(-2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `PAY-${yy}${mm}${dd}-${rand}`
}

onMounted(() => {
  props.form.payment_date = new Date().toISOString().split('T')[0]
  if (!props.form.amount) props.form.amount = props.data.amount
  if (!props.form.reference_no) props.form.reference_no = generateRef()
  loadCoa()
  window.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  window.removeEventListener('click', handleOutsideClick)
})
</script>
