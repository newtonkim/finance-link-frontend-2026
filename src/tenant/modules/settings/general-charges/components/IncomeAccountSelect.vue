<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ChevronDown, Search, Plus } from 'lucide-vue-next'
import { chartOfAccountsApi } from '@/tenant/apis/chartOfAccounts/chartOfAccountsApi'
import { isNearMatch, levenshtein } from '@/Global/utils/levenshtein'

interface Account {
  id: number
  gl_code: string
  name: string
}

const props = defineProps<{
  modelValue: number | null
  canCreate: boolean
  placeholder?: string
  refreshTrigger?: number
  autoSelectId?: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
  (e: 'requestCreate', payload: { prefillName: string }): void
}>()

const open = ref(false)
const search = ref('')
const accounts = ref<Account[]>([])
const loading = ref(false)

const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

// Approximate worst-case panel height (search input + max-h-60 list + paddings).
const PANEL_MAX_HEIGHT_PX = 340

async function fetchAccounts() {
  loading.value = true
  try {
    const res = await chartOfAccountsApi.list({
      account_type: 'INCOME',
      is_postable: 1,
      list: 1,
    })
    const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
    accounts.value = data.slice().sort((a: Account, b: Account) => a.gl_code.localeCompare(b.gl_code))
  } finally {
    loading.value = false
  }
}

function updatePanelPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top

  // Flip up when there's no room below AND there's more room above.
  if (spaceBelow < PANEL_MAX_HEIGHT_PX && spaceAbove > spaceBelow) {
    panelStyle.value = {
      position: 'fixed',
      bottom: `${viewportHeight - rect.top + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
    }
  } else {
    panelStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
    }
  }
}

function toggleOpen() {
  open.value = !open.value
  if (open.value) {
    nextTick(updatePanelPosition)
  }
}

function onDocumentClick(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node | null
  if (!target) return
  if (triggerRef.value && triggerRef.value.contains(target)) return
  if (panelRef.value && panelRef.value.contains(target)) return
  open.value = false
}

onMounted(() => {
  fetchAccounts()
  document.addEventListener('click', onDocumentClick)
  // Capture phase catches scrolls on nested overflow:auto containers like the drawer body.
  window.addEventListener('scroll', updatePanelPosition, true)
  window.addEventListener('resize', updatePanelPosition)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('scroll', updatePanelPosition, true)
  window.removeEventListener('resize', updatePanelPosition)
})

watch(
  () => props.refreshTrigger,
  (val, prev) => {
    if (val !== prev && val !== undefined) {
      fetchAccounts()
    }
  },
)

watch(
  () => props.autoSelectId,
  (val) => {
    if (val !== null && val !== undefined) {
      emit('update:modelValue', val)
    }
  },
)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return accounts.value
  return accounts.value.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.gl_code.toLowerCase().includes(q),
  )
})

const hasExactMatch = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return false
  return accounts.value.some((a) => a.name.trim().toLowerCase() === q)
})

const nearMatches = computed(() => {
  const q = search.value.trim()
  if (q.length <= 2 || hasExactMatch.value) return []
  return accounts.value
    .filter((a) => isNearMatch(q, a.name))
    .sort((a, b) => levenshtein(q, a.name) - levenshtein(q, b.name))
    .slice(0, 2)
})

const selectedLabel = computed(() => {
  const id = props.modelValue
  if (id === null) return ''
  const match = accounts.value.find((a) => a.id === id)
  return match ? `${match.gl_code} - ${match.name}` : ''
})

const createFooterLabel = computed(() => {
  const q = search.value.trim()
  return q ? `Create "${q}" as income account` : 'Create new income account'
})

function select(account: Account) {
  emit('update:modelValue', account.id)
  open.value = false
  search.value = ''
}

function onCreateClick() {
  emit('requestCreate', { prefillName: search.value.trim() })
  open.value = false
}
</script>

<template>
  <div class="relative w-full">
    <!-- Inline "Create new" action — sits on the right of the field's label row.
         Absolute-positioned with a negative top so it aligns next to the
         "Credit Account" label that DynamicForm renders above this component. -->
    <button
      v-if="canCreate"
      data-test="create-footer"
      type="button"
      class="absolute right-0 -top-7 flex items-center gap-1 text-xs font-semibold text-nfuko-primary hover:underline"
      @click="onCreateClick"
    >
      <Plus class="size-3.5" />
      <span>{{ createFooterLabel }}</span>
    </button>

    <button
      ref="triggerRef"
      data-test="trigger"
      type="button"
      class="w-full flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-left dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
      @click="toggleOpen"
    >
      <span :class="selectedLabel ? '' : 'text-neutral-400'">
        {{ selectedLabel || placeholder || 'Select income account' }}
      </span>
      <ChevronDown class="size-4 text-neutral-400" />
    </button>

    <!-- Teleport the dropdown panel out of the drawer so the parent's
         overflow:auto can't clip it. Position is kept in sync with the trigger
         via getBoundingClientRect (see updatePanelPosition). -->
    <Teleport to="body">
      <div
        v-if="open"
        ref="panelRef"
        :style="panelStyle"
        class="z-50 rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
      >
        <div class="border-b border-neutral-100 p-2 dark:border-neutral-800">
          <div class="relative">
            <Search class="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <input
              data-test="search"
              v-model="search"
              class="w-full rounded-md border border-neutral-200 bg-neutral-50 pl-8 pr-2 py-1.5 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              placeholder="Search income accounts"
            />
          </div>
        </div>

        <div v-if="nearMatches.length > 0" class="p-2 border-b border-neutral-100 dark:border-neutral-800">
          <div class="text-[11px] font-semibold text-amber-700 dark:text-amber-300 px-1 mb-1">
            Did you mean…?
          </div>
          <button
            v-for="m in nearMatches"
            :key="m.id"
            type="button"
            class="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-amber-50 dark:hover:bg-amber-500/10"
            @click="select(m)"
          >
            {{ m.gl_code }} - {{ m.name }}
          </button>
        </div>

        <div class="max-h-60 overflow-y-auto py-1">
          <div v-if="loading" class="px-3 py-2 text-sm text-neutral-500">Loading…</div>
          <div v-else-if="filtered.length === 0" class="px-3 py-2 text-sm text-neutral-500">
            No income accounts found
          </div>
          <button
            v-for="account in filtered"
            :key="account.id"
            type="button"
            class="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-white/5"
            @click="select(account)"
          >
            {{ account.gl_code }} - {{ account.name }}
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
