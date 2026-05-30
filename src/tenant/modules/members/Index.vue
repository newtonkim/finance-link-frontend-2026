<template>
    <TableDrawer :appendSearchColumns="appendSearchColumns" :drawer-show-footer="!automaticCreate.key"
        :printTable="true" ref="drawer" :exportItems="exportItems" drawerWidth=" w-2/3" :url="tableUrl"
        state="memberList" :drawerTitle="drawerTitle" :columns="columns" @save="saveUser" :showTableAction="true"
        saveButtonClass="bg-[#052659] hover:bg-[#052659]/90 shadow-sm"
        printButtonClass="bg-[#052659] hover:bg-[#052659]/90">
        <template #header-action>
            <div>
                <h1 class="text-4xl font-black text-[#052659] dark:text-white tracking-tight">
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
        <template #profile="{ item }">
            <div class="flex items-center justify-center">
                <div class="h-10 w-10 overflow-hidden rounded-full bg-[#052659]/10 ring-1 ring-[#052659]/10">
                    <img
                        v-if="profileImageUrl(item)"
                        :src="profileImageUrl(item)"
                        :alt="`${item?.salutation_name ?? item?.full_name ?? 'Member'} profile image`"
                        class="h-full w-full object-cover"
                    />
                    <div
                        v-else
                        class="flex h-full w-full items-center justify-center text-xs font-bold uppercase text-[#052659]"
                    >
                        {{ memberInitials(item) }}
                    </div>
                </div>
            </div>
        </template>
        <template #searchSideAction>
            <StatusButtonsHorizontal :max-length="7" v-memo="[statusFilter]" :filters="filters"
                v-model="statusFilter" />
        </template>
        <template #drawer="{ action, data }">
            <Create v-if="['add'].includes(action)" :data="{ ...data, action }" v-model:form="formData" />
            <Edit v-if="['edit'].includes(action)" :data="{ ...data, action }" v-model:form="formData" />
            <Details v-if="['view'].includes(action)" :data="data" />
            <component
                :defaults="['dob', 'name', 'account_number', 'salutation', 'gender', 'phone', 'dob', 'address', 'joined_date', 'nationality']"
                v-else-if="migrationComponent" :is="migrationComponent.component" :data="{ ...data, action }"
                :url="migrationComponent?.url" />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Create, Details, Edit } from '.'
import { setLocalValues, uploadTemplateColumData } from '@/Global'
import { useRouter } from 'vue-router';
import { MemberTemplate } from './imgration/index';
const router = useRouter(),
    appendSearchColumns = [
        {
            key: 'member_type', label: 'Member Type', onSearch: {
                type: 'select',
                options: [{ name: 'none member', id: 'new' }, { name: 'existing member', id: 'existing' }]
            }
        },
    ],
    automaticCreate = ref<any>({})
const formData = ref<Record<string, any>>({}), statusFilter = ref('all'),
    drawerTitle = ref('Create Tenant'), filters = ['all', 'active', 'suspended', 'pending', 'dormant'],
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
    { key: 'profile', label: 'Profile', width: '6em', type: 'image', class: 'text-center' },
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
    {
        key: 'actions', label: 'Actions', show: ['edit', 'dormant', 'activate'], condition: {
            "edit": (item: any) => item?.dormant_date == null,
            "activate": (item: any) => item?.dormant_date != null,
            "dormant": (item: any) => !item?.dormant_date,
        }
    }
    // { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]
function navigateToProfile(item: any) {
    router.push(`/tenant/member/profile`)
    setLocalValues('memberProfile', item)
}

function profileImageUrl(item: any) {
    const raw = item?.profile ?? item?.profile_picture ?? item?.avatar_url ?? item?.avatar
    if (!raw || typeof raw !== 'string') return ''
    if (raw.startsWith('data:')) return raw

    const storageIndex = raw.indexOf('/storage/')
    if (storageIndex >= 0) return raw.slice(storageIndex)

    if (raw.startsWith('http') || raw.startsWith('//')) return raw

    return raw
        .replace('/public/', '/storage/')
        .replace(/^public\//, '/storage/')
        .replace(/^storage\//, '/storage/')
}

function memberInitials(item: any) {
    const name = item?.salutation_name ?? item?.full_name ?? item?.name ?? ''
    return String(name)
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('') || 'M'
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
