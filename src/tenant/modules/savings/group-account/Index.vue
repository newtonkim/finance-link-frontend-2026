<template>
  <TableDrawer :permissions="{
    create: 'group-saving-create',
    view: 'group-saving-details',
    edit: 'group-saving-update',
    delete: 'group-saving-delete'
  }" :showTableAction="true" :drawerRemount="drawerRemount" :exportItems="exportItems" :drawer-show-footer="triger"
    :automaticCreate="automaticCreate.actionSlot != 'create-none-member'" :drawerWidth="drawerTitle?.width"
    :url="tableUrl" state="groupAccountList" :drawerTitle="drawerTitle?.title" :columns="columns" @save="saveUser"
    ref="drawer">
    <template #header-action>
      <div class="space-y-3">
        <PainPageHeader title="Group Savings"
          dec="Create savings groups, manage their members, and track status and performance at a glance." />
      </div>
    </template>
    <template #sub-header>
      <AnalysisTile :data="stats" grid-class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" />
    </template>
    <template #group_code="{ item }">
      <CopyData :show="item?.group_code" :copy="item?.group_code">
        <template #text>
          <button @click="navigateToProfile(item)"
            class="group inline-flex items-center gap-2 cursor-pointer text-left">
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#052659]/10 text-[10px] font-black text-[#052659] dark:bg-white/10 dark:text-white">
              {{ (item?.group_name || item?.group_code || 'G').charAt(0).toUpperCase() }}
            </span>
            <span class="min-w-0">
              <span class="block truncate font-mono text-sm font-semibold text-nfuko-action group-hover:underline dark:text-white">{{ item?.group_code }}</span>
              <span v-if="item?.group_name" class="block truncate text-[11px] text-neutral-400">{{ item?.group_name }}</span>
            </span>
          </button>
        </template>
      </CopyData>
    </template>
    <template #actions="{ item }">
      <TabelActionButtons @action="() => OpenThedrawer(item)" title="add to group " color="primary" icon="CirclePile" />
    </template>
    <template #searchSideAction>
      <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
    </template>
    <template #drawer="{ action, data }">
      <uploadTemplateColumData upload-trick="row" v-if="
        [
          'import-group-account-savings',
          'import-group-account-member',
          'import-groups'

        ].includes((automaticCreate as any).actionSlot)
      " :title="(automaticCreate as any)?.actionSlot"
        :url="`/group-account-savings/${(automaticCreate as any)?.actionSlot}`"
        :submit-url="(automaticCreate as any).actionSlot" submit="import" />

      <GroupTemplate v-if="'download-group-savings-template' == automaticCreate.actionSlot" />
      <SavingGroupMemberTemplate v-if="'download-group-member-template' == automaticCreate.actionSlot" />
      <AddGroupTab v-if="automaticCreate.actionSlot == 'create-none-member'"
        :data="{ ...automaticCreate, ...data, action }" v-model:form="formData" />
      <Create v-else-if="['add', 'edit'].includes(action)" :data="{ ...data, action }" v-model:form="formData" />
      <Details v-else-if="action === 'view'" :data="data" />
    </template>
  </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { pomPinia } from 'septor-store';
import { Users, Handshake, PauseCircle, TrendingUp } from 'lucide-vue-next'
import { Create, Details, AddGroupTab, GroupTemplate, SavingGroupMemberTemplate } from '.'
import { TableDrawer, StatusButtonsHorizontal, AnalysisTile, PainPageHeader, TabelActionButtons, setLocalValues, CopyData, uploadTemplateColumData } from '@/Global'
import { useRouter } from 'vue-router';
import { groupSavingsApi } from '@/tenant/apis/savings/group-savingsApi';
const Store = pomPinia();
const props = defineProps<{
  data?: any
}>(),
  automaticCreate = ref<any>({ drawerActions: true, actionSlot: null, item: null }),
  drawer = ref<any>(null),
  drawerRemount = ref(false),
  formData = ref<Record<string, any>>({})
const statusFilter = ref('all')
const drawerTitle = ref({
  title: 'Create Tenant',
  width: 'w-2/3'
})
const router = useRouter();
const filters = ['all', 'active', 'suspended', 'expired', 'trial'], { addNoneExistingMember } = groupSavingsApi()
const tableUrl = computed(() => {
  return `/group-account-savings/list?status=${statusFilter.value}`
})
const titleMap: Record<string, { title: string; width: string }> = {
  view: {
    title: "view group Savings account Details",
    width: "w-1/2"
  },
  edit: {
    title: "Edit Member Savings Account",
    width: "w-1/2"
  },
  add: {
    title: "Create a Group Savings",
    width: " md:w-2/3 sm:w-full"
  }
}
const columns = [
  { key: 'group_code', label: 'group code', copy: true, sticky: 'left', width: '15em' },
  { key: 'group_name', label: 'name', sticky: 'left', width: '14em' },
  { key: 'phone', label: 'admin phone', sticky: 'left', width: '14em' },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'total_in_group', label: 'total members', type: 'number', width: '10em' },
  { key: 'dcreated', label: 'joined',onSearch: { type: 'date-range', }  },
  { key: 'created_by', label: 'Created By', width: '10em' },
  { key: 'created_at', label: 'Created At', type: 'date', width: '9em',onSearch: { type: 'date-range', }  },
  { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]

const stats = computed(() => {
  const analysis = (Store as any).groupAccountList?.payload?.total_analysis ?? {}
  const total = Number(analysis.total_groups ?? 0)
  const active = Number(analysis.active_groups ?? 0)
  const inactive = Math.max(total - active, 0)
  const activeRate = total > 0 ? Math.round((active / total) * 100) : 0

  return [
    {
      title: 'Total groups',
      value: total,
      type: 'number',
      icon: Users,
      bgColor: 'bg-[#052659]/10',
      iconColor: 'text-[#052659]',
    },
    {
      title: 'Active groups',
      value: active,
      type: 'number',
      icon: Handshake,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trend: `${activeRate}% of all groups`,
      trendColor: 'text-emerald-600',
    },
    {
      title: 'Inactive groups',
      value: inactive,
      type: 'number',
      icon: PauseCircle,
      bgColor: 'bg-slate-100',
      iconColor: 'text-slate-500',
    },
    {
      title: 'Active rate',
      value: activeRate,
      suffix: '%',
      icon: TrendingUp,
      bgColor: 'bg-[#cda434]/10',
      iconColor: 'text-[#cda434]',
    },
  ]
})

async function saveUser(type: string, data: any, sumited: any) {

  if (automaticCreate.value.actionSlot == 'create-none-member') {
    const checker = await addNoneExistingMember(formData.value, automaticCreate.value.item)
    if (checker.success == false) {
    }
    formData.value = {}
    automaticCreate.value = { drawerActions: true, actionSlot: 'create-none-member', item: automaticCreate.value.item }
    drawer.value.toggleDrawer()
    return
  } else if (titleMap[type]) {
    automaticCreate.value = { drawerActions: true, actionSlot: null, item: "" }
    drawerTitle.value = titleMap[type]
  }

}
function OpenThedrawer(item: any, actionSlot = "create-none-member") {
  automaticCreate.value = { drawerActions: true, actionSlot, item }
  drawerTitle.value = { title: "add member to group", width: "w-2/4" }
  drawer.value.toggleDrawer()
  drawer.value.buttonTypeClicked = automaticCreate.value.actionSlot
}
watch(() => drawer.value?.drawerOpen, (val) => {
  if (!val) {
    automaticCreate.value = { drawerActions: true, actionSlot: null, item: null }
  }
}, {
  immediate: true,
  deep: true
})

const triger = computed(() => {
  return !['download-group-savings-template', 'download-group-member-template', 'import-group-account-member', 'import-group-account-savings','import-groups'].includes(automaticCreate.value.actionSlot)
})
function navigateToProfile(item: any) {

  router.push(`/tenant/group-savings/profile`)
  setLocalValues('groupProfile' as any, item)
}
const exportItems = ref([
  {
    label: "Group savings Template",
    action: (vl) => {
      automaticCreate.value = {
        actionSlot: "download-group-savings-template",
        item: vl,
      };
      OpenThedrawer(vl, "download-group-savings-template");
      drawerTitle.value = { title: "Group savings Template", width: "w-1/2" }
    },
  },
  {
    label: "Group member Template",
    action: (vl) => {
      automaticCreate.value = {
        actionSlot: "download-group-member-template",
        item: vl,
      };
      OpenThedrawer(vl, "download-group-member-template");
      drawerTitle.value = { title: "Group savings Template", width: "w-1/2" }
    },
  },
  {
    label: "import groups",
    action: (vl) => {
      automaticCreate.value = {
        actionSlot: "import-groups",
        item: vl,
      };
      OpenThedrawer(vl, "import-groups");
      drawerTitle.value = { title: "import groups", width: "w-1/2" }
    },
  },
  {
    label: "import group members",
    action: (vl) => {
      automaticCreate.value = {
        actionSlot: "import-group-account-member",
        item: vl,
      };
      OpenThedrawer(vl, "import-group-account-member");
      drawerTitle.value = { title: "import group member", width: "w-1/2" }
    },
  },

])

watch(
  () => drawer.value?.drawerOpen,
  (v) => {
    if (!v) {
      automaticCreate.value = {};
    }
  }
);
</script>