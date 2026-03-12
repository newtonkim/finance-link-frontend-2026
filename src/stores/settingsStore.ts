import { defineStore } from 'pinia'
import { ref } from 'vue'
import { onboardingSettingsApi } from '@/tenant/apis/onboardingSettings/api'

const STORAGE_KEY = 'mfuko_settings'

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : {}
    } catch {
        return {}
    }
}

function saveToStorage(data: Record<string, unknown>) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const useSettingsStore = defineStore('settings', () => {
    const stored = loadFromStorage()

    const hideInitialDeposit = ref<boolean>(Boolean(stored.hideInitialDeposit ?? false))
    const hideOpeningBalance = ref<boolean>(Boolean(stored.hideOpeningBalance ?? false))
    const hideIsShareholderField = ref<boolean>(Boolean(stored.hideIsShareholderField ?? false))

    function setHideInitialDeposit(value: boolean) {
        hideInitialDeposit.value = value
        saveToStorage({ ...loadFromStorage(), hideInitialDeposit: value })
    }

    function setHideOpeningBalance(value: boolean) {
        hideOpeningBalance.value = value
        saveToStorage({ ...loadFromStorage(), hideOpeningBalance: value })
    }

    function setHideIsShareholderField(value: boolean) {
        hideIsShareholderField.value = value
        saveToStorage({ ...loadFromStorage(), hideIsShareholderField: value })
    }

    // ── Shares onboarding settings (fetched from backend) ────────────────────
    const sharesCompulsory = ref<boolean>(false)
    const minSharesOnOnboarding = ref<number>(1)
    const sharePrice = ref<number>(0)
    const sharesCompulsoryAppliesToExisting = ref<boolean>(false)
    const autoCreateSavingsAccount = ref<boolean>(true)
    const requireMemberApproval = ref<boolean>(false)
    const onboardingSettingsLoaded = ref<boolean>(false)

    async function fetchOnboardingSettings() {
        try {
            const res = await onboardingSettingsApi.get()
            const data = res.data.data
            sharesCompulsory.value = data.shares_compulsory
            minSharesOnOnboarding.value = data.min_shares_on_onboarding
            sharePrice.value = Number(data.share_price)
            sharesCompulsoryAppliesToExisting.value = data.shares_compulsory_applies_to_existing
            autoCreateSavingsAccount.value = data.auto_create_savings_account
            requireMemberApproval.value = data.require_member_approval
            onboardingSettingsLoaded.value = true
        } catch {
            // silently fail — defaults remain
        }
    }

    async function saveOnboardingSettings(payload: {
        shares_compulsory: boolean
        min_shares_on_onboarding: number
        share_price: number
        shares_compulsory_applies_to_existing: boolean
        auto_create_savings_account: boolean
        require_member_approval: boolean
    }) {
        const res = await onboardingSettingsApi.update(payload)
        const data = res.data.data
        sharesCompulsory.value = data.shares_compulsory
        minSharesOnOnboarding.value = data.min_shares_on_onboarding
        sharePrice.value = Number(data.share_price)
        sharesCompulsoryAppliesToExisting.value = data.shares_compulsory_applies_to_existing
        autoCreateSavingsAccount.value = data.auto_create_savings_account
        requireMemberApproval.value = data.require_member_approval
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
        onboardingSettingsLoaded,
        fetchOnboardingSettings,
        saveOnboardingSettings,
    }
})
