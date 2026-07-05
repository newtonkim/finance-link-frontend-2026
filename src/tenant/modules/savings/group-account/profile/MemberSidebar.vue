<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Star } from 'lucide-vue-next';
import { formatCurrency, NameInitials } from '../../../../../Global/index';
const props = defineProps<{
    data: Record<string, any>;
    memberInitials: string;
    computedAge: string;
    uploadProcessing: boolean;
    formatDate: (d?: string) => string;
}>(), emit = defineEmits<{
    avatarClick: [];
}>();
const formatCleanDate = (date: any) => {
    return date ? String(date).replace(/,/g, "") : "—"
}
const quickInfo = computed(() => [
    {
        label: "Code",
        value: (props.data.group_code),
    },
    {
        label: "Status",
        value: (props.data.status)
    },
    {
        label: "Location",
        value: props.data.location || "—"
    },
    {
        label: "Members",
        value: props.data.total_members ?? "—"
    },
    {
        label: "Contact",
        value: props.data.phone || "—"
    },
    {
        label: "Created",
        value: formatCleanDate(props.data.created_at)
    },
])
const imageLoadFailed = ref(false)
const groupImageUrl = computed(() => {
    const raw = props.data?.group_image || props.data?.group_log || props.data?.image_path
    if (!raw || typeof raw !== 'string') return ''

    const imagePath = raw.trim().replace('/public/', '/storage/')
    if (!imagePath) return ''
    if (/^https?:\/\//i.test(imagePath)) return imagePath
    if (imagePath.startsWith('/storage/')) return imagePath
    if (imagePath.startsWith('storage/')) return `/${imagePath}`
    if (imagePath.startsWith('/public/')) return imagePath.replace('/public/', '/storage/')
    if (imagePath.startsWith('public/')) return `/storage/${imagePath.slice(7)}`

    return `/storage/${imagePath.replace(/^\/+/, '')}`
})
const fallbackInitials = computed(() => props.memberInitials || NameInitials(props.data?.group_name || props.data?.name || ''))
const pooledSavings = computed(() => Number(props.data?.available_balance ?? 0))
const pooledSavingsDisplay = computed(() =>
    new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(pooledSavings.value)
)
const savingsGoal = computed(() => Number(props.data?.savings_goal ?? props.data?.goal_amount ?? props.data?.target_amount ?? 0))
const savingsProgress = computed(() => {
    if (!savingsGoal.value || savingsGoal.value <= 0) return 0
    return Math.min(100, Math.round((pooledSavings.value / savingsGoal.value) * 100))
})

watch(groupImageUrl, () => {
    imageLoadFailed.value = false
})
</script>
<template>
    <div class="w-full lg:w-[300px] shrink-0 flex flex-col gap-6">
        <div class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div class="relative h-[128px] bg-[#091326]">
                <div class="absolute top-5 left-1/2 -translate-x-1/2">
                    <span
                        class="inline-flex items-center gap-1.5 rounded-full border border-[#5c79b2] bg-white/5 px-4 py-1.5 text-[12px] font-black uppercase tracking-[0.18em] text-[#8db5ff]">
                        <Star :size="13" fill="currentColor" />
                        STANDARD
                    </span>
                </div>
            </div>
            <div class="relative z-10 flex justify-center -mt-[52px] px-4">

                <div @click="emit('avatarClick')"
                    class="relative flex size-[104px] cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#1456d9] shadow-sm">
                    <img v-if="groupImageUrl && !imageLoadFailed" :src="groupImageUrl" :alt="`${data?.group_name || 'Group'} profile image`"
                        class="w-full h-full object-cover" @error="imageLoadFailed = true" />
                    <span v-else class="text-[30px] font-black leading-none text-white">{{ fallbackInitials }}</span>
                    <div v-if="uploadProcessing" class="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div class="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                    </div>
                </div>
            </div>

            <div class="px-6 pb-7 pt-5 text-center">
                <h2 class="text-[20px] font-black leading-tight tracking-normal text-[#111827]">
                    {{ data?.group_name || data?.name || 'Group profile' }}
                </h2>
                <p class="mt-1 text-[15px] font-bold leading-none tracking-normal text-slate-400">
                    {{ data?.group_code || '—' }}
                </p>
            </div>

            <div class="border-t border-slate-100 px-6 py-7">
                <h3 class="mb-5 flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.18em] text-slate-400">
                    <span class="size-2 rounded-full bg-[#1456d9]"></span>
                    Quick Info
                </h3>

                <div class="divide-y divide-slate-100">
                    <div v-for="(item, index) in quickInfo" :key="index" class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                        <span class="text-[15px] font-medium leading-none text-slate-500">
                            {{ item?.label }}
                        </span>
                        <span class="max-w-[58%] truncate text-right text-[15px] font-black leading-none text-[#111827]">
                            {{ item?.value || "—" }}
                        </span>
                    </div>
                </div>

                <div class="mt-7 rounded-[22px] bg-[#eef3ff] px-5 py-5">
                    <p class="text-[13px] font-black uppercase tracking-[0.18em] text-[#1456d9]">
                        Pooled Savings
                    </p>
                    <p class="mt-3 max-w-full break-words text-[clamp(18px,5.8vw,24px)] font-black leading-tight tracking-normal text-[#111827]">
                        {{ pooledSavingsDisplay }}
                    </p>
                    <div v-if="savingsGoal > 0" class="mt-5">
                        <div class="h-2.5 overflow-hidden rounded-full bg-[#cfe0ff]">
                            <div class="h-full rounded-full bg-[#1456d9]" :style="{ width: `${savingsProgress}%` }"></div>
                        </div>
                        <p class="mt-3 text-[14px] font-bold text-slate-500">
                            {{ savingsProgress }}% of {{ formatCurrency(savingsGoal) }} goal
                        </p>
                    </div>
                    <p v-else class="mt-4 text-[14px] font-bold text-slate-500">
                        Current group balance
                    </p>
                </div>
            </div>
        </div>

    </div>
</template>
