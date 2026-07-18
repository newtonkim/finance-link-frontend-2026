<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { savingsAccountsApi } from '@/tenant/apis/savingsAccounts/savingsAccountsApi'
import InterestPostingHistory from '@/tenant/modules/savings/components/InterestPostingHistory.vue'
import { useCurrencyStore } from '@/stores/currency'
import { notify } from '@/Global/Toasters'
import { formatMoneyValue, copyToClipboard } from '@/Global'
import { saccoBrandingState } from '@/tenant/apis/saccobranding/saccoBrandingApi'
import {
    Lock, Copy, Check, FileText, ChevronRight,
} from 'lucide-vue-next'

const currencyStore = useCurrencyStore()
const currency = computed(() => currencyStore.currencyCode)

const loading = ref(true)
const fdLoading = ref(false)
const fdAccount = ref<Record<string, any> | null>(null)

const props = defineProps({
    data: {
        type: Object,
        required: true,
    },
})

const isFixed = computed(() => props.data?.type === 'fixed' || props.data?.account_type === 'fixed')

const transactions = ref<any[]>([])

// ---- account information rows ------------------------------------------
const infoRows = computed(() => [
    { label: 'Account number', value: props.data?.account_code || '—', mono: true },
    { label: 'Operating mode', value: isFixed.value ? 'Fixed deposit' : 'Ordinary savings' },
    { label: 'Product type', value: props.data?.product || '—', cap: true },
    { label: 'Account type', value: props.data?.type || '—', cap: true },
    { label: 'Currency', value: currency.value },
    { label: 'Phone', value: props.data?.phone || '—', mono: true },
    { label: 'Interest rate', value: props.data?.intrest != null ? formatRate(props.data.intrest) + ' p.a.' : '—' },
    { label: 'Opening date', value: fmtDate(props.data?.created_at) },
])

// ---- statement-style ledger (matches printable statement) ---------------
function isChargeTxn(t: any) {
    return /charge/i.test(String(t?.type ?? ''))
}
const ledger = computed(() => {
    // Chronological; within the same timestamp the principal (deposit/withdrawal)
    // always posts before its charge.
    const rows = [...transactions.value].sort((a, b) => {
        const da = new Date(a.created_at || a.transaction_date || 0).getTime()
        const db = new Date(b.created_at || b.transaction_date || 0).getTime()
        if (da !== db) return da - db
        return (isChargeTxn(a) ? 1 : 0) - (isChargeTxn(b) ? 1 : 0)
    })

    let totalCredit = 0
    let totalDebit = 0
    const prepared = rows.map((t, i) => {
        const principal = Number(t.total ?? 0)
        const charge = Number(t.charge ?? 0)
        const credit = isCredit(t.type)
        const creditVal = credit ? principal : 0
        // Charges always reduce the balance, so they post to the debit column.
        const debitVal = (credit ? 0 : principal) + charge
        totalCredit += creditVal
        totalDebit += debitVal
        return { t, no: i + 1, charge, credit, creditVal, debitVal, reversed: isReversed(t) }
    })

    const closing = Number(props.data?.blc ?? 0)
    // Derive the brought-forward opening so the running balance reconciles to the
    // account's current balance (per-transaction balances are not stored).
    const opening = closing - (totalCredit - totalDebit)

    let bal = opening
    const items = prepared.map((p) => {
        bal += p.creditVal - p.debitVal
        return {
            ...p.t,
            _no: p.no,
            _charge: p.charge,
            _isCredit: p.credit,
            _debit: p.debitVal,
            _credit: p.creditVal,
            _balance: bal,
            _reversed: p.reversed,
        }
    })

    return { items, opening, closing, totalCredit, totalDebit }
})

// ---- balance tiles ------------------------------------------------------
const balanceTiles = computed(() => [
    { label: 'Current balance', value: props.data?.blc, sub: '', rate: false, text: false },
    { label: 'Opening balance', value: props.data?.opblc, sub: '', rate: false, text: false },
    { label: 'Interest rate', value: props.data?.intrest, sub: 'per annum', rate: true, text: false },
    { label: 'Account type', value: props.data?.type || '—', sub: props.data?.product || '', rate: false, text: true },
])

// ---- copy account code --------------------------------------------------
const copied = ref(false)
function copyCode() {
    if (!props.data?.account_code) return
    copyToClipboard(String(props.data.account_code))
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
}

// ---- formatting helpers -------------------------------------------------
function memberInitials(name?: string): string {
    const words = String(name ?? '').trim().split(/\s+/).filter(Boolean)
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
    return String(name ?? '—').slice(0, 2).toUpperCase()
}
function fmtDate(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatRate(r: number | null | undefined) {
    if (r == null) return '—'
    const n = Number(r)
    return (n <= 1 ? n * 100 : n).toFixed(2).replace(/\.00$/, '') + '%'
}

function statusPill(s?: string): string {
    const v = String(s ?? '').toLowerCase()
    if (['active'].includes(v)) return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300'
    if (['suspended', 'expired', 'closed'].includes(v)) return 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300'
    if (['trial', 'dormant', 'pending'].includes(v)) return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300'
    return 'bg-neutral-100 text-neutral-600 ring-neutral-500/20 dark:bg-neutral-800 dark:text-neutral-300'
}

// ---- transaction presentation ------------------------------------------
function isCredit(t?: string) {
    return ['deposit', 'opening', 'opening-balance', 'interest', 'reversed', 'charge-reversal'].includes(
        String(t ?? '').toLowerCase(),
    )
}
function isReversed(item: any) {
    return ['true', '1', true].includes(item?.reversed)
}
// Strip backend-embedded "<amount> Blc :<balance>" tail from narrations,
// e.g. "Initial Deposit Charge: 4000.00 Blc :996000" -> "Initial Deposit Charge".
function cleanNarration(s: any): string {
    return String(s ?? '')
        .replace(/\s*:?\s*[\d.,]+\s*blc\s*:?\s*[\d.,]+\s*$/i, '')
        .replace(/[:\s]+$/, '')
        .trim()
}

// ---- printable SACCO statement -----------------------------------------
function esc(v: any): string {
    return String(v ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}
function amt(v: any): string {
    return formatMoneyValue(Number(v ?? 0))
}

function openStatement() {
    const { items, opening, closing, totalCredit, totalDebit } = ledger.value
    const rows = items

    const bodyRows = rows.map((t) => `
        <tr class="${t._reversed ? 'reversed' : ''} ${t._no % 2 ? 'zebra' : ''}">
            <td class="c">${t._no}</td>
            <td class="nowrap">${esc(fmtDate(t.created_at || t.transaction_date))}</td>
            <td class="mono">${esc(t.reference || '—')}</td>
            <td>
                <span class="desc">${esc(cleanNarration(t.narration) || t.type || '—')}</span>
                ${t._reversed ? '<span class="rev-tag">REVERSED</span>' : ''}
            </td>
            <td class="num">${t._debit ? esc(amt(t._debit)) : ''}</td>
            <td class="num">${t._credit ? esc(amt(t._credit)) : ''}</td>
            <td class="num bal">${esc(amt(t._balance))}</td>
        </tr>`).join('')

    const branding = saccoBrandingState
    const saccoName = esc(branding?.sacco_name || 'Savings & Credit Cooperative')
    const tagline = esc(branding?.tagline || '')
    const logo = branding?.logo_url
    const generated = new Date().toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
    const periodFrom = rows.length ? fmtDate(rows[0].created_at || rows[0].transaction_date) : '—'
    const periodTo = rows.length ? fmtDate(rows[rows.length - 1].created_at || rows[rows.length - 1].transaction_date) : '—'

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Statement — ${esc(props.data?.member_name || '')}</title>
<style>
    @page { size: A4; margin: 14mm 12mm; }
    * { box-sizing: border-box; }
    body { font-family: "Helvetica Neue", Arial, sans-serif; color: #1a1a1a; font-size: 11px; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .accent { color: #06265a; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #06265a; padding-bottom: 12px; }
    .brand { display: flex; gap: 12px; align-items: center; }
    .brand img { height: 46px; width: auto; object-fit: contain; }
    .brand .logo-fallback { height: 46px; width: 46px; border-radius: 10px; background: #06265a; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; }
    .sacco-name { font-size: 17px; font-weight: 800; letter-spacing: -.2px; }
    .tagline { color: #666; font-size: 10px; margin-top: 1px; }
    .doc-title { text-align: right; }
    .doc-title h1 { font-size: 13px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin: 0; color: #06265a; }
    .doc-title p { color: #666; font-size: 10px; margin: 2px 0 0; }
    .meta { display: flex; justify-content: space-between; gap: 24px; margin: 16px 0; }
    .meta .block { flex: 1; }
    .meta .block h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin: 0 0 5px; }
    .meta .row { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dotted #e5e5e5; }
    .meta .row span:first-child { color: #777; }
    .meta .row span:last-child { font-weight: 600; }
    .mono { font-family: "Courier New", monospace; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e5e5e5; border: 1px solid #e5e5e5; border-radius: 6px; overflow: hidden; margin-bottom: 14px; }
    .summary .cell { background: #fafafa; padding: 9px 11px; }
    .summary .cell.k { background: #06265a; }
    .summary .cell .lbl { font-size: 8.5px; text-transform: uppercase; letter-spacing: .6px; color: #888; }
    .summary .cell.k .lbl { color: #cfe0ff; }
    .summary .cell .val { font-size: 14px; font-weight: 800; margin-top: 2px; }
    .summary .cell.k .val { color: #fff; }
    .summary .cell .cur { font-size: 9px; font-weight: 600; color: #aaa; }
    .summary .cell.k .cur { color: #cfe0ff; }
    table.ledger { width: 100%; border-collapse: collapse; font-size: 10px; }
    table.ledger thead th { background: #06265a; color: #fff; text-align: left; padding: 7px 8px; font-size: 9px; text-transform: uppercase; letter-spacing: .5px; }
    table.ledger thead th.num { text-align: right; }
    table.ledger thead th.c { text-align: center; }
    table.ledger td { padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
    table.ledger td.num { text-align: right; font-variant-numeric: tabular-nums; }
    table.ledger td.c { text-align: center; color: #999; }
    table.ledger td.bal { font-weight: 700; }
    table.ledger tr.zebra td { background: #f7f9fc; }
    table.ledger tr.reversed td { color: #b00; text-decoration: line-through; }
    table.ledger tr.reversed .rev-tag { text-decoration: none; }
    .desc { text-transform: capitalize; }
    .muted { color: #999; }
    .rev-tag { display: inline-block; margin-left: 5px; font-size: 8px; font-weight: 800; color: #b00; border: 1px solid #f2bcbc; border-radius: 3px; padding: 0 3px; vertical-align: middle; }
    tr.total td { border-top: 2px solid #06265a; font-weight: 800; padding-top: 8px; }
    tr.closing td { background: #eef4ff; font-weight: 800; font-size: 11px; }
    .empty { text-align: center; padding: 30px; color: #999; }
    .foot { margin-top: 18px; padding-top: 10px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; color: #999; font-size: 9px; }
    @media print { .noprint { display: none; } }
    .noprint { text-align: center; margin: 16px 0; }
    .noprint button { background: #06265a; color: #fff; border: 0; padding: 9px 22px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 12px; }
</style></head>
<body>
    <div class="head">
        <div class="brand">
            ${logo ? `<img src="${esc(logo)}" alt="logo" onerror="this.style.display='none'">` : `<div class="logo-fallback">${esc((branding?.sacco_name || 'SA').slice(0, 2).toUpperCase())}</div>`}
            <div>
                <div class="sacco-name">${saccoName}</div>
                ${tagline ? `<div class="tagline">${tagline}</div>` : ''}
            </div>
        </div>
        <div class="doc-title">
            <h1>Statement of Account</h1>
            <p>Generated ${esc(generated)}</p>
        </div>
    </div>

    <div class="meta">
        <div class="block">
            <h3>Account holder</h3>
            <div class="row"><span>Name</span><span>${esc(props.data?.member_name || '—')}</span></div>
            <div class="row"><span>Account number</span><span class="mono">${esc(props.data?.account_code || '—')}</span></div>
            <div class="row"><span>Phone</span><span class="mono">${esc(props.data?.phone || '—')}</span></div>
        </div>
        <div class="block">
            <h3>Account</h3>
            <div class="row"><span>Product</span><span>${esc(props.data?.product || '—')}</span></div>
            <div class="row"><span>Currency</span><span>${esc(currency.value)}</span></div>
            <div class="row"><span>Status</span><span style="text-transform:capitalize">${esc(props.data?.status || '—')}</span></div>
            <div class="row"><span>Statement period</span><span>${esc(periodFrom)} — ${esc(periodTo)}</span></div>
        </div>
    </div>

    <div class="summary">
        <div class="cell"><div class="lbl">Opening balance</div><div class="val"><span class="cur">${esc(currency.value)}</span> ${esc(amt(opening))}</div></div>
        <div class="cell"><div class="lbl">Total credits</div><div class="val" style="color:#0a7d3c"><span class="cur">${esc(currency.value)}</span> ${esc(amt(totalCredit))}</div></div>
        <div class="cell"><div class="lbl">Total debits</div><div class="val" style="color:#b00"><span class="cur">${esc(currency.value)}</span> ${esc(amt(totalDebit))}</div></div>
        <div class="cell k"><div class="lbl">Closing balance</div><div class="val"><span class="cur">${esc(currency.value)}</span> ${esc(amt(closing))}</div></div>
    </div>

    <table class="ledger">
        <thead>
            <tr>
                <th class="c">#</th>
                <th>Date</th>
                <th>Reference</th>
                <th>Description</th>
                <th class="num">Debit (${esc(currency.value)})</th>
                <th class="num">Credit (${esc(currency.value)})</th>
                <th class="num">Balance (${esc(currency.value)})</th>
            </tr>
        </thead>
        <tbody>
            <tr class="zebra"><td></td><td colspan="3"><b>Opening balance</b></td><td class="num"></td><td class="num"></td><td class="num bal">${esc(amt(opening))}</td></tr>
            ${bodyRows || ''}
            ${rows.length ? '' : '<tr><td colspan="7" class="empty">No transactions recorded for this account.</td></tr>'}
            <tr class="total"><td colspan="4">Totals</td><td class="num">${esc(amt(totalDebit))}</td><td class="num">${esc(amt(totalCredit))}</td><td class="num"></td></tr>
            <tr class="closing"><td colspan="6">Closing balance</td><td class="num bal">${esc(amt(closing))}</td></tr>
        </tbody>
    </table>

    <div class="foot">
        <span>This is a computer-generated statement and does not require a signature.</span>
        <span>${saccoName} · ${esc(generated)}</span>
    </div>

    <div class="noprint"><button onclick="window.print()">Print statement</button></div>
    ${/* keep the script closing tag escaped as <\/script>: written un-escaped it
         would terminate this SFC's script block and break Vue's template parser */ ''}
    <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 350); };<\/script>
</body></html>`

    const win = window.open('', '_blank', 'width=900,height=1000')
    if (!win) {
        notify({ msg: 'Allow pop-ups to open the statement.', type: 'warning' })
        return
    }
    win.document.open()
    win.document.write(html)
    win.document.close()
}

// ---- data load ----------------------------------------------------------
const isMatured = computed(() => {
    const md = fdAccount.value?.maturity_date
    if (!md) return false
    return new Date(md) <= new Date()
})

async function loadFdDetails() {
    if (!props.data?.id) return
    fdLoading.value = true
    try {
        const res = await savingsAccountsApi.show(props.data.id)
        fdAccount.value = res.data?.data ?? res.data
    } catch {
        // non-critical — FD panel just won't show extra data
    } finally {
        fdLoading.value = false
    }
}

function prepareTransactions() {
    transactions.value = (props.data?.transactionList ?? []).map((e: any) => ({
        id: e.id,
        reference: e.reference,
        total: e.total,
        charge: e.charge,
        amount: e.amount,
        type: e.type,
        mode: e.mode,
        narration: e.narration,
        transfer_by: e.by,
        transaction_date: e.transaction_date,
        created_at: e.created_at,
        reversed: e.reversed,
    }))
}

onMounted(async () => {
    loading.value = true
    prepareTransactions()
    loading.value = false
    if (isFixed.value) loadFdDetails()
})
</script>

<template>
    <div class="h-[90vh] overflow-y-auto bg-neutral-50 px-3 py-4 dark:bg-neutral-950 sm:px-5">
        <!-- ───────────── Top bar: context + actions ───────────── -->
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <nav class="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
                <span>Members</span>
                <ChevronRight :size="12" />
                <span>Savings accounts</span>
                <ChevronRight :size="12" />
                <span class="font-semibold text-neutral-700 dark:text-neutral-200">Account details</span>
            </nav>
            <button type="button" @click="openStatement"
                class="inline-flex items-center gap-1.5 rounded-lg border border-[#06265a]/25 bg-[#06265a]/5 px-3.5 py-1.5 text-xs font-semibold text-[#06265a] shadow-sm transition-colors hover:bg-[#06265a]/15 dark:border-[#06265a]/40 dark:bg-[#06265a]/30 dark:text-[#9db4dd]">
                <FileText :size="14" /> Statement
            </button>
        </div>

        <!-- ───────────── Member identity card ───────────── -->
        <section
            class="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="flex min-w-0 items-center gap-4">
                    <div
                        class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#06265a]/5 ring-1 ring-[#06265a]/15 dark:bg-[#06265a]/30 dark:ring-[#06265a]/40">
                        <img v-if="data.member_image" :src="data.member_image" :alt="data.member_name"
                            class="size-full object-cover" />
                        <span v-else class="text-base font-bold text-[#06265a] dark:text-[#9db4dd]">
                            {{ memberInitials(data.member_name) }}
                        </span>
                    </div>
                    <div class="min-w-0">
                        <h2 class="truncate text-lg font-bold text-neutral-900 dark:text-white">
                            {{ data.member_name || 'Unnamed member' }}
                        </h2>
                        <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
                            <button type="button" @click="copyCode" :disabled="!data.account_code"
                                class="group inline-flex items-center gap-1 font-mono text-[#06265a] transition-colors disabled:cursor-default dark:text-[#9db4dd]"
                                :title="data.account_code ? 'Copy account number' : ''">
                                {{ data.account_code || '—' }}
                                <Check v-if="copied" :size="11" class="text-emerald-600" />
                                <Copy v-else-if="data.account_code" :size="11"
                                    class="text-neutral-300 transition-colors group-hover:text-neutral-500" />
                            </button>
                            <span class="text-neutral-300">·</span>
                            <span>Opened {{ fmtDate(data.created_at) }}</span>
                            <template v-if="data.product">
                                <span class="text-neutral-300">·</span>
                                <span class="capitalize">{{ data.product }}</span>
                            </template>
                        </div>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <span v-if="isFixed"
                        class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300">
                        <Lock :size="12" /> Fixed deposit
                    </span>
                    <span :class="[
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset',
                        statusPill(data.status),
                    ]">
                        <span class="size-1.5 rounded-full bg-current opacity-70" />
                        {{ data.status || 'unknown' }}
                    </span>
                </div>
            </div>
        </section>

        <!-- ───────────── Balance tiles ───────────── -->
        <section class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div v-for="tile in balanceTiles" :key="tile.label"
                class="rounded-2xl border border-neutral-200/80 bg-[#06265a]/5 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <p class="text-xs font-medium text-neutral-500">{{ tile.label }}</p>
                <p v-if="tile.text" class="mt-1.5 truncate text-xl font-bold capitalize text-neutral-900 dark:text-white">
                    {{ tile.value }}
                </p>
                <p v-else-if="tile.rate" class="mt-1.5 text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">
                    {{ formatRate(tile.value) }}
                </p>
                <p v-else class="mt-1.5 text-2xl font-bold leading-tight tracking-tight text-neutral-900 dark:text-white">
                    <span class="text-sm font-semibold text-neutral-400">{{ currency }}</span>
                    <span class="tabular-nums"> {{ formatMoneyValue(Number(tile.value ?? 0)) }}</span>
                </p>
                <p v-if="tile.sub" class="mt-1 truncate text-xs text-neutral-400">{{ tile.sub }}</p>
            </div>
        </section>

        <!-- ───────────── Account information ───────────── -->
        <section
            class="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <header class="border-b border-neutral-200 px-5 py-3.5 dark:border-neutral-800">
                <h3 class="text-sm font-bold text-neutral-800 dark:text-neutral-100">Account information</h3>
            </header>
            <dl class="grid grid-cols-1 sm:grid-cols-2">
                <div v-for="(row, idx) in infoRows" :key="row.label"
                    class="flex items-center justify-between gap-4 border-neutral-100 px-5 py-3 dark:border-neutral-800"
                    :class="[idx < infoRows.length - (infoRows.length % 2 === 0 ? 2 : 1) ? 'border-b' : '', idx % 2 === 0 ? 'sm:border-r' : '']">
                    <dt class="text-sm text-neutral-500">{{ row.label }}</dt>
                    <dd class="truncate text-right text-sm font-semibold text-neutral-800 dark:text-neutral-100"
                        :class="{ 'font-mono': row.mono, 'capitalize': row.cap }" :title="String(row.value)">
                        {{ row.value }}
                    </dd>
                </div>
            </dl>
        </section>

        <!-- ───────────── Fixed deposit panel ───────────── -->
        <section v-if="isFixed" class="mt-4">
            <div v-if="fdLoading"
                class="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
                <div class="h-3 w-32 animate-pulse rounded bg-amber-100 dark:bg-amber-500/20" />
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div v-for="i in 4" :key="i" class="space-y-1.5">
                        <div class="h-2.5 w-20 animate-pulse rounded bg-amber-100 dark:bg-amber-500/20" />
                        <div class="h-4 w-24 animate-pulse rounded bg-amber-100 dark:bg-amber-500/20" />
                    </div>
                </div>
            </div>

            <div v-else-if="fdAccount"
                class="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
                <div class="mb-4 flex items-center justify-between">
                    <p class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                        <Lock :size="13" /> Fixed deposit terms
                    </p>
                    <span :class="[
                        'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                        isMatured ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
                    ]">
                        {{ isMatured ? 'Matured' : 'Active' }}
                    </span>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-5">
                    <div>
                        <p class="text-[10px] font-semibold uppercase tracking-wider text-amber-600/70 dark:text-amber-300/60">Tenor</p>
                        <p class="mt-0.5 font-bold text-neutral-800 dark:text-neutral-100">
                            {{ fdAccount.tenor_months != null ? fdAccount.tenor_months + ' months' : '—' }}
                        </p>
                    </div>
                    <div>
                        <p class="text-[10px] font-semibold uppercase tracking-wider text-amber-600/70 dark:text-amber-300/60">Maturity date</p>
                        <p class="mt-0.5 font-bold text-neutral-800 dark:text-neutral-100">{{ fmtDate(fdAccount.maturity_date) }}</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-semibold uppercase tracking-wider text-amber-600/70 dark:text-amber-300/60">Interest rate</p>
                        <p class="mt-0.5 font-bold text-neutral-800 dark:text-neutral-100">{{ formatRate(fdAccount.interest_rate) }} p.a.</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-semibold uppercase tracking-wider text-amber-600/70 dark:text-amber-300/60">Next interest</p>
                        <p class="mt-0.5 font-bold text-neutral-800 dark:text-neutral-100">{{ fmtDate(fdAccount.next_interest_date) }}</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-semibold uppercase tracking-wider text-amber-600/70 dark:text-amber-300/60">On maturity</p>
                        <p class="mt-0.5 font-bold capitalize text-neutral-800 dark:text-neutral-100">{{ fdAccount.maturity_action ?? '—' }}</p>
                    </div>
                </div>
            </div>

            <div v-if="fdAccount" class="mt-4">
                <InterestPostingHistory :account-id="data.id" :currency="currency" />
            </div>
        </section>

        <!-- ───────────── Recent transactions ───────────── -->
        <section
            class="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <header class="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5 dark:border-neutral-800">
                <h3 class="text-sm font-bold text-neutral-800 dark:text-neutral-100">Recent transactions</h3>
                <button type="button" @click="openStatement"
                    class="inline-flex items-center gap-1 text-xs font-semibold text-[#06265a] hover:underline dark:text-[#9db4dd]">
                    View full statement <ChevronRight :size="13" />
                </button>
            </header>

            <div v-if="loading" class="space-y-2 p-4">
                <div v-for="i in 4" :key="i" class="h-10 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            </div>

            <div v-else-if="!transactions.length" class="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
                <div class="flex size-12 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                    <FileText :size="20" class="text-neutral-400" />
                </div>
                <p class="text-sm font-semibold text-neutral-700 dark:text-neutral-200">No transactions yet</p>
                <p class="max-w-xs text-xs text-neutral-400">
                    Deposits, withdrawals and charges on this account will appear here.
                </p>
            </div>

            <div v-else class="overflow-x-auto">
                <table class="w-full min-w-160 border-collapse text-sm">
                    <thead>
                        <tr class="bg-[#06265a] text-left align-bottom text-[11px] font-bold uppercase tracking-wider text-white">
                            <th class="px-4 py-2.5 text-center">#</th>
                            <th class="px-4 py-2.5">Date</th>
                            <th class="px-4 py-2.5">Reference</th>
                            <th class="px-4 py-2.5">Description</th>
                            <th class="px-4 py-2.5 text-right">Debit<br>({{ currency }})</th>
                            <th class="px-4 py-2.5 text-right">Credit<br>({{ currency }})</th>
                            <th class="px-4 py-2.5 text-right">Balance<br>({{ currency }})</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- opening balance -->
                        <tr class="bg-[#06265a]/5 dark:bg-neutral-800/40">
                            <td class="px-4 py-3"></td>
                            <td class="px-4 py-3 font-bold text-neutral-800 dark:text-neutral-100" colspan="3">Opening balance</td>
                            <td class="px-4 py-3"></td>
                            <td class="px-4 py-3"></td>
                            <td class="px-4 py-3 text-right font-bold tabular-nums text-neutral-900 dark:text-white">
                                {{ formatMoneyValue(ledger.opening) }}
                            </td>
                        </tr>

                        <!-- rows -->
                        <tr v-for="row in ledger.items" :key="row.id ?? row._no"
                            class="group border-b border-neutral-100 transition-colors odd:bg-neutral-50/60 hover:bg-[#06265a]/5 dark:border-neutral-800 dark:odd:bg-neutral-800/20"
                            :class="{ 'text-rose-600 line-through dark:text-rose-400': row._reversed }">
                            <td class="px-4 py-3 text-center text-xs text-neutral-400">{{ row._no }}</td>
                            <td class="whitespace-nowrap px-4 py-3 text-neutral-600 dark:text-neutral-300">
                                {{ fmtDate(row.created_at || row.transaction_date) }}
                            </td>
                            <td class="whitespace-nowrap px-4 py-3">
                                <span class="font-mono text-xs text-[#06265a] dark:text-[#9db4dd]">{{ row.reference || '—' }}</span>
                            </td>
                            <td class="px-4 py-3">
                                <span class="capitalize text-neutral-800 dark:text-neutral-100">{{ cleanNarration(row.narration) || row.type || '—' }}</span>
                                <span v-if="row._reversed"
                                    class="ml-1.5 inline-block rounded border border-rose-200 px-1 align-middle text-[9px] font-bold uppercase leading-tight text-rose-600 no-underline dark:border-rose-500/30">Reversed</span>
                            </td>
                            <td class="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-200">
                                {{ row._debit ? formatMoneyValue(row._debit) : '' }}
                            </td>
                            <td class="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-200">
                                {{ row._credit ? formatMoneyValue(row._credit) : '' }}
                            </td>
                            <td class="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-neutral-900 dark:text-white">
                                {{ formatMoneyValue(row._balance) }}
                            </td>
                        </tr>

                        <!-- totals -->
                        <tr class="border-t-2 border-[#06265a] font-bold text-neutral-900 dark:text-white">
                            <td class="px-4 py-3" colspan="4">Totals</td>
                            <td class="px-4 py-3 text-right tabular-nums">{{ formatMoneyValue(ledger.totalDebit) }}</td>
                            <td class="px-4 py-3 text-right tabular-nums">{{ formatMoneyValue(ledger.totalCredit) }}</td>
                            <td class="px-4 py-3"></td>
                        </tr>
                        <!-- closing -->
                        <tr class="bg-[#06265a]/5 font-bold text-neutral-900 dark:bg-[#06265a]/30 dark:text-white">
                            <td class="px-4 py-3" colspan="6">Closing balance</td>
                            <td class="px-4 py-3 text-right tabular-nums">{{ formatMoneyValue(ledger.closing) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </div>
</template>
