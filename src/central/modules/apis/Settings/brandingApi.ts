import { apiClient } from '@/central/api/client'
import { notify } from '@/Global/Toasters/ToastMsg'
import { pomPinia } from 'septor-store'

export function brandingApi() {
    const Store = pomPinia()

    async function getBranding() {
        return Store.stateGenaratorApi({
            StateStore: 'central_branding',
            time: 60,
            reqs: {
                url: 'central/settings/branding',
                method: 'get',
            },
        })
    }

    async function updateBranding(data: {
        platform_name?: string
        tagline?: string
        logo?: File | null
    }) {
        const formData = new FormData()
        if (data.platform_name !== undefined) formData.append('platform_name', data.platform_name)
        if (data.tagline !== undefined) formData.append('tagline', data.tagline ?? '')
        if (data.logo) formData.append('logo', data.logo)

        try {
            const res = await apiClient.post('/central/settings/branding', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            notify({ msg: 'Branding updated successfully', type: 'Success' })
            // Update the store so any component reading central_branding reacts immediately
            ;(Store as any).central_branding = { payload: res.data.payload }
            return res.data
        } catch (e: any) {
            notify({
                msg: e?.response?.data?.message ?? 'Failed to update branding',
                type: 'Error',
            })
            throw e
        }
    }

    return { getBranding, updateBranding }
}
