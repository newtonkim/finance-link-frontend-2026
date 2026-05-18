<script setup lang="ts">
import { ref, computed } from 'vue';

import { Users, MinusCircle, PlusCircle, Trash2, ShieldCheck, ShieldX, Clock, AlertTriangle, RotateCcw } from 'lucide-vue-next';
const memberStatues = computed(() => [
    {
        name: "Rejected",
        id: 'rejected',
    },
    {
        name: "Pending",
        id: 'pending',
    },
    {
        name: "Active",
        id: 'active',
    },
])
const props = defineProps<{
    member: Record<string, any>;
    approving: boolean;
    rejecting: boolean;
    deleting: boolean;
}>();

const emit = defineEmits<{
    deposit: [];
    withdraw: [];
    delete: [];
    approve: [];
    reject: [reason: string];
}>();

const showRejectModal = ref(false);
const rejectReason = ref('');
const showDeleteDialog = ref(false);

const handleReject = async () => {
    await emit('reject', rejectReason.value);
    showRejectModal.value = false;
    rejectReason.value = '';
};

const handleDelete = () => {
    emit('delete');
    showDeleteDialog.value = false;
};
</script>

<template>
    <!-- Pending approval banner -->

    <div v-if="member?.status === 'pending'"
        class="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 mb-1">
        <Clock class="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div class="flex-1 min-w-0">
            <p class="text-[13px] font-bold text-amber-800">Awaiting Approval</p>
            <p class="text-[12px] text-amber-700 mt-0.5">
                This member is pending approval. Deposits, withdrawals, and loans are blocked until an admin approves
                the registration.
            </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
            <button @click="showRejectModal = true" :disabled="rejecting"
                class="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                <ShieldX :size="13" />
                Reject
            </button>
            <button @click="()=>{
                emit('approve')
                
                }" :disabled="approving"
                class="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50">
                <ShieldCheck :size="13" />
                {{ approving ? 'Approving…' : 'Approve Member' }}
            </button>
        </div>
    </div>

    <!-- Rejected banner -->
    <div v-if="member?.status === 'rejected'"
        class="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-2 absolute   left-0  mx-4 mb-1">
        <ShieldX class="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        <div class="flex-1 min-w-0">
            <p class="text-[13px] font-bold text-red-800">Registration Rejected</p>
            <p class="text-[12px] text-red-700 mt-0.5">This member's registration was rejected and cannot transact.</p>
        </div>
    </div>

    <!-- Top action buttons -->
    <!-- <div class="flex flex-wrap items-center justify-end gap-1">
      
        <button
            class="flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-bold rounded-full bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] transition-colors">
            <Users :size="15" />
            Member Groups
        </button>

        <button @click="emit('withdraw')" :disabled="member?.status !== 'active'"
            :title="member?.status !== 'active' ? 'Member must be approved before withdrawals' : ''"
            :class="member?.status !== 'active'
                ? 'flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-bold rounded-full bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-bold rounded-full bg-[#f97316] text-white hover:bg-[#ea580c] transition-colors shadow-sm'">
            <MinusCircle :size="15" stroke-width="2.5" />
            Withdraw
        </button>
        <button @click="emit('deposit')" :disabled="member?.status !== 'active'"
            :title="member?.status !== 'active' ? 'Member must be approved before deposits' : ''"
            :class="member?.status !== 'active'
                ? 'flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-bold rounded-full bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-bold rounded-full bg-[#16a34a] text-white hover:bg-[#15803d] transition-colors shadow-sm'">
            <PlusCircle :size="15" stroke-width="2.5" />
            Deposit
        </button>
        <button @click="showDeleteDialog = true"
            class="flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-bold rounded-full border border-[#fca5a5] bg-[#fff1f2] text-[#ef4444] hover:bg-[#ffe4e6] transition-colors">
            <Trash2 :size="15" stroke-width="2.5" />
            Delete Member
        </button>

        
    </div> -->

    <!-- Reject modal -->
    <div v-if="showRejectModal"
        class="fixed inset-0  flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="w-full max-w-md rounded-2xl bg-white p -6 shadow-2xl">
            <h3 class="text-[15px] font-bold text-gray-900 mb-1">Reject Registration</h3>
            <p class="text-[12px] text-gray-500 mb-4">Optionally provide a reason for rejection. This will be saved to
                the member's record.</p>
            <textarea v-model="rejectReason" rows="3" placeholder="Rejection reason (optional)..."
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[13px] text-gray-800 focus:border-red-400 focus:outline-none resize-none" />
            <div class="flex justify-end gap-3 mt-4">
                <button @click="showRejectModal = false"
                    class="px-4 py-2 rounded-full text-[12px] font-bold border border-gray-200 text-gray-600 hover:bg-gray-50">
                    Cancel
                </button>
                <button @click="handleReject" :disabled="rejecting"
                    class="px-5 py-2 rounded-full text-[12px] font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                    {{ rejecting ? 'Rejecting…' : 'Confirm Reject' }}
                </button>
            </div>
        </div>
    </div>

    <!-- Delete confirmation dialog -->
    <!-- <Teleport to="body">
        <Transition name="fade">
            <div v-if="showDeleteDialog" class="fixed inset-0  flex items-center justify-center">
                <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showDeleteDialog = false"></div>
                <div
                    class="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 dark:border dark:border-neutral-800">
                    <div class="flex items-start gap-4">
                        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                            <AlertTriangle :size="20" class="text-red-600" />
                        </div>
                        <div>
                            <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Delete Member</h3>
                            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Are you sure you want to delete <strong
                                    class="text-neutral-700 dark:text-neutral-200">{{ member.name }}</strong>? This
                                action cannot be undone.
                            </p>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button @click="showDeleteDialog = false"
                            class="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
                            Cancel
                        </button>
                        <button @click="handleDelete" :disabled="deleting"
                            class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                            <span v-if="deleting"
                                class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport> -->
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
