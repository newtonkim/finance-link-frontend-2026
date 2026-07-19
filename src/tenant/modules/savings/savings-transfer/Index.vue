<template>
    <TableDrawer ref="drawer" :drawerWidth="drawerTitle?.width" :url="tableUrl" state="transferList"
        :drawerTitle="drawerTitle?.title" :columns="columns" @save="saveUser">
        <template #header-action>
            <div class="flex items-center gap-3">
                <span class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#052659]/10 text-[#052659] dark:bg-white/10 dark:text-white">
                    <ArrowLeftRight :size="20" />
                </span>
                <div class="min-w-0">
                    <h1 class="text-2xl font-black leading-tight tracking-tight text-[#06265a] dark:text-white">Savings transfers</h1>
                    <p class="mt-0.5 text-sm font-medium text-slate-500 dark:text-neutral-400">Move funds between member savings accounts and track every transfer.</p>
                </div>
            </div>
        </template>

        <template #member_name="{ item }">
            <button type="button" @click="navigateToProfile(item)"
                class="truncate text-left text-sm font-bold text-[#052659] transition-colors hover:underline dark:text-white">
                {{ item?.member_name }}
            </button>
        </template>

        <template #code="{ item }">
            <div class="flex flex-col gap-1.5">
                <div class="flex items-center gap-1.5">
                    <button type="button" @click="navigateToProfileFulldetailes(item)"
                        class="truncate font-mono text-[13px] font-bold text-[#052659] transition-colors hover:underline dark:text-white">
                        {{ item.code }}
                    </button>
                    <CopyData :show="item.code" />
                </div>
                <div class="flex items-center gap-2">
                    <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold capitalize leading-none ring-1 ring-inset"
                        :class="statusPill(item.status)">
                        <span class="size-1.5 rounded-full bg-current"></span>
                        {{ item.status }}
                    </span>
                    <span v-if="item.count > 1"
                        class="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-neutral-800"
                        title="Contains more transactions">
                        +{{ item.count - 1 }} more
                    </span>
                </div>
            </div>
        </template>

        <template #transfer_from_product="{ item }">
            <div class="min-w-0">
                <div class="truncate font-mono text-[13px] font-bold text-slate-800 dark:text-neutral-200">{{ item?.transfer_from_account || '—' }}</div>
                <div class="truncate text-[11px] font-medium capitalize text-slate-400">{{ item?.transfer_from_product || '—' }}</div>
            </div>
        </template>

        <template #transfer_to_product="{ item }">
            <div class="min-w-0">
                <div class="flex items-center gap-1.5 truncate">
                    <ArrowRight :size="12" class="shrink-0 text-emerald-500" />
                    <span class="truncate font-mono text-[13px] font-bold text-slate-800 dark:text-neutral-200">{{ item?.transfer_to_account || '—' }}</span>
                </div>
                <div class="truncate pl-[18px] text-[11px] font-medium capitalize text-slate-400">{{ item?.transfer_to_product || '—' }}</div>
            </div>
        </template>
        <template #searchSideAction>
           
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </template>
        <template #drawer="{ action, data }">
            <Details v-if="['view'].includes(action)" :data="data" @actionTaken="() => refresh()" />
            <Create v-else :data="{ ...data, action }" v-model:form="formData" />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeftRight, ArrowRight } from 'lucide-vue-next'
import { Create, Details } from '.'
import { setLocalValues } from '@/Global'

import { useRouter } from 'vue-router';

function statusPill(status?: string): string {
    const s = String(status ?? '').toLowerCase()
    if (['completed', 'approved', 'success'].includes(s)) return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
    if (['pending', 'trial', 'processing'].includes(s)) return 'bg-amber-50 text-amber-700 ring-amber-600/20'
    if (['rejected', 'failed', 'cancelled', 'canceled'].includes(s)) return 'bg-rose-50 text-rose-600 ring-rose-600/20'
    return 'bg-slate-100 text-slate-600 ring-slate-500/20'
}

const router = useRouter()
const formData = ref<Record<string, any>>({}), statusFilter = ref('all'),
    drawer = ref<any>(null),
    drawerTitle = ref<any>({ title: 'Create Transfer', width: 'w-1/2' }),
    filters = ["All", "rejected", "pending", "approved", "cancelled", "completed", "failed",],
    tableUrl = computed(() => `/savings-transfer/list?status=${statusFilter.value}`),
    title: Record<string, any> = {
        "view": { title: "View Savings Transfer Details", width: "w-2/3" },
        "add": { title: "Create a peer to peer transfer", width: "w-3/4" },
    }
function saveUser(type: string, data: any) {
    if (title?.[type])
        drawerTitle.value = title?.[type]
}
const columns = [
    { key: 'code', label: 'transfer code', sticky: 'left', width: '14em', copy: true },
    { key: 'member_name', label: 'Member', width: '14em ', },
    { key: 'transfer_from_product', label: 'transfer from', width: '14em ', },
    { key: 'transfer_to_product', label: 'transfer to', width: '14em ', },
    { key: 'transfer_amount', label: 'transfer', type: "money" },
    { key: 'account_balance', label: 'balance', type: "money" },
    { key: 'created_at', label: 'created at', type: 'date' , width: '10em',},
    { key: 'actions', label: 'Actions', show: ['view', 'delete'] }
]

function refresh() {
    drawer.value?.toggleDrawer()
    setTimeout(() => {
        drawer.value?.toggleDrawer()
    }, 300)
}
function navigateToProfile(item: any) {
    router.push(`/tenant/member/profile`)
    setLocalValues('memberProfile', {...item,id: item?.member_id})
}
function navigateToProfileFulldetailes(item: any) {
    router.push(`/tenant/savings-transfer-details`)
    setLocalValues('transaferDetails', {...item})
}
</script>