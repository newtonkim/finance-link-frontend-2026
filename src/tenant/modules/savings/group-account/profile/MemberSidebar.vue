<script setup lang="ts">
import { computed } from 'vue';
import {  Star } from 'lucide-vue-next';
import { formatCurrency, NameInitials } from '@/Global';
const props = defineProps<{
    data: Record<string, any>;
    memberInitials: string;
    computedAge: string;
    uploadProcessing: boolean;
    formatDate: (d?: string) => string;
}>();


const emit = defineEmits<{
    avatarClick: [];
}>(); 
const quickInfo = computed(() => [
    {
        label: "code",
        value: (props.data.group_code),
        type: 'copy',
    },
    {
        label: "name",
        value: (props.data.group_name)
    },
    {
        label: "Blc for all",
        value: formatCurrency(props.data.available_balance)
    },
    {
        label: "status",
        value: (props.data.status)
    },
    {
        label: "created by",
        value: (props.data.created_by)

    },
    {
        label: "contact",
        value: props.data.phone || "—"
    },
    {
        label: "contact 2",
        value: props.data.phone2 || "—"
    },
    {
        label: "created at",
        value: formatCleanDate(props.data.created_at)
    },

])
const formatCleanDate = (date) => {
    return date ? (date).replace(/,/g, "") : "—"
}
</script>
<template>
    <div class="w-full lg:w-[280px] shrink-0 flex flex-col gap-6">
        <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div class="relative h-[88px] bg-[#08262a]">
                <div class="absolute top-4 left-1/2 -translate-x-1/2">
                    <span
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-[#cda434] border border-[#cda434]/30">
                        <Star :size="10" fill="currentColor" />
                        STANDARD
                    </span>
                </div>
            </div>
            <div class="flex justify-center -mt-12 relative z-10 px-4">

                <div @click="emit('avatarClick')"
                    class="w-[96px] h-[96px] rounded-full border-[3px] border-[#cda434] bg-white flex items-center justify-center overflow-hidden cursor-pointer shadow-sm relative">
                    {{ }}
                    <img v-if="data?.group_image" :src="data.group_image.replace('/public/', '/storage/')"
                        class="w-full h-full object-cover" />
                    <span v-else class="text-2xl font-bold text-[#cda434]">{{ NameInitials(data?.name) }}</span>
                    <div v-if="uploadProcessing" class="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div class="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                    </div>
                </div>
            </div>


            <div class="bg-white   rounded-2xl p-6  ">
                <h3 class="text-[12px] font-bold text-[#64748b] uppercase tracking-wider mb-5">
                    Quick Info
                </h3>

                <table class=" text-sm capitalize">
                    <tbody>
                        <tr v-for="(item, index) in quickInfo" :key="index" :class="[
                            item?.border ? 'border-t border-gray-100' : ''
                        ]">
                            <td class="py-[10px] text-[13px] text-[#788896] whitespace-nowrap pr-4">
                                {{ item?.label }}
                            </td>

                            <td class="py-[10px] text-right">
                                <div
                                    class="text-[13px] text-gray-[#788896] tracking-tight flex items-center justify-end gap-2 truncate">
                                    <span v-if="item?.type === 'copy'" class="w-[11vw]">

                                        <CopyData :copy="item?.value" />
                                    </span>

                                    <span v-else class="truncate">
                                        {{ item?.value || "—" }}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>
</template>
