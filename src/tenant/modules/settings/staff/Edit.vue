<template>
    <div class="relative z-10 flex  w-full flex-col " style="
        height: 88vh;
">
        <!-- Body -->
        <div class="  overflow-y-auto px-4 space-y-2 flex-1 ">
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
                <div class="relative">
                    <input
                        v-model="form.password"
                        :type="showPassword ? 'text' : 'password'"
                        placeholder="••••••••"
                        class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 pr-10 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                    <button
                        type="button"
                        @click="showPassword = !showPassword"
                        class="absolute inset-y-0 right-2 flex items-center text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white"
                        :aria-label="showPassword ? 'Hide password' : 'Show password'"
                    >
                        <EyeOff v-if="showPassword" class="h-4 w-4" />
                        <Eye v-else class="h-4 w-4" />
                    </button>
                </div>
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
                                ? { violet: 'bg-nfuko-primary-600 text-white', indigo: 'bg-nfuko-primary-600 text-white', emerald: 'bg-nfuko-primary-600 text-white' }[perm.color]
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
            class="absolute  p-2 z-50 sticky bottom-0 border-0 border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">
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
import { ref, onMounted, watch } from 'vue'
import { Check, Vote, GitBranch, CheckSquare, Eye, EyeOff } from 'lucide-vue-next'
import { useStaffStore } from '@/stores/staffStore'
import type { Staff } from '@/tenant/apis/staff/api'
import { tenantClient } from '@/tenant/apis/tenantClient'
import { branchesApi } from '@/tenant/apis/branches/branchesApi'
import type { Branch } from '@/tenant/apis/branches/branchesApi'
import { toast } from 'vue-sonner'
import { 
    SheetFooter,
} from '@/Global';
const staffStore = useStaffStore()

const branches = ref<Branch[]>([])
const roles = ref<{ id: number; name: string }[]>([])
const props = defineProps({
    data: {
        type: Object,
        required: true,
    },
})

// ─── Drawer state ─────────────────────────────────────────────────────────────
const isEditing = ref(false)
const saving = ref(false)
const currentId = ref<number | null>(null)
const showPassword = ref(false)

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

function normalizeBoolean(value: unknown): boolean {
    if (value === true || value === 1 || value === '1') return true
    if (value === false || value === 0 || value === '0' || value == null) return false
    return Boolean(value)
}

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

})

watch(
    () => props.data,
    (staff) => {
        if (staff) openEdit(staff as Staff)
    },
    { immediate: true }
)

function openEdit(staff: Staff) {
    if (!staff) return
    isEditing.value = true
    const recordId = Number((staff as any).id ?? (staff as any).staff_id ?? 0)
    currentId.value = Number.isFinite(recordId) && recordId > 0 ? recordId : null
    showPassword.value = false
    form.value = {
        name: (staff as any).staff_fall_name ?? staff.name ?? '',
        email: (staff as any).staff_email ?? staff.email ?? '',
        role: (staff as any).system_role ?? staff.role ?? 'Staff',
        password: '',
        status: (staff as any).status ?? 'active',
        is_tenant_admin: normalizeBoolean((staff as any).is_tenant_admin),
        branch_id: (staff as any).branch_id ?? null,
        can_vote_on_loans: normalizeBoolean((staff as any).can_vote_on_loans),
        can_manage_branch: normalizeBoolean((staff as any).can_manage_branch),
        can_finalise_loan: normalizeBoolean((staff as any).can_finalise_loan),
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
            const payload: Partial<Staff> = {
                name: form.value.name,
                email: form.value.email,
                role: form.value.role,
                status: form.value.status,
                is_tenant_admin: Boolean(form.value.is_tenant_admin),
                branch_id: form.value.branch_id ?? null,
                can_vote_on_loans: Boolean(form.value.can_vote_on_loans),
                can_manage_branch: Boolean(form.value.can_manage_branch),
                can_finalise_loan: Boolean(form.value.can_finalise_loan),
                password: form.value.password,
            }
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

function handleCancel(){
    
}
const loanPermissions = [
    { field: 'can_vote_on_loans' as const, icon: Vote, label: 'Vote on loan applications', description: 'Can cast approve/decline votes in committee rounds.', color: 'violet' },
    { field: 'can_manage_branch' as const, icon: GitBranch, label: 'Manage branch (Branch Manager)', description: 'Can recommend applications and return for correction.', color: 'indigo' },
    { field: 'can_finalise_loan' as const, icon: CheckSquare, label: 'Finalise loan terms', description: 'Can confirm and lock repayment schedules before disbursement.', color: 'emerald' },
]
</script>
