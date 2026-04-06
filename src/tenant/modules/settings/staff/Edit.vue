<template>
    <div class="relati ve z-10 flex  w-full flex-col">


        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-4 py-2 space-y-4">
            <!-- Name -->
            <div>
                <label class="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Name <span
                        class="text-red-500">*</span></label>
                <input v-model="form.name" type="text" placeholder="John Doe"
                    class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>

            <!-- Email -->
            <div>
                <label class="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Email <span
                        class="text-red-500">*</span></label>
                <input v-model="form.email" type="email" placeholder="john@sacco.com"
                    class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>

            <!-- Password -->
            <div>
                <label class="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Password
                    <span v-if="isEditing" class="font-normal text-neutral-400">(leave blank to keep current)</span>
                    <span v-else class="text-red-500"> *</span>
                </label>
                <input v-model="form.password" type="password" placeholder="••••••••"
                    class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>

            <!-- Role + Status in 2 cols -->
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Role</label>
                    <select v-model="form.role"
                        class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                        <option value="" disabled>— Select role —</option>
                        <option v-for="r in roles" :key="r.id" :value="r.name">{{ r.name }}</option>
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Status</label>
                    <select v-model="form.status"
                        class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <!-- Branch -->
            <div>
                <label class="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Branch</label>
                <select v-model="form.branch_id"
                    class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                    <option :value="null">— No Branch —</option>
                    <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
                </select>
            </div>

            <!-- System Admin toggle -->
            <label
                class="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/30">
                <input type="checkbox" v-model="form.is_tenant_admin"
                    class="mt-0.5 h-4 w-4 rounded accent-nfuko-primary cursor-pointer" />
                <div>
                    <p class="text-sm font-semibold text-neutral-900 dark:text-white">System Administrator</p>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">Grants full override permissions within
                        this workspace.</p>
                </div>
            </label>

            <!-- Loan Workflow Permissions -->
            <div>
                <p
                    class="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                    Loan Workflow Permissions</p>
                <div class="space-y-2">
                    <div v-for="perm in loanPermissions" :key="perm.field"
                        class="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/30">
                        <div class="flex items-center gap-3">
                            <component :is="perm.icon" class="h-4 w-4 shrink-0" :class="{
                                'text-violet-500': perm.color === 'violet',
                                'text-indigo-500': perm.color === 'indigo',
                                'text-emerald-500': perm.color === 'emerald',
                            }" />
                            <div>
                                <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ perm.label }}</p>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ perm.description }}</p>
                            </div>
                        </div>
                        <button type="button"
                            class="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                            :class="form[perm.field]
                                ? { violet: 'bg-violet-600 text-white', indigo: 'bg-indigo-600 text-white', emerald: 'bg-emerald-600 text-white' }[perm.color]
                                : 'border border-neutral-200 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400'"
                            @click="form[perm.field] = !form[perm.field]">
                            <Check v-if="form[perm.field]" class="h-3 w-3" />
                            {{ form[perm.field] ? 'Enabled' : 'Disabled' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <SheetFooter
            class="p-2 z-50 sticky bottom-0 border-0 border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">
            <div class="flex w-full gap-3 items-center justify-between">
                <div>
                    <Button variant="outline"
                        class="flex-1 h-11 w-full  font-bold border-neutral-200 dark:border-neutral-800"
                        @click="handleCancel">
                        Close
                    </Button>
                </div>

                <div>
                    <!-- @click="handleSave" -->
                    <Button :disabled="saving" @click="save" type="submit"
                        class="flex-1 h-11  w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors">
                        Save

                    </Button>
                </div>
            </div>

        </SheetFooter>
    </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { UserCog, Plus, Search, X, Check, Pencil, Vote, GitBranch, CheckSquare, Eye, Trash2 } from 'lucide-vue-next'
import { useStaffStore } from '@/stores/staffStore'
import type { Staff } from '@/tenant/apis/staff/api'
import { tenantClient } from '@/tenant/apis/tenantClient'
import { branchesApi } from '@/tenant/apis/branches/branchesApi'
import type { Branch } from '@/tenant/apis/branches/branchesApi'
import { toast } from 'vue-sonner'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/Global';
const router = useRouter()
const staffStore = useStaffStore()

const search = ref('')
const branches = ref<Branch[]>([])
const roles = ref<{ id: number; name: string }[]>([])
const props = defineProps({
    data: {
        type: Object,
        required: true,
    },
})

// ─── Delete confirm ────────────────────────────────────────────────────────────
const deleteTarget = ref<Staff | null>(null)
const deleting = ref(false)

// ─── Drawer state ─────────────────────────────────────────────────────────────
const isEditing = ref(false)
const saving = ref(false)
const currentId = ref<number | null>(null)

const defaultForm = () => ({
    name: '',
    email: '',
    role: 'Staff',
    password: '',
    status: 'active' as 'active' | 'inactive',
    is_tenant_admin: false,
    branch_id: null as number | null,
    can_vote_on_loans: false,
    can_manage_branch: false,
    can_finalise_loan: false,
})

const form = ref(defaultForm())

onMounted(async () => {
    await staffStore.fetchStaffList()
    try {
        const [branchRes, roleRes] = await Promise.all([
            branchesApi.list(),
            tenantClient.post('/staff/roles-drop-down'),
        ])
        branches.value = (branchRes.data?.data ?? []).filter((b: Branch) => b.is_active)
        roles.value = roleRes.data?.payload?.data ?? roleRes.data?.payload ?? []
    } catch { }

    openEdit(props.data)
})

const filtered = computed(() => {
    const q = search.value.toLowerCase()
    return (staffStore.staffList as Staff[])
        .filter((s) => !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
        .slice()
        .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
})

function openCreate() {
    isEditing.value = false
    currentId.value = null
    form.value = defaultForm()
}

function openEdit(staff: Staff) {

    isEditing.value = true
    currentId.value = staff.id!
    form.value = {
        name: staff.staff_fall_name,
        email: staff.staff_email,
        role: staff.system_role,
        password: '',
        status: staff.status,
        is_tenant_admin: staff.is_tenant_admin ?? false,
        branch_id: staff.branch_id ?? null,
        can_vote_on_loans: staff.can_vote_on_loans ?? false,
        can_manage_branch: staff.can_manage_branch ?? false,
        can_finalise_loan: staff.can_finalise_loan ?? false,
    }
}

async function save() {
    if (!form.value.name || !form.value.email) {
        toast.error('Name and email are required.')
        return
    }
    if (!isEditing.value && !form.value.password) {
        toast.error('Password is required for new staff.')
        return
    }
    saving.value = true
    try {
        if (isEditing.value && currentId.value) {
            const payload: Partial<Staff> = { ...form.value }
            if (!payload.password) delete payload.password
            await staffStore.updateStaff(currentId.value, payload)
        } else {
            await staffStore.createStaff(form.value as Staff)
        }
        await staffStore.fetchStaffList()
    } catch {
        // error shown by store
    } finally {
        saving.value = false
    }
}

function viewStaff(staff: Staff) {
    router.push({ name: 'tenant-settings-staff-profile', params: { id: staff.id } })
}

async function confirmDelete() {
    if (!deleteTarget.value?.id) return
    deleting.value = true
    try {
        await staffStore.deleteStaff(deleteTarget.value.id)
        deleteTarget.value = null
    } catch {
        // error shown by store
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

const loanPermissions = [
    { field: 'can_vote_on_loans' as const, icon: Vote, label: 'Vote on loan applications', description: 'Can cast approve/decline votes in committee rounds.', color: 'violet' },
    { field: 'can_manage_branch' as const, icon: GitBranch, label: 'Manage branch (Branch Manager)', description: 'Can recommend applications and return for correction.', color: 'indigo' },
    { field: 'can_finalise_loan' as const, icon: CheckSquare, label: 'Finalise loan terms', description: 'Can confirm and lock repayment schedules before disbursement.', color: 'emerald' },
]
</script>