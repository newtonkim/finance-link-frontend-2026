<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Upload, Trash2, FileText, CheckCircle, Clock, XCircle, Loader2, AlertTriangle } from 'lucide-vue-next'
import { loanApplicationsApi } from '../../../apis/loans/loanApplicationsApi'

interface RequiredDoc {
    slug: string
    label: string
    required: boolean
    uploaded: boolean
    stage?: 'draft' | 'submission' | 'review' | 'approval' | 'disbursement'
}

interface UploadedDoc {
    id: number
    document_type: string
    document_label: string
    original_name: string
    url: string | null
    mime_type: string | null
    file_size: number | null
    status: 'pending' | 'verified' | 'rejected'
    notes: string | null
    created_at: string
}

const props = defineProps<{
    applicationId: number
    editable?: boolean
}>()

const emit = defineEmits<{
    updated: []
}>()

// ─── State ────────────────────────────────────────────────────────────────────
const documents    = ref<UploadedDoc[]>([])
const required     = ref<RequiredDoc[]>([])
const listLoading  = ref(false)
const uploading    = ref<string | null>(null)   // slug being uploaded
const removing     = ref<number | null>(null)   // doc id being removed
const fileInputs   = ref<Record<string, HTMLInputElement | null>>({})

// ─── Load ─────────────────────────────────────────────────────────────────────
async function load() {
    listLoading.value = true
    try {
        const res      = await loanApplicationsApi.listDocuments(props.applicationId)
        documents.value = res.data?.data ?? []
        required.value  = res.data?.required ?? []
    } catch {
        toast.error('Failed to load documents.')
    } finally {
        listLoading.value = false
    }
}

// ─── Upload ───────────────────────────────────────────────────────────────────
function triggerUpload(slug: string) {
    fileInputs.value[slug]?.click()
}

async function onFileChange(event: Event, slug: string) {
    const input = event.target as HTMLInputElement
    const file  = input.files?.[0]
    if (!file) return

    // Reset input so same file can be re-selected after deletion
    input.value = ''

    if (file.size > 10 * 1024 * 1024) {
        toast.error('File must not exceed 10 MB.')
        return
    }

    uploading.value = slug
    try {
        const fd = new FormData()
        fd.append('document_type', slug)
        fd.append('file', file)

        await loanApplicationsApi.uploadDocument(props.applicationId, fd)
        toast.success('Document uploaded.')
        await load()
        emit('updated')
    } catch (err: any) {
        const msg = err?.response?.data?.errors?.file?.[0]
            ?? err?.response?.data?.message
            ?? 'Upload failed.'
        toast.error(msg)
    } finally {
        uploading.value = null
    }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
async function removeDocument(doc: UploadedDoc) {
    removing.value = doc.id
    try {
        await loanApplicationsApi.deleteDocument(props.applicationId, doc.id)
        toast.success('Document removed.')
        await load()
        emit('updated')
    } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to remove document.')
    } finally {
        removing.value = null
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function docsForSlug(slug: string): UploadedDoc[] {
    return documents.value.filter(d => d.document_type === slug)
}

function stageLabel(stage: RequiredDoc['stage']): string {
    switch (stage) {
        case 'draft': return 'Draft'
        case 'submission': return 'Submission'
        case 'review': return 'Review'
        case 'approval': return 'Approval'
        case 'disbursement': return 'Disbursement'
        default: return 'Submission'
    }
}

function formatSize(bytes: number | null): string {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const statusIcon = { pending: Clock, verified: CheckCircle, rejected: XCircle } as const
const statusClass = {
    pending:  'text-amber-500 dark:text-amber-400',
    verified: 'text-emerald-600 dark:text-emerald-400',
    rejected: 'text-red-500 dark:text-red-400',
} as const

// Extra documents (uploaded against types not in the required list)
const extraDocs = computed(() =>
    documents.value.filter(d => !required.value.some(r => r.slug === d.document_type))
)

const allRequiredUploaded = computed(() => required.value.every(r => r.uploaded))

watch(() => props.applicationId, load, { immediate: true })
</script>

<template>
    <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="mb-4 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Documents</h3>
            <span v-if="required.length" :class="[
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                allRequiredUploaded
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
            ]">
                <CheckCircle v-if="allRequiredUploaded" class="h-3 w-3" />
                <AlertTriangle v-else class="h-3 w-3" />
                {{ required.filter(r => r.uploaded).length }} / {{ required.length }} required
            </span>
        </div>

        <!-- Loading skeleton -->
        <div v-if="listLoading" class="space-y-2">
            <div v-for="n in 3" :key="n" class="h-14 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
        </div>

        <template v-else>
            <!-- Required documents -->
            <div v-if="required.length" class="space-y-3">
                <div v-for="req in required" :key="req.slug">
                    <!-- Type header -->
                    <div class="flex items-center justify-between gap-2">
                        <p class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                            {{ req.label }}
                            <span class="ml-1 text-red-400">*</span>
                            <span class="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                                {{ stageLabel(req.stage) }}
                            </span>
                        </p>
                        <!-- Upload button (editable) -->
                        <button v-if="editable"
                            :disabled="uploading === req.slug"
                            class="flex items-center gap-1 rounded-lg border border-dashed border-neutral-300 px-2.5 py-1 text-xs text-neutral-500 transition hover:border-nfuko-primary hover:text-nfuko-primary disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-400"
                            @click="triggerUpload(req.slug)">
                            <Loader2 v-if="uploading === req.slug" class="h-3 w-3 animate-spin" />
                            <Upload v-else class="h-3 w-3" />
                            {{ uploading === req.slug ? 'Uploading…' : 'Upload' }}
                        </button>
                        <input
                            :ref="(el) => { fileInputs[req.slug] = el as HTMLInputElement }"
                            type="file"
                            class="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                            @change="(e) => onFileChange(e, req.slug)"
                        />
                    </div>

                    <!-- Uploaded files for this type -->
                    <ul v-if="docsForSlug(req.slug).length" class="space-y-1.5">
                        <li v-for="doc in docsForSlug(req.slug)" :key="doc.id"
                            class="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800">
                            <FileText class="h-4 w-4 flex-shrink-0 text-neutral-400" />
                            <div class="min-w-0 flex-1">
                                <a v-if="doc.url" :href="doc.url" target="_blank"
                                    class="block truncate text-xs font-medium text-nfuko-primary hover:underline dark:text-bg-nfuko-yellow">
                                    {{ doc.original_name }}
                                </a>
                                <span v-else class="block truncate text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                    {{ doc.original_name }}
                                </span>
                                <p class="text-xs text-neutral-400">{{ formatSize(doc.file_size) }}</p>
                            </div>
                            <!-- Status -->
                            <component :is="statusIcon[doc.status]"
                                class="h-4 w-4 flex-shrink-0"
                                :class="statusClass[doc.status]" />
                            <!-- Delete -->
                            <button v-if="editable"
                                :disabled="removing === doc.id"
                                class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
                                @click="removeDocument(doc)">
                                <Loader2 v-if="removing === doc.id" class="h-3.5 w-3.5 animate-spin" />
                                <Trash2 v-else class="h-3.5 w-3.5" />
                            </button>
                        </li>
                    </ul>
                    <p v-else class="rounded-xl border border-dashed border-neutral-200 px-3 py-2 text-xs text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
                        Not yet uploaded
                    </p>
                </div>
            </div>

            <!-- Extra / ad-hoc documents -->
            <div v-if="extraDocs.length || editable" :class="required.length ? 'mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-800' : ''">
                <div class="mb-2 flex items-center justify-between gap-2">
                    <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400">Additional Documents</p>
                    <button v-if="editable"
                        :disabled="uploading === 'other'"
                        class="flex items-center gap-1 rounded-lg border border-dashed border-neutral-300 px-2.5 py-1 text-xs text-neutral-500 transition hover:border-nfuko-primary hover:text-nfuko-primary disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-400"
                        @click="triggerUpload('other')">
                        <Loader2 v-if="uploading === 'other'" class="h-3 w-3 animate-spin" />
                        <Upload v-else class="h-3 w-3" />
                        {{ uploading === 'other' ? 'Uploading…' : 'Upload' }}
                    </button>
                    <input
                        :ref="(el) => { fileInputs['other'] = el as HTMLInputElement }"
                        type="file"
                        class="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                        @change="(e) => onFileChange(e, 'other')"
                    />
                </div>
                <ul v-if="extraDocs.length" class="space-y-1.5">
                    <li v-for="doc in extraDocs" :key="doc.id"
                        class="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800">
                        <FileText class="h-4 w-4 flex-shrink-0 text-neutral-400" />
                        <div class="min-w-0 flex-1">
                            <a v-if="doc.url" :href="doc.url" target="_blank"
                                class="block truncate text-xs font-medium text-nfuko-primary hover:underline dark:text-bg-nfuko-yellow">
                                {{ doc.original_name }}
                            </a>
                            <span v-else class="block truncate text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                {{ doc.original_name }}
                            </span>
                            <p class="text-xs text-neutral-400">{{ doc.document_label }} · {{ formatSize(doc.file_size) }}</p>
                        </div>
                        <component :is="statusIcon[doc.status]"
                            class="h-4 w-4 flex-shrink-0"
                            :class="statusClass[doc.status]" />
                        <button v-if="editable"
                            :disabled="removing === doc.id"
                            class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
                            @click="removeDocument(doc)">
                            <Loader2 v-if="removing === doc.id" class="h-3.5 w-3.5 animate-spin" />
                            <Trash2 v-else class="h-3.5 w-3.5" />
                        </button>
                    </li>
                </ul>
                <p v-else-if="!required.length && !editable"
                    class="text-sm text-neutral-400 dark:text-neutral-500">
                    No documents uploaded.
                </p>
            </div>
        </template>
    </div>
</template>
