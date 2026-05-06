<template>

    <TableDrawer :drawer-show-footer="!automaticCreate.key" :printTable="true" ref="drawer" :exportItems="exportItems"
        drawerWidth=" w-2/3" :url="tableUrl" state="memberList" :drawerTitle="drawerTitle" :columns="columns"
        @save="saveUser" :showTableAction="true">
        <template #header-action>
            <div>
                <h1 class="text-4xl font-black text-[#0A2318] dark:text-white tracking-tight">
                    Members list</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 ">Manage all members.</p>
            </div>
        </template>
        <template #salutation_name="{ item }">
            <span>
                <Button @click="navigateToProfile(item)"
                    class="flex items-center gap-2 font-semibold text-nfuko-action text-sm dark:text-white">
                    <span>{{ item?.salutation_name }}</span>
                </Button>
            </span>
        </template>
        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </template>
        <template #drawer="{ action, data }">
            <Create v-if="['add'].includes(action)" :data="{ ...data, action }" v-model:form="formData" />
            <Edit v-if="['edit'].includes(action)" :data="{ ...data, action }" v-model:form="formData" />
            <Details v-if="['view'].includes(action)" :data="data" />
            <component
                :defaults="['dob', 'name', 'account_number','salutation', 'gender', 'phone', 'dob', 'address', 'joined_date', 'nationality']"
                v-else-if="migrationComponent" :is="migrationComponent.component" :data="{ ...data, action }"
                :url="migrationComponent?.url" />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Create, Details, Edit } from '.'
import { TableDrawer, StatusButtonsHorizontal, setLocalValues, uploadTemplateColumData } from '@/Global'
import { useRouter } from 'vue-router';
import { MemberTemplate } from './imgration/index';
const router = useRouter(),
    automaticCreate = ref<any>({})
const formData = ref<Record<string, any>>({}), statusFilter = ref('all'),
    drawerTitle = ref('Create Tenant'), filters = ['all', 'active', 'suspended', 'pending', 'trial'],
    tableUrl = computed(() => `/members/list?status=${statusFilter.value}`),
    title: Record<string, string> = {
        "view": "View Member Details",
        "edit": "Edit member",
        "add": "Create a sacco member",
    },
    drawer = ref<any>(null)
function saveUser(type: string, data: any) {
    if (title?.[type]) drawerTitle.value = title?.[type]
}
const columns = [
    { key: 'memeber_code', label: 'code', sticky: 'left', width: '14em', copy: true },
    { key: 'salutation_name', label: 'Member', sticky: 'left', width: '14em ', },
    // { key: 'member_type', label: 'Member Type' },
    { key: 'NIN', label: 'national id', },
    // { key: 'email', label: 'email', },
    { key: 'primary_contact', label: 'phone', width: '10em ', },
    // { key: 'other_contacts', label: 'Other Contacts', width: '14em ', },
    { key: 'joined_date', label: 'Joined Date', width: '12em ', },
    { key: 'sex', label: 'Gender', type: 'status' },
    // { key: 'marital_status', label: 'Status', type: 'status' },
    { key: 'actions', label: 'Actions', show: ['edit', 'delete'] }
    // { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]
function navigateToProfile(item: any) {
    router.push(`/tenant/member/profile`)
    setLocalValues('memberProfile', item)
}
const exportItems = ref([
    {
        key: 'member-template',
        label: 'Member Template',
        component: MemberTemplate,
        url: 'members/download-template',
        action: () => openDrawer('member-template')
    },
    {
        key: 'import-member-template',
        label: 'Import Member Template',
        url: 'members/import-data',
        component: uploadTemplateColumData,
        action: () => openDrawer('import-member-template')
    }
])
const migrationComponent = computed(() => {
    return exportItems.value.find(i => i.key === automaticCreate.value?.key)
})

function openDrawer(key: string) {
    const item = exportItems.value.find(i => i.key === key)
    if (!item) return

    automaticCreate.value = item
    drawerTitle.value = item.label

    setTimeout(() => {
        drawer.value?.toggleDrawer()
    }, 100)

}
watch(() => drawer.value?.drawerOpen, (val) => {
    if (!val) {
        automaticCreate.value = {}
    }
}, { immediate: true, deep: true })
</script>