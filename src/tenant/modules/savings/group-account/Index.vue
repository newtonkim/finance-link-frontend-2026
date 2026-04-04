<template>
  <TableDrawer :permissions="{
    create: 'group-saving-create',
    view: 'group-saving-details',
    edit: 'group-saving-update',
    delete: 'group-saving-delete'
  }" :showTableAction="true" :drawerRemount="drawerRemount"
    :automaticCreate="automaticCreate.actionSlot != 'create-none-member'" :drawerWidth="drawerTitle?.width"
    :url="tableUrl" state="groupAccountList" :drawerTitle="drawerTitle?.title" :columns="columns" @save="saveUser"
    ref="drawer">
    <template #header-action>
      <div class="space-y-3">
        <PainPageHeader title="Group Savings"
          dec="Manage and monitor institutional savings groups, their membership tiers, and overall performance." />
      </div>
    </template>
    <template #sub-header>
      <AnalysisTile :data="stats" grid-class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" />
    </template>
    <template #actions="{ item }: { item: any }">
      <TabelActionButtons @action="() => OpenThedrawer(item)" title="add to group " color="primary" icon="CirclePile" />
    </template>
    <template #searchSideAction>
      <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
    </template>
    <template #drawer="{ action, data }">
      <AddGroupTab v-if="automaticCreate.actionSlot == 'create-none-member'" :data="{ ...data, action }"
        v-model:form="formData" />
      <Create v-else-if="['add', 'edit'].includes(action)" :data="{ ...data, action }" v-model:form="formData" />
      <Details v-else-if="action === 'view'" :data="data" />
    </template>
  </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { pomPinia } from 'septor-store';
import { Create, Details, AddGroupTab } from '.'
import { TableDrawer, StatusButtonsHorizontal, addNumberCommas, AnalysisTile, PainPageHeader, TabelActionButtons } from '@/Global'
import { groupSavingsApi } from '@/tenant/apis/savings/group-savingsApi';
const Store = pomPinia();
const props = defineProps<{
  data?: any
}>(),
  automaticCreate = ref({ drawerActions: true, actionSlot: null, item: null }),
  drawer = ref(null),
  drawerRemount = ref(false),
  formData = ref<Record<string, any>>({})
const statusFilter = ref('all')
const drawerTitle = ref({
  title: 'Create Tenant',
  width: 'w-2/3'
})
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
    width: "w-1/3"
  },
  add: {
    title: "Create a Group Savings",
    width: " md:w-2/3 sm:w-full"
  }
}
const columns = [
  { key: 'group_code', label: 'group code', copy: true, sticky: 'left', width: '14em' },
  { key: 'group_name', label: 'name', sticky: 'left', width: '14em' },
  { key: 'phone', label: 'admin phone', sticky: 'left', width: '14em' },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'total_in_group', label: 'total members', type: 'number', width: '10em' },
  { key: 'dcreated', label: 'joined', },
  { key: 'created_by', label: 'Created By', width: '10em' },
  { key: 'created_at', label: 'Created At', type: 'date', width: '9em' },
  { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]

const stats = computed(() => [
  {
    title: 'Total Group',
    value: addNumberCommas(
      Store?.groupAccountList?.payload?.total_analysis?.total_groups ?? 0
    ),
    trendColor: 'text-emerald-500',
    bgColor: 'bg-[#f0f9f6]',
    iconColor: 'text-[#2d9d78]',
  },
  {
    title: 'Active Group',
    value: addNumberCommas(
      Store?.groupAccountList?.payload?.total_analysis?.active_groups ?? 0
    ),
    trendColor: 'text-emerald-500',
    bgColor: 'bg-[#f0f9f6]',
    iconColor: 'text-[#2d9d78]',
  },
  {
    title: 'Active Portfolios',
    value: props?.data?.revenue?.monthly ?? '0.00',
    trendColor: 'text-neutral-400',
    bgColor: 'bg-[#f0f9f6]',
    iconColor: 'text-[#2d9d78]',
  },
  {
    title: 'Growth Rate',
    value: addNumberCommas(
      props?.data?.revenue?.yearly ?? '1.00'
    ),
    trendColor: 'text-neutral-400',
    bgColor: 'bg-[#f0f9f6]',
    iconColor: 'text-[#2d9d78]',
  },
])

async function saveUser(type: string, data: any, sumited: any) {


  if (automaticCreate.value.actionSlot == 'create-none-member') {
    const checker = await addNoneExistingMember(formData.value, automaticCreate.value.item)
    console.log(checker);
    
    if (checker == false) {
      formData.value = formData.value
    }
    drawer.value.toggleDrawer()
    formData.value = {}
    automaticCreate.value = { actionSlot: 'create-none-member', item: automaticCreate.value.item }
      drawer.value.toggleDrawer()
    return
  } else if (titleMap[type]) {
    automaticCreate.value = { actionSlot: null, item: "" }
    drawerTitle.value = titleMap[type]
  }

}
function OpenThedrawer(item: any) {
  automaticCreate.value = { actionSlot: 'create-none-member', item }
  drawerTitle.value = { title: "add member to group", width: "w-2/4" }
  drawer.value.toggleDrawer()

}
watch(() => drawer.value?.drawerOpen, (val) => {
  if (!val) {
    automaticCreate.value = {}
  }
}, {
  immediate: true,
  deep: true
})

</script>