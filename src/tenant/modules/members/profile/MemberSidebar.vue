<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { computed } from 'vue';
import { Edit, Star } from 'lucide-vue-next';
import { formatCurrency, NameInitials, SearchableSelect } from '@/Global';
import { memberProfileApi } from '@/tenant/apis/savings/member-profileApi';

const props = defineProps<{
    member: Record<string, any>;
    memberInitials: string;
    computedAge: string;
    uploadProcessing: boolean;
    formatDate: (d?: string) => string;
}>();

const { ChangMemberStatus } = memberProfileApi();

// 0759919211
const emit = defineEmits<{
    avatarClick: [];
}>();
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
const quickInfo = computed(() => [
    {
        label: "Date of Birth",
        value: formatCleanDate(props.member.dob)
    },
    {
        label: "National ID",
        value: props.member.NIN || "—"
    },
    {
        label: "Date Joined",
        value: formatCleanDate(
            props.member.joined_at || props.member.created_at
        )
    },
    {
        label: "Mobile Money",
        value: props.member.MM_number || "—"
    },
    {
        label: "Nationality",
        value: props.member.from || "—"
    },
    {
        label: "Referred By",
        value: props.member.referred_by || "—",
        border: true
    },
    {
        label: "Registered By",
        value: props.member.created_by || "—"
    }
])
const formatCleanDate = (date: any) => {
    return date ? (date).replace(/,/g, "") : "—"
}
</script>
<template>
    <div class="w-full lg:w-[280px] shrink-0 flex flex-col gap-6">
        <!-- Member Card -->
        <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <!-- Banner -->
            <div class="relative h-[88px] bg-[#08262a]">
                <div class="absolute top-4 left-1/2 -translate-x-1/2">
                    <span
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-[#cda434] border border-[#cda434]/30">
                        <Star :size="10" fill="currentColor" />
                        STANDARD
                    </span>
                </div>
            </div>
            <!-- Avatar -->
            <div class="flex justify-center -mt-12 relative z-10 px-4">
                <div @click="emit('avatarClick')"
                    class="w-[96px] h-[96px] rounded-full border-[3px] border-[#cda434] bg-white flex items-center justify-center overflow-hidden cursor-pointer shadow-sm relative">
                    <img v-if="member.profile || member.avatar_url" :src="member.profile || member.avatar_url" alt="Avatar"
                        class="w-full h-full object-cover" />
                    <span v-else class="text-2xl font-bold text-[#cda434]">{{ NameInitials(member.full_name || member.name) }}</span>
                    <div v-if="uploadProcessing" class="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div class="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                    </div>
                </div>
            </div>
            <!-- Member info -->
            <div class="px-5 pt-3 mb-5 text-center">
                <h2 class="text-[17px] font-black text-gray-900 tracking-tight">
                    {{ member.full_name || '—' }}
                </h2>
                <p class="text-[13px] text-[#788896] mt-1 tracking-tight">ID · {{ member.memeber_code || '—' }}</p>
                <p class="text-[13px] text-[#788896] mt-0.5 tracking-tight">{{ member.email || '—' }}</p>

                <div class="mt-4">
                    <span v-if="`${member?.status}` === 'active'"
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#ebf7ee] text-[#22a053]">
                        <span class="w-1.5 h-1.5 rounded-full bg-[#22a053]"></span>
                        Active Member
                    </span>
                    <span v-else-if="`${member?.status}` === 'pending'"
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600">
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Pending Approval
                    </span>
                    <span v-else-if="`${member?.status}` === 'rejected'"
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-500">
                        <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        Rejected
                    </span>
                    <span v-else
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">
                        <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        {{ member?.status || 'Unknown' }}
                    </span>
                </div>
            </div>
            <!-- Stats Grid 2x2 -->
            <div class="mx-5 mb-5 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                <div class="grid grid-cols-2">
                    <div class="p-4 border-r border-b border-gray-100">
                        <span
                            class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Shares</span>
                        <span class="text-[17px] font-extrabold text-gray-900">{{ Number(member?.share_value)
                            }}</span>
                    </div>
                    <div class="p-4 border-b border-gray-100">
                        <span
                            class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Gender</span>
                        <span class="text-[16px] font-bold text-gray-900 capitalize">{{ member.gender || '—' }}</span>
                    </div>
                    <div class="p-4 border-r border-gray-100">
                        <span
                            class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Marital</span>
                        <span class="text-[16px] font-bold text-gray-900 capitalize">{{ member.marital_status || '—'
                            }}</span>
                    </div>
                    <div class="p-4">
                        <span
                            class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Age</span>
                        <span class="text-[16px] font-bold text-gray-900">{{ computedAge }}</span>
                    </div>
                </div>
            </div>

        </div>
        <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 class="text-[12px] font-bold text-[#64748b] uppercase tracking-wider mb-5">
                Quick Info
            </h3>

            <div class="space-y-[18px]">
                <SearchableSelect label="status" name="status" type="select" required :options="memberStatues"
                    v-model="member.status" :value="member?.status"
                    @update:modelValue="(val) => ChangMemberStatus({ id: member.id, code: member.memeber_code, status: val })"
                    placeholder="Select status" dataOnMount />
                <div v-for="(item, index) in quickInfo" :key="index" :class="[
                    'flex justify-between items-center',
                    item.border ? 'pt-1 border-t border-gray-100 mt-1' : ''
                ]">
                    <span class="text-[13px] text-[#788896]">
                        {{ item.label }}
                    </span>

                    <span class="text-[13px]  text-gray-700 font-mono tracking-tight flex items-center gap-2">
                        {{ item.value }}
                    </span>
                </div>

            </div>
        </div>

    </div>
</template>
