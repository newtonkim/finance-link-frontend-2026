<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { PlusCircle, Trash2, Loader2, Shield } from 'lucide-vue-next'
import { loanApplicationsApi } from '../../../apis/loans/loanApplicationsApi'

interface CollateralItem {
    id: number
    asset_type: string
    description: string | null
    estimated_value: number
    estimated_value_formatted: string
    notes: string | null
    created_at: string
}

const props = defineProps<{
    applicationId: number
    /** Show add/remove controls — false on read-only pages */
    editable?: boolean
}>()

const emit = defineEmits<{ (e: 'updated'): void }>()

const items       = ref<CollateralItem[]>([])
const totalValue  = ref(0)
const totalFmt    = ref('')
const listLoading = ref(false)
const removing    = ref<number | null>(null)

// ─── Add form ─────────────────────────────────────────────────────────────────
const showForm       = ref(false)
const adding         = ref(false)
const assetType      = ref('')
const description    = ref('')
const estimatedValue = ref('')
const notes          = ref('')
const formErrors     = ref<Record<string, string>>({})

const ASSET_TYPES = ['Land', 'Building', 'Vehicle', 'Equipment', 'Livestock', 'Inventory', 'Jewellery', 'Other']

async function load() {
    listLoading.value = true
    try {
        const res = await loanApplicationsApi.listCollaterals(props.applicationId)
        items.value      = res.data.data ?? []
        totalValue.value = res.data.total_value ?? 0
        totalFmt.value   = res.data.total_value_formatted ?? ''
    } catch {
        toast.error('Failed to load collateral items.')
    } finally {
        listLoading.value = false
    }
}

async function remove(id: number) {
    removing.value = id
    try {
        await loanApplicationsApi.removeCollateral(props.applicationId, id)
        toast.success('Collateral item removed.')
        await load()
        emit('updated')
    } catch {
        toast.error('Failed to remove collateral item.')
    } finally {
        removing.value = null
    }
}

function resetForm() {
    assetType.value      = ''
    description.value    = ''
    estimatedValue.value = ''
    notes.value          = ''
    formErrors.value     = {}
    showForm.value       = false
}

async function submit() {
    formErrors.value = {}
    if (!assetType.value) {
        formErrors.value.asset_type = 'Asset type is required.'
        return
    }
    const val = parseFloat(estimatedValue.value)
    if (isNaN(val) || val < 0) {
        formErrors.value.estimated_value = 'Enter a valid estimated value.'
        return
    }
    adding.value = true
    try {
        await loanApplicationsApi.addCollateral(props.applicationId, {
            asset_type:      assetType.value,
            description:     description.value || null,
            estimated_value: val,
            notes:           notes.value || null,
        })
        toast.success('Collateral item added.')
        resetForm()
        await load()
        emit('updated')
    } catch (err: any) {
        const errs = err?.response?.data?.errors
        if (errs) {
            formErrors.value = Object.fromEntries(
                Object.entries(errs).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
            ) as Record<string, string>
        } else {
            toast.error('Failed to add collateral item.')
        }
    } finally {
        adding.value = false
    }
}

const coverageClass = computed(() => {
    if (items.value.length === 0) return ''
    return 'text-emerald-700 dark:text-emerald-400'
})

onMounted(load)
</script>

<template>
    <div>
        <!-- Header -->
        <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <Shield class="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Collateral & Securities</h3>
            </div>
            <div class="flex items-center gap-3">
                <span v-if="items.length > 0" class="text-xs text-neutral-500 dark:text-neutral-400">
                    Total:
                    <span :class="coverageClass" class="font-semibold">{{ totalFmt }}</span>
                </span>
                <button
                    v-if="editable"
                    class="flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    @click="showForm = !showForm"
                >
                    <PlusCircle class="h-3.5 w-3.5" />
                    Add
                </button>
            </div>
        </div>

        <!-- Add form -->
        <div v-if="showForm && editable" class="mb-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/40">
            <p class="mb-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300">New Collateral Item</p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <label class="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">Asset Type <span class="text-red-500">*</span></label>
                    <select
                        v-model="assetType"
                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    >
                        <option value="">Select type…</option>
                        <option v-for="t in ASSET_TYPES" :key="t" :value="t">{{ t }}</option>
                    </select>
                    <p v-if="formErrors.asset_type" class="mt-1 text-xs text-red-500">{{ formErrors.asset_type }}</p>
                </div>
                <div>
                    <label class="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">Estimated Value <span class="text-red-500">*</span></label>
                    <input
                        v-model="estimatedValue"
                        type="number"
                        min="0"
                        placeholder="0.00"
                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    />
                    <p v-if="formErrors.estimated_value" class="mt-1 text-xs text-red-500">{{ formErrors.estimated_value }}</p>
                </div>
                <div class="sm:col-span-2">
                    <label class="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">Description</label>
                    <input
                        v-model="description"
                        type="text"
                        placeholder="e.g. 1/4 acre plot in Nakuru"
                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    />
                </div>
                <div class="sm:col-span-2">
                    <label class="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">Notes</label>
                    <textarea
                        v-model="notes"
                        rows="2"
                        placeholder="Additional notes…"
                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    />
                </div>
            </div>
            <div class="mt-3 flex justify-end gap-2">
                <button
                    class="rounded-lg px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    @click="resetForm"
                >Cancel</button>
                <button
                    :disabled="adding"
                    class="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                    @click="submit"
                >
                    <Loader2 v-if="adding" class="h-3 w-3 animate-spin" />
                    Save
                </button>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="listLoading" class="flex items-center justify-center py-6">
            <Loader2 class="h-5 w-5 animate-spin text-neutral-300 dark:text-neutral-600" />
        </div>

        <!-- Empty state -->
        <div
            v-else-if="items.length === 0"
            class="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 py-6 text-center dark:border-neutral-700"
        >
            <Shield class="mb-2 h-5 w-5 text-neutral-300 dark:text-neutral-600" />
            <p class="text-sm text-neutral-500 dark:text-neutral-400">No collateral recorded.</p>
            <p v-if="!editable" class="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">Collateral can be added when editing the application.</p>
        </div>

        <!-- Items list -->
        <ul v-else class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <li
                v-for="item in items"
                :key="item.id"
                class="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
                <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div class="flex items-center gap-2">
                        <span class="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {{ item.asset_type }}
                        </span>
                        <span class="text-sm font-semibold text-neutral-900 dark:text-white">
                            {{ item.estimated_value_formatted }}
                        </span>
                    </div>
                    <p v-if="item.description" class="truncate text-xs text-neutral-500 dark:text-neutral-400">{{ item.description }}</p>
                    <p v-if="item.notes" class="text-xs text-neutral-400 dark:text-neutral-500">{{ item.notes }}</p>
                </div>
                <button
                    v-if="editable"
                    :disabled="removing === item.id"
                    class="shrink-0 rounded-lg p-1.5 text-red-400 hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-900/20"
                    @click="remove(item.id)"
                >
                    <Loader2 v-if="removing === item.id" class="h-3.5 w-3.5 animate-spin" />
                    <Trash2 v-else class="h-3.5 w-3.5" />
                </button>
            </li>
        </ul>
    </div>
</template>
