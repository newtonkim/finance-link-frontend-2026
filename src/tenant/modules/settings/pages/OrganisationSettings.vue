<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Building2, Search, Plus, Pencil, Trash2, X, Calendar, ArrowLeft, Coins, ImageIcon, Loader2, Receipt } from 'lucide-vue-next'
import { Spinner, InputError, Label } from '@/Global'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import MultiSearchableSelect from '@/Global/MultiSearchableSelect.vue'
import ConfirmationDialog from '@/Global/confirmationDialog/confirmationDialog.vue'
import { fiscalYearsApi } from '@/tenant/apis/fiscalYears/fiscalYearsApi'
import { currenciesApi, type CurrencyOption, type CurrencySettings } from '@/tenant/apis/currencies/currenciesApi'
import { saccoBrandingApi } from '@/tenant/apis/saccobranding/saccoBrandingApi'
import { savingsProductsApi } from '@/tenant/apis/savingsProducts/api'
import { chartOfAccountsApi } from '@/tenant/apis/chartOfAccounts/chartOfAccountsApi'
import { tenantClient } from '@/tenant/apis/tenantClient'
import { useTenantContextStore } from '@/stores/tenantContext'
import { useCurrencyStore } from '@/stores/currency'
import { toast } from 'vue-sonner'
import { SettingCard } from '@/tenant/components/globals'

const tenantContextStore = useTenantContextStore()
const currencyStore = useCurrencyStore()

// ─── Types ────────────────────────────────────────────────────────────────────
interface FiscalYear {
    id: number
    name: string
    start_date: string
    end_date: string
}
interface Meta { current_page: number; last_page: number; total: number }

const selectCls = 'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus: border-nfuko-primary focus:ring-2 focus:ring-bg-nfuko-primary/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
const inputCls = 'w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus: border-nfuko-primary focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'

// ─── Sacco Branding Drawer ────────────────────────────────────────────────────
const showBrandingDrawer = ref(false)
const brandingLoading = ref(false)
const brandingSaving = ref(false)
const brandingName = ref('')
const brandingTagline = ref('')
const brandingLogoFile = ref<File | null>(null)
const brandingLogoPreview = ref<string | null>(null)
const brandingExistingLogoUrl = ref<string | null>(null)
const brandingIsDragging = ref(false)
const brandingFileInput = ref<HTMLInputElement | null>(null)

async function openBrandingDrawer() {
    showBrandingDrawer.value = true
    brandingLoading.value = true
    try {
        const res = await saccoBrandingApi.get()
        const data = res.data?.data ?? res.data ?? null
        if (data) {
            brandingName.value = data.sacco_name ?? ''
            brandingTagline.value = data.tagline ?? ''
            brandingExistingLogoUrl.value = data.logo_url ?? null
        }
    } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to load branding.')
    } finally {
        brandingLoading.value = false
    }
}

function closeBrandingDrawer() {
    showBrandingDrawer.value = false
    brandingLogoFile.value = null
    brandingLogoPreview.value = null
}

function brandingCurrentLogo() {
    return brandingLogoPreview.value ?? brandingExistingLogoUrl.value
}

function onBrandingFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) applyBrandingFile(file)
}

function onBrandingDrop(e: DragEvent) {
    brandingIsDragging.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('image/')) applyBrandingFile(file)
}

function applyBrandingFile(file: File) {
    brandingLogoFile.value = file
    const reader = new FileReader()
    reader.onload = (ev) => { brandingLogoPreview.value = ev.target?.result as string }
    reader.readAsDataURL(file)
}

function removeBrandingLogo() {
    brandingLogoFile.value = null
    brandingLogoPreview.value = null
    if (brandingFileInput.value) brandingFileInput.value.value = ''
}

async function saveBranding() {
    brandingSaving.value = true
    try {
        const res = await saccoBrandingApi.update({
            sacco_name: brandingName.value,
            tagline: brandingTagline.value,
            logo: brandingLogoFile.value,
        })
        const data = res.data?.data ?? res.data ?? null
        if (data) {
            brandingExistingLogoUrl.value = data.logo_url ?? null
            brandingLogoFile.value = null
            brandingLogoPreview.value = null
            // saccoBrandingState is already updated inside saccoBrandingApi.update()
            // so the sidebar reacts immediately
        }
        toast.success('Branding saved successfully.')
        closeBrandingDrawer()
    } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to save branding.')
    } finally {
        brandingSaving.value = false
    }
}

// ─── Currency Settings Drawer ────────────────────────────────────────────────
const DEFAULT_CURRENCIES: CurrencyOption[] = [
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'UGX' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'SEK' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'NOK' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'DKK' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
    { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
    { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
    { code: 'XAF', name: 'Central African CFA Franc', symbol: 'CFA' },
    { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
    { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
    { code: 'BWP', name: 'Botswana Pula', symbol: 'P' },
    { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK' },
    { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨' },
]

const showCurrencyDrawer = ref(false)
const currencyLoading = ref(false)
const currencySaving = ref(false)
const currencySearch = ref('')
const multiCurrencyEnabled = ref(true)
const currencyOptions = ref<CurrencyOption[]>([...DEFAULT_CURRENCIES])
const currencyForm = ref<CurrencySettings>({
    default_currency: 'UGX',
    enabled_currencies: DEFAULT_CURRENCIES.map((c) => c.code),
})

function normalizeCurrency(raw: any): CurrencyOption | null {
    const code = raw?.code ?? raw?.currency_code ?? raw?.currency ?? ''
    if (!code) return null
    const name = raw?.name ?? raw?.currency_name ?? code
    const symbol = raw?.symbol ?? raw?.currency_symbol ?? undefined
    return { code, name, symbol }
}

function ensureDefaultEnabled() {
    const code = currencyForm.value.default_currency
    if (!code) return
    if (!multiCurrencyEnabled.value) {
        currencyForm.value.enabled_currencies = [code]
        return
    }
    if (!currencyForm.value.enabled_currencies.includes(code)) {
        currencyForm.value.enabled_currencies.push(code)
    }
}

function applyMultiCurrencyFlag() {
    if (!multiCurrencyEnabled.value) {
        currencyForm.value.enabled_currencies = [currencyForm.value.default_currency]
    }
}

const filteredCurrencies = computed(() => {
    const q = currencySearch.value.trim().toLowerCase()
    if (!q) return currencyOptions.value
    const parts = q.split(/\s+/).filter(Boolean)
    return currencyOptions.value.filter((c) => {
        const hay = [c.code, c.name, c.symbol].filter(Boolean).join(' ').toLowerCase()
        return parts.every((p) => hay.includes(p))
    })
})

const defaultCurrencyOptions = computed(() =>
    currencyOptions.value.map((c) => ({
        id: c.code,
        name: `${c.code} — ${c.name}${c.symbol ? ` (${c.symbol})` : ''}`,
    }))
)

watch(() => currencyForm.value.default_currency, ensureDefaultEnabled)
watch(multiCurrencyEnabled, applyMultiCurrencyFlag)

function openCurrencyDrawer() {
    showCurrencyDrawer.value = true
    loadCurrencySettings()
}

function closeCurrencyDrawer() {
    showCurrencyDrawer.value = false
    currencySearch.value = ''
}

function toggleCurrency(code: string) {
    if (code === currencyForm.value.default_currency) return
    const idx = currencyForm.value.enabled_currencies.indexOf(code)
    if (idx >= 0) {
        currencyForm.value.enabled_currencies.splice(idx, 1)
    } else {
        currencyForm.value.enabled_currencies.push(code)
    }
}

async function loadCurrencySettings() {
    currencyLoading.value = true
    try {
        const [listRes, settingsRes] = await Promise.allSettled([
            currenciesApi.list(),
            currenciesApi.getSettings(),
        ])

        if (listRes.status === 'fulfilled') {
            const listPayload = listRes.value.data?.data ?? listRes.value.data ?? []
            if (Array.isArray(listPayload) && listPayload.length) {
                const normalized = listPayload.map(normalizeCurrency).filter(Boolean) as CurrencyOption[]
                if (normalized.length) {
                    currencyOptions.value = normalized
                }
            }
        }

        if (settingsRes.status === 'fulfilled') {
            const settingsPayload = settingsRes.value.data?.data ?? settingsRes.value.data ?? null
            if (settingsPayload) {
                currencyForm.value = {
                    default_currency: settingsPayload.default_currency || 'UGX',
                    enabled_currencies: Array.isArray(settingsPayload.enabled_currencies) && settingsPayload.enabled_currencies.length
                        ? settingsPayload.enabled_currencies
                        : [settingsPayload.default_currency || 'UGX'],
                }
                multiCurrencyEnabled.value = currencyForm.value.enabled_currencies.length > 1
                currencyStore.setSettings(currencyForm.value)
            }
        }

        if (!currencyOptions.value.some((c) => c.code === currencyForm.value.default_currency)) {
            const fallback = DEFAULT_CURRENCIES.find((c) => c.code === currencyForm.value.default_currency)
            if (fallback) currencyOptions.value = [fallback, ...currencyOptions.value]
        }

        ensureDefaultEnabled()
    } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to load currency settings.')
    } finally {
        currencyLoading.value = false
    }
}

async function saveCurrencySettings() {
    currencySaving.value = true
    try {
        ensureDefaultEnabled()
        applyMultiCurrencyFlag()
        await currenciesApi.updateSettings(currencyForm.value)
        currencyStore.setSettings(currencyForm.value)
        closeCurrencyDrawer()
        toast.success('Currency saved successfully.')
    } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Currency did not save.')
    } finally {
        currencySaving.value = false
    }
}

// ─── General Charges Drawer ──────────────────────────────────────────────────
const showGeneralChargesDrawer = ref(false)

const generalChargeForm = ref({
    is_revenue: '',
    name: '',
    application: '',
    saving_product_ids: [] as string[],
    loan_product_ids: [] as string[],
    charge_type: '',
    amount: 0,
    credit_account_id: '',
    where_to_apply: 'loans',
    is_fine: '',
    interval_type: '',
    interval: 1 as string | number,
})

const isRevenueOptions = [
    { id: 'yes', name: 'Yes' },
    { id: 'no', name: 'No' },
]

const applicationOptions = [
    { id: 'on_shares', name: 'On Shares' },
    { id: 'on_registration', name: 'On Registration' },
    { id: 'on_loan_application', name: 'On Loan Application' },
    { id: 'other', name: 'Other' },
]

const chargeTypeOptions = [
    { id: 'percentage', name: 'Percentage' },
    { id: 'amount', name: 'Amount' },
]

const whereToApplyOptions = [
    { id: 'loans', name: 'Loans' },
    { id: 'savings', name: 'Saving products' },
    { id: 'shares', name: 'Shares' },
]

const intervalTypeOptions = [
    { id: 'days', name: 'Days' },
    { id: 'weeks', name: 'Weeks' },
    { id: 'months', name: 'Months' },
    { id: 'years', name: 'Years' },
]

const isFineOptions = [
    { id: 'yes', name: 'Yes' },
    { id: 'no', name: 'No' },
]

const savingProductOptions = ref<any[]>([])
const loanProductOptions = ref<any[]>([])
const creditAccountOptions = ref<any[]>([])

async function fetchGeneralChargesOptions() {
    try {
        const [savRes, coaRes, loanRes] = await Promise.allSettled([
            savingsProductsApi.list(),
            tenantClient.get('/chart-of-accounts', { params: { list: true, account_type: 'INCOME' } }),
            tenantClient.get('/loan-products')
        ])

        if (savRes.status === 'fulfilled') {
            const sp = savRes.value.data?.data ?? savRes.value.data ?? []
            savingProductOptions.value = Array.isArray(sp) ? sp.map((p: any) => ({ id: p.id, name: p.name ?? 'Product ' + p.id })) : []
        }

        if (coaRes.status === 'fulfilled') {
            const coa = coaRes.value.data?.data ?? coaRes.value.data ?? []
            creditAccountOptions.value = Array.isArray(coa)
                ? coa.filter((a: any) => a.account_type && a.account_type.toString().toLowerCase() === 'income')
                    .map((a: any) => ({ id: a.id, name: a.name ?? 'Account ' + a.id }))
                : []
        }

        if (loanRes.status === 'fulfilled') {
            const lp = loanRes.value.data?.data ?? loanRes.value.data ?? []
            loanProductOptions.value = Array.isArray(lp) ? lp.map((p: any) => ({ id: p.id, name: p.name ?? 'Loan ' + p.id })) : []
        }
    } catch (err) {
        console.error('Error fetching options:', err)
    }
}

onMounted(() => {
    fetchGeneralChargesOptions()
    fetchGeneralCharges()
})

function openGeneralChargesDrawer() {
    editingCharge.value = null
    generalChargeForm.value = {
        is_revenue: '',
        name: '',
        application: '',
        saving_product_ids: [],
        loan_product_ids: [],
        charge_type: '',
        amount: 0,
        credit_account_id: '',
        where_to_apply: 'loans',
        is_fine: '',
        interval_type: '',
        interval: 1,
    }
    showGeneralChargesDrawer.value = true
}

function openEditChargeDrawer(charge: GeneralCharge) {
    editingCharge.value = charge
    generalChargeForm.value = {
        is_revenue: (charge as any).is_revenue ? 'yes' : 'no',
        name: charge.name,
        application: charge.application,
        saving_product_ids: (charge as any).saving_product_ids ?? [],
        loan_product_ids: (charge as any).loan_product_ids ?? [],
        charge_type: charge.charge_type ?? '',
        amount: Number(charge.amount),
        credit_account_id: (charge as any).credit_account_id ?? '',
        where_to_apply: charge.where_to_apply ?? 'loans',
        is_fine: (charge as any).is_fine ? 'yes' : 'no',
        interval_type: (charge as any).interval_type ?? '',
        interval: (charge as any).interval ?? 1,
    }
    showGeneralChargesDrawer.value = true
}

function closeGeneralChargesDrawer() {
    editingCharge.value = null
    showGeneralChargesDrawer.value = false
}

// ─── General Charges List ────────────────────────────────────────────────────
interface GeneralCharge {
    id: number
    name: string
    application: string
    where_to_apply: string | null
    charge_type: string | null
    amount: string
    is_active: boolean
    is_reversible: boolean
    is_revenue: boolean
}

const generalCharges = ref<GeneralCharge[]>([])
const generalChargesLoading = ref(false)
const generalChargeToggling = ref<number | null>(null)
const generalChargeReversibleToggling = ref<number | null>(null)
const generalChargeDeleting = ref<number | null>(null)
const editingCharge = ref<GeneralCharge | null>(null)

async function fetchGeneralCharges() {
    generalChargesLoading.value = true
    try {
        const res = await tenantClient.get('/general-charges')
        generalCharges.value = res.data?.data ?? []
    } catch {
        toast.error('Failed to load charges.')
    } finally {
        generalChargesLoading.value = false
    }
}

async function toggleGeneralCharge(charge: GeneralCharge) {
    generalChargeToggling.value = charge.id
    try {
        const res = await tenantClient.patch(`/general-charges/${charge.id}/toggle`)
        const updated = res.data?.data
        const idx = generalCharges.value.findIndex(c => c.id === charge.id)
        if (idx !== -1) generalCharges.value[idx] = updated
    } catch {
        toast.error('Failed to toggle charge.')
    } finally {
        generalChargeToggling.value = null
    }
}

async function toggleGeneralChargeReversible(charge: GeneralCharge) {
    generalChargeReversibleToggling.value = charge.id
    try {
        const res = await tenantClient.patch(`/general-charges/${charge.id}/toggle-reversible`)
        const updated = res.data?.data
        const idx = generalCharges.value.findIndex(c => c.id === charge.id)
        if (idx !== -1) generalCharges.value[idx] = updated
    } catch {
        toast.error('Failed to toggle reversible.')
    } finally {
        generalChargeReversibleToggling.value = null
    }
}

async function deleteGeneralCharge(charge: GeneralCharge) {
    if (!confirm(`Delete charge "${charge.name}"? This cannot be undone.`)) return
    generalChargeDeleting.value = charge.id
    try {
        await tenantClient.delete(`/general-charges/${charge.id}`)
        generalCharges.value = generalCharges.value.filter(c => c.id !== charge.id)
        toast.success('Charge deleted.')
    } catch {
        toast.error('Failed to delete charge.')
    } finally {
        generalChargeDeleting.value = null
    }
}

function applicationLabel(app: string): string {
    const map: Record<string, string> = {
        on_registration: 'On Registration',
        on_shares: 'On Shares',
        on_loan_application: 'On Loan Application',
        other: 'Other',
    }
    return map[app] ?? app
}

const generalChargeProcessing = ref(false)
const generalChargeErrors = ref<Record<string, string>>({})

async function submitGeneralCharge() {
    generalChargeErrors.value = {}
    generalChargeProcessing.value = true
    try {
        if (editingCharge.value) {
            const res = await tenantClient.put(`/general-charges/${editingCharge.value.id}`, generalChargeForm.value)
            const updated = res.data?.data
            const idx = generalCharges.value.findIndex(c => c.id === editingCharge.value!.id)
            if (idx !== -1) generalCharges.value[idx] = updated
            toast.success('Charge updated successfully.')
        } else {
            await tenantClient.post('/general-charges', generalChargeForm.value)
            toast.success('Charge added successfully.')
            fetchGeneralCharges()
        }
        closeGeneralChargesDrawer()
    } catch (err: any) {
        const data = err?.response?.data
        if (data?.errors) {
            generalChargeErrors.value = Object.fromEntries(
                Object.entries(data.errors as Record<string, string[]>).map(([k, v]) => [k, v[0] ?? ''])
            )
            toast.error('Please fix the errors below.')
        } else {
            toast.error(data?.message ?? 'Failed to save charge.')
        }
    } finally {
        generalChargeProcessing.value = false
    }
}

// ─── Fiscal Year List Drawer ─────────────────────────────────────────────────
const showFiscalDrawer = ref(false)
const fiscalYears = ref<FiscalYear[]>([])
const fiscalMeta = ref<Meta>({ current_page: 1, last_page: 1, total: 0 })
const fiscalLoading = ref(false)
const fiscalSearch = ref('')
let fiscalSearchTimer: ReturnType<typeof setTimeout> | null = null

async function fetchFiscalYears(page = 1) {
    fiscalLoading.value = true
    try {
        const res = await fiscalYearsApi.list({ search: fiscalSearch.value || undefined, page })
        fiscalYears.value = res.data?.data ?? []
        if (res.data?.meta) fiscalMeta.value = res.data.meta
    } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to load financial years.')
    } finally {
        fiscalLoading.value = false
    }
}

watch(fiscalSearch, () => {
    if (fiscalSearchTimer) clearTimeout(fiscalSearchTimer)
    fiscalSearchTimer = setTimeout(() => fetchFiscalYears(1), 400)
})

function openFiscalDrawer() {
    showFiscalDrawer.value = true
    fetchFiscalYears(1)
}

function closeFiscalDrawer() {
    showFiscalDrawer.value = false
    fiscalSearch.value = ''
}

const fiscalPages = computed(() =>
    Array.from({ length: fiscalMeta.value.last_page }, (_, i) => i + 1)
)

// ─── Add / Edit Fiscal Year Form Drawer ──────────────────────────────────────
const showFiscalForm = ref(false)
const fiscalFormMode = ref<'add' | 'edit'>('add')
const fiscalEditId = ref<number>(0)
const fiscalProcessing = ref(false)
const fiscalErrors = ref<Record<string, any>>({})
const fiscalForm = ref({
    name: '',
    start_date: '',
    end_date: '',
})

// Auto-calculate end date based on known fiscal year patterns
watch(() => fiscalForm.value.start_date, (val) => {
    if (!val) { fiscalForm.value.end_date = ''; return }
    try {
        const start = new Date(val)
        const month = start.getMonth() // 0-indexed: 0=Jan, 5=Jun
        const day = start.getDate()
        const year = start.getFullYear()

        if (month === 0 && day === 1) {
            // Jan 1 → Dec 31 of the same year
            fiscalForm.value.end_date = `${year}-12-31`
        } else if (month === 5 && day === 1) {
            // Jun 1 → Jul 31 of the same year
            fiscalForm.value.end_date = `${year}-07-31`
        } else {
            // For other dates, don't auto-populate
            fiscalForm.value.end_date = ''
        }
    } catch {
        fiscalForm.value.end_date = ''
    }
})

function openAddFiscal() {
    fiscalFormMode.value = 'add'
    fiscalEditId.value = 0
    fiscalErrors.value = {}
    fiscalForm.value = { name: '', start_date: '', end_date: '' }
    showFiscalForm.value = true
}

function openEditFiscal(fy: FiscalYear) {
    fiscalFormMode.value = 'edit'
    fiscalEditId.value = fy.id
    fiscalErrors.value = {}
    fiscalForm.value = {
        name: fy.name,
        start_date: fy.start_date,
        end_date: fy.end_date,
    }
    showFiscalForm.value = true
}

function closeFiscalForm() {
    showFiscalForm.value = false
    fiscalErrors.value = {}
}

async function submitFiscalForm() {
    fiscalProcessing.value = true
    fiscalErrors.value = {}

    // Check for duplicate date range in existing fiscal years
    const duplicate = fiscalYears.value.find((fy) => {
        if (fiscalFormMode.value === 'edit' && fy.id === fiscalEditId.value) return false
        return fy.start_date === fiscalForm.value.start_date && fy.end_date === fiscalForm.value.end_date
    })
    if (duplicate) {
        toast.error(`Financial year with this date range already exists (${duplicate.name}).`)
        fiscalProcessing.value = false
        return
    }

    try {
        if (fiscalFormMode.value === 'edit') {
            await fiscalYearsApi.update(fiscalEditId.value, fiscalForm.value)
            toast.success('Financial year updated successfully.')
        } else {
            await fiscalYearsApi.store(fiscalForm.value)
            toast.success('Financial year created successfully.')
        }
        showFiscalForm.value = false
        await fetchFiscalYears(fiscalMeta.value.current_page)
    } catch (err: any) {
        if (err?.response?.status === 422) {
            fiscalErrors.value = err.response.data.errors || {}
        } else {
            toast.error(err?.response?.data?.message ?? 'Failed to save financial year.')
        }
    } finally {
        fiscalProcessing.value = false
    }
}

function formatDate(d: string) {
    if (!d) return '—'
    return d
}

// ─── Delete Fiscal Year ──────────────────────────────────────────────────────
const showDeleteDialog = ref(false)
const deleteTarget = ref<FiscalYear | null>(null)

function deleteFiscalYear(fy: FiscalYear) {
    deleteTarget.value = fy
    showDeleteDialog.value = true
}

async function confirmDelete() {
    if (!deleteTarget.value) return
    try {
        await fiscalYearsApi.destroy(deleteTarget.value.id)
        toast.success('Financial year deleted successfully.')
        await fetchFiscalYears(fiscalMeta.value.current_page)
    } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to delete financial year.')
    } finally {
        showDeleteDialog.value = false
        deleteTarget.value = null
    }
}
const settingsCards = [
    {
        title: "Branch Management",
        description: "Manage branches and physical locations.",
        type: "link",
        route: { name: "tenant-settings-branch-list" },
        action: "Manage Branches →"
    },
    {
        title: "General Settings",
        description: "Configure basic organisation information and settings.",

    },
]


</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Building2 class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Organisation Settings
                </h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage your organisation's identity and
                    structure</p>
            </div>
        </div>

        <SettingCard :settingsCards="settingsCards">
            <template #general-settings>
                <button @click="openBrandingDrawer"
                    class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">
                    Sacco Branding Config →
                </button>
                <button @click="openCurrencyDrawer"
                    class="mt-2 block w-fit text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">
                    Currency configuration →
                </button>
            </template>
        </SettingCard>

        <div class="grid gap-5 lg:grid-cols-2">
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Fiscal Year</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Define and manage your organisation's
                    financial periods.</p>
                <button @click="openFiscalDrawer" :disabled="fiscalLoading"
                    class="inline-flex items-center gap-1.5 text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline disabled:opacity-60">
                    <Spinner v-if="fiscalLoading" class="h-3.5 w-3.5" />
                    {{ fiscalLoading ? 'Loading…' : 'Set Fiscal Year →' }}
                </button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Workflow & Approvals</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Setup approval workflows for various
                    processes.</p>
                <button
                    class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Configure
                    Workflows →</button>
            </div>
        </div>

        <!-- ═══ General Charges ══════════════════════════════════════════════ -->
        <div
            class="rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <!-- Header -->
            <div
                class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                <div>
                    <h3 class="text-base font-semibold text-neutral-900 dark:text-white">General Charges</h3>
                    <p class="text-xs text-neutral-500 mt-0.5">Charges applied on registration, shares, loan
                        applications and
                        more.</p>
                </div>
                <button @click="openGeneralChargesDrawer"
                    class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors"
                    style="background-color: var(--color-nfuko-primary);">
                    <Plus class="h-4 w-4" />
                    Add New Charge
                </button>
            </div>

            <!-- Loading skeleton -->
            <div v-if="generalChargesLoading" class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <div v-for="i in 3" :key="i" class="flex items-center gap-4 px-6 py-4 animate-pulse">
                    <div class="h-4 w-40 rounded bg-neutral-100 dark:bg-neutral-800" />
                    <div class="h-4 w-24 rounded bg-neutral-100 dark:bg-neutral-800" />
                    <div class="ml-auto h-6 w-12 rounded-full bg-neutral-100 dark:bg-neutral-800" />
                </div>
            </div>

            <!-- Empty state -->
            <div v-else-if="generalCharges.length === 0" class="flex flex-col items-center gap-2 py-12 text-center">
                <Receipt class="h-8 w-8 text-neutral-300" />
                <p class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No charges configured</p>
                <p class="text-xs text-neutral-400">Click "Add New Charge" to create your first charge.</p>
            </div>

            <!-- Table -->
            <div v-else class="overflow-x-auto">
                <table class="w-full text-sm border-collapse">
                    <thead>
                        <tr class="bg-neutral-50/60 dark:bg-neutral-800/40">
                            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Charge Name</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Applies On</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Applies To</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Amount</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500">Reversible</th>
                            <th class="px-6 py-3 text-center text-xs font-semibold text-neutral-500">Active</th>
                            <th class="px-6 py-3 text-right text-xs font-semibold text-neutral-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                        <tr v-for="charge in generalCharges" :key="charge.id"
                            class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                            :class="{ 'opacity-50': !charge.is_active }">
                            <!-- Name -->
                            <td class="px-6 py-4">
                                <span class="font-semibold text-neutral-900 dark:text-white">{{ charge.name }}</span>
                            </td>

                            <!-- Application -->
                            <td class="px-6 py-4">
                                <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" :class="{
                                    'bg-blue-50 text-blue-700': charge.application === 'on_registration',
                                    'bg-purple-50 text-purple-700': charge.application === 'on_shares',
                                    'bg-amber-50 text-amber-700': charge.application === 'on_loan_application',
                                    'bg-neutral-100 text-neutral-600': charge.application === 'other',
                                }">
                                    {{ applicationLabel(charge.application) }}
                                </span>
                            </td>

                            <!-- Applies To (where_to_apply) -->
                            <td class="px-6 py-4">
                                <span v-if="charge.where_to_apply"
                                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
                                    :class="{
                                        'bg-sky-50 text-sky-700': charge.where_to_apply === 'loans',
                                        'bg-emerald-50 text-emerald-700': charge.where_to_apply === 'savings',
                                        'bg-violet-50 text-violet-700': charge.where_to_apply === 'shares',
                                    }">
                                    {{ charge.where_to_apply === 'savings' ? 'Savings Products' : charge.where_to_apply
                                    }}
                                </span>
                                <span v-else class="text-neutral-400">—</span>
                            </td>

                            <!-- Amount -->
                            <td class="px-6 py-4">
                                <div class="flex flex-col gap-1">
                                    <span class="font-mono font-semibold text-neutral-900 dark:text-white">
                                        {{ charge.charge_type === 'percentage' ? charge.amount + '%' :
                                        Number(charge.amount).toLocaleString() }}
                                    </span>
                                    <span class="inline-flex w-fit rounded px-1.5 py-0.5 text-xs font-medium capitalize"
                                        :class="charge.charge_type === 'percentage' ? 'bg-amber-50 text-amber-700' : 'bg-neutral-100 text-neutral-600'">
                                        {{ charge.charge_type ?? 'flat amount' }}
                                    </span>
                                </div>
                            </td>

                            <!-- Reversible toggle -->
                            <td class="px-6 py-4 text-center">
                                <button type="button" @click="toggleGeneralChargeReversible(charge)"
                                    :disabled="generalChargeReversibleToggling === charge.id"
                                    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                    :style="charge.is_reversible ? 'background-color: var(--color-nfuko-primary)' : 'background-color: #d1d5db'">
                                    <span
                                        class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200"
                                        :class="charge.is_reversible ? 'translate-x-4' : 'translate-x-0'" />
                                </button>
                            </td>

                            <!-- Active toggle -->
                            <td class="px-6 py-4 text-center">
                                <button type="button" @click="toggleGeneralCharge(charge)"
                                    :disabled="generalChargeToggling === charge.id"
                                    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                    :style="charge.is_active ? 'background-color: var(--color-nfuko-primary)' : 'background-color: #d1d5db'">
                                    <span
                                        class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200"
                                        :class="charge.is_active ? 'translate-x-4' : 'translate-x-0'" />
                                </button>
                            </td>

                            <!-- Actions: Edit + Delete -->
                            <td class="px-6 py-4 text-right">
                                <div class="inline-flex items-center gap-2">
                                    <button @click="openEditChargeDrawer(charge)"
                                        class="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 text-neutral-600 hover:bg-neutral-100 transition-colors"
                                        title="Edit charge">
                                        <Pencil class="h-3.5 w-3.5" />
                                    </button>
                                    <button @click="deleteGeneralCharge(charge)"
                                        :disabled="generalChargeDeleting === charge.id"
                                        class="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-500 hover:bg-rose-100 transition-colors disabled:opacity-50"
                                        title="Delete charge">
                                        <Trash2 class="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- ═══ Sacco Branding Drawer ══════════════════════════════════════════ -->
    <Transition name="drawer-fade">
        <div v-if="showBrandingDrawer" class="fixed inset-0 z-50">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeBrandingDrawer"></div>
            <Transition name="drawer-slide">
                <aside
                    class="absolute right-0 top-0 h-full w-full max-w-[560px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
                    role="dialog" aria-label="Sacco Branding">
                    <div class="flex h-full flex-col">
                        <!-- Header -->
                        <div class="border-b border-neutral-200 px-6 py-5 dark:border-neutral-700">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                                        <ImageIcon class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                    </div>
                                    <div>
                                        <h3
                                            class="text-lg font-bold tracking-tight text-neutral-900 uppercase dark:text-white">
                                            Sacco Branding
                                        </h3>
                                        <p class="text-xs text-neutral-500">Update your sacco logo, name and tagline</p>
                                    </div>
                                </div>
                                <button type="button" @click="closeBrandingDrawer"
                                    class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800 dark:hover:text-white">
                                    <X class="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <!-- Body -->
                        <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                            <!-- Loading skeleton -->
                            <div v-if="brandingLoading" class="space-y-5">
                                <div v-for="i in 3" :key="i"
                                    class="h-24 rounded-2xl bg-neutral-100 animate-pulse dark:bg-neutral-800" />
                            </div>

                            <template v-else>
                                <!-- Logo Upload -->
                                <div class="space-y-3">
                                    <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Sacco Logo
                                    </label>
                                    <p class="text-xs text-neutral-400">PNG, JPG or SVG · max 2 MB · recommended 256×256
                                        px</p>

                                    <div class="flex items-start gap-4">
                                        <!-- Preview -->
                                        <div
                                            class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 overflow-hidden">
                                            <img v-if="brandingCurrentLogo()" :src="brandingCurrentLogo()!"
                                                class="h-full w-full object-contain p-2" alt="Logo preview" />
                                            <ImageIcon v-else class="h-7 w-7 text-neutral-300" />
                                        </div>

                                        <!-- Drop zone -->
                                        <div class="flex-1">
                                            <div @click="brandingFileInput?.click()"
                                                @dragover.prevent="brandingIsDragging = true"
                                                @dragleave="brandingIsDragging = false" @drop.prevent="onBrandingDrop"
                                                :class="[
                                                    'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 cursor-pointer transition-all duration-200',
                                                    brandingIsDragging
                                                        ? 'border-nfuko-primary bg-nfuko-primary/5'
                                                        : 'border-neutral-200 dark:border-neutral-700 hover:border-nfuko-primary/50 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                                ]">
                                                <input ref="brandingFileInput" type="file" accept="image/*"
                                                    class="hidden" @change="onBrandingFileChange" />
                                                <p class="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                                                    Drop here or <span class="text-nfuko-primary">browse</span>
                                                </p>
                                            </div>
                                            <!-- Selected file chip -->
                                            <div v-if="brandingLogoFile"
                                                class="mt-2 flex items-center justify-between rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 px-3 py-2">
                                                <div class="flex items-center gap-2">
                                                    <ImageIcon class="h-4 w-4 text-nfuko-primary shrink-0" />
                                                    <span
                                                        class="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate max-w-[160px]">
                                                        {{ brandingLogoFile.name }}
                                                    </span>
                                                    <span class="text-[11px] text-neutral-400">
                                                        ({{ (brandingLogoFile.size / 1024).toFixed(1) }} KB)
                                                    </span>
                                                </div>
                                                <button @click="removeBrandingLogo"
                                                    class="flex h-6 w-6 items-center justify-center rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                                                    <X class="h-3.5 w-3.5 text-neutral-400" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Sacco Name -->
                                <div class="space-y-2">
                                    <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Sacco Name
                                    </label>
                                    <input v-model="brandingName" type="text" placeholder="e.g. Nakuru Sacco"
                                        class="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/20 transition-all" />
                                    <p class="text-xs text-neutral-400">Displayed in the sidebar and on printed
                                        documents.</p>
                                </div>

                                <!-- Tagline -->
                                <div class="space-y-2">
                                    <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Tagline <span class="text-neutral-400 font-normal">(optional)</span>
                                    </label>
                                    <input v-model="brandingTagline" type="text"
                                        placeholder="e.g. Empowering members since 2005"
                                        class="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/20 transition-all" />
                                    <p class="text-xs text-neutral-400">Short motto shown below the sacco name.</p>
                                </div>

                                <!-- Live Preview -->
                                <div class="space-y-2">
                                    <label
                                        class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Preview</label>
                                    <div
                                        class="flex items-center gap-3 rounded-xl bg-nfuko-primary px-4 py-3 w-fit min-w-[200px]">
                                        <div
                                            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 overflow-hidden">
                                            <img v-if="brandingCurrentLogo()" :src="brandingCurrentLogo()!"
                                                class="h-8 w-auto object-contain" alt="Preview" />
                                            <ImageIcon v-else class="h-5 w-5 text-white/50" />
                                        </div>
                                        <div class="flex flex-col min-w-0">
                                            <span class="text-sm font-bold text-white truncate">
                                                {{ brandingName || 'Sacco Name' }}
                                            </span>
                                            <span v-if="brandingTagline" class="text-[11px] text-white/50 truncate">
                                                {{ brandingTagline }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>

                        <!-- Footer -->
                        <div
                            class="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
                            <button type="button" @click="closeBrandingDrawer"
                                class="rounded-lg bg-neutral-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-600 transition-colors">
                                Cancel
                            </button>
                            <button type="button" @click="saveBranding" :disabled="brandingSaving || brandingLoading"
                                class="inline-flex items-center gap-2 rounded-lg bg-nfuko-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002d32] transition-colors disabled:opacity-60 shadow-sm dark:bg-bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-[#b8973b]">
                                <Loader2 v-if="brandingSaving" class="h-4 w-4 animate-spin" />
                                {{ brandingSaving ? 'Saving…' : 'Save Branding' }}
                            </button>
                        </div>
                    </div>
                </aside>
            </Transition>
        </div>
    </Transition>

    <!-- ═══ Currency Settings Drawer ══════════════════════════════════════ -->
    <Transition name="drawer-fade">
        <div v-if="showCurrencyDrawer" class="fixed inset-0 z-50">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeCurrencyDrawer"></div>

            <Transition name="drawer-slide">
                <aside
                    class="absolute right-0 top-0 h-full w-full max-w-[620px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
                    role="dialog" aria-label="Currency Settings">
                    <div class="flex h-full flex-col">
                        <!-- Header -->
                        <div class="border-b border-neutral-200 px-6 py-5 dark:border-neutral-700">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                                        <Coins class="h-4.5 w-4.5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                    </div>
                                    <div>
                                        <h3
                                            class="text-lg font-bold tracking-tight text-neutral-900 uppercase dark:text-white">
                                            Currency Settings
                                        </h3>
                                        <p class="text-xs text-neutral-500">Select system default and enabled currencies
                                        </p>
                                    </div>
                                </div>
                                <button type="button" @click="closeCurrencyDrawer"
                                    class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800 dark:hover:text-white">
                                    <X class="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <!-- Body -->
                        <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                            <div class="flex items-center gap-3">
                                <div class="relative flex-1">
                                    <Search
                                        class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                    <input v-model="currencySearch" type="text"
                                        placeholder="Search currency by code or name" :class="inputCls" />
                                </div>
                            </div>

                            <div class="space-y-2">
                                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Default
                                    currency</Label>
                                <SearchableSelect v-model="currencyForm.default_currency"
                                    :options="defaultCurrencyOptions" placeholder="Search default currency"
                                    state="currency-default" />
                                <p class="text-xs text-neutral-500">Default is {{ currencyForm.default_currency || 'UGX'
                                    }}.
                                </p>
                            </div>

                            <div class="space-y-3">
                                <div
                                    class="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800/60">
                                    <div>
                                        <p class="text-sm font-semibold text-neutral-900 dark:text-white">Multi-currency
                                        </p>
                                        <p class="text-xs text-neutral-500">Allow transactions in more than one
                                            currency.
                                        </p>
                                    </div>
                                    <button type="button" @click="multiCurrencyEnabled = !multiCurrencyEnabled"
                                        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300"
                                        :class="multiCurrencyEnabled ? ' bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'">
                                        <span
                                            class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300"
                                            :class="multiCurrencyEnabled ? 'translate-x-6' : 'translate-x-1'" />
                                    </button>
                                </div>

                                <div class="flex items-center justify-between">
                                    <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Enabled
                                        currencies</Label>
                                    <span class="text-xs text-neutral-500">
                                        {{ currencyForm.enabled_currencies.length }} selected
                                    </span>
                                </div>

                                <div v-if="currencyLoading" class="space-y-3">
                                    <div v-for="i in 6" :key="i"
                                        class="h-10 rounded-lg bg-neutral-100 animate-pulse dark:bg-neutral-800" />
                                </div>

                                <div v-else class="grid gap-3 sm:grid-cols-2"
                                    :class="!multiCurrencyEnabled ? 'opacity-50 pointer-events-none' : ''">
                                    <button v-for="c in filteredCurrencies" :key="c.code" type="button"
                                        @click="toggleCurrency(c.code)"
                                        :disabled="c.code === currencyForm.default_currency"
                                        class="flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-75"
                                        :class="currencyForm.enabled_currencies.includes(c.code)
                                            ? ' border-nfuko-primary  bg-nfuko-primary/5 dark:border-bg-nfuko-yellow dark:bg-nfuko-yellow/10'
                                            : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800'">
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                                                {{ c.code }}
                                            </div>
                                            <div>
                                                <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{
                                                    c.name
                                                    }}</p>
                                                <p class="text-xs text-neutral-500">{{ c.symbol || '—' }}</p>
                                            </div>
                                        </div>
                                        <div class="h-5 w-5 rounded-full border-2 transition-colors" :class="currencyForm.enabled_currencies.includes(c.code)
                                            ? ' border-nfuko-primary  bg-nfuko-primary dark:border-bg-nfuko-yellow dark:bg-nfuko-yellow'
                                            : 'border-neutral-300 dark:border-neutral-600'" />
                                    </button>
                                </div>

                                <p class="text-xs text-neutral-500">
                                    The default currency cannot be disabled.
                                    <span v-if="!multiCurrencyEnabled"> Multi-currency is off, so only the default is
                                        active.</span>
                                </p>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div
                            class="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
                            <button type="button" @click="closeCurrencyDrawer"
                                class="rounded-lg bg-neutral-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-600 transition-colors">
                                Cancel
                            </button>
                            <button type="button" @click="saveCurrencySettings" :disabled="currencySaving"
                                class="inline-flex items-center gap-2 rounded-lg  bg-nfuko-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002d32] transition-colors disabled:opacity-60 shadow-sm dark:bg-nfuko-yellow dark: text-nfuko-primary dark:hover:bg-[#b8973b]">
                                <Spinner v-if="currencySaving" class="h-4 w-4" />
                                Save currency settings
                            </button>
                        </div>
                    </div>
                </aside>
            </Transition>
        </div>
    </Transition>

    <!-- ═══ Fiscal Year List Drawer ═════════════════════════════════════════ -->
    <Transition name="drawer-fade">
        <div v-if="showFiscalDrawer" class="fixed inset-0 z-50">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeFiscalDrawer"></div>

            <Transition name="drawer-slide">
                <aside
                    class="absolute right-0 top-0 h-full w-full max-w-[680px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
                    role="dialog" aria-label="Financial Years">
                    <div class="flex h-full flex-col">
                        <!-- Header -->
                        <div class="border-b border-neutral-200 px-6 py-5 dark:border-neutral-700">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                                        <Calendar class="h-4.5 w-4.5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                    </div>
                                    <div>
                                        <h3
                                            class="text-lg font-bold tracking-tight text-neutral-900 uppercase dark:text-white">
                                            Financial Years
                                        </h3>
                                        <p class="text-xs text-neutral-500">Manage your organisation's fiscal periods
                                        </p>
                                    </div>
                                </div>
                                <button type="button" @click="closeFiscalDrawer"
                                    class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800 dark:hover:text-white">
                                    <X class="h-4 w-4" />
                                </button>
                            </div>

                            <!-- Search + Add button -->
                            <div class="mt-4 flex items-center gap-3">
                                <div class="relative flex-1">
                                    <Search
                                        class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                    <input v-model="fiscalSearch" type="text" placeholder="Search for financial year"
                                        class="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus: border-nfuko-primary focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                </div>
                                <button @click="openAddFiscal"
                                    class="inline-flex items-center gap-2 whitespace-nowrap rounded-xl  bg-nfuko-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#002d32] transition-colors shadow-sm dark:bg-nfuko-yellow dark: text-nfuko-primary dark:hover:bg-[#b8973b]">
                                    <Plus class="h-4 w-4" />
                                    Add financial year
                                </button>
                            </div>
                        </div>

                        <!-- Table Body -->
                        <div class="flex-1 overflow-y-auto">
                            <table class="w-full text-sm">
                                <thead>
                                    <tr
                                        class="border-b border-neutral-100 bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-800/30">
                                        <th
                                            class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                            S/N</th>
                                        <th
                                            class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                            Financial year</th>
                                        <th
                                            class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                            Start</th>
                                        <th
                                            class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                            End</th>
                                        <th
                                            class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                            Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
                                    <!-- Loading -->
                                    <template v-if="fiscalLoading">
                                        <tr v-for="i in 4" :key="i" class="animate-pulse">
                                            <td v-for="j in 5" :key="j" class="px-6 py-4">
                                                <div class="h-4 rounded bg-neutral-100 dark:bg-neutral-800"
                                                    :class="j === 2 ? 'w-28' : 'w-20'" />
                                            </td>
                                        </tr>
                                    </template>

                                    <!-- Empty -->
                                    <tr v-else-if="fiscalYears.length === 0">
                                        <td colspan="5" class="px-6 py-16 text-center text-sm text-neutral-400">
                                            No financial years found.
                                        </td>
                                    </tr>

                                    <!-- Rows -->
                                    <tr v-else v-for="(fy, idx) in fiscalYears" :key="fy.id"
                                        class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                                        <td class="px-6 py-4 text-neutral-500">{{ idx + 1 + (fiscalMeta.current_page -
                                            1) *
                                            15 }}</td>
                                        <td class="px-6 py-4 font-medium text-neutral-900 dark:text-white">{{ fy.name }}
                                        </td>
                                        <td class="px-6 py-4 text-neutral-600 dark:text-neutral-300">{{
                                            formatDate(fy.start_date) }}</td>
                                        <td class="px-6 py-4 text-neutral-600 dark:text-neutral-300">{{
                                            formatDate(fy.end_date) }}</td>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-2">
                                                <button @click="openEditFiscal(fy)"
                                                    class="inline-flex items-center gap-1.5 rounded-lg  bg-nfuko-primary px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#002d32] transition-colors shadow-sm dark:bg-nfuko-yellow dark: text-nfuko-primary dark:hover:bg-[#b8973b]">
                                                    <Pencil class="h-3 w-3" />
                                                    Edit
                                                </button>
                                                <button @click="deleteFiscalYear(fy)"
                                                    class="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors shadow-sm">
                                                    <Trash2 class="h-3 w-3" />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination -->
                        <div v-if="fiscalMeta.last_page > 1"
                            class="flex items-center justify-between border-t border-neutral-100 px-6 py-3 dark:border-neutral-800">
                            <p class="text-xs text-neutral-400">
                                Page {{ fiscalMeta.current_page }} of {{ fiscalMeta.last_page }} ({{ fiscalMeta.total }}
                                records)
                            </p>
                            <div class="flex gap-1">
                                <button v-for="page in fiscalPages" :key="page" @click="fetchFiscalYears(page)"
                                    class="h-8 w-8 rounded-lg text-xs font-medium transition-colors"
                                    :class="page === fiscalMeta.current_page ? ' bg-nfuko-primary text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'">
                                    {{ page }}
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </Transition>
        </div>
    </Transition>

    <!-- ═══ Add / Edit Fiscal Year Form Drawer ═════════════════════════════ -->
    <Transition name="drawer-fade">
        <div v-if="showFiscalForm" class="fixed inset-0 z-[60]">
            <div class="absolute inset-0 bg-black/30 backdrop-blur-[2px]" @click="closeFiscalForm"></div>

            <Transition name="drawer-slide">
                <aside
                    class="absolute right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
                    role="dialog"
                    :aria-label="fiscalFormMode === 'edit' ? 'Edit financial year' : 'Add financial year'">
                    <div class="flex h-full flex-col">
                        <!-- Header -->
                        <div
                            class="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
                            <div class="flex items-center gap-3">
                                <button type="button" @click="closeFiscalForm"
                                    class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800 dark:hover:text-white">
                                    <ArrowLeft class="h-4 w-4" />
                                </button>
                                <h3 class="text-[15px] font-bold text-neutral-900 dark:text-white">
                                    {{ fiscalFormMode === 'edit' ? 'Edit financial year' : 'Add financial year' }}
                                </h3>
                            </div>
                            <button type="button" @click="closeFiscalForm"
                                class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800 dark:hover:text-white">
                                <X class="h-4 w-4" />
                            </button>
                        </div>

                        <!-- Form Body -->
                        <form @submit.prevent="submitFiscalForm" class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                            <!-- Name -->
                            <div class="space-y-2">
                                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Financial
                                    year
                                    name <span class="text-red-500">*</span></Label>
                                <input v-model="fiscalForm.name" type="text" placeholder="e.g. 2026"
                                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus: border-nfuko-primary focus:ring-2 focus:ring-bg-nfuko-primary/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                <InputError v-if="fiscalErrors.name"
                                    :message="fiscalErrors.name?.[0] ?? fiscalErrors.name" />
                            </div>

                            <!-- Start Date -->
                            <div class="space-y-2">
                                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Start
                                    date</Label>
                                <input v-model="fiscalForm.start_date" type="date"
                                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus: border-nfuko-primary focus:ring-2 focus:ring-bg-nfuko-primary/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                <InputError v-if="fiscalErrors.start_date"
                                    :message="fiscalErrors.start_date?.[0] ?? fiscalErrors.start_date" />
                            </div>

                            <!-- End Date (auto-calculated, read-only) -->
                            <div class="space-y-2">
                                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">End date
                                    <span class="text-red-500">*</span></Label>
                                <input v-model="fiscalForm.end_date" type="date"
                                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus: border-nfuko-primary focus:ring-2 focus:ring-bg-nfuko-primary/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                <InputError v-if="fiscalErrors.end_date"
                                    :message="fiscalErrors.end_date?.[0] ?? fiscalErrors.end_date" />
                            </div>
                        </form>

                        <!-- Footer -->
                        <div
                            class="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
                            <button type="button" @click="closeFiscalForm"
                                class="rounded-lg bg-neutral-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-600 transition-colors">
                                Close
                            </button>
                            <button type="button" @click="submitFiscalForm" :disabled="fiscalProcessing"
                                class="inline-flex items-center gap-2 rounded-lg  bg-nfuko-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002d32] transition-colors disabled:opacity-60 shadow-sm dark:bg-nfuko-yellow dark: text-nfuko-primary dark:hover:bg-[#b8973b]">
                                <Spinner v-if="fiscalProcessing" class="h-4 w-4" />
                                {{ fiscalFormMode === 'edit' ? 'Update financial year' : 'Save financial year' }}
                            </button>
                        </div>
                    </div>
                </aside>
            </Transition>
        </div>
    </Transition>

    <!-- ═══ General Charges Drawer ══════════════════════════════════════════ -->
    <Transition name="drawer-fade">
        <div v-if="showGeneralChargesDrawer" class="fixed inset-0 z-50">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeGeneralChargesDrawer"></div>

            <Transition name="drawer-slide">
                <aside
                    class="absolute right-0 top-0 h-full w-full max-w-[620px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
                    role="dialog" aria-label="General Charges">
                    <div class="flex h-full flex-col">
                        <!-- Header -->
                        <div class="border-b border-neutral-200 px-6 py-5 dark:border-neutral-700">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="flex h-9 w-9 items-center justify-center rounded-xl bg-nfuko-primary-50 dark:bg-nfuko-primary-900/30">
                                        <Receipt class="h-4.5 w-4.5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                                            {{ editingCharge ? 'Edit Charge' : 'Add New Charge' }}
                                        </h3>
                                    </div>
                                </div>
                                <button type="button" @click="closeGeneralChargesDrawer"
                                    class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800 dark:hover:text-white">
                                    <X class="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <!-- Body -->
                        <div class="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                            <!-- Is it a revenue -->
                            <div class="space-y-2">
                                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Is it a
                                    revenue</Label>
                                <SearchableSelect v-model="generalChargeForm.is_revenue" :options="isRevenueOptions"
                                    placeholder="Please Select option" state="revenue-select" />
                            </div>

                            <!-- Charge name* -->
                            <div class="space-y-2">
                                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Charge
                                    name<span class="text-red-500">*</span></Label>
                                <input v-model="generalChargeForm.name" type="text" placeholder="Charge name"
                                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                <p v-if="generalChargeErrors.name" class="text-xs text-red-500">{{
                                    generalChargeErrors.name
                                    }}</p>
                            </div>

                            <!-- Application* -->
                            <div class="space-y-2">
                                <Label
                                    class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Application<span
                                        class="text-red-500">*</span></Label>
                                <SearchableSelect v-model="generalChargeForm.application" :options="applicationOptions"
                                    placeholder="Please Select option" state="application-select" />
                            </div>

                            <!-- Applies To (where_to_apply) — always visible -->
                            <div class="space-y-2">
                                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Applies
                                    To</Label>
                                <SearchableSelect v-model="generalChargeForm.where_to_apply"
                                    :options="whereToApplyOptions" placeholder="Select where to apply"
                                    state="where-to-apply-select-main" />
                            </div>

                            <!-- Saving products* (Only if on_registration) -->
                            <div v-if="generalChargeForm.application === 'on_registration'" class="space-y-2">
                                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Saving
                                    products<span class="text-red-500">*</span></Label>
                                <MultiSearchableSelect v-model="generalChargeForm.saving_product_ids"
                                    :options="savingProductOptions" placeholder="Choose saving products ..."
                                    state="saving-product-select" />
                            </div>

                            <!-- Loan products* (Only if on_loan_application) -->
                            <div v-if="generalChargeForm.application === 'on_loan_application'" class="space-y-2">
                                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Loan
                                    types<span class="text-red-500">*</span></Label>
                                <MultiSearchableSelect v-model="generalChargeForm.loan_product_ids"
                                    :options="loanProductOptions" placeholder="Choose loan products ..."
                                    state="loan-product-select" />
                            </div>

                            <!-- Percentage/Amount* (Only if on_loan_application) -->
                            <div v-if="generalChargeForm.application === 'on_loan_application'" class="space-y-2">
                                <Label
                                    class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Percentage/Amount<span
                                        class="text-red-500">*</span></Label>
                                <SearchableSelect v-model="generalChargeForm.charge_type" :options="chargeTypeOptions"
                                    placeholder="Select charge type" state="charge-type-select" />
                            </div>

                            <!-- Other application logic -->
                            <template v-if="generalChargeForm.application === 'other'">
                                <template v-if="generalChargeForm.where_to_apply === 'loans'">
                                    <!-- Loan types* -->
                                    <div class="space-y-2">
                                        <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Loan
                                            types<span class="text-red-500">*</span></Label>
                                        <MultiSearchableSelect v-model="generalChargeForm.loan_product_ids"
                                            :options="loanProductOptions" placeholder="Choose loan products ..."
                                            state="other-loan-product-select" />
                                    </div>

                                    <!-- Is it a fine to be applied on loan mishandling ?* -->
                                    <div class="space-y-2">
                                        <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Is
                                            it a fine to be applied on loan mishandling ?<span
                                                class="text-red-500">*</span></Label>
                                        <SearchableSelect v-model="generalChargeForm.is_fine" :options="isFineOptions"
                                            placeholder="Select yes or no" state="is-fine-select" />
                                    </div>

                                    <!-- Interval type* -->
                                    <div class="space-y-2">
                                        <Label
                                            class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Interval
                                            type<span class="text-red-500">*</span></Label>
                                        <SearchableSelect v-model="generalChargeForm.interval_type"
                                            :options="intervalTypeOptions" placeholder="select the interval type"
                                            state="interval-type-select" />
                                    </div>

                                    <!-- Interval* -->
                                    <div class="space-y-2">
                                        <Label
                                            class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Interval<span
                                                class="text-red-500">*</span></Label>
                                        <input v-model="generalChargeForm.interval" type="number" min="1"
                                            class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                    </div>

                                    <!-- Percentage/Amount* -->
                                    <div class="space-y-2">
                                        <Label
                                            class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Percentage/Amount<span
                                                class="text-red-500">*</span></Label>
                                        <SearchableSelect v-model="generalChargeForm.charge_type"
                                            :options="chargeTypeOptions" placeholder="select amount/percentage"
                                            state="other-charge-type-select" />
                                    </div>
                                </template>

                                <template v-if="generalChargeForm.where_to_apply === 'savings'">
                                    <!-- Saving products* -->
                                    <div class="space-y-2">
                                        <Label
                                            class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Saving
                                            products<span class="text-red-500">*</span></Label>
                                        <MultiSearchableSelect v-model="generalChargeForm.saving_product_ids"
                                            :options="savingProductOptions" placeholder="Choose saving products ..."
                                            state="other-saving-product-select" />
                                    </div>

                                    <!-- Interval type* -->
                                    <div class="space-y-2">
                                        <Label
                                            class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Interval
                                            type<span class="text-red-500">*</span></Label>
                                        <SearchableSelect v-model="generalChargeForm.interval_type"
                                            :options="intervalTypeOptions" placeholder="select the interval type"
                                            state="interval-type-select-savings" />
                                    </div>

                                    <!-- Interval* -->
                                    <div class="space-y-2">
                                        <Label
                                            class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Interval<span
                                                class="text-red-500">*</span></Label>
                                        <input v-model="generalChargeForm.interval" type="number" min="1"
                                            class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                    </div>
                                </template>
                            </template>

                            <!-- Amount* (Shown generally or when strictly required by user) -->
                            <div v-if="['on_shares', 'on_loan_application', 'on_registration', 'other'].includes(generalChargeForm.application)"
                                class="space-y-2">
                                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Amount<span
                                        class="text-red-500">*</span></Label>
                                <input v-model="generalChargeForm.amount" type="number"
                                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                            </div>

                            <!-- Credit account (optional) -->
                            <div v-if="['on_registration', 'on_loan_application'].includes(generalChargeForm.application)"
                                class="space-y-2">
                                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Credit
                                    account
                                    (optional)</Label>
                                <SearchableSelect v-model="generalChargeForm.credit_account_id"
                                    :options="creditAccountOptions" placeholder="Select option"
                                    state="credit-account-select" />
                            </div>
                        </div>

                        <!-- Footer -->
                        <div
                            class="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
                            <button type="button" @click="closeGeneralChargesDrawer"
                                class="rounded-lg bg-neutral-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-600 transition-colors">
                                Close
                            </button>
                            <button type="button" @click="submitGeneralCharge" :disabled="generalChargeProcessing"
                                class="rounded-lg bg-nfuko-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-nfuko-primary/90 transition-colors shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nfuko-primary disabled:opacity-60 disabled:cursor-not-allowed">
                                {{ generalChargeProcessing ? 'Saving...' : editingCharge ? 'Save Changes' : 'Add New   Charge' }}
                            </button>
                        </div>
                    </div>
                </aside>
            </Transition>
        </div>
    </Transition>

    <!-- ═══ Delete Confirmation Dialog ════════════════════════════════════ -->
    <ConfirmationDialog v-model:show="showDeleteDialog" :items="deleteTarget" title="Delete Financial Year"
        @confirm="confirmDelete" />
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
    transition: opacity 0.2s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
    opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
    transition: transform 0.25s ease;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
    transform: translateX(100%);
}
</style>
