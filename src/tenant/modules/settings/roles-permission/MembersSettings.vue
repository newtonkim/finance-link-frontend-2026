<script setup lang="ts">
import { Users, } from 'lucide-vue-next'
import { SettingCard } from '@/tenant/components/globals'
import { kycMembersModel } from '../components'
const settingsCards = [
    {
        title: "Staff Management",
        description: "Add and manage system users and staff.",
        type: "link",
        route: { name: "tenant-settings-staff" },
        action: "Manage Staff →"
    },
    {
        title: "Roles & Permissions",
        description: "Define access levels and functional permissions.",
        type: "link",
        action: "Configure Roles →",
        route: { name: "tenant-settings-members-roles-permission" },
    },
    {
        title: "KYC / Member Onboarding",
        description: "Setup onboarding requirements and KYC documents.",
        type: "onboarding",
    },
    {
        title: "Membership Tiers",
        description: "Create and manage different levels of membership.",
        type: "button",
        action: "Manage Tiers →"
    }
]
</script>
<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Users class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Members & Roles</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage users, permissions, and member
                    onboarding</p>
            </div>
        </div>
        <SettingCard :settingsCards="settingsCards">
            <template #kyc-member-onboarding="{ card }">
                <div class="flex flex-col gap-2 items-start">
                    <button
                        class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Setup
                        KYC
                        →</button>
                    <kycMembersModel />
                </div>

            </template>
        </SettingCard>
    </div>
</template>
