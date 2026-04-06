<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Trash2, Edit, Eye, ShieldCheck } from 'lucide-vue-next'
import { useStaffStore } from '@/stores/staffStore'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { List } from '@/tenant/modules/staff/index.ts'
import type { Staff } from '@/tenant/apis/staff/api'
import { tenantClient } from '@/tenant/apis/tenantClient'
import { branchesApi } from '@/tenant/apis/branches/branchesApi'
import type { Branch } from '@/tenant/apis/branches/branchesApi'

const router = useRouter()
const staffStore = useStaffStore()

const branches = ref<Branch[]>([])
const roles = ref<{ id: number; name: string }[]>([])

const deleteTarget = ref<Staff | null>(null)
const deleting = ref(false)

onMounted(async () => {
    await staffStore.fetchStaffList()
    try {
        const res = await branchesApi.list()
        branches.value = (res.data?.data ?? []).filter((b: Branch) => b.is_active)
    } catch {}
    try {
        const roleRes = await tenantClient.post('/staff/roles-drop-down')
        roles.value = roleRes.data?.payload?.data ?? roleRes.data?.payload ?? []
    } catch {}
})

const viewStaff = (staff: Staff) => {
    router.push(`/tenant/settings/staff/${staff.id}`)
}

const confirmDelete = async () => {
    if (!deleteTarget.value?.id) return
    deleting.value = true
    try {
        await staffStore.deleteStaff(deleteTarget.value.id)
        deleteTarget.value = null
    } catch {
        // Error handled in store
    } finally {
        deleting.value = false
    }
}

function branchName(id: number | null | undefined) {
    if (!id) return '—'
    return branches.value.find((b) => b.id === id)?.name ?? '—'
}

function formatDate(d?: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
    <div class="bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <List />

        <!-- Staff table with permissions column -->
        <!-- Note: This is now handled by the unified List component above. 
             If additional columns are needed in TableDrawer, they should be added to Index.vue. -->

        <!-- Delete confirmation modal -->
        <Teleport to="body">
            <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
                leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
                <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    @mousedown.self="deleteTarget = null">
                    <div class="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                        <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Remove staff member?</h3>
                        <p class="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                            <strong class="text-neutral-800 dark:text-neutral-200">{{ deleteTarget?.name }}</strong> will be removed. This cannot be undone.
                        </p>
                        <div class="mt-5 flex gap-3 justify-end">
                            <button class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
                                @click="deleteTarget = null">Cancel</button>
                            <button
                                :disabled="deleting"
                                class="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                                @click="confirmDelete">
                                {{ deleting ? 'Removing…' : 'Remove' }}
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>
