import { reactive } from 'vue'
import { tenantClient } from '@/tenant/apis/tenantClient'
import { getetSystemBranding,setSystemBranding } from '@/Global'

/** Module-level singleton — any component that imports this shares the same reactive object */
export const saccoBrandingState = reactive<{
    sacco_name: string | null
    tagline: string | null
    logo_url: string | null
    loaded: boolean
}>({
    sacco_name: null,
    tagline: null,
    logo_url: null,
    loaded: false,
})

function signNewData(res){
    saccoBrandingState.sacco_name = res.name ?? null
            saccoBrandingState.tagline = res.tag ?? null
            saccoBrandingState.logo_url = res.logo ?? null
            saccoBrandingState.loaded = true 
}
export const saccoBrandingApi = {

    async get() {
        /// don call all the time , system is s busy doing vital things
        // const res = await tenantClient.get('/sacco-branding')
        // const data = res.data?.data ?? res.data ?? null
        // if (data) {
        //     saccoBrandingState.sacco_name = data.sacco_name ?? null
        //     saccoBrandingState.tagline = data.tagline ?? null
        //     saccoBrandingState.logo_url = data.logo_url ?? null
        //     saccoBrandingState.loaded = true
        // }
        const res=await       getetSystemBranding();
        
        if (res) {
       signNewData(res)
        }
    },

    async update(data: { sacco_name?: string; tagline?: string; logo?: File | null }) {
        const formData = new FormData()
        if (data.sacco_name !== undefined) formData.append('sacco_name', data.sacco_name)
        if (data.tagline !== undefined) formData.append('tagline', data.tagline ?? '')
        if (data.logo) formData.append('logo', data.logo)

        const res = await tenantClient.post('/sacco-branding', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })

        const saved = res.data?.data ?? res.data ?? null
        if (saved) {
                setSystemBranding(saved)
                signNewData(saved)
        }
        return res
    },
}
