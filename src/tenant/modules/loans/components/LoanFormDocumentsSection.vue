<script setup lang="ts">
import { FileText, Upload, X, CheckCircle2, AlertCircle } from 'lucide-vue-next'
import { ref, computed } from 'vue'

interface DocumentFile {
    document_type_id: number
    name: string
    file: File | null
    is_required: boolean
}

const props = defineProps<{
    selectedProduct: any
}>()

const documents = defineModel<DocumentFile[]>({ default: () => [] })

// Initialize or update documents when product changes
const requiredDocs = computed(() => {
    return props.selectedProduct?.required_documents || []
})

// Sync documents array with requiredDocs
const syncDocuments = () => {
    const currentDocs = [...documents.value]
    const nextDocs: DocumentFile[] = requiredDocs.value.map((rd: any) => {
        const existing = currentDocs.find(d => d.document_type_id === rd.document_type_id)
        return {
            document_type_id: rd.document_type_id,
            name: rd.document_type?.name || 'Required Document',
            file: existing?.file || null,
            is_required: rd.is_required
        }
    })
    documents.value = nextDocs
}

// Watch for product changes implicitly via computed or parent re-render
import { watch } from 'vue'
watch(() => props.selectedProduct?.id, () => {
    syncDocuments()
}, { immediate: true })

function onFileChange(index: number, e: Event) {
    const target = e.target as HTMLInputElement
    if (target.files && target.files[0]) {
        documents.value[index].file = target.files[0]
    }
}

function removeFile(index: number) {
    documents.value[index].file = null
}

const allRequiredProvided = computed(() => {
    return documents.value
        .filter(d => d.is_required)
        .every(d => d.file !== null)
})

defineExpose({ allRequiredProvided })
</script>

<template>
    <div v-if="selectedProduct && requiredDocs.length > 0" 
         class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        
        <div class="mb-5 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <FileText class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                <h2 class="text-base font-semibold text-neutral-900 dark:text-white uppercase tracking-tight">Required Documents</h2>
            </div>
            <div v-if="allRequiredProvided" class="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/30">
                <CheckCircle2 class="h-3 w-3" /> All Required Attached
            </div>
            <div v-else class="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600 dark:bg-amber-950/30">
                <AlertCircle class="h-3 w-3" /> Missing Requirements
            </div>
        </div>

        <div class="grid gap-4">
            <div v-for="(doc, idx) in documents" :key="doc.document_type_id" 
                 class="relative flex flex-col gap-3 rounded-xl border border-neutral-100 p-4 transition-all hover:border-nfuko-primary/20 dark:border-neutral-800"
                 :class="doc.file ? 'bg-emerald-50/10 border-emerald-100' : 'bg-neutral-50/30'">
                
                <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-neutral-800">
                            <FileText class="h-5 w-5 text-neutral-400" />
                        </div>
                        <div>
                            <p class="text-sm font-bold text-neutral-900 dark:text-white">{{ doc.name }}</p>
                            <span v-if="doc.is_required" class="text-[10px] font-bold uppercase tracking-wider text-red-500">Required</span>
                            <span v-else class="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Optional</span>
                        </div>
                    </div>

                    <div v-if="doc.file" class="flex items-center gap-2">
                        <button type="button" @click="removeFile(idx)" 
                                class="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <X class="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <!-- Upload Area -->
                <div v-if="!doc.file" class="group relative">
                    <input type="file" 
                           class="absolute inset-0 z-10 cursor-pointer opacity-0"
                           @change="onFileChange(idx, $event)" />
                    <div class="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-200 py-3 text-xs font-medium text-neutral-500 transition-colors group-hover:border-nfuko-primary/40 group-hover:text-nfuko-primary dark:border-neutral-700">
                        <Upload class="h-3.5 w-3.5" />
                        Click to select or drag and drop
                    </div>
                </div>

                <!-- File Summary -->
                <div v-else class="flex items-center gap-2 rounded-lg bg-emerald-50/50 px-3 py-2 dark:bg-emerald-950/20">
                    <CheckCircle2 class="h-3.5 w-3.5 text-emerald-500" />
                    <span class="truncate text-xs font-medium text-emerald-700 dark:text-emerald-400">{{ doc.file.name }}</span>
                    <span class="ml-auto text-[10px] text-emerald-500">{{ (doc.file.size / 1024).toFixed(1) }} KB</span>
                </div>
            </div>
        </div>

        <p v-if="!allRequiredProvided" class="mt-4 text-center text-xs text-amber-500 font-medium">
            Please upload all required documents to proceed.
        </p>
    </div>
</template>
