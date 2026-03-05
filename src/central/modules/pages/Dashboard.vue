<script setup lang="ts">
import { ref } from 'vue';
import {
    Users,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    ShieldAlert,
    CreditCard,
    ChevronDown,
} from 'lucide-vue-next';
import { Card, CardContent } from '@/Global/ui/card';
import { Button } from '@/Global/ui/button';

const stats = [
    {
        title: 'Total ...',
        subtitle: 'Active',
        value: '0',
        trend: '0 Active',
        trendColor: 'text-green-500',
        icon: Users,
        bgColor: 'bg-neutral-100',
        iconColor: 'text-neutral-600'
    },
    {
        title: 'Mont...',
        subtitle: 'Monthly',
        value: '$0.00',
        trend: 'Monthly',
        trendColor: 'text-neutral-400',
        icon: DollarSign,
        bgColor: 'bg-[#f0f9f6]',
        iconColor: 'text-[#2d9d78]'
    },
    {
        title: 'Annu...',
        subtitle: 'ARR',
        value: '$0.00',
        trend: 'ARR',
        trendColor: 'text-neutral-400',
        icon: TrendingUp,
        bgColor: 'bg-[#f0f9f6]',
        iconColor: 'text-[#2d9d78]'
    },
    {
        title: 'Expiri...',
        subtitle: 'Action required',
        value: '0',
        trend: 'Action required',
        trendColor: 'text-neutral-400',
        icon: AlertTriangle,
        bgColor: 'bg-[#fff7ed]',
        iconColor: 'text-[#ea580c]'
    },
    {
        title: 'Expir...',
        subtitle: 'Expired',
        value: '0',
        trend: 'Expired',
        trendColor: 'text-red-500',
        icon: ShieldAlert,
        bgColor: 'bg-[#fef2f2]',
        iconColor: 'text-[#dc2626]'
    },
    {
        title: 'Suspe...',
        subtitle: 'Suspended',
        value: '0',
        trend: 'Suspended',
        trendColor: 'text-red-500',
        icon: CreditCard,
        bgColor: 'bg-[#fef2f2]',
        iconColor: 'text-[#dc2626]'
    },
];

const salesData = [
    { month: 'Jan', value: 45 },
    { month: 'Feb', value: 52 },
    { month: 'Mar', value: 48 },
    { month: 'Apr', value: 61 },
    { month: 'May', value: 55 },
    { month: 'Jun', value: 67 },
    { month: 'Jul', value: 80 },
    { month: 'Aug', value: 75 },
    { month: 'Sep', value: 90 },
    { month: 'Oct', value: 85 },
    { month: 'Nov', value: 100 },
    { month: 'Dec', value: 110 },
];

const categoryData = [
    { name: 'Electronics', color: '#001d22', value: 68 },
    { name: 'Fashion', color: '#2d9d78', value: 20 },
    { name: 'Health & Wellness', color: '#9bb5a5', value: 8 },
    { name: 'Others', color: '#d1dfdb', value: 4 },
];
</script>

<template>
    <div class="p-6 space-y-8">
        <!-- Platform Overview Heading -->
        <div>
            <h2 class="text-xl font-bold text-neutral-900 tracking-tight">Platform Overview</h2>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card v-for="stat in stats" :key="stat.title" class="border-neutral-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <CardContent class="p-5 flex flex-col gap-4">
                    <div class="flex items-center justify-between">
                        <div :class="['p-2.5 rounded-xl', stat.bgColor]">
                            <component :is="stat.icon" :class="['size-5', stat.iconColor]" />
                        </div>
                    </div>
                    <div>
                        <div class="flex items-baseline gap-1">
                            <span class="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{{ stat.title }}</span>
                        </div>
                        <div class="flex items-baseline gap-2 mt-1">
                            <span class="text-2xl font-bold text-neutral-900">{{ stat.value }}</span>
                            <span :class="['text-[10px] font-bold', stat.trendColor]">{{ stat.trend }}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Sales Revenue Chart -->
            <Card class="lg:col-span-2 border-neutral-100 shadow-sm rounded-3xl p-6">
                <div class="flex items-center justify-between mb-8">
                    <div class="flex items-center gap-2">
                        <div class="p-1.5 rounded-lg bg-blue-50">
                            <TrendingUp class="size-4 text-blue-600" />
                        </div>
                        <h3 class="font-bold text-neutral-900">Sales Revenue</h3>
                    </div>
                    <div class="flex bg-neutral-100 p-1 rounded-xl gap-1">
                        <Button variant="ghost" size="sm" class="h-8 rounded-lg text-[11px] font-bold bg-white shadow-sm">Monthly</Button>
                        <Button variant="ghost" size="sm" class="h-8 rounded-lg text-[11px] font-bold text-neutral-400">Quarterly</Button>
                        <Button variant="ghost" size="sm" class="h-8 rounded-lg text-[11px] font-bold text-neutral-400">Yearly</Button>
                    </div>
                </div>

                <div class="flex items-center gap-6 mb-8 text-[11px] font-bold uppercase tracking-wider">
                    <div class="flex items-center gap-2">
                        <div class="size-2 rounded-full bg-blue-600"></div>
                        <span class="text-neutral-400">One-Time Revenue</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="size-2 rounded-full bg-blue-200"></div>
                        <span class="text-neutral-400">Recurring Revenue</span>
                    </div>
                </div>

                <!-- Mock Bar Chart -->
                <div class="h-64 flex items-end justify-between gap-1 w-full pt-4 border-l border-b border-neutral-100 relative">
                    <!-- Grid Lines -->
                    <div class="absolute inset-x-0 top-0 border-t border-neutral-50 h-px"></div>
                    <div class="absolute inset-x-0 top-1/4 border-t border-neutral-50 h-px"></div>
                    <div class="absolute inset-x-0 top-2/4 border-t border-neutral-50 h-px"></div>
                    <div class="absolute inset-x-0 top-3/4 border-t border-neutral-50 h-px"></div>

                    <!-- Y-Axis Mock -->
                    <div class="absolute -left-10 inset-y-0 flex flex-col justify-between text-[10px] font-bold text-neutral-300 py-2">
                        <span>150K</span>
                        <span>100K</span>
                        <span>50K</span>
                        <span>0</span>
                    </div>

                    <div v-for="bar in salesData" :key="bar.month" class="group relative flex-1 flex flex-col items-center gap-2">
                        <div class="w-full flex flex-col items-center gap-0.5">
                            <div
                                class="w-2 md:w-4 bg-blue-600 rounded-t-sm transition-all duration-500 group-hover:bg-blue-700"
                                :style="{ height: `${bar.value * 1.5}px` }"
                            ></div>
                            <div
                                class="w-2 md:w-4 bg-blue-200 rounded-t-sm transition-all duration-500 group-hover:bg-blue-300"
                                :style="{ height: `${bar.value * 0.8}px` }"
                            ></div>
                        </div>
                        <span class="text-[10px] font-bold text-neutral-300">{{ bar.month }}</span>
                    </div>
                </div>
            </Card>

            <!-- Top Categories Chart -->
            <Card class="border-neutral-100 shadow-sm rounded-3xl p-6">
                <div class="flex items-center justify-between mb-8">
                    <h3 class="font-bold text-neutral-900">Top Categories</h3>
                    <Button variant="ghost" size="sm" class="text-[11px] font-bold text-neutral-400 hover:text-neutral-900">See All</Button>
                </div>

                <!-- Mock Donut Chart -->
                <div class="flex flex-col items-center gap-8 py-4">
                    <div class="relative size-48">
                        <svg viewBox="0 0 100 100" class="rotate-[-90deg]">
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#d1dfdb" stroke-width="12" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#001d22" stroke-width="12" stroke-dasharray="251.2" stroke-dashoffset="80" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2d9d78" stroke-width="12" stroke-dasharray="251.2" stroke-dashoffset="180" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#9bb5a5" stroke-width="12" stroke-dasharray="251.2" stroke-dashoffset="230" />
                        </svg>
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                            <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total Sales</span>
                            <span class="text-xl font-bold text-neutral-900">$125,000</span>
                        </div>
                    </div>

                    <div class="w-full space-y-4">
                        <div v-for="cat in categoryData" :key="cat.name" class="flex items-center justify-between group">
                            <div class="flex items-center gap-3">
                                <div class="size-2 rounded-full" :style="{ backgroundColor: cat.color }"></div>
                                <span class="text-sm font-medium text-neutral-600 group-hover:text-neutral-900 transition-colors">{{ cat.name }}</span>
                            </div>
                            <div class="flex items-center gap-4">
                                <span class="text-sm font-bold text-neutral-900">${{ (cat.value * 1250).toLocaleString() }}</span>
                                <span class="text-sm font-bold text-neutral-400 w-8 text-right">{{ cat.value }}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    </div>
</template>

<style scoped>
/* Custom animations or refinements */
</style>
