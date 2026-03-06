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
        title: 'Total Tenants',
        value: '0',
        trend: '0 Active',
        trendColor: 'text-emerald-500',
        icon: Users,
        bgColor: 'bg-neutral-50',
        iconColor: 'text-neutral-500'
    },
    {
        title: 'Monthly Revenue',
        value: '$0.00',
        trend: 'Monthly',
        trendColor: 'text-neutral-400',
        icon: DollarSign,
        bgColor: 'bg-emerald-50',
        iconColor: 'text-emerald-600'
    },
    {
        title: 'Annual Revenue',
        value: '$0.00',
        trend: 'ARR',
        trendColor: 'text-neutral-400',
        icon: TrendingUp,
        bgColor: 'bg-emerald-50',
        iconColor: 'text-emerald-600'
    },
    {
        title: 'Expiring (3d)',
        value: '0',
        trend: 'Action required',
        trendColor: 'text-orange-500',
        icon: AlertTriangle,
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-500'
    },
    {
        title: 'Expired Licenses',
        value: '0',
        trend: 'Expired',
        trendColor: 'text-rose-500',
        icon: ShieldAlert,
        bgColor: 'bg-rose-50',
        iconColor: 'text-rose-500'
    },
    {
        title: 'Suspended Users',
        value: '0',
        trend: 'Suspended',
        trendColor: 'text-rose-500',
        icon: CreditCard,
        bgColor: 'bg-rose-50',
        iconColor: 'text-rose-500'
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
    { name: 'Electronics', color: '#001d22', value: 68, amount: '$85,000' },
    { name: 'Fashion', color: '#2d9d78', value: 20, amount: '$25,000' },
    { name: 'Health & Wellness', color: '#9bb5a5', value: 8, amount: '$10,000' },
    { name: 'Home & Living', color: '#d1dfdb', value: 4, amount: '$5,000' },
];

const recentActivity = [
    {
        id: 1,
        title: 'Order #2048',
        subtitle: 'John Doe • 12 Jan 25',
        type: 'New Order',
        typeColor: 'bg-neutral-100 text-neutral-600',
        icon: CreditCard,
        iconBg: 'bg-emerald-50 text-emerald-600'
    },
    {
        id: 2,
        title: 'Low Stock Alert',
        subtitle: 'MacBook Air M2 • 10 Jan 25',
        type: 'Low Stock',
        typeColor: 'bg-rose-50 text-rose-600',
        icon: AlertTriangle,
        iconBg: 'bg-rose-50 text-rose-600'
    },
    {
        id: 3,
        title: 'Promo code "SUMMER20"',
        subtitle: 'Applied 52 times • 8 Jan 25',
        type: 'Campaign',
        typeColor: 'bg-emerald-50 text-emerald-600',
        icon: TrendingUp,
        iconBg: 'bg-blue-50 text-blue-600'
    }
];

const topProducts = [
    {
        name: 'iPhone 15 Pro',
        stocks: '6,200',
        price: '$999.00',
        sales: '4,800',
        earnings: '$4,795,200',
        icon: '📱'
    },
    {
        name: 'MacBook Air M2',
        stocks: '1,020',
        price: '$1,299',
        sales: '3,200',
        earnings: '$4,156,800',
        icon: '💻'
    },
    {
        name: 'Google Pixel 8',
        stocks: '1,500',
        price: '$699.00',
        sales: '800',
        earnings: '$559,200',
        icon: '📱'
    },
    {
        name: 'Nike Air Max 90',
        stocks: '2,400',
        price: '$130.00',
        sales: '1,800',
        earnings: '$234,000',
        icon: '👟'
    }
];
</script>

<template>
    <div class="p-6 space-y-8">
        <!-- Platform Overview Heading -->
        <div>
            <h2 class="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">Platform Overview</h2>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card v-for="stat in stats" :key="stat.title"
                class="border-neutral-100 dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <CardContent class="p-5 flex gap-4 items-center">
                    <div :class="['p-3 rounded-xl flex items-center justify-center dark:bg-white/10', stat.bgColor]">
                        <component :is="stat.icon" :class="['size-5', stat.iconColor]" />
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-0.5">
                            <span
                                class="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">{{
                                    stat.title
                                }}</span>
                        </div>
                        <div class="flex items-baseline gap-2">
                            <span class="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">{{
                                stat.value }}</span>
                            <span :class="['text-[10px] font-bold', stat.trendColor]">{{ stat.trend }}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Sales Revenue Chart -->
            <Card
                class="lg:col-span-2 border-neutral-100 dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-3xl p-6">
                <div class="flex items-center justify-between mb-8">
                    <div class="flex items-center gap-2">
                        <svg class="size-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5">
                            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                            <path d="M22 12A10 10 0 0 0 12 2v10z" />
                        </svg>
                        <h3 class="font-bold text-neutral-900 dark:text-white text-lg">Sales Revenue</h3>
                    </div>
                    <div class="flex items-center gap-6">
                        <div class="flex bg-neutral-100/80 dark:bg-white/10 p-1 rounded-xl gap-1">
                            <Button variant="ghost" size="sm"
                                class="h-8 rounded-lg text-[11px] font-bold bg-white dark:bg-white/15 dark:text-white shadow-sm px-4">Monthly</Button>
                            <Button variant="ghost" size="sm"
                                class="h-8 rounded-lg text-[11px] font-bold text-neutral-400 dark:text-neutral-500 px-4">Quarterly</Button>
                            <Button variant="ghost" size="sm"
                                class="h-8 rounded-lg text-[11px] font-bold text-neutral-400 dark:text-neutral-500 px-4">Yearly</Button>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-4 mb-10 text-[10px] font-bold uppercase tracking-widest">
                    <div class="flex items-center gap-2">
                        <div class="size-2 rounded-full bg-[#001D22] dark:bg-white"></div>
                        <span class="text-neutral-400 dark:text-neutral-500">One-Time Revenue</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="size-2 rounded-full bg-[#9BB5A5]"></div>
                        <span class="text-neutral-400 dark:text-neutral-500">Recurring Revenue</span>
                    </div>
                </div>

                <!-- Mock Bar Chart -->
                <div
                    class="h-64 flex items-end justify-between gap-1 w-full pt-4 border-l border-b border-neutral-100 dark:border-white/10 relative">
                    <!-- Grid Lines -->
                    <div class="absolute inset-x-0 top-0 border-t border-neutral-50 dark:border-white/5 h-px"></div>
                    <div class="absolute inset-x-0 top-1/4 border-t border-neutral-50 dark:border-white/5 h-px"></div>
                    <div class="absolute inset-x-0 top-2/4 border-t border-neutral-50 dark:border-white/5 h-px"></div>
                    <div class="absolute inset-x-0 top-3/4 border-t border-neutral-50 dark:border-white/5 h-px"></div>

                    <!-- Y-Axis Mock -->
                    <div
                        class="absolute -left-10 inset-y-0 flex flex-col justify-between text-[10px] font-bold text-neutral-300 dark:text-neutral-600 py-2">
                        <span>150K</span>
                        <span>100K</span>
                        <span>50K</span>
                        <span>0</span>
                    </div>

                    <div v-for="bar in salesData" :key="bar.month"
                        class="group relative flex-1 flex flex-col items-center gap-2">
                        <div class="w-full flex flex-col items-center gap-1">
                            <div class="w-2 md:w-5 bg-[#001D22] dark:bg-white/80 rounded-t-[2px] transition-all duration-500 group-hover:bg-neutral-900 dark:group-hover:bg-white"
                                :style="{ height: `${bar.value * 1.2}px` }"></div>
                            <div class="w-2 md:w-5 bg-[#9BB5A5] rounded-t-[2px] transition-all duration-500 group-hover:bg-[#8aa394]"
                                :style="{ height: `${bar.value * 0.7}px` }"></div>
                        </div>
                        <span
                            class="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-tighter">{{
                                bar.month
                            }}</span>
                    </div>
                </div>
            </Card>

            <!-- Top Categories Chart -->
            <Card class="border-neutral-100 dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-3xl p-6">
                <div class="flex items-center justify-between mb-8">
                    <h3 class="font-bold text-neutral-900 dark:text-white">Top Categories</h3>
                    <Button variant="ghost" size="sm"
                        class="text-[11px] font-bold text-neutral-400 hover:text-neutral-900 dark:hover:text-white">See
                        All</Button>
                </div>

                <!-- Mock Donut Chart -->
                <div class="flex flex-col items-center gap-10 py-4">
                    <div class="relative size-48">
                        <svg viewBox="0 0 100 100" class="rotate-[-90deg]">
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#d1dfdb" stroke-width="12"
                                class="dark:opacity-30" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#001d22" stroke-width="12"
                                stroke-dasharray="251.2" stroke-dashoffset="80" class="dark:stroke-white/80" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2d9d78" stroke-width="12"
                                stroke-dasharray="251.2" stroke-dashoffset="185" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#9bb5a5" stroke-width="12"
                                stroke-dasharray="251.2" stroke-dashoffset="235" />
                        </svg>
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                            <span
                                class="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Total
                                Sales</span>
                            <span
                                class="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">$125,000</span>
                        </div>
                    </div>

                    <div class="w-full space-y-5 px-2">
                        <div v-for="cat in categoryData" :key="cat.name"
                            class="flex items-center justify-between group cursor-pointer">
                            <div class="flex items-center gap-3">
                                <div class="size-2 rounded-full" :style="{ backgroundColor: cat.color }"></div>
                                <span
                                    class="text-[13px] font-bold text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">{{
                                        cat.name }}</span>
                            </div>
                            <div class="flex items-center gap-4">
                                <span class="text-[13px] font-bold text-neutral-900 dark:text-white">{{ cat.amount
                                    }}</span>
                                <span
                                    class="text-[13px] font-bold text-neutral-400 dark:text-neutral-500 w-8 text-right">{{
                                        cat.value
                                    }}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>

        <!-- Bottom Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Recent Activity -->
            <Card class="border-neutral-100 dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-3xl p-6">
                <div class="flex items-center justify-between mb-8">
                    <div class="flex items-center gap-2">
                        <svg class="size-5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <h3 class="font-bold text-neutral-900 dark:text-white text-lg">Recent Activity</h3>
                    </div>
                    <Button variant="ghost" size="sm"
                        class="text-[11px] font-bold text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-0">See
                        All</Button>
                </div>

                <div class="space-y-6">
                    <div v-for="activity in recentActivity" :key="activity.id"
                        class="flex items-center gap-4 group cursor-pointer">
                        <div
                            :class="['size-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105', activity.iconBg]">
                            <component :is="activity.icon" class="size-5" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between mb-1">
                                <h4 class="text-[13px] font-bold text-neutral-900 dark:text-white truncate">{{
                                    activity.title }}</h4>
                                <span
                                    :class="['text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight', activity.typeColor]">
                                    {{ activity.type }}
                                </span>
                            </div>
                            <p class="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 truncate">{{
                                activity.subtitle }}</p>
                        </div>
                    </div>
                </div>
            </Card>

            <!-- Top Products -->
            <Card
                class="lg:col-span-2 border-neutral-100 dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-3xl p-6">
                <div class="flex items-center justify-between mb-8">
                    <h3 class="font-bold text-neutral-900 dark:text-white text-lg">Top Products</h3>
                    <div class="flex items-center gap-4">
                        <Button variant="ghost" size="sm"
                            class="text-[11px] font-bold text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                            <svg class="size-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.5">
                                <path d="M3 6h18M6 12h12M10 18h4" />
                            </svg>
                            Sort
                        </Button>
                        <Button variant="ghost" size="sm"
                            class="text-[11px] font-bold text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                            <svg class="size-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.5">
                                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                            </svg>
                            Filter
                        </Button>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr
                                class="text-left text-[11px] font-bold text-neutral-300 dark:text-neutral-600 uppercase tracking-widest border-b border-neutral-50 dark:border-white/10">
                                <th class="pb-4 font-bold">Product</th>
                                <th class="pb-4 font-bold text-right">Stocks</th>
                                <th class="pb-4 font-bold text-right">Price</th>
                                <th class="pb-4 font-bold text-right">Sales</th>
                                <th class="pb-4 font-bold text-right">Earnings</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-neutral-50/50 dark:divide-white/5">
                            <tr v-for="product in topProducts" :key="product.name"
                                class="group hover:bg-neutral-50/50 dark:hover:bg-white/5 transition-colors">
                                <td class="py-4">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="size-9 rounded-lg bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-lg">
                                            {{ product.icon }}
                                        </div>
                                        <span class="text-[13px] font-bold text-neutral-900 dark:text-white">{{
                                            product.name }}</span>
                                    </div>
                                </td>
                                <td
                                    class="py-4 text-right text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
                                    {{ product.stocks
                                    }}</td>
                                <td
                                    class="py-4 text-right text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
                                    {{ product.price }}
                                </td>
                                <td
                                    class="py-4 text-right text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
                                    {{ product.sales }}
                                </td>
                                <td class="py-4 text-right text-[13px] font-bold text-neutral-900 dark:text-white">{{
                                    product.earnings
                                    }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    </div>
</template>

<style scoped>
/* Custom animations or refinements */
</style>
