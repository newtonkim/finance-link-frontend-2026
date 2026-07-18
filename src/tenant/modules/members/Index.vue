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
        <!-- Bespoke members table (keeps drawer/search/status/pagination via TableDrawer) -->
        <template #table="{ rows, loading, onAction }">
            <table class="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                    <tr class="border-b border-neutral-200 dark:border-neutral-800">
                        <th class="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-neutral-400">Member</th>
                        <th class="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-neutral-400">National ID</th>
                        <th class="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-neutral-400">Phone</th>
                        <th class="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-neutral-400">Joined</th>
                        <th class="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-neutral-400">Gender</th>
                        <th class="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.09em] text-neutral-400 hide-on-print">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                    <template v-if="loading">
                        <tr v-for="i in 6" :key="`s${i}`" class="animate-pulse">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="h-11 w-11 shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-800" />
                                    <div class="space-y-2"><div class="h-3.5 w-32 rounded bg-neutral-100 dark:bg-neutral-800" /><div class="h-2.5 w-20 rounded bg-neutral-100 dark:bg-neutral-800" /></div>
                                </div>
                            </td>
                            <td v-for="j in 5" :key="j" class="px-6 py-4"><div class="h-3.5 w-20 rounded bg-neutral-100 dark:bg-neutral-800" /></td>
                        </tr>
                    </template>
                    <tr v-else-if="!rows.length">
                        <td colspan="6" class="px-6 py-20 text-center">
                            <p class="text-sm font-semibold text-neutral-700 dark:text-neutral-200">No members yet</p>
                            <p class="mt-1 text-xs text-neutral-400">Members you add will appear here.</p>
                        </td>
                    </tr>
                    <tr v-else v-for="item in rows" :key="item.id"
                        class="group transition-colors hover:bg-nfuko-primary-50/40 dark:hover:bg-neutral-800/40">
                        <!-- identity: avatar · name · code -->
                        <td class="px-6 py-3.5">
                            <div class="flex items-center gap-3">
                                <div class="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#052659]/10 ring-1 ring-[#052659]/10 dark:ring-white/10">
                                    <img v-if="profileImageUrl(item)" :src="profileImageUrl(item)"
                                        :alt="item?.salutation_name ?? 'Member'" class="h-full w-full object-cover" />
                                    <div v-else class="flex h-full w-full items-center justify-center text-sm font-bold uppercase text-[#052659] dark:text-nfuko-primary-300">
                                        {{ memberInitials(item) }}
                                    </div>
                                </div>
                                <div class="min-w-0">
                                    <button type="button" @click="navigateToProfile(item)"
                                        class="block max-w-[16rem] truncate text-left text-sm font-semibold text-neutral-900 transition-colors hover:text-nfuko-primary-700 dark:text-white">
                                        {{ item?.salutation_name || '—' }}
                                    </button>
                                    <button type="button" @click="copyCode(item)" title="Copy code"
                                        class="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-neutral-400 transition-colors hover:text-nfuko-primary-600">
                                        {{ item?.memeber_code || '—' }}
                                        <Check v-if="copiedCode === item.id" class="h-3 w-3 text-emerald-600" />
                                        <Copy v-else class="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                    </button>
                                </div>
                            </div>
                        </td>
                        <!-- national id -->
                        <td class="whitespace-nowrap px-6 py-3.5">
                            <span v-if="item?.NIN" class="font-mono text-xs text-neutral-600 dark:text-neutral-300">{{ item.NIN }}</span>
                            <span v-else class="text-neutral-300">—</span>
                        </td>
                        <!-- phone -->
                        <td class="whitespace-nowrap px-6 py-3.5 tabular-nums text-neutral-600 dark:text-neutral-300">{{ item?.primary_contact || '—' }}</td>
                        <!-- joined -->
                        <td class="whitespace-nowrap px-6 py-3.5">
                            <div class="text-sm text-neutral-700 dark:text-neutral-200">{{ formatJoined(item?.joined_date) }}</div>
                            <div v-if="relativeJoined(item?.joined_date)" class="text-[11px] text-neutral-400">{{ relativeJoined(item?.joined_date) }}</div>
                        </td>
                        <!-- gender -->
                        <td class="px-6 py-3.5">
                            <span v-if="item?.sex"
                                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset"
                                :class="genderPill(item.sex)">
                                <span class="size-1.5 rounded-full bg-current opacity-70" />
                                {{ item.sex }}
                            </span>
                            <span v-else class="text-neutral-300">—</span>
                        </td>
                        <!-- actions -->
                        <td class="whitespace-nowrap px-6 py-3.5 text-right hide-on-print">
                            <div class="inline-flex items-center justify-end gap-2">
                                <button v-if="!item?.dormant_date" type="button" @click="onAction(item, 'edit')"
                                    :disabled="licenseState.readOnly"
                                    :title="licenseState.readOnly ? 'License expired — renew to edit' : ''"
                                    class="inline-flex items-center gap-1.5 rounded-lg border border-nfuko-primary-200 bg-nfuko-primary-50 px-3 py-1.5 text-xs font-semibold text-nfuko-primary-700 transition-colors hover:bg-nfuko-primary-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-nfuko-primary-50 dark:border-nfuko-primary-500/20 dark:bg-nfuko-primary-500/10 dark:text-nfuko-primary-300">
                                    <Pencil class="h-3.5 w-3.5" /> Edit
                                </button>
                                <button v-if="!item?.dormant_date" type="button" @click="onAction(item, 'dormant')"
                                    :disabled="licenseState.readOnly"
                                    :title="licenseState.readOnly ? 'License expired — renew to make changes' : ''"
                                    class="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                                    <MoonStar class="h-3.5 w-3.5" /> Dormant
                                </button>
                                <button v-else type="button" @click="onAction(item, 'activate')"
                                    :disabled="licenseState.readOnly"
                                    :title="licenseState.readOnly ? 'License expired — renew to make changes' : ''"
                                    class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                                    <Sun class="h-3.5 w-3.5" /> Activate
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
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
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { Create, Details, Edit } from '.'
import { setLocalValues, uploadTemplateColumData, copyToClipboard } from '@/Global'
import { Pencil, MoonStar, Sun, Copy, Check } from 'lucide-vue-next'
import { useRouter } from 'vue-router';
import { MemberTemplate } from './imgration/index';
import { licenseState } from '@/tenant/apis/licenseState';

const copiedCode = ref<number | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | null = null
function copyCode(item: any) {
    if (!item?.memeber_code) return
    copyToClipboard(String(item.memeber_code))
    copiedCode.value = item.id
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copiedCode.value = null), 1500)
}
onBeforeUnmount(() => { if (copyTimer) clearTimeout(copyTimer) })
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
    { key: 'sex', label: 'Gender' },
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

// Safari/strict parsers reject "YYYY-MM-DD HH:mm:ss"; normalise the space to 'T'.
function parseDate(d: any): Date | null {
    if (!d) return null
    const date = new Date(String(d).trim().replace(' ', 'T'))
    return isNaN(date.getTime()) ? null : date
}

function formatJoined(d: any) {
    const date = parseDate(d)
    if (!date) return '—'
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function relativeJoined(d: any) {
    const date = parseDate(d)
    if (!date) return ''
    const days = Math.floor((Date.now() - date.getTime()) / 86400000)
    if (days < 0) return ''
    if (days === 0) return 'today'
    if (days === 1) return 'yesterday'
    if (days < 30) return `${days} days ago`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
    const years = Math.floor(days / 365)
    return `${years} year${years > 1 ? 's' : ''} ago`
}

function genderPill(sex: any) {
    const g = String(sex ?? '').trim().toLowerCase()
    if (g === 'male' || g === 'm') return 'bg-teal-50 text-teal-700 ring-teal-600/15 dark:bg-teal-500/10 dark:text-teal-300'
    if (g === 'female' || g === 'f') return 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300'
    return 'bg-neutral-100 text-neutral-500 ring-neutral-500/15 dark:bg-neutral-800 dark:text-neutral-300'
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
