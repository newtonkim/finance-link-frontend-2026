<template>
  <AnalysisTile :data='stats'/> 

</template>
<script setup lang="ts">
import { Users, DollarSign, TrendingUp, AlertTriangle, ShieldAlert, CreditCard, } from 'lucide-vue-next';
import { addCommasCurrency,AnalysisTile } from '@/Global';
import { ref, watch } from 'vue';
const props = defineProps({
    data: Object
})
const stats: any = ref([])
function setData() {

    stats.value = [
        {
            title: 'Total Tenants',
            value: addCommasCurrency(props?.data?.tenants?.tatal_tenants ?? 0),
            trend: addCommasCurrency(props?.data?.tenants?.tatal_tenants ?? 0) + ' Active',
            trendColor: 'text-emerald-500',
            icon: Users,
            bgColor: 'bg-[#f0f9f6]', // Light greenish/mint
            iconColor: 'text-[#2d9d78]'
        },
        {
            title: 'Monthly Revenue',
            value: props?.data?.revenue?.monthly ?? "0.00",
            trend: 'Monthly',
            trendColor: 'text-neutral-400',
            icon: DollarSign,
            bgColor: 'bg-[#f0f9f6]',
            iconColor: 'text-[#2d9d78]'
        },
        {
            title: 'Annual Revenue',
            value: addCommasCurrency(props?.data?.revenue?.yearly ?? "0.00"),
            trend: 'ARR',
            trendColor: 'text-neutral-400',
            icon: TrendingUp,
            bgColor: 'bg-[#f0f9f6]',
            iconColor: 'text-[#2d9d78]'
        },
        {
            title: 'Expiring (3d)',
            value: addCommasCurrency(props?.data?.licenses?.expiring_soon_3_days ?? "0"),
            trend: 'Action required',
            trendColor: 'text-orange-500',
            icon: AlertTriangle,
            bgColor: 'bg-orange-50',
            iconColor: 'text-orange-500'
        },
        {
            title: 'Expired Licenses',
            value: addCommasCurrency(props?.data?.licenses?.expired_licenses ?? "0"),

            trend: 'Expired',
            trendColor: 'text-rose-500',
            icon: ShieldAlert,
            bgColor: 'bg-rose-50',
            iconColor: 'text-rose-500'
        },
        {
            title: 'Suspended Users',
            value: addCommasCurrency(props?.data?.tenants?.suspended_tenants ?? "0"),
            trend: 'Suspended',
            trendColor: 'text-rose-500',
            icon: CreditCard,
            bgColor: 'bg-rose-50',
            iconColor: 'text-rose-500'
        },
    ];
}

watch(() => props?.data, () => {
    setData()
}, {
    immediate: true,
    deep: true
})

</script>