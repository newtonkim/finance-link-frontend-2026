import { defineStore } from 'pinia'
import { ref } from 'vue'
import { onboardingSettingsApi, type OnboardingSettings } from '@/tenant/apis/onboardingSettings/api'

export const useSettingsStore = defineStore('settings', () => {
    const hideInitialDeposit = ref<boolean>(false)
    const hideOpeningBalance = ref<boolean>(false)
    const hideIsShareholderField = ref<boolean>(false)

    function setHideInitialDeposit(value: boolean) {
        hideInitialDeposit.value = value
    }

    function setHideOpeningBalance(value: boolean) {
        hideOpeningBalance.value = value
    }

    function setHideIsShareholderField(value: boolean) {
        hideIsShareholderField.value = value
    }

    // ── Shares onboarding settings (fetched from backend) ────────────────────
    const sharesCompulsory = ref<boolean>(false)
    const minSharesOnOnboarding = ref<number>(1)
    const sharePrice = ref<number>(0)
    const sharesCompulsoryAppliesToExisting = ref<boolean>(false)
    const autoCreateSavingsAccount = ref<boolean>(true)
    const requireMemberApproval = ref<boolean>(false)
    const loyalMemberMinTenureMonths = ref<number>(12)
    const onboardingSettingsLoaded = ref<boolean>(false)

    function applyOnboardingSettings(data?: OnboardingSettings | null) {
        if (!data) return

        sharesCompulsory.value = Boolean(data.shares_compulsory)
        minSharesOnOnboarding.value = Number(data.min_shares_on_onboarding ?? 1)
        sharePrice.value = Number(data.share_price ?? 0)
        sharesCompulsoryAppliesToExisting.value = Boolean(data.shares_compulsory_applies_to_existing)
        autoCreateSavingsAccount.value = data.auto_create_savings_account ?? true
        requireMemberApproval.value = Boolean(data.require_member_approval)
        loyalMemberMinTenureMonths.value = data.loyal_member_min_tenure_months ?? 12
        hideInitialDeposit.value = Boolean(data.hide_initial_deposit_field)
        hideOpeningBalance.value = Boolean(data.hide_opening_balance_field)
        hideIsShareholderField.value = Boolean(data.hide_is_shareholder_field)
        onboardingSettingsLoaded.value = true
    }

    async function fetchOnboardingSettings() {
        try {
            const res = await onboardingSettingsApi.get()
            applyOnboardingSettings(res.data.data)
        } catch {
            // silently fail — defaults remain
        }
    }

    async function saveOnboardingSettings(payload: OnboardingSettings) {
        const res = await onboardingSettingsApi.update({
            shares_compulsory: sharesCompulsory.value,
            min_shares_on_onboarding: minSharesOnOnboarding.value,
            share_price: sharePrice.value,
            shares_compulsory_applies_to_existing: sharesCompulsoryAppliesToExisting.value,
            auto_create_savings_account: autoCreateSavingsAccount.value,
            require_member_approval: requireMemberApproval.value,
            loyal_member_min_tenure_months: loyalMemberMinTenureMonths.value,
            hide_initial_deposit_field: hideInitialDeposit.value,
            hide_opening_balance_field: hideOpeningBalance.value,
            hide_is_shareholder_field: hideIsShareholderField.value,
            ...payload,
        })

        applyOnboardingSettings(res.data.data)
    }

    return {
        hideInitialDeposit,
        hideOpeningBalance,
        hideIsShareholderField,
        setHideInitialDeposit,
        setHideOpeningBalance,
        setHideIsShareholderField,
        // onboarding
        sharesCompulsory,
        minSharesOnOnboarding,
        sharePrice,
        sharesCompulsoryAppliesToExisting,
        autoCreateSavingsAccount,
        requireMemberApproval,
        loyalMemberMinTenureMonths,
        onboardingSettingsLoaded,
        fetchOnboardingSettings,
        saveOnboardingSettings,
    }
})
