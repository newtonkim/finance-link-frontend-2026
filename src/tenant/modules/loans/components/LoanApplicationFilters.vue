<script setup lang="ts">
import { ref, computed } from 'vue'
import { Filter, Search, X } from 'lucide-vue-next'

const props = defineProps<{
    filters: Record<string, any>
    branches: { id: number; name: string }[]
    products: { id?: number; name: string; code?: string | null }[]
}>()

const emit = defineEmits<{
    filter: []
    search: []
    clear: []
}>()

const statusOptions = [
    { value: '',             label: 'All Statuses' },
    { value: 'draft',        label: 'Draft' },
    { value: 'submitted',    label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'recommended',  label: 'Recommended' },
    { value: 'awaiting_documents',  label: 'Awaiting Documents' },
    { value: 'approved',     label: 'Approved' },
    { value: 'rejected',     label: 'Rejected' },
    { value: 'disbursed',    label: 'Disbursed' },
    { value: 'cancelled',    label: 'Cancelled' },
]

// ─── Product filter dropdown ──────────────────────────────────────────────────
const productSearch       = ref('')
const showProductFilter   = ref(false)
const selectedProductName = ref('')

const filteredProductOptions = computed(() => {
    const q = productSearch.value.trim().toLowerCase()
    if (!q) return props.products
    return props.products.filter(p =>
        p.name.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)
    )
})

function selectProduct(p: { id?: number; name: string; code?: string | null }) {
    props.filters.loan_product_id = p.id
    selectedProductName.value     = p.code ? `${p.name} (${p.code})` : p.name
    productSearch.value           = ''
    showProductFilter.value       = false
    emit('filter')
}

function clearProduct() {
    props.filters.loan_product_id = ''
    selectedProductName.value     = ''
    productSearch.value           = ''
    emit('filter')
}

function closeProductFilter() { setTimeout(() => { showProductFilter.value = false }, 200) }

// ─── Member search debounce ───────────────────────────────────────────────────
let memberTimer: ReturnType<typeof setTimeout> | null = null
function onMemberInput() {
    if (memberTimer) clearTimeout(memberTimer)
    memberTimer = setTimeout(() => emit('search'), 400)
}

const inputBase = 'rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
</script>

<template>
    <div class="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="flex flex-wrap items-end gap-3">
            <div class="flex items-center gap-2">
                <Filter class="h-4 w-4 text-neutral-400" />
                <span class="text-sm font-medium text-neutral-600 dark:text-neutral-400">Filters</span>
            </div>

            <!-- Status -->
            <div class="flex flex-col gap-1">
                <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">Status</label>
                <select v-model="filters.status" :class="inputBase" @change="emit('filter')">
                    <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
            </div>

            <!-- Member search -->
            <div class="flex flex-col gap-1">
                <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">Member</label>
                <div class="relative">
                    <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                        v-model="filters.member_search"
                        type="text"
                        placeholder="Search member…"
                        class="w-48 rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
                        @input="onMemberInput"
                        @keyup.enter="emit('search')"
                    />
                </div>
            </div>

            <!-- Product filter -->
            <div class="flex flex-col gap-1">
                <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">Product</label>
                <div class="relative">
                    <div class="flex w-44 items-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm gap-1.5 dark:border-neutral-700 dark:bg-neutral-800">
                        <input
                            v-model="productSearch"
                            :placeholder="selectedProductName || 'All products…'"
                            :class="selectedProductName && !productSearch ? 'text-neutral-900 dark:text-white' : ''"
                            class="flex-1 min-w-0 bg-transparent text-sm text-neutral-500 outline-none dark:placeholder-neutral-500 dark:text-neutral-400"
                            @focus="showProductFilter = true"
                            @blur="closeProductFilter"
                        />
                        <button v-if="filters.loan_product_id" type="button" class="shrink-0 text-neutral-400 hover:text-neutral-600" @mousedown.prevent="clearProduct">
                            <X class="h-3 w-3" />
                        </button>
                    </div>
                    <div v-if="showProductFilter" class="absolute z-20 mt-1 w-56 rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                        <ul v-if="filteredProductOptions.length" class="max-h-48 overflow-y-auto">
                            <li
                                v-for="p in filteredProductOptions" :key="p.id"
                                class="cursor-pointer px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                                @mousedown.prevent="selectProduct(p)"
                            >
                                <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ p.name }}</p>
                                <p class="text-xs text-neutral-400">{{ p.code }}</p>
                            </li>
                        </ul>
                        <p v-else class="px-3 py-2 text-sm text-neutral-400">No products found.</p>
                    </div>
                </div>
            </div>

            <!-- Branch -->
            <div class="flex flex-col gap-1">
                <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">Branch</label>
                <select v-model="filters.branch_id" class="w-40 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" @change="emit('filter')">
                    <option value="">All Branches</option>
                    <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
                </select>
            </div>

            <!-- Date From -->
            <div class="flex flex-col gap-1">
                <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">From</label>
                <input v-model="filters.date_from" type="date" :class="inputBase" @change="emit('filter')" />
            </div>

            <!-- Date To -->
            <div class="flex flex-col gap-1">
                <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">To</label>
                <input v-model="filters.date_to" type="date" :class="inputBase" @change="emit('filter')" />
            </div>

            <!-- Apply & Clear -->
            <div class="flex items-end gap-2">
                <button class="rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white hover:bg-nfuko-primary/90 transition-colors dark:bg-bg-nfuko-yellow dark:text-black" @click="emit('filter')">Apply</button>
                <button
                    v-if="filters.status || filters.member_search || filters.loan_product_id || filters.branch_id || filters.date_from || filters.date_to"
                    class="flex items-center gap-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    @click="emit('clear')"
                >
                    <X class="h-3.5 w-3.5" /> Clear
                </button>
            </div>
        </div>
    </div>
</template>
