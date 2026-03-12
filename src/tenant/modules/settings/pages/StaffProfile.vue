<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, UserCog, Mail, ShieldCheck, Download, Users, Briefcase } from 'lucide-vue-next'
import { useStaffStore } from '@/stores/staffStore'
import {
} from '@/Global'

const route = useRoute()
const staffStore = useStaffStore()

const staffId = computed(() => Number(route.params.id))
const activeTab = ref('overview')

onMounted(async () => {
    if (staffId.value) {
        await Promise.all([
            staffStore.fetchStaffDetails(staffId.value),
            staffStore.fetchOnboardedMembers(staffId.value)
        ])
    }
})

const staff = computed(() => staffStore.currentStaff)
const onboardedMembers = computed(() => staffStore.onboardedMembers)

const exportData = () => {
    // Basic CSV Export implementation
    if (!onboardedMembers.value.length) return

    const headers = ['Member Number', 'Name', 'Email', 'Joined At', 'Status']
    const csvContent = [
        headers.join(','),
        ...onboardedMembers.value.map(m =>
            `"${m.member_number}","${m.name}","${m.email || 'N/A'}","${new Date(m.joined_at || m.created_at).toLocaleDateString()}","${m.status}"`
        )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${staff.value?.name.replace(/\s+/g, '_')}_onboarded_members.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
</script>

<template>
    <div class="flex flex-col flex-1 h-full bg-[#f8faf9] dark:bg-[#0a0a0a] p-4 md:p-6 overflow-hidden max-w-[1600px] mx-auto w-full">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-6">
            <RouterLink to="/tenant/settings/staff" class="mr-2 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition">
                <ChevronLeft class="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </RouterLink>
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <UserCog class="h-5 w-5 text-[#001d22] dark:text-[#C9A84C]" />
            </div>
            <div class="flex-1">
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Staff Profile</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">View performance metrics and onboarded members</p>
            </div>
        </div>

        <div v-if="staffStore.isLoading && !staff" class="flex justify-center items-center py-20 text-neutral-500">
            Loading profile...
        </div>

        <div v-else-if="staff" class="flex flex-col lg:flex-row gap-6 h-full min-h-0">
            <!-- Sidebar: Staff Info -->
            <div class="w-full lg:w-80 flex-shrink-0 flex flex-col gap-5">
                <div class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 text-center">
                    <div class="h-24 w-24 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 border-4 border-[#001d22]/5 dark:border-[#C9A84C]/5 flex items-center justify-center text-3xl font-bold text-neutral-700 dark:text-neutral-200 mb-4">
                        {{ staff.name.charAt(0).toUpperCase() }}
                    </div>
                    <h2 class="text-lg font-bold text-neutral-900 dark:text-white flex items-center justify-center gap-2">
                        {{ staff.name }}
                        <ShieldCheck v-if="staff.is_tenant_admin" class="h-4 w-4 text-emerald-500" title="Tenant Admin" />
                    </h2>
                    <span :class="[
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-2',
                        staff.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400'
                    ]">
                        {{ staff.status }}
                    </span>

                    <div class="mt-6 flex flex-col gap-3 text-sm text-left px-2">
                        <div class="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                            <Mail class="h-4 w-4 opacity-70" />
                            <span class="truncate">{{ staff.email }}</span>
                        </div>
                        <div class="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                            <Briefcase class="h-4 w-4 opacity-70" />
                            <span>{{ staff.role }}</span>
                        </div>
                        <div class="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                            <Users class="h-4 w-4 opacity-70" />
                            <span>Joined {{ new Date(staff.created_at || '').toLocaleDateString() }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content Area: Tabs -->
            <div class="flex-1 flex flex-col min-w-0 rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
                <!-- Tabs Header -->
                <div class="flex items-center space-x-6 px-6 pt-6 border-b border-neutral-100 dark:border-neutral-800">
                    <button
                        @click="activeTab = 'overview'"
                        :class="[
                            'px-2 py-3 font-medium transition-colors border-b-2',
                            activeTab === 'overview'
                                ? 'border-[#001d22] dark:border-[#C9A84C] text-[#001d22] dark:text-[#C9A84C]'
                                : 'border-transparent text-neutral-500 hover:text-[#001d22] dark:hover:text-[#C9A84C]'
                        ]"
                    >
                        Overview & KPI
                    </button>
                    <button
                        @click="activeTab = 'onboarded'"
                        :class="[
                            'flex items-center gap-2 px-2 py-3 font-medium transition-colors border-b-2',
                            activeTab === 'onboarded'
                                ? 'border-[#001d22] dark:border-[#C9A84C] text-[#001d22] dark:text-[#C9A84C]'
                                : 'border-transparent text-neutral-500 hover:text-[#001d22] dark:hover:text-[#C9A84C]'
                        ]"
                    >
                        Onboarded Members
                        <span class="bg-neutral-100 dark:bg-neutral-800 text-xs px-2 py-0.5 rounded-full">{{ onboardedMembers.length }}</span>
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-6">
                    <!-- Overview Tab -->
                    <div v-show="activeTab === 'overview'" class="w-full h-full">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900 p-5">
                                <div class="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Total Members Onboarded</div>
                                <div class="text-3xl font-bold text-[#001d22] dark:text-[#C9A84C]">{{ onboardedMembers.length }}</div>
                                <p class="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                                    All-time KPI metric
                                </p>
                            </div>
                            <div class="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900 p-5">
                                <div class="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Status</div>
                                <div class="text-lg font-bold text-neutral-900 dark:text-white capitalize">{{ staff.status }} Account</div>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                                    {{ staff.is_tenant_admin ? 'Has administrative privileges' : 'Standard privileges' }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Onboarded Members Tab -->
                    <div v-show="activeTab === 'onboarded'" class="w-full h-full flex flex-col">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Members brought in by {{ staff.name }}</h3>
                                <button @click="exportData" class="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline">
                                    <Download class="h-4 w-4" />
                                    Export CSV Report
                                </button>
                            </div>

                            <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                                <table class="w-full text-left text-sm text-neutral-500 dark:text-neutral-400">
                                    <thead class="bg-neutral-50 text-xs uppercase text-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400">
                                        <tr>
                                            <th scope="col" class="px-6 py-3 font-semibold">Member #</th>
                                            <th scope="col" class="px-6 py-3 font-semibold">Name</th>
                                            <th scope="col" class="px-6 py-3 font-semibold">Joined At</th>
                                            <th scope="col" class="px-6 py-3 font-semibold text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-if="!onboardedMembers.length">
                                            <td colspan="4" class="px-6 py-8 text-center text-neutral-500">No members onboarded by this staff yet.</td>
                                        </tr>
                                        <tr v-for="member in onboardedMembers" :key="member.id" class="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
                                            <td class="whitespace-nowrap px-6 py-3 font-medium text-[#001d22] dark:text-[#C9A84C]">
                                                <RouterLink :to="`/tenant/members/${member.id}`" class="hover:underline">
                                                    {{ member.member_number }}
                                                </RouterLink>
                                            </td>
                                            <td class="whitespace-nowrap px-6 py-3 font-medium text-neutral-900 dark:text-white">
                                                {{ member.name }}
                                            </td>
                                            <td class="whitespace-nowrap px-6 py-3 text-neutral-500">
                                                {{ new Date(member.joined_at || member.created_at).toLocaleDateString() }}
                                            </td>
                                            <td class="whitespace-nowrap px-6 py-3 text-center">
                                                <span :class="[
                                                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase',
                                                    member.status === 'active'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400'
                                                ]">
                                                    {{ member.status }}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
            </div>
        </div>
    </div>
</template>
