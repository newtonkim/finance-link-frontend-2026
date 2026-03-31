<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Settings, Plus, Trash2, Save } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { tenantClient } from '../../../apis/tenantClient'

interface AmountTier {
    min: number | null
    max: number | null
    quorum_size: number | null
    approval_threshold: number | null
    unanimity: boolean
}

interface LoanProduct {
    id: number
    name: string
    code: string
}

interface ApprovalSetting {
    id?: number
    loan_product_id: number
    quorum_size: number
    approval_threshold: number
    amount_tiers: AmountTier[]
    abstention_timeout_hours: number
}

const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const loanProducts = ref<LoanProduct[]>([])
const settings = ref<ApprovalSetting[]>([])
const editingSetting = ref<ApprovalSetting | null>(null)
const showForm = ref(false)

async function loadData() {
    loading.value = true
    try {
        const [productsRes, settingsRes] = await Promise.all([
            tenantClient.get<{ data: LoanProduct[] }>('/loan-products'),
            tenantClient.get<{ data: ApprovalSetting[] }>('/loan-approval-settings'),
        ])
        loanProducts.value = productsRes.data.data
        settings.value = settingsRes.data.data
    } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to load settings.')
    } finally {
        loading.value = false
    }
}

function openCreateForm() {
    editingSetting.value = {
        loan_product_id: 0,
        quorum_size: 3,
        approval_threshold: 2,
        amount_tiers: [],
        abstention_timeout_hours: 48,
    }
    showForm.value = true
}

function openEditForm(setting: ApprovalSetting) {
    editingSetting.value = { ...setting, amount_tiers: [...(setting.amount_tiers || [])] }
    showForm.value = true
}

function addTier() {
    if (!editingSetting.value) return
    editingSetting.value.amount_tiers.push({
        min: null,
        max: null,
        quorum_size: null,
        approval_threshold: null,
        unanimity: false,
    })
}

function removeTier(index: number) {
    if (!editingSetting.value) return
    editingSetting.value.amount_tiers.splice(index, 1)
}

async function saveSetting() {
    if (!editingSetting.value) return
    if (!editingSetting.value.loan_product_id) {
        toast.error('Please select a loan product.')
        return
    }
    saving.value = true
    try {
        if (editingSetting.value.id) {
            await tenantClient.put(`/loan-approval-settings/${editingSetting.value.id}`, editingSetting.value)
            toast.success('Setting updated.')
        } else {
            await tenantClient.post('/loan-approval-settings', editingSetting.value)
            toast.success('Setting created.')
        }
        showForm.value = false
        await loadData()
    } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to save setting.')
    } finally {
        saving.value = false
    }
}

async function deleteSetting(id: number) {
    if (!confirm('Are you sure you want to delete this setting?')) return
    try {
        await tenantClient.delete(`/loan-approval-settings/${id}`)
        toast.success('Setting deleted.')
        await loadData()
    } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to delete setting.')
    }
}

function getProductName(productId: number) {
    return loanProducts.value.find(p => p.id === productId)?.name ?? 'Unknown'
}

onMounted(loadData)
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 bg-[#f8faf9] p-4 md:p-6 dark:bg-[#0a0a0a]">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <button
                    class="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    @click="router.back()">
                    <ArrowLeft class="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                </button>
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <Settings class="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Loan Approval Settings</h1>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">Configure committee voting rules per loan product.</p>
                </div>
            </div>
            <button
                class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                @click="openCreateForm">
                <Plus class="h-4 w-4" />
                Add Setting
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-20 text-sm text-neutral-400">Loading…</div>

        <!-- Settings list -->
        <div v-else-if="settings.length" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div v-for="setting in settings" :key="setting.id"
                class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div class="mb-3 flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">{{ getProductName(setting.loan_product_id) }}</h3>
                    <div class="flex gap-1">
                        <button class="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
                            @click="openEditForm(setting)">
                            <Settings class="h-3.5 w-3.5" />
                        </button>
                        <button class="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                            @click="deleteSetting(setting.id!)">
                            <Trash2 class="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
                <dl class="space-y-2 text-xs">
                    <div class="flex justify-between">
                        <dt class="text-neutral-500 dark:text-neutral-400">Quorum Size</dt>
                        <dd class="font-medium text-neutral-900 dark:text-white">{{ setting.quorum_size }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-neutral-500 dark:text-neutral-400">Approval Threshold</dt>
                        <dd class="font-medium text-neutral-900 dark:text-white">{{ setting.approval_threshold }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-neutral-500 dark:text-neutral-400">Abstention Timeout</dt>
                        <dd class="font-medium text-neutral-900 dark:text-white">{{ setting.abstention_timeout_hours }}h</dd>
                    </div>
                    <div v-if="setting.amount_tiers?.length" class="flex justify-between">
                        <dt class="text-neutral-500 dark:text-neutral-400">Amount Tiers</dt>
                        <dd class="font-medium text-neutral-900 dark:text-white">{{ setting.amount_tiers.length }} tier(s)</dd>
                    </div>
                </dl>
            </div>
        </div>

        <!-- Empty state -->
        <div v-else class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 py-16 dark:border-neutral-700">
            <Settings class="mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
            <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">No approval settings configured</p>
            <p class="mt-1 text-xs text-neutral-400">Add settings to configure committee voting rules per loan product.</p>
        </div>

        <!-- Form modal -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showForm && editingSetting"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                @mousedown.self="showForm = false">
                <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95"
                    enter-to-class="opacity-100 scale-100" appear>
                    <div class="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                        <div class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                                <Settings class="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">
                                    {{ editingSetting.id ? 'Edit' : 'Create' }} Approval Setting
                                </h3>
                                <p class="text-xs text-neutral-500">Configure voting rules for a loan product.</p>
                            </div>
                        </div>
                        <div class="space-y-4 px-6 py-5">
                            <!-- Loan Product -->
                            <div>
                                <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Loan Product <span class="text-red-400">*</span></label>
                                <select v-model="editingSetting.loan_product_id"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                                    <option :value="0" disabled>Select a product…</option>
                                    <option v-for="product in loanProducts" :key="product.id" :value="product.id">
                                        {{ product.name }} ({{ product.code }})
                                    </option>
                                </select>
                            </div>

                            <!-- Quorum & Threshold -->
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Quorum Size</label>
                                    <input v-model.number="editingSetting.quorum_size" type="number" min="1"
                                        class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Approval Threshold</label>
                                    <input v-model.number="editingSetting.approval_threshold" type="number" min="1"
                                        class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                </div>
                            </div>

                            <!-- Abstention Timeout -->
                            <div>
                                <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Abstention Timeout (hours)</label>
                                <input v-model.number="editingSetting.abstention_timeout_hours" type="number" min="1"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                            </div>

                            <!-- Amount Tiers -->
                            <div>
                                <div class="mb-2 flex items-center justify-between">
                                    <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Amount Tiers (optional)</label>
                                    <button type="button"
                                        class="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-nfuko-primary hover:bg-nfuko-primary/10"
                                        @click="addTier">
                                        <Plus class="h-3 w-3" /> Add Tier
                                    </button>
                                </div>
                                <div v-if="editingSetting.amount_tiers.length" class="space-y-3">
                                    <div v-for="(tier, idx) in editingSetting.amount_tiers" :key="idx"
                                        class="rounded-xl border border-neutral-100 p-3 dark:border-neutral-800">
                                        <div class="mb-2 flex items-center justify-between">
                                            <span class="text-xs font-medium text-neutral-500">Tier {{ idx + 1 }}</span>
                                            <button type="button" class="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                                                @click="removeTier(idx)">
                                                <Trash2 class="h-3 w-3" />
                                            </button>
                                        </div>
                                        <div class="grid grid-cols-2 gap-2">
                                            <div>
                                                <label class="text-[10px] text-neutral-500">Min Amount</label>
                                                <input v-model.number="tier.min" type="number" min="0" placeholder="0"
                                                    class="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                            </div>
                                            <div>
                                                <label class="text-[10px] text-neutral-500">Max Amount</label>
                                                <input v-model.number="tier.max" type="number" min="0" placeholder="No limit"
                                                    class="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                            </div>
                                            <div>
                                                <label class="text-[10px] text-neutral-500">Quorum</label>
                                                <input v-model.number="tier.quorum_size" type="number" min="1" placeholder="Default"
                                                    class="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                            </div>
                                            <div>
                                                <label class="text-[10px] text-neutral-500">Threshold</label>
                                                <input v-model.number="tier.approval_threshold" type="number" min="1" placeholder="Default"
                                                    class="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                            </div>
                                        </div>
                                        <label class="mt-2 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                                            <input type="checkbox" v-model="tier.unanimity" class="rounded" />
                                            Require unanimity
                                        </label>
                                    </div>
                                </div>
                                <p v-else class="text-xs text-neutral-400">No amount tiers configured. Default quorum and threshold will apply to all amounts.</p>
                            </div>
                        </div>
                        <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                @click="showForm = false">Cancel</button>
                            <button :disabled="saving"
                                class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                                @click="saveSetting">
                                <Save class="h-4 w-4" />
                                {{ saving ? 'Saving…' : 'Save Setting' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </div>
</template>
