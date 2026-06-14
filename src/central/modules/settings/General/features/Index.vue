<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white">

    <!-- Header -->
    <div class="px-6 pt-6 pb-5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black tracking-tight">Plan Features</h1>
        <p class="mt-1 text-sm text-neutral-500">Manage the feature options available when creating plans.</p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-2 rounded-xl bg-[#052659] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#052659]/90 transition-colors shrink-0"
      >
        <Plus class="size-4" />
        New feature
      </button>
    </div>

    <div class="px-6 py-6">

      <!-- Loading skeleton -->
      <div v-if="loading" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="n in 6" :key="n"
          class="h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      </div>

      <!-- Empty -->
      <div v-else-if="features.length === 0"
        class="flex flex-col items-center justify-center gap-3 py-24 text-neutral-400">
        <Puzzle class="size-10 opacity-30" />
        <p class="text-sm font-semibold">No features yet. Add one above.</p>
      </div>

      <!-- Features grid -->
      <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="feat in features"
          :key="feat.id"
          class="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-5 py-4 shadow-sm"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-xl"
              style="background-color: rgba(0,80,216,0.08)">
              <Puzzle class="size-4 text-nfuko-primary" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-black text-neutral-800 dark:text-neutral-100 truncate">{{ feat.name }}</p>
              <p class="text-xs font-mono text-neutral-400 truncate">{{ feat.key }}</p>
            </div>
          </div>
          <button
            @click="confirmDelete(feat)"
            class="shrink-0 flex size-8 items-center justify-center rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 class="size-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create drawer -->
    <Drawer
      :open="drawerOpen"
      title="New Feature"
      :showFooter="true"
      @update:open="drawerOpen = $event"
      @save="saveFeature"
      @submit="saveFeature"
    >
      <template #body>
        <div class="p-5 space-y-4">
          <div>
            <label class="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wide">Feature Name</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="e.g. Mobile App"
              class="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
              @input="autoKey"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wide">Key <span class="normal-case font-normal text-neutral-400">(snake_case, auto-generated)</span></label>
            <input
              v-model="form.key"
              type="text"
              placeholder="e.g. mobile_app"
              class="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm font-mono font-medium text-neutral-700 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
              @input="onKeyInput"
            />
          </div>
        </div>
      </template>
    </Drawer>

    <!-- Delete confirm modal -->
    <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div class="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl p-6">
        <div class="flex size-11 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30 mb-4">
          <Trash2 class="size-5 text-red-500" />
        </div>
        <h3 class="text-base font-black text-neutral-800 dark:text-neutral-100 mb-1">Delete feature?</h3>
        <p class="text-sm text-neutral-500 mb-5">
          "<span class="font-semibold">{{ deleteTarget.name }}</span>" will be removed from the features list.
          Existing plans that include this feature will not be affected.
        </p>
        <div class="flex gap-3">
          <button
            @click="deleteTarget = null"
            class="flex-1 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-4 py-2.5 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="deleteFeature"
            :disabled="deleting"
            class="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Puzzle, Trash2 } from 'lucide-vue-next'
import { Drawer } from '@/Global'
import { formawtacher } from '@/Global/Forminputs/formWatcher'
import { featuresApi } from '@/central/modules/apis/Settings'
import { toast } from 'vue-sonner'

const { list, create, remove } = featuresApi()
const formStore = formawtacher()

const loading = ref(true)
const deleting = ref(false)
const drawerOpen = ref(false)
const deleteTarget = ref<any>(null)
const features = ref<any[]>([])
const form = ref({ name: '', key: '' })
const keyManuallyEdited = ref(false)

function autoKey() {
  if (keyManuallyEdited.value) return
  form.value.key = form.value.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function onKeyInput() {
  keyManuallyEdited.value = form.value.key !== ''
}

function openCreate() {
  form.value = { name: '', key: '' }
  keyManuallyEdited.value = false
  drawerOpen.value = true
}

function confirmDelete(feat: any) {
  deleteTarget.value = feat
}

async function loadFeatures() {
  loading.value = true
  try {
    const res = await list()
    features.value = res?.data?.payload ?? res?.data?.data ?? []
  } finally {
    loading.value = false
  }
}

async function saveFeature() {
  if (!form.value.name.trim() || !form.value.key.trim()) {
    toast.error('Name and key are required.')
    return
  }
  formStore.setLoading(true)
  try {
    await create({ name: form.value.name.trim(), key: form.value.key.trim() })
    toast.success('Feature created.')
    drawerOpen.value = false
    await loadFeatures()
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? 'Failed to create feature.'
    toast.error(msg)
  } finally {
    formStore.setLoading(false)
  }
}

async function deleteFeature() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await remove({ id: deleteTarget.value.id })
    toast.success('Feature deleted.')
    deleteTarget.value = null
    await loadFeatures()
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Failed to delete feature.')
  } finally {
    deleting.value = false
  }
}

onMounted(loadFeatures)
</script>
