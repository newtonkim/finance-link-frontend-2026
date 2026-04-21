import { ref, reactive, computed } from 'vue'
import { toast } from 'vue-sonner'
import { useSettingsStore } from '@/stores/settingsStore'

export function useSharesSettings() {
    const settingsStore = useSettingsStore()

    // ── Manage Shares Drawer State ──────────────────────────────────────────
    const sharesDrawerOpen = ref(false)
    const sharesDrawerSaving = ref(false)
    const sharesDrawerLoading = ref(false)

    const tempHideIsShareholderField = ref(settingsStore.hideIsShareholderField)
    const tempSharesCompulsory = ref(false)
    const tempMinShares = ref(1)
    const tempSharePrice = ref<number | string>(0)
    const tempAppliesToExisting = ref(false)

    const minInvestment = computed(() =>
        Number(tempMinShares.value) * Number(tempSharePrice.value)
    )

    async function openSharesDrawer() {
        sharesDrawerOpen.value = true
        sharesDrawerLoading.value = true
        try {
            await settingsStore.fetchOnboardingSettings()
            tempHideIsShareholderField.value = settingsStore.hideIsShareholderField
            tempSharesCompulsory.value = settingsStore.sharesCompulsory
            tempMinShares.value = settingsStore.minSharesOnOnboarding
            tempSharePrice.value = settingsStore.sharePrice
            tempAppliesToExisting.value = settingsStore.sharesCompulsoryAppliesToExisting
        } finally {
            sharesDrawerLoading.value = false
        }
    }

    async function saveSharesSettings() {
        sharesDrawerSaving.value = true
        try {
            settingsStore.setHideIsShareholderField(tempHideIsShareholderField.value)
            await settingsStore.saveOnboardingSettings({
                shares_compulsory: tempSharesCompulsory.value,
                min_shares_on_onboarding: Number(tempMinShares.value),
                share_price: Number(tempSharePrice.value),
                shares_compulsory_applies_to_existing: tempAppliesToExisting.value,
                hide_is_shareholder_field: Boolean(tempHideIsShareholderField.value),
                auto_create_savings_account: settingsStore.autoCreateSavingsAccount,
                require_member_approval: settingsStore.requireMemberApproval,
            })
            toast.success('Share management settings saved.')
            sharesDrawerOpen.value = false
        } catch {
            toast.error('Failed to save settings. Please try again.')
        } finally {
            sharesDrawerSaving.value = false
        }
    }

    // ── Dividend Drawer State ───────────────────────────────────────────────
    const dividendDrawerOpen = ref(false)
    const dividendDrawerSaving = ref(false)

    const dividendForm = reactive({
        distribution_account_type: 'shareholders_only' as 'shareholders_only' | 'all_accounts',
        distribution_basis: 'proportional' as 'proportional' | 'equal',
        frequency: 'annually' as 'monthly' | 'quarterly' | 'semi_annually' | 'annually',
        distribution_day: 1,
        distribution_month: 12,
        dividend_rate: '' as string | number,
        minimum_shares: '' as string | number,
        minimum_dividend_amount: '' as string | number,
        rounding: 'nearest' as 'nearest' | 'floor' | 'ceil',
        auto_distribute: false,
        carry_forward_remainder: true,
    })

    const accountTypeOptions = [
        { value: 'shareholders_only', label: 'Share holders only' },
        { value: 'all_accounts', label: 'All sacco accounts' },
    ]

    const frequencyOptions = [
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'semi_annually', label: 'Semi-annually' },
        { value: 'annually', label: 'Annually' },
    ]

    const basisOptions = [
        { value: 'proportional', label: 'Proportional to shares held' },
        { value: 'equal', label: 'Equal distribution' },
    ]

    const roundingOptions = [
        { value: 'nearest', label: 'Round to nearest' },
        { value: 'floor', label: 'Round down (floor)' },
        { value: 'ceil', label: 'Round up (ceiling)' },
    ]

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ]

    async function saveDividendSettings() {
        dividendDrawerSaving.value = true
        try {
            // Simulated API call as per original code's comment handleSave
            await new Promise(resolve => setTimeout(resolve, 700))
            toast.success('Dividend settings saved successfully.')
            dividendDrawerOpen.value = false
        } catch {
            toast.error('Failed to save dividend settings.')
        } finally {
            dividendDrawerSaving.value = false
        }
    }

    return {
        // Shares Logic
        sharesDrawerOpen,
        sharesDrawerSaving,
        sharesDrawerLoading,
        tempHideIsShareholderField,
        tempSharesCompulsory,
        tempMinShares,
        tempSharePrice,
        tempAppliesToExisting,
        minInvestment,
        openSharesDrawer,
        saveSharesSettings,

        // Dividend Logic
        dividendDrawerOpen,
        dividendDrawerSaving,
        dividendForm,
        saveDividendSettings,

        // Options
        accountTypeOptions,
        frequencyOptions,
        basisOptions,
        roundingOptions,
        months,
    }
}
