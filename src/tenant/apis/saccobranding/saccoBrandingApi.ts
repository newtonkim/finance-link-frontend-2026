import { reactive } from 'vue'
import { tenantClient } from '@/tenant/apis/tenantClient'
import { getetSystemBranding, setSystemBranding } from '@/Global'

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

/**
 * Shape stored in localStorage — always uses logo_path (relative).
 * Supports the legacy login shape (name/tag/logo) for backward compatibility.
 */
type BrandingCache = {
    sacco_name?: string | null
    name?: string | null       // legacy: login endpoint aliases sacco_name → name
    tagline?: string | null
    tag?: string | null        // legacy: login endpoint aliases tagline → tag
    logo_path?: string | null
    logo?: string | null       // legacy: login endpoint aliases logo_path → logo
}

function buildLogoUrl(logoPath: string | null | undefined): string | null {
    if (!logoPath) return null

    const storageIndex = logoPath.indexOf('/storage/')
    if (storageIndex >= 0) return logoPath.slice(storageIndex)

    if (logoPath.startsWith('data:')) return logoPath

    const clean = logoPath.replace(/^\/+/, '').replace(/^storage\//, '')
    return `/storage/${clean}`
}

function signNewData(res: BrandingCache & { logo_url?: string | null }) {
    saccoBrandingState.sacco_name = res.sacco_name ?? res.name ?? null
    saccoBrandingState.tagline    = res.tagline    ?? res.tag  ?? null
    // Prefer a full logo_url from the server; fall back to building from path
    saccoBrandingState.logo_url   = res.logo_url ?? buildLogoUrl(res.logo_path ?? res.logo)
    saccoBrandingState.loaded     = true
}

export const saccoBrandingApi = {
    async get() {
        // Show cached data immediately so the sidebar renders without a flash
        const cached = getetSystemBranding()
        if (cached) {
            signNewData(cached)
        }
        // Always fetch fresh data from the server to pick up any changes (e.g. newly saved logo)
        try {
            const res = await tenantClient.get('/sacco-branding')
            const data = res.data?.data ?? res.data ?? null
            if (data) {
                setSystemBranding({
                    sacco_name: data.sacco_name ?? null,
                    tagline:    data.tagline    ?? null,
                    logo_path:  data.logo_path  ?? null,
                })
                signNewData(data)
            }
        } catch {
            // Silently fall back to the cached data already applied above
        }
    },

    async update(data: { sacco_name?: string; tagline?: string; logo?: File | null }) {
        const formData = new FormData()
        if (data.sacco_name !== undefined) formData.append('sacco_name', data.sacco_name)
        if (data.tagline    !== undefined) formData.append('tagline',    data.tagline ?? '')
        if (data.logo)                     formData.append('logo',       data.logo)

        const res = await tenantClient.post('/sacco-branding', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })

        const saved = res.data?.data ?? res.data ?? null
        if (saved) {
            // Persist only env-independent fields — never the absolute logo_url
            setSystemBranding({
                sacco_name: saved.sacco_name ?? null,
                tagline:    saved.tagline    ?? null,
                logo_path:  saved.logo_path  ?? null,
            })
            signNewData(saved)
        }
        return res
    },

    /** Expose so callers can build a logo URL with the same logic (e.g. after save). */
    buildLogoUrl,
}
