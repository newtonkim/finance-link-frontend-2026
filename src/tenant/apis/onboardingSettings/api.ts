import { tenantClient } from '@/tenant/apis/tenantClient'

export interface OnboardingSettings {
    id?: number
    shares_compulsory: boolean
    min_shares_on_onboarding: number
    share_price: number
    shares_compulsory_applies_to_existing: boolean
    auto_create_savings_account: boolean
    require_member_approval: boolean
}

export const onboardingSettingsApi = {
    get(): Promise<{ data: { data: OnboardingSettings } }> {
        return tenantClient.get('/onboarding-settings')
    },
    update(data: OnboardingSettings): Promise<{ data: { data: OnboardingSettings; message: string } }> {
        return tenantClient.put('/onboarding-settings', data)
    },
}
