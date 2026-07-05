<template>
  <div class="group-savings-page">
    <TableDrawer
      :permissions="{
        create: 'group-saving-create',
        view: 'group-saving-details',
        edit: 'group-saving-update',
        delete: 'group-saving-delete',
      }"
      :check-box="false"
      :show-add-button="false"
      :showTableAction="false"
      :drawerRemount="drawerRemount"
      :exportItems="exportItems"
      :drawer-show-footer="triger"
      :automaticCreate="automaticCreate.actionSlot != 'create-none-member'"
      :drawerWidth="drawerTitle?.width"
      :saveButtonClass="drawerSaveButtonClass"
      :saveButtonText="drawerSaveButtonText"
      cancelButtonText="Cancel"
      :url="tableUrl"
      state="groupAccountList"
      :drawerTitle="drawerTitle?.title"
      :columns="columns"
      @save="saveUser"
      ref="drawer"
    >
      <template #sub-header>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="card in summaryCards"
            :key="card.title"
            class="min-h-[86px] rounded-xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {{ card.title }}
                </p>
                <div class="mt-3 flex items-center gap-2">
                  <p class="text-2xl font-black leading-none tracking-normal text-slate-950">
                    {{ card.value }}
                  </p>
                  <span
                    v-if="card.badge"
                    class="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black leading-none text-emerald-600"
                  >
                    {{ card.badge }}
                  </span>
                </div>
                <p class="mt-2 text-[11px] font-medium leading-none text-slate-500">
                  {{ card.caption }}
                </p>
              </div>
              <div
                :class="[
                  'flex size-7 shrink-0 items-center justify-center rounded-lg',
                  card.iconBg,
                ]"
              >
                <component :is="card.icon" :size="14" :class="card.iconClass" />
              </div>
            </div>
          </div>
        </div>
        <div class="mt-3 flex justify-end">
          <button
            type="button"
            @click="createGroup"
            class="inline-flex items-center gap-2 rounded-xl bg-[#182538] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#22344f]"
          >
            <Plus :size="16" /> Create Group
          </button>
        </div>
      </template>
      <template #group_name="{ item }">
        <button
          type="button"
          @click="navigateToProfile(item)"
          class="group flex min-w-0 items-center gap-3 text-left"
        >
          <span
            :class="[
              'flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md text-[11px] font-black uppercase',
              avatarClass(item),
            ]"
          >
            <img
              v-if="shouldShowGroupImage(item)"
              :src="item.group_image"
              :alt="item?.group_name ?? 'Group'"
              class="size-full object-cover"
              @error="failedGroupImages[groupImageKey(item)] = true"
            />
            <template v-else>{{ groupInitials(item) }}</template>
          </span>
          <span class="min-w-0">
            <span class="block truncate text-[13px] font-black leading-tight text-slate-950 transition-colors group-hover:text-[#7DA0CA]">
              {{ item?.group_name ?? 'Unnamed group' }}
            </span>
            <span class="mt-1 block truncate text-[11px] font-medium leading-none text-slate-500 transition-colors group-hover:text-[#7DA0CA]">
              {{ item?.group_code ?? 'No code' }}
            </span>
          </span>
        </button>
      </template>
      <template #status="{ item }">
        <span
          :class="[
            'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-black leading-none',
            statusClass(item?.status),
          ]"
        >
          <span class="size-1.5 rounded-full bg-current"></span>
          {{ formatStatus(item?.status) }}
        </span>
      </template>
      <template #total_in_group="{ item }">
        <span class="text-[13px] font-black text-slate-800">{{
          addNumberCommas(item?.total_in_group ?? 0)
        }}</span>
      </template>
      <template #actions="{ item }">
        <div class="flex flex-nowrap items-center justify-end gap-1">
          <button
            v-for="action in rowActions"
            :key="action.name"
            type="button"
            :aria-label="action.label"
            :title="action.label"
            :class="[
              'inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-bold leading-none transition-colors',
              action.name === 'delete'
                ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                : action.name === 'add-member'
                  ? 'border-[#cda434]/40 bg-[#cda434]/10 text-[#a87f24] hover:bg-[#cda434]/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            ]"
            @click="action.handler(item)"
          >
            <component :is="action.icon" :size="12" stroke-width="2" />
            {{ action.label }}
          </button>
        </div>
      </template>
      <template #searchSideAction>
        <div
          class="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-50 p-1 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
        >
          <button
            v-for="filter in statusFilters"
            :key="filter.id"
            type="button"
            @click="statusFilter = filter.id"
            :class="[
              'inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-[11px] font-black capitalize leading-none transition',
              statusFilter === filter.id
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:bg-white/70 hover:text-slate-800',
            ]"
          >
            <span>{{ filter.label }}</span>
            <span
              class="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-500"
            >
              {{ filter.count }}
            </span>
          </button>
        </div>
      </template>
      <template #drawer="{ action, data }">
        <uploadTemplateColumData
          upload-trick="row"
          v-if="
            [
              'import-group-account-savings',
              'import-group-account-member',
              'import-groups',
            ].includes((automaticCreate as any).actionSlot)
          "
          :title="(automaticCreate as any)?.actionSlot"
          :url="`/group-account-savings/${(automaticCreate as any)?.actionSlot}`"
          :submit-url="(automaticCreate as any).actionSlot"
          submit="import"
        />

        <GroupTemplate v-if="'download-group-savings-template' == automaticCreate.actionSlot" />
        <SavingGroupMemberTemplate
          v-if="'download-group-member-template' == automaticCreate.actionSlot"
        />
        <AddGroupTab
          v-if="automaticCreate.actionSlot == 'create-none-member'"
          :data="{ ...data, action, ...automaticCreate }"
          v-model:form="formData"
        />
        <Create
          v-else-if="['add', 'edit'].includes(action)"
          :data="{ ...data, action }"
          v-model:form="formData"
        />
        <Details v-else-if="action === 'view'" :data="data" />
      </template>
    </TableDrawer>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { pomPinia } from 'septor-store'
import { Create, Details, AddGroupTab, GroupTemplate, SavingGroupMemberTemplate } from '.'
import { TableDrawer, addNumberCommas, setLocalValues, uploadTemplateColumData } from '@/Global'
import { useRouter } from 'vue-router'
import { groupSavingsApi } from '@/tenant/apis/savings/group-savingsApi'
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Eye,
  Trash2,
  UserPlus,
  Users,
  UsersRound,
  Plus,
} from 'lucide-vue-next'
const Store = pomPinia(),
  automaticCreate = ref<any>({ drawerActions: true, actionSlot: null, item: null }),
  drawer = ref<any>(null),
  drawerRemount = ref(false),
  formData = ref<Record<string, any>>({})
const statusFilter = ref('all')
const failedGroupImages = ref<Record<string, boolean>>({})
const drawerTitle = ref({
  title: 'Create Tenant',
  width: 'w-2/3',
})
const addMemberDrawerWidth = 'w-full sm:max-w-[820px] xl:max-w-[960px]'
const router = useRouter()
const { addNoneExistingMember } = groupSavingsApi()
const tableUrl = computed(() => {
  return `/group-account-savings/list?status=${statusFilter.value}`
})
const drawerSaveButtonText = computed(() =>
  automaticCreate.value.actionSlot === 'create-none-member' ? 'Add member' : 'Save',
)
const drawerSaveButtonClass = computed(() =>
  automaticCreate.value.actionSlot === 'create-none-member'
    ? 'bg-[#06265a] hover:bg-[#041b40] shadow-sm'
    : 'bg-emerald-600 hover:bg-[#052659]/90 shadow-sm',
)
const titleMap: Record<string, { title: string; width: string }> = {
  view: {
    title: 'view group Savings account Details',
    width: 'w-1/2',
  },
  edit: {
    title: 'Update Group',
    width: 'w-1/2',
  },
  add: {
    title: 'Create a Group Savings',
    width: ' md:w-2/3 sm:w-full',
  },
}
const columns = [
  { key: 'group_name', label: 'Group', sticky: 'left', width: '28em' },
  { key: 'phone', label: 'Admin Phone', width: '16em' },
  { key: 'status', label: 'Status', width: '12em' },
  { key: 'total_in_group', label: 'Members', width: '12em' },
  { key: 'created_by', label: 'Created By', width: '15em' },
  {
    key: 'created_at',
    label: 'Created',
    type: 'date',
    width: '14em',
    onSearch: { type: 'date-range' },
  },
  { key: 'actions', label: 'Actions', show: [], width: '24em', class: '!overflow-visible' },
]

const payload = computed(() => (Store as any).groupAccountList?.payload ?? {})
const rows = computed(() => (Array.isArray(payload.value?.data) ? payload.value.data : []))
const totalGroups = computed(() =>
  Number(
    payload.value?.total_analysis?.total_groups ?? payload.value?.total ?? rows.value.length ?? 0,
  ),
)
const activeGroups = computed(() =>
  Number(payload.value?.total_analysis?.active_groups ?? countStatus('active')),
)
const needsAttention = computed(() => Math.max(totalGroups.value - activeGroups.value, 0))
const totalMembers = computed(() =>
  Number(
    payload.value?.total_analysis?.total_members ??
      rows.value.reduce((sum: number, row: any) => {
        return sum + Number(row?.total_in_group ?? 0)
      }, 0),
  ),
)
const activeShare = computed(() =>
  totalGroups.value ? Math.round((activeGroups.value / totalGroups.value) * 100) : 0,
)

const summaryCards = computed(() => [
  {
    title: 'Total Groups',
    value: addNumberCommas(totalGroups.value),
    caption: 'All registered groups',
    icon: UsersRound,
    iconBg: 'bg-indigo-50',
    iconClass: 'text-indigo-500',
  },
  {
    title: 'Active',
    value: addNumberCommas(activeGroups.value),
    badge: `${activeShare.value}%`,
    caption: 'Share of all groups',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50',
    iconClass: 'text-emerald-500',
  },
  {
    title: 'Needs Attention',
    value: addNumberCommas(needsAttention.value),
    caption: 'Suspended, expired or trial',
    icon: AlertTriangle,
    iconBg: 'bg-orange-50',
    iconClass: 'text-orange-500',
  },
  {
    title: 'Total Members',
    value: addNumberCommas(totalMembers.value),
    caption: 'Across all groups',
    icon: Users,
    iconBg: 'bg-violet-50',
    iconClass: 'text-violet-500',
  },
])

const statusFilters = computed(() => [
  { id: 'all', label: 'All', count: totalGroups.value },
  { id: 'active', label: 'Active', count: activeGroups.value },
  { id: 'trial', label: 'Trial', count: countStatus('trial') },
  { id: 'suspended', label: 'Suspended', count: countStatus('suspended') },
  { id: 'expired', label: 'Expired', count: countStatus('expired') },
])

const rowActions = [
  { name: 'view', label: 'View', icon: Eye, handler: (item: any) => runTableAction(item, 'view') },
  { name: 'edit', label: 'Edit', icon: Edit3, handler: (item: any) => runTableAction(item, 'edit') },
  { name: 'add-member', label: 'Add member', icon: UserPlus, handler: (item: any) => OpenThedrawer(item) },
  { name: 'delete', label: 'Delete', icon: Trash2, handler: (item: any) => runTableAction(item, 'delete') },
]

function countStatus(status: string) {
  return rows.value.filter((row: any) => normalizeStatus(row?.status) === status).length
}

function normalizeStatus(status: unknown) {
  return String(status ?? '')
    .trim()
    .toLowerCase()
}

function formatStatus(status: unknown) {
  const value = normalizeStatus(status)
  return value || 'unknown'
}

function statusClass(status: unknown) {
  const value = normalizeStatus(status)
  if (value === 'active') return 'bg-emerald-50 text-emerald-600'
  if (value === 'trial') return 'bg-amber-50 text-amber-600'
  if (value === 'suspended') return 'bg-rose-50 text-rose-600'
  if (value === 'expired') return 'bg-slate-100 text-slate-500'
  return 'bg-slate-100 text-slate-500'
}

function groupInitials(item: any) {
  const label = String(item?.group_name ?? item?.group_code ?? 'Group')
  const parts = label.trim().split(/\s+/).filter(Boolean)
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : label.slice(0, 2)).toUpperCase()
}

function groupImageKey(item: any) {
  return String(item?.id ?? item?.group_code ?? item?.group_name ?? '')
}

function shouldShowGroupImage(item: any) {
  const key = groupImageKey(item)
  return Boolean(item?.group_image) && !failedGroupImages.value[key]
}

function avatarClass(item: any) {
  const palettes = [
    'bg-blue-50 text-blue-700',
    'bg-violet-50 text-violet-700',
    'bg-emerald-50 text-emerald-700',
    'bg-amber-50 text-amber-700',
  ]
  const seed = Number(item?.id ?? 0)
  return palettes[Math.abs(seed) % palettes.length]
}

function runTableAction(item: any, action: string) {
  drawer.value?.handleAction?.(item, action)
}

async function saveUser(type: string, data: any, sumited: any) {
  if (automaticCreate.value.actionSlot == 'create-none-member') {
    const checker = await addNoneExistingMember(formData.value, automaticCreate.value.item)
    if (checker.success == false) {
    }
    formData.value = {}
    automaticCreate.value = {
      drawerActions: true,
      actionSlot: 'create-none-member',
      item: automaticCreate.value.item,
    }
    drawer.value.toggleDrawer()
    return
  } else if (titleMap[type]) {
    automaticCreate.value = { drawerActions: true, actionSlot: null, item: '' }
    drawerTitle.value = titleMap[type]
  }
}
function createGroup() {
  automaticCreate.value = { drawerActions: true, actionSlot: null, item: null }
  drawerTitle.value = titleMap.add
  drawer.value.toggleDrawer()
  drawer.value.buttonTypeClicked = 'add'
}
function OpenThedrawer(item: any, actionSlot = 'create-none-member') {
  automaticCreate.value = { drawerActions: true, actionSlot, item }
  drawerTitle.value = { title: 'add member to group', width: addMemberDrawerWidth }
  drawer.value.toggleDrawer()
  drawer.value.buttonTypeClicked = automaticCreate.value.actionSlot
}
watch(
  () => drawer.value?.drawerOpen,
  (val) => {
    if (!val) {
      automaticCreate.value = { drawerActions: true, actionSlot: null, item: null }
    }
  },
  {
    immediate: true,
    deep: true,
  },
)

const triger = computed(() => {
  return ![
    'download-group-savings-template',
    'download-group-member-template',
    'import-group-account-member',
    'import-group-account-savings',
    'import-groups',
  ].includes(automaticCreate.value.actionSlot)
})
function navigateToProfile(item: any) {
  router.push(`/tenant/group-savings/profile`)
  setLocalValues('groupProfile' as any, item)
}
const exportItems = ref([
  {
    label: 'Group savings Template',
    action: (vl) => {
      automaticCreate.value = {
        actionSlot: 'download-group-savings-template',
        item: vl,
      }
      OpenThedrawer(vl, 'download-group-savings-template')
      drawerTitle.value = { title: 'Group savings Template', width: 'w-1/2' }
    },
  },
  {
    label: 'Group member Template',
    action: (vl) => {
      automaticCreate.value = {
        actionSlot: 'download-group-member-template',
        item: vl,
      }
      OpenThedrawer(vl, 'download-group-member-template')
      drawerTitle.value = { title: 'Group savings Template', width: 'w-1/2' }
    },
  },
  {
    label: 'import groups',
    action: (vl) => {
      automaticCreate.value = {
        actionSlot: 'import-groups',
        item: vl,
      }
      OpenThedrawer(vl, 'import-groups')
      drawerTitle.value = { title: 'import groups', width: 'w-1/2' }
    },
  },
  {
    label: 'import group members',
    action: (vl) => {
      automaticCreate.value = {
        actionSlot: 'import-group-account-member',
        item: vl,
      }
      OpenThedrawer(vl, 'import-group-account-member')
      drawerTitle.value = { title: 'import group member', width: 'w-1/2' }
    },
  },
])

watch(
  () => drawer.value?.drawerOpen,
  (v) => {
    if (!v) {
      automaticCreate.value = {}
    }
  },
)
</script>

<style scoped>
.group-savings-page {
  background: #f8fafc;
}

.group-savings-page :deep(.flex.h-full > .flex.items-center.justify-between:first-child) {
  display: none;
}

.group-savings-page :deep(.rounded-xl.border-0) {
  margin-top: 14px;
  overflow: hidden;
  border: 1px solid rgb(226 232 240 / 0.75);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
}

.group-savings-page :deep(.rounded-xl.border-0 > .flex) {
  margin: 0;
  border: 0;
  border-radius: 0;
  border-bottom: 1px solid rgb(241 245 249);
  box-shadow: none;
}

.group-savings-page :deep(input[type='search']) {
  height: 32px;
  max-width: 320px;
  border-radius: 8px;
  border-color: rgb(226 232 240);
  padding-top: 0;
  padding-bottom: 0;
  font-size: 12px;
  font-weight: 500;
}

.group-savings-page :deep(input[type='search']::placeholder) {
  color: #64748b;
}

.group-savings-page :deep(table thead) {
  background: #f8fafc;
  box-shadow: none;
}

.group-savings-page :deep(table th) {
  padding-top: 12px;
  padding-bottom: 12px;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.group-savings-page :deep(table td) {
  padding-top: 13px;
  padding-bottom: 13px;
  color: #475569;
  font-size: 13px;
  text-transform: none;
}

.group-savings-page :deep(table tr) {
  border-color: rgb(241 245 249);
}

.group-savings-page :deep(.custom-scrollbar) {
  border-radius: 0;
  box-shadow: none;
}
</style>
