<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import {
  Upload,
  Trash2,
  FileText,
  Pencil,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Eye,
  X,
} from 'lucide-vue-next'
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
  currentStage?: string
}>()

const emit = defineEmits<{
  updated: []
  'status-change': [hasMissing: boolean]
}>()

// ─── State ────────────────────────────────────────────────────────────────────
const documents = ref<UploadedDoc[]>([])
const required = ref<RequiredDoc[]>([])
const listLoading = ref(false)
const uploading = ref<string | null>(null) // slug being uploaded
const removing = ref<number | null>(null) // doc id being removed
const fileInputs = ref<Record<string, HTMLInputElement | null>>({})

// ─── Add-document modal (all uploads go through this) ────────────────────────
const addModalOpen = ref(false)
const addForm = ref({ slug: '', name: '', description: '', file: null as File | null })
const addFormError = ref('')

function openAddModal(slug: string, label = '') {
  addForm.value = { slug, name: label, description: '', file: null }
  addFormError.value = ''
  addModalOpen.value = true
}

function onAddFileChange(e: Event) {
  addForm.value.file = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function submitAddDocument() {
  if (!addForm.value.name.trim()) { addFormError.value = 'Name is required.'; return }
  if (!addForm.value.file)        { addFormError.value = 'Please choose a file.'; return }
  if (addForm.value.file.size > 10 * 1024 * 1024) { addFormError.value = 'File must not exceed 10 MB.'; return }

  addFormError.value = ''
  uploading.value = addForm.value.slug
  try {
    const fd = new FormData()
    fd.append('document_type', addForm.value.slug)
    fd.append('name', addForm.value.name.trim())
    fd.append('description', addForm.value.description.trim())
    fd.append('file', addForm.value.file)
    await loanApplicationsApi.uploadDocument(props.applicationId, fd)
    toast.success('Document uploaded.')
    addModalOpen.value = false
    await load()
    emit('updated')
  } catch (err: any) {
    addFormError.value =
      err?.response?.data?.errors?.file?.[0] ?? err?.response?.data?.message ?? 'Upload failed.'
  } finally {
    uploading.value = null
  }
}

// ─── Edit-document modal ─────────────────────────────────────────────────────
const editModalOpen = ref(false)
const editingDoc = ref<UploadedDoc | null>(null)
const editForm = ref({ name: '', description: '', file: null as File | null })
const editFormError = ref('')
const editSaving = ref(false)

function openEditModal(doc: UploadedDoc) {
  editingDoc.value = doc
  editForm.value = { name: doc.document_label, description: doc.notes ?? '', file: null }
  editFormError.value = ''
  editModalOpen.value = true
}

function onEditFileChange(e: Event) {
  editForm.value.file = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function submitEditDocument() {
  if (!editForm.value.name.trim()) { editFormError.value = 'Name is required.'; return }
  if (editForm.value.file && editForm.value.file.size > 10 * 1024 * 1024) {
    editFormError.value = 'File must not exceed 10 MB.'
    return
  }

  editFormError.value = ''
  editSaving.value = true
  try {
    const doc = editingDoc.value!
    if (editForm.value.file) {
      // Replace file: delete old, upload new with updated label
      await loanApplicationsApi.deleteDocument(props.applicationId, doc.id)
      const fd = new FormData()
      fd.append('document_type', doc.document_type)
      fd.append('name', editForm.value.name.trim())
      fd.append('description', editForm.value.description.trim())
      fd.append('file', editForm.value.file)
      await loanApplicationsApi.uploadDocument(props.applicationId, fd)
    } else {
      // Label/notes only — PATCH
      await loanApplicationsApi.updateDocument(props.applicationId, doc.id, {
        name: editForm.value.name.trim(),
        notes: editForm.value.description.trim() || undefined,
      })
    }
    toast.success('Document updated.')
    editModalOpen.value = false
    await load()
    emit('updated')
  } catch (err: any) {
    editFormError.value =
      err?.response?.data?.errors?.name?.[0] ??
      err?.response?.data?.errors?.file?.[0] ??
      err?.response?.data?.message ??
      'Update failed.'
  } finally {
    editSaving.value = false
  }
}

// ─── Load ─────────────────────────────────────────────────────────────────────
async function load() {
  listLoading.value = true
  try {
    const res = await loanApplicationsApi.listDocuments(props.applicationId)
    documents.value = res.data?.data ?? []
    required.value = res.data?.required ?? []
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
  const file = input.files?.[0]
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
    const msg =
      err?.response?.data?.errors?.file?.[0] ?? err?.response?.data?.message ?? 'Upload failed.'
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

// ─── Document preview modal ───────────────────────────────────────────────────
const viewing = ref<number | null>(null)
const previewDoc = ref<UploadedDoc | null>(null)
const previewBlobUrl = ref<string | null>(null)

function isImage(mime: string | null) {
  return !!mime && mime.startsWith('image/')
}
function isPdf(mime: string | null) {
  return mime === 'application/pdf'
}

async function viewDocument(doc: UploadedDoc) {
  viewing.value = doc.id
  try {
    const res = await loanApplicationsApi.downloadDocument(props.applicationId, doc.id)
    const blob: Blob = res.data
    const url = URL.createObjectURL(blob)
    previewBlobUrl.value = url
    previewDoc.value = doc
  } catch {
    toast.error('Failed to load document.')
  } finally {
    viewing.value = null
  }
}

function closePreview() {
  if (previewBlobUrl.value) {
    URL.revokeObjectURL(previewBlobUrl.value)
    previewBlobUrl.value = null
  }
  previewDoc.value = null
}

function docsForSlug(slug: string): UploadedDoc[] {
  return documents.value.filter((d) => d.document_type === slug)
}

function stageLabel(stage: RequiredDoc['stage']): string {
  switch (stage) {
    case 'draft':
      return 'Draft'
    case 'submission':
      return 'Submission'
    case 'review':
      return 'Review'
    case 'approval':
      return 'Approval'
    case 'disbursement':
      return 'Disbursement'
    default:
      return 'Submission'
  }
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Extra documents (uploaded against types not in the required list)
const extraDocs = computed(() =>
  documents.value.filter((d) => !required.value.some((r) => r.slug === d.document_type)),
)

const allRequiredUploaded = computed(() => required.value.every((r) => r.uploaded))

const currentStage = computed(() => props.currentStage ?? 'submission')

const missingForCurrentStage = computed(() =>
  required.value.filter(
    (r) => !r.uploaded && r.required && (r.stage ?? 'submission') === currentStage.value,
  ),
)

const hasMissing = computed(() => missingForCurrentStage.value.length > 0)

const hasMissingForStage = (stage: string) =>
  required.value.some((r) => !r.uploaded && r.required && (r.stage ?? 'submission') === stage)

defineExpose({ hasMissing, hasMissingForStage })

watch(hasMissing, (val) => {
  emit('status-change', val)
}, { immediate: true })

watch(() => props.applicationId, load, { immediate: true })
</script>

<template>
  <div
    class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
  >
    <div class="mb-4 flex items-center justify-between gap-2">
      <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Documents</h3>
      <span
        v-if="required.length"
        :class="[
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
          allRequiredUploaded
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
        ]"
      >
        <CheckCircle v-if="allRequiredUploaded" class="h-3 w-3" />
        <AlertTriangle v-else class="h-3 w-3" />
        {{ required.filter((r) => r.uploaded).length }} / {{ required.length }} required
      </span>
    </div>

    <!-- Blinking call-to-action banner when stage docs are missing -->
    <div
      v-if="!listLoading && hasMissing"
      class="mb-4 flex animate-pulse items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950/40"
    >
      <AlertTriangle class="h-4 w-4 shrink-0 text-red-500" />
      <p class="text-xs font-semibold text-red-600 dark:text-red-400">
        Upload required
        <span class="capitalize">{{ currentStage }}</span>
        stage
        {{ missingForCurrentStage.length === 1 ? 'document' : 'documents' }}
        before this application can proceed
        ({{ missingForCurrentStage.length }} missing).
      </p>
    </div>

    <!-- Loading skeleton -->
    <div v-if="listLoading" class="space-y-2">
      <div
        v-for="n in 3"
        :key="n"
        class="h-14 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"
      />
    </div>

    <template v-else>
      <!-- Required documents -->
      <div v-if="required.length" class="space-y-3">
        <div v-for="req in required" :key="req.slug">
          <!-- Type header -->
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {{ docsForSlug(req.slug)[0]?.document_label || req.label }}
              <span class="ml-1 text-red-400">*</span>
              <span
                class="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
              >
                {{ stageLabel(req.stage) }}
              </span>
            </p>
            <!-- Upload button (editable) -->
            <button
              v-if="editable"
              :disabled="uploading === req.slug"
              class="flex items-center gap-1 rounded-lg border border-dashed border-neutral-300 px-2.5 py-1 text-xs text-neutral-500 transition hover:border-nfuko-primary hover:text-nfuko-primary disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-400"
              @click="openAddModal(req.slug, docsForSlug(req.slug)[0]?.document_label || req.label)"
            >
              <Loader2 v-if="uploading === req.slug" class="h-3 w-3 animate-spin" />
              <Upload v-else class="h-3 w-3" />
              {{ uploading === req.slug ? 'Uploading…' : 'Upload' }}
            </button>
          </div>

          <!-- Uploaded files for this type -->
          <ul v-if="docsForSlug(req.slug).length" class="space-y-1.5">
            <li
              v-for="doc in docsForSlug(req.slug)"
              :key="doc.id"
              class="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800"
            >
              <FileText class="h-4 w-4 shrink-0 text-neutral-400" />
              <div class="min-w-0 flex-1">
                <span class="block truncate text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  {{ doc.original_name }}
                </span>
                <p class="text-xs text-neutral-400">{{ formatSize(doc.file_size) }}</p>
              </div>
              <!-- Eye / view -->
              <button
                :disabled="viewing === doc.id"
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-emerald-400 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                title="View document"
                @click="viewDocument(doc)"
              >
                <Loader2 v-if="viewing === doc.id" class="h-3.5 w-3.5 animate-spin" />
                <Eye v-else class="h-3.5 w-3.5" />
              </button>
              <!-- Edit -->
              <button
                v-if="editable"
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-white"
                title="Edit document"
                @click="openEditModal(doc)"
              >
                <Pencil class="h-3.5 w-3.5" />
              </button>
              <!-- Delete -->
              <button
                v-if="editable"
                :disabled="removing === doc.id"
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
                @click="removeDocument(doc)"
              >
                <Loader2 v-if="removing === doc.id" class="h-3.5 w-3.5 animate-spin" />
                <Trash2 v-else class="h-3.5 w-3.5" />
              </button>
            </li>
          </ul>
          <!-- Clickable upload zone when missing for current stage + editable -->
          <button
            v-else-if="editable && !req.uploaded && (req.stage ?? 'submission') === currentStage"
            type="button"
            :disabled="uploading === req.slug"
            class="group relative w-full animate-pulse overflow-hidden rounded-xl border border-dashed border-red-300 bg-red-50 px-3 py-4 text-left transition-all hover:animate-none hover:border-red-400 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-950/30 dark:hover:bg-red-950/50"
            @click="openAddModal(req.slug, docsForSlug(req.slug)[0]?.document_label || req.label)"
          >
            <div class="flex items-center justify-center gap-2 text-xs font-semibold text-red-500 dark:text-red-400">
              <Loader2 v-if="uploading === req.slug" class="h-4 w-4 animate-spin" />
              <Upload v-else class="h-4 w-4" />
              {{ uploading === req.slug ? 'Uploading…' : '⚠ Click to upload — required for this stage' }}
            </div>
          </button>
          <!-- Static placeholder when not editable or already uploaded -->
          <p
            v-else-if="!docsForSlug(req.slug).length"
            :class="[
              'rounded-xl border border-dashed px-3 py-2.5 text-xs transition-all',
              !req.uploaded && (req.stage ?? 'submission') === currentStage
                ? 'border-red-200 text-red-400 dark:border-red-900 dark:text-red-500'
                : 'border-neutral-200 text-neutral-400 dark:border-neutral-700 dark:text-neutral-500',
            ]"
          >
            Not yet uploaded
          </p>
        </div>
      </div>

      <!-- Extra / ad-hoc documents -->
      <div
        v-if="extraDocs.length || editable"
        :class="
          required.length ? 'mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-800' : ''
        "
      >
        <div class="mb-2 flex items-center justify-between gap-2">
          <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Additional Documents
          </p>
          <button
            v-if="editable"
            :disabled="uploading === 'other'"
            class="flex items-center gap-1 rounded-lg border border-dashed border-neutral-300 px-2.5 py-1 text-xs text-neutral-500 transition hover:border-nfuko-primary hover:text-nfuko-primary disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-400"
            @click="openAddModal('other')"
          >
            <Loader2 v-if="uploading === 'other'" class="h-3 w-3 animate-spin" />
            <Upload v-else class="h-3 w-3" />
            {{ uploading === 'other' ? 'Uploading…' : 'Upload' }}
          </button>
        </div>
        <ul v-if="extraDocs.length" class="space-y-1.5">
          <li
            v-for="doc in extraDocs"
            :key="doc.id"
            class="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800"
          >
            <FileText class="h-4 w-4 shrink-0 text-neutral-400" />
            <div class="min-w-0 flex-1">
              <button
                v-if="doc.url"
                :disabled="viewing === doc.id"
                class="block truncate text-xs font-medium text-nfuko-primary hover:underline dark:text-bg-nfuko-yellow disabled:opacity-50"
                @click="viewDocument(doc)"
              >
                <Loader2 v-if="viewing === doc.id" class="mr-1 inline h-3 w-3 animate-spin" />
                {{ doc.original_name }}
              </button>
              <span
                v-else
                class="block truncate text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                {{ doc.original_name }}
              </span>
              <p class="text-xs text-neutral-400">
                {{ doc.document_label }} · {{ formatSize(doc.file_size) }}
              </p>
            </div>
            <!-- Edit -->
            <button
              v-if="editable"
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-white"
              title="Edit document"
              @click="openEditModal(doc)"
            >
              <Pencil class="h-3.5 w-3.5" />
            </button>
            <button
              v-if="editable"
              :disabled="removing === doc.id"
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
              @click="removeDocument(doc)"
            >
              <Loader2 v-if="removing === doc.id" class="h-3.5 w-3.5 animate-spin" />
              <Trash2 v-else class="h-3.5 w-3.5" />
            </button>
          </li>
        </ul>
        <p
          v-else-if="!required.length && !editable"
          class="text-sm text-neutral-400 dark:text-neutral-500"
        >
          No documents uploaded.
        </p>
      </div>
    </template>
  </div>

  <!-- ─── Add-document modal ────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="addModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="addModalOpen = false"
      >
        <div class="absolute inset-0 bg-black/50" @click="addModalOpen = false" />
        <div class="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
            <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Add loan document</h3>
            <button
              class="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-white"
              @click="addModalOpen = false"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="space-y-4 px-6 py-5">
            <!-- Name -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Name</label>
              <input
                v-model="addForm.name"
                type="text"
                placeholder="Enter Loan Security Name"
                class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-nfuko-primary focus:outline-none focus:ring-2 focus:ring-nfuko-primary/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              />
            </div>

            <!-- File -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Loan file</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-500 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 dark:file:bg-neutral-700 dark:file:text-neutral-300"
                @change="onAddFileChange"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Description</label>
              <textarea
                v-model="addForm.description"
                rows="3"
                class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-nfuko-primary focus:outline-none focus:ring-2 focus:ring-nfuko-primary/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              />
            </div>

            <!-- Error -->
            <p v-if="addFormError" class="text-xs text-red-500">{{ addFormError }}</p>
          </div>

          <!-- Footer -->
          <div class="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
            <button
              type="button"
              class="rounded-lg border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
              @click="addModalOpen = false"
            >
              Close
            </button>
            <button
              type="button"
              :disabled="uploading === 'other'"
              class="flex items-center gap-2 rounded-lg bg-nfuko-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-nfuko-primary/90 disabled:opacity-50"
              @click="submitAddDocument"
            >
              <Loader2 v-if="uploading === 'other'" class="h-4 w-4 animate-spin" />
              {{ uploading === 'other' ? 'Uploading…' : 'Submit' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ─── Edit-document modal ─────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="editModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="editModalOpen = false"
      >
        <div class="absolute inset-0 bg-black/50" @click="editModalOpen = false" />
        <div class="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
          <div class="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
            <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Edit document</h3>
            <button
              class="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-white"
              @click="editModalOpen = false"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
          <div class="space-y-4 px-6 py-5">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Name</label>
              <input
                v-model="editForm.name"
                type="text"
                class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-nfuko-primary focus:outline-none focus:ring-2 focus:ring-nfuko-primary/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Replace file <span class="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-500 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 dark:file:bg-neutral-700 dark:file:text-neutral-300"
                @change="onEditFileChange"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Description</label>
              <textarea
                v-model="editForm.description"
                rows="3"
                class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-nfuko-primary focus:outline-none focus:ring-2 focus:ring-nfuko-primary/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              />
            </div>
            <p v-if="editFormError" class="text-xs text-red-500">{{ editFormError }}</p>
          </div>
          <div class="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
            <button
              type="button"
              class="rounded-lg border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
              @click="editModalOpen = false"
            >
              Close
            </button>
            <button
              type="button"
              :disabled="editSaving"
              class="flex items-center gap-2 rounded-lg bg-nfuko-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-nfuko-primary/90 disabled:opacity-50"
              @click="submitEditDocument"
            >
              <Loader2 v-if="editSaving" class="h-4 w-4 animate-spin" />
              {{ editSaving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ─── Document preview modal ─────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="previewDoc && previewBlobUrl"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closePreview"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closePreview" />

        <!-- Modal — width adapts: compact for images, wider for PDFs -->
        <div
          class="relative z-10 flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
          :class="isImage(previewDoc.mime_type) ? 'w-auto max-w-sm' : 'w-full max-w-3xl'"
          style="max-height: 90vh"
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
            <div class="flex items-center gap-2 min-w-0">
              <FileText class="h-4 w-4 shrink-0 text-emerald-500" />
              <p class="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                {{ previewDoc.original_name }}
              </p>
              <span class="ml-1 shrink-0 text-xs text-neutral-400">
                {{ formatSize(previewDoc.file_size) }}
              </span>
            </div>
            <button
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-white"
              @click="closePreview"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-auto p-4">
            <!-- Image preview -->
            <img
              v-if="isImage(previewDoc.mime_type)"
              :src="previewBlobUrl"
              :alt="previewDoc.original_name"
              class="mx-auto max-h-[60vh] w-auto rounded-xl object-contain"
            />
            <!-- PDF preview -->
            <iframe
              v-else-if="isPdf(previewDoc.mime_type)"
              :src="previewBlobUrl"
              class="h-[70vh] w-full rounded-xl border-0"
              :title="previewDoc.original_name"
            />
            <!-- Unsupported — prompt download -->
            <div v-else class="flex flex-col items-center justify-center gap-4 py-16">
              <FileText class="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Preview not available for this file type.
              </p>
              <a
                :href="previewBlobUrl"
                :download="previewDoc.original_name"
                class="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
              >
                Download File
              </a>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
