<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Trash2, Shield, Check, X, Eye } from 'lucide-vue-next'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import { ConfirmDialog } from '@/Global'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import { computed } from 'vue'

interface CollateralItem {
    asset_type: string
    description: string
    estimated_value: number | null
    notes: string
    proof_document?: File | null
    proof_preview?: string | null
}

const props = defineProps<{
    selectedProduct: any
    selectedMember: any
    requestedAmount: number | null
}>()

const items = defineModel<CollateralItem[]>({ default: () => [] })

const { formatAmount } = useLoanApplicationHelpers()

const assetTypes = ['Land', 'Building', 'Vehicle', 'Equipment', 'Savings/Deposit', 'Other']
const assetTypeOptions = computed(() => assetTypes.map(t => ({ id: t, name: t })))

const totalRequired = computed(() => {
    const amt = props.requestedAmount || 0
    const pct = props.selectedProduct?.security_value_percentage || 0
    return (amt * pct) / 100
})

const totalProvided = computed(() =>
    items.value.reduce((sum, item) => sum + (item.estimated_value || 0), 0)
)

const securityGap = computed(() => Math.max(0, totalRequired.value - totalProvided.value))

const isSecured = computed(() => {
    const noValueRequired = totalRequired.value <= 0
    const thresholdCount = props.selectedProduct?.max_securities || 0
    const noCountRequired = thresholdCount <= 0
    
    if (noValueRequired && noCountRequired) return true

    const valueSecured = noValueRequired || totalProvided.value >= totalRequired.value
    const countSecured = noCountRequired || items.value.length >= thresholdCount
    
    return valueSecured && countSecured
})

defineExpose({ isSecured })

// Modal
const modalOpen   = ref(false)
const newItem     = ref<CollateralItem>({ asset_type: '', description: '', estimated_value: null, notes: '', proof_document: null, proof_preview: null })

// Document Preview Modal
const previewModalOpen = ref(false)
const previewFileUrl   = ref('')
const previewFileType  = ref('')

const formattedAmount = computed({
    get: () => {
        if (newItem.value.estimated_value == null) return ''
        return newItem.value.estimated_value.toLocaleString('en-US')
    },
    set: (val: string) => {
        const numericStr = val.replace(/[^0-9.]/g, '')
        const num = parseFloat(numericStr)
        newItem.value.estimated_value = isNaN(num) ? null : num
    }
})

function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
        const file = target.files[0]
        newItem.value.proof_document = file
        if (file.type.startsWith('image/')) {
            newItem.value.proof_preview = URL.createObjectURL(file)
        } else {
            newItem.value.proof_preview = null
        }
    } else {
        newItem.value.proof_document = null
        newItem.value.proof_preview = null
    }
}

function previewDocument(file: File) {
    if (file) {
        previewFileUrl.value = URL.createObjectURL(file)
        previewFileType.value = file.type
        previewModalOpen.value = true
    }
}

function closePreviewModal() {
    previewModalOpen.value = false
    setTimeout(() => {
        if (previewFileUrl.value) {
            URL.revokeObjectURL(previewFileUrl.value)
        }
        previewFileUrl.value = ''
        previewFileType.value = ''
    }, 200)
}

function openModal() {
    newItem.value = { asset_type: '', description: '', estimated_value: null, notes: '', proof_document: null, proof_preview: null }
    modalOpen.value = true
}

function handleAssetTypeChange(val: string) {
    newItem.value.asset_type = val
    if (val === 'Savings/Deposit' && props.selectedMember?.savings_account) {
        newItem.value.estimated_value = props.selectedMember.savings_account.balance
    }
}

function addItem() {
    if (!newItem.value.asset_type || !newItem.value.estimated_value) return
    items.value = [...items.value, { ...newItem.value }]
    modalOpen.value = false
}

const itemToDeleteIdx = ref<number | null>(null)

function promptRemoveItem(idx: number) {
    itemToDeleteIdx.value = idx
}

function confirmRemoveItem() {
    if (itemToDeleteIdx.value !== null) {
        items.value = items.value.filter((_, i) => i !== itemToDeleteIdx.value)
        itemToDeleteIdx.value = null
    }
}
</script>

<template>
    <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="mb-5 flex items-center justify-between font-bold">
            <div class="flex items-center gap-2">
                <Shield class="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                <h2 class="text-base font-semibold text-neutral-900 dark:text-white uppercase tracking-tight">Security Coverage</h2>
                <span class="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                    Required: {{ selectedProduct?.security_value_percentage }}%
                </span>
                <span v-if="selectedProduct?.max_securities" class="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium" :class="items.length >= selectedProduct.max_securities ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-amber-500 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400'">
                    Count: {{ items.length }} / {{ selectedProduct.max_securities }}
                </span>
            </div>
            <button type="button" class="flex items-center gap-1.5 rounded-lg bg-nfuko-primary/10 px-3 py-1.5 text-xs font-bold text-nfuko-primary hover:bg-nfuko-primary/20 transition-colors" @click="openModal">
                <Plus class="h-3.5 w-3.5" /> Add Security
            </button>
        </div>

        <!-- Security status summary -->
        <div v-if="totalRequired > 0" class="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div class="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                <p class="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Required Security ({{ selectedProduct?.security_value_percentage }}%)</p>
                <p class="text-lg font-bold text-neutral-900 dark:text-white">{{ formatAmount(totalRequired) }}</p>
            </div>
            <div class="rounded-xl border p-4" :class="isSecured ? 'border-emerald-100 bg-emerald-50/30' : 'border-amber-100 bg-amber-50/30'">
                <p class="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Total Security Provided</p>
                <div class="flex items-end justify-between">
                    <p class="text-lg font-bold" :class="isSecured ? 'text-emerald-600' : 'text-amber-600'">{{ formatAmount(totalProvided) }}</p>
                    <p v-if="!isSecured" class="text-[11px] font-bold text-amber-600">Gap: {{ formatAmount(securityGap) }}</p>
                    <div v-else class="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <Check class="h-3 w-3" /> Fully Secured
                    </div>
                </div>
            </div>
        </div>

        <!-- Items list -->
        <div v-if="items.length" class="space-y-4">
            <div v-for="(item, idx) in items" :key="idx"
                class="flex items-center justify-between rounded-xl border border-neutral-100 bg-white p-4 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <img v-if="item.proof_preview" :src="item.proof_preview" class="h-10 w-12 flex-shrink-0 cursor-pointer rounded-lg bg-neutral-100 object-cover border border-neutral-200 dark:border-neutral-700 hover:opacity-80 transition-opacity" @click="previewDocument(item.proof_document!)" title="Click to view full image" />
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600 dark:bg-neutral-800 font-mono">{{ item.asset_type }}</span>
                            <p class="truncate text-sm font-semibold text-neutral-900 dark:text-white">{{ item.description }}</p>
                        </div>
                        <p v-if="item.notes" class="text-xs text-neutral-500 line-clamp-1">{{ item.notes }}</p>
                    </div>
                </div>
                <div class="ml-4 flex items-center gap-4">
                    <p class="text-sm font-bold text-neutral-900 dark:text-white">{{ formatAmount(item.estimated_value) }}</p>
                    <div class="flex items-center gap-1">
                        <button v-if="item.proof_document" type="button" class="rounded-lg p-1.5 text-neutral-400 hover:bg-sky-50 hover:text-sky-500 dark:hover:bg-sky-900/20 transition-colors" @click="previewDocument(item.proof_document)" title="View Proof">
                            <Eye class="h-4 w-4" />
                        </button>
                        <button type="button" class="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors" @click="promptRemoveItem(idx)">
                            <Trash2 class="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div v-else-if="!totalRequired" class="flex flex-col items-center justify-center py-6 text-center border border-dashed border-neutral-100 rounded-xl dark:border-neutral-800">
            <Shield class="mb-2 h-5 w-5 text-neutral-200 dark:text-neutral-700" />
            <p class="text-xs text-neutral-400">Security / Collateral is optional for this product.</p>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-neutral-100 rounded-3xl dark:border-neutral-800">
            <Shield class="mb-3 h-10 w-10 text-neutral-100 dark:text-neutral-800" />
            <p class="text-sm text-neutral-400 font-medium">No collateral or securities added yet.</p>
            <p class="text-xs text-neutral-400 mt-1">Required for this product to proceed.</p>
        </div>
    </div>

    <!-- Add Collateral Modal -->
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
        <div v-if="modalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div class="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" @click="modalOpen = false" />
            <div class="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-950 dark:border dark:border-neutral-800">
                <div class="mb-6 flex items-center justify-between">
                    <h3 class="text-xl font-bold text-neutral-900 dark:text-white">Add New Security</h3>
                    <button class="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 transition-colors" @click="modalOpen = false">
                        <X class="h-6 w-6" />
                    </button>
                </div>
                <div class="space-y-5">
                    <div>
                        <label class="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">Asset Type</label>
                        <SearchableSelect
                            v-model="newItem.asset_type"
                            :options="assetTypeOptions"
                            placeholder="Select asset type..."
                            @update:model-value="handleAssetTypeChange"
                        />
                    </div>
                    <div>
                        <label class="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">Name of Security</label>
                        <input v-model="newItem.description" type="text" placeholder="e.g. Title deed ref. LR1234, 2019 Toyota Corolla..."
                            class="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <p class="mt-1 text-xs text-neutral-400">Briefly identify the asset being provided.</p>
                    </div>
                    <div>
                        <label class="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">Amount Value</label>
                        <input v-model="formattedAmount" type="text" placeholder="0.00"
                            class="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                    </div>
                    <div>
                        <label class="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">Proof of Document</label>
                        <input type="file" accept="image/*,.pdf" @change="handleFileUpload"
                            class="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-nfuko-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-nfuko-primary hover:file:bg-nfuko-primary/20 focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        <p class="mt-1 text-xs text-neutral-400">Upload a clear image or PDF of the security document.</p>
                    </div>
                    <div>
                        <label class="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">Description / Notes</label>
                        <textarea v-model="newItem.notes" rows="3" placeholder="Additional details, condition, location..."
                            class="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                    </div>
                </div>
                <div class="mt-8 flex gap-3">
                    <button type="button" class="flex-1 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors" @click="modalOpen = false">Cancel</button>
                    <button type="button" :disabled="!newItem.asset_type || !newItem.estimated_value"
                        class="flex-1 rounded-2xl bg-nfuko-primary px-4 py-3 text-sm font-bold text-white hover:bg-nfuko-primary/90 transition-colors disabled:opacity-50"
                        @click="addItem">Add Security</button>
                </div>
            </div>
        </div>
    </Transition>

    <!-- Document Preview Modal -->
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
        <div v-if="previewModalOpen" class="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <div class="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm" @click="closePreviewModal" />
            <div class="relative w-full max-w-xl flex flex-col items-center justify-center pointer-events-none">
                <button type="button" class="pointer-events-auto absolute -top-12 right-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors" @click="closePreviewModal">
                    <X class="h-6 w-6" />
                </button>
                <div class="pointer-events-auto w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
                    <img v-if="previewFileType.startsWith('image/')" :src="previewFileUrl" class="max-h-[65vh] w-full object-contain" />
                    <iframe v-else-if="previewFileType === 'application/pdf'" :src="previewFileUrl" class="h-[65vh] w-full border-0 bg-white"></iframe>
                    <div v-else class="flex h-[40vh] items-center justify-center bg-white dark:bg-neutral-950 rounded-2xl">
                        <p class="text-neutral-500 font-medium">Preview not available for this file type.</p>
                    </div>
                </div>
            </div>
        </div>
    </Transition>

    <ConfirmDialog
        :show="itemToDeleteIdx !== null"
        type="delete"
        title="Remove Security Item"
        @confirm="confirmRemoveItem"
        @cancel="itemToDeleteIdx = null"
        @update:show="val => { if (!val) itemToDeleteIdx = null }"
    >
        <template #message>
            Are you sure you want to remove this security item?
        </template>
    </ConfirmDialog>
</template>
