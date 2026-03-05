<script setup lang="ts">
import { 
    Users, 
    CreditCard, 
    AlertTriangle, 
    DollarSign,
    ShieldAlert,
    TrendingUp
} from 'lucide-vue-next';

defineProps<{
    metrics: {
        total_tenants: number;
        active_tenants: number;
        expired_licenses: number;
        suspended_tenants: number;
        expiring_soon_3_days: number;
        revenue_metrics: {
            monthly_recurring_revenue: number;
            annual_recurring_revenue: number;
        };
    }
}>();

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
};
</script>

<template>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <!-- Total Tenants -->
        <div class="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e2edea]">
                <Users :size="20" :stroke-width="2" class="text-[#001d22]" />
            </div>
            <div class="min-w-0">
                <p class="truncate text-[13px] text-neutral-500 dark:text-neutral-400">Total Tenants</p>
                <div class="flex items-baseline gap-2">
                    <p class="text-[22px] font-bold leading-tight text-neutral-900 dark:text-white">
                        {{ metrics.total_tenants }}
                    </p>
                    <span class="text-[11px] font-medium text-green-500">{{ metrics.active_tenants }} Active</span>
                </div>
            </div>
        </div>

        <!-- Monthly Revenue -->
        <div class="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e2edea]">
                <DollarSign :size="20" :stroke-width="2" class="text-[#001d22]" />
            </div>
            <div class="min-w-0">
                <p class="truncate text-[13px] text-neutral-500 dark:text-neutral-400">Monthly Revenue</p>
                <p class="text-[22px] font-bold leading-tight text-neutral-900 dark:text-white">
                    {{ formatCurrency(metrics.revenue_metrics.monthly_recurring_revenue) }}
                </p>
                <p class="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                    Monthly
                </p>
            </div>
        </div>
        
        <!-- Annual Revenue -->
        <div class="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 dark:bg-green-950/30">
                <TrendingUp :size="20" :stroke-width="2" class="text-green-500" />
            </div>
            <div class="min-w-0">
                <p class="truncate text-[13px] text-neutral-500 dark:text-neutral-400">Annual Revenue</p>
                <p class="text-[22px] font-bold leading-tight text-neutral-900 dark:text-white">
                    {{ formatCurrency(metrics.revenue_metrics.annual_recurring_revenue) }}
                </p>
                <p class="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                    ARR
                </p>
            </div>
        </div>

        <!-- Expiring Soon -->
        <div class="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/30">
                <AlertTriangle :size="20" :stroke-width="2" class="text-orange-500" />
            </div>
            <div class="min-w-0">
                <p class="truncate text-[13px] text-neutral-500 dark:text-neutral-400">Expiring (3d)</p>
                <p class="text-[22px] font-bold leading-tight text-neutral-900 dark:text-white">
                    {{ metrics.expiring_soon_3_days }}
                </p>
                <p class="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">Action required</p>
            </div>
        </div>
        
        <!-- Expired Licenses -->
        <div class="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30">
                <ShieldAlert :size="20" :stroke-width="2" class="text-red-500" />
            </div>
            <div class="min-w-0">
                <p class="truncate text-[13px] text-neutral-500 dark:text-neutral-400">Expired Licenses</p>
                <p class="text-[22px] font-bold leading-tight text-neutral-900 dark:text-white">
                    {{ metrics.expired_licenses }}
                </p>
                <p class="text-[11px] font-medium text-red-500">Expired</p>
            </div>
        </div>

        <!-- Suspended / Expired -->
        <div class="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30">
                <CreditCard :size="20" :stroke-width="2" class="text-red-500" />
            </div>
            <div class="min-w-0">
                <p class="truncate text-[13px] text-neutral-500 dark:text-neutral-400">Suspended Users</p>
                <div class="flex items-baseline gap-2">
                    <p class="text-[22px] font-bold leading-tight text-neutral-900 dark:text-white">
                        {{ metrics.suspended_tenants }}
                    </p>
                    <span class="text-[11px] font-medium text-red-500">Suspended</span>
                </div>
            </div>
        </div>
    </div>
</template>
