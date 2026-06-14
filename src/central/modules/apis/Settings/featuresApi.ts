import { apiClient } from '@/central/api/client'

export function featuresApi() {
    async function list() {
        const res = await apiClient.post('central/settings/features/list', {})
        return res
    }

    async function create(data: { name: string; key: string }) {
        const res = await apiClient.post('central/settings/features/create', data)
        return res
    }

    async function remove(data: { id: number }) {
        const res = await apiClient.post('central/settings/features/delete', data)
        return res
    }

    return { list, create, remove }
}
