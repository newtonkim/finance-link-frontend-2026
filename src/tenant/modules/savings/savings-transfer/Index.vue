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

        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </template>

        <!-- Bespoke transfers table (keeps TableDrawer data / search / drawer / pagination) -->
        <template #table="{ rows, loading, onAction }">
            <table class="w-full min-w-230 border-collapse text-left text-sm">
                <thead>
                    <tr class="border-b border-slate-200 dark:border-neutral-800">
                        <th class="px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.09em] text-slate-400">Transfer</th>
                        <th class="px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.09em] text-slate-400">Member</th>
                        <th class="px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.09em] text-slate-400">Flow</th>
                        <th class="px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.09em] text-slate-400">Status</th>
                        <th class="px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-[0.09em] text-slate-400">Amount</th>
                        <th class="px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-[0.09em] text-slate-400 hide-on-print">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-neutral-800">
                    <!-- Loading -->
                    <template v-if="loading">
                        <tr v-for="i in 5" :key="`s${i}`" class="animate-pulse">
                            <td class="px-6 py-4"><div class="h-3.5 w-28 rounded bg-slate-100 dark:bg-neutral-800" /><div class="mt-2 h-2.5 w-16 rounded bg-slate-100 dark:bg-neutral-800" /></td>
                            <td class="px-6 py-4"><div class="flex items-center gap-3"><div class="size-9 rounded-full bg-slate-100 dark:bg-neutral-800" /><div class="h-3.5 w-24 rounded bg-slate-100 dark:bg-neutral-800" /></div></td>
                            <td class="px-6 py-4"><div class="h-3.5 w-48 rounded bg-slate-100 dark:bg-neutral-800" /></td>
                            <td class="px-6 py-4"><div class="h-5 w-20 rounded-full bg-slate-100 dark:bg-neutral-800" /></td>
                            <td class="px-6 py-4"><div class="ml-auto h-4 w-24 rounded bg-slate-100 dark:bg-neutral-800" /></td>
                            <td class="px-6 py-4"><div class="ml-auto h-7 w-16 rounded bg-slate-100 dark:bg-neutral-800" /></td>
                        </tr>
                    </template>

                    <!-- Empty -->
                    <tr v-else-if="!rows.length">
                        <td colspan="6" class="px-6 py-20 text-center">
                            <div class="mx-auto flex max-w-xs flex-col items-center">
                                <span class="mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-neutral-800">
                                    <ArrowLeftRight :size="22" />
                                </span>
                                <p class="text-sm font-bold text-slate-700 dark:text-neutral-200">No transfers yet</p>
                                <p class="mt-1 text-xs text-slate-400">Peer-to-peer transfers between member accounts will appear here.</p>
                            </div>
                        </td>
                    </tr>

                    <!-- Rows -->
                    <tr v-else v-for="item in rows" :key="item.id ?? item.code"
                        class="group transition-colors hover:bg-[#052659]/2.5 dark:hover:bg-neutral-800/40">
                        <!-- Transfer: code · date -->
                        <td class="px-6 py-4 align-top">
                            <CopyData :copy="item.code">
                                <template #text>
                                    <button type="button" @click="navigateToProfileFulldetailes(item)"
                                        class="block max-w-48 truncate text-left font-mono text-[13px] font-bold text-[#052659] transition-colors hover:underline dark:text-white">
                                        {{ item.code }}
                                    </button>
                                </template>
                            </CopyData>
                            <div class="mt-1 text-[11px] font-medium text-slate-400">{{ fmtDate(item.created_at) }}</div>
                        </td>

                        <!-- Member -->
                        <td class="px-6 py-4 align-top">
                            <button type="button" @click="navigateToProfile(item)" class="flex items-center gap-3 text-left">
                                <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#052659]/10 text-[11px] font-black uppercase text-[#052659] ring-1 ring-[#052659]/10 dark:bg-white/10 dark:text-white dark:ring-white/10">
                                    {{ initials(item.member_name) }}
                                </span>
                                <span class="min-w-0 truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-[#052659] dark:text-white">
                                    {{ item.member_name || '—' }}
                                </span>
                            </button>
                        </td>

                        <!-- Flow: from → to -->
                        <td class="px-6 py-4 align-top">
                            <div class="flex items-center gap-2.5">
                                <div class="min-w-0 rounded-lg bg-rose-50/70 px-2.5 py-1.5 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:ring-rose-500/20">
                                    <div class="truncate font-mono text-[12px] font-bold text-rose-800 dark:text-rose-300">{{ item.transfer_from_account || '—' }}</div>
                                    <div class="truncate text-[10px] font-medium capitalize text-rose-600/80">{{ item.transfer_from_product || 'account' }}</div>
                                </div>
                                <ArrowRight :size="15" class="shrink-0 text-slate-300" />
                                <div class="min-w-0 rounded-lg bg-emerald-50/70 px-2.5 py-1.5 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
                                    <div class="truncate font-mono text-[12px] font-bold text-emerald-800 dark:text-emerald-300">{{ item.transfer_to_account || '—' }}</div>
                                    <div class="truncate text-[10px] font-medium capitalize text-emerald-600/80">{{ item.transfer_to_product || 'account' }}</div>
                                </div>
                            </div>
                        </td>

                        <!-- Status -->
                        <td class="px-6 py-4 align-top">
                            <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize leading-none ring-1 ring-inset"
                                :class="statusPill(item.status)">
                                <span class="size-1.5 rounded-full bg-current"></span>
                                {{ item.status }}
                            </span>
                            <div v-if="item.count > 1" class="mt-1.5">
                                <span class="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-neutral-800"
                                    title="Contains more transactions">+{{ item.count - 1 }} more</span>
                            </div>
                        </td>

                        <!-- Amount -->
                        <td class="px-6 py-4 text-right align-top">
                            <div class="font-mono text-[15px] font-black tracking-tight text-[#052659] dark:text-white">
                                {{ fmtMoney(item.transfer_amount) }}
                            </div>
                            <div class="mt-0.5 text-[11px] font-medium text-slate-400">Bal {{ fmtMoney(item.account_balance) }}</div>
                        </td>

                        <!-- Actions -->
                        <td class="px-6 py-4 text-right align-top hide-on-print">
                            <div class="inline-flex items-center gap-1">
                                <button type="button" @click="onAction(item, 'view')" title="View details"
                                    class="flex size-8 items-center justify-center rounded-lg text-[#052659] transition hover:bg-[#052659] hover:text-white dark:text-white">
                                    <Eye class="size-4" />
                                </button>
                                <button type="button" @click="onAction(item, 'delete')" title="Delete transfer"
                                    class="flex size-8 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 hover:text-rose-600">
                                    <Trash2 class="size-4" />
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </template>

        <template #drawer="{ action, data }">
            <Details v-if="['view'].includes(action)" :data="data" @actionTaken="() => refresh()" />
            <Create v-else :data="{ ...data, action }" v-model:form="formData" />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeftRight, ArrowRight, Eye, Trash2 } from 'lucide-vue-next'
import { Create, Details } from '.'
import { setLocalValues, formatMoneyValue } from '@/Global'
import { useRouter } from 'vue-router';

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

function statusPill(status?: string): string {
    const s = String(status ?? '').toLowerCase()
    if (['completed', 'approved', 'success'].includes(s)) return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
    if (['pending', 'trial', 'processing'].includes(s)) return 'bg-amber-50 text-amber-700 ring-amber-600/20'
    if (['rejected', 'failed', 'cancelled', 'canceled'].includes(s)) return 'bg-rose-50 text-rose-600 ring-rose-600/20'
    return 'bg-slate-100 text-slate-600 ring-slate-500/20'
}
function initials(name?: string): string {
    return String(name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '—'
}
function fmtMoney(v?: string | number): string {
    return formatMoneyValue(v ?? 0)
}
function fmtDate(d?: string): string {
    if (!d) return '—'
    const date = new Date(d)
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
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
    { key: 'created_at', label: 'created at', type: 'date', width: '10em', },
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
    setLocalValues('memberProfile', { ...item, id: item?.member_id })
}
function navigateToProfileFulldetailes(item: any) {
    router.push(`/tenant/savings-transfer-details`)
    setLocalValues('transaferDetails', { ...item })
}
</script>
