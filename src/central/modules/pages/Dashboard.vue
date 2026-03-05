<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { AuthBase } from '@/Global';

const authStore = useAuthStore();
const user = authStore.user;
</script>

<template>
    <div class="p-8">
        <div class="max-w-7xl mx-auto">
            <h1 class="text-3xl font-bold text-[#001d22] mb-6">Central Dashboard</h1>
            <div class="bg-white rounded-2xl shadow-sm border border-[#d1dfdb] p-8">
                <h2 class="text-xl font-semibold mb-4">Welcome, {{ user?.name || 'Super Admin' }}!</h2>
                <p class="text-neutral-600 mb-6">
                    You are logged in to the Mfuko Pro Central Management System.
                </p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="p-6 rounded-xl bg-neutral-50 border border-neutral-100">
                        <h3 class="font-bold text-lg mb-2">Tenants</h3>
                        <p class="text-sm text-neutral-500">Manage all Sacco tenant instances.</p>
                    </div>
                    <div class="p-6 rounded-xl bg-neutral-50 border border-neutral-100">
                        <h3 class="font-bold text-lg mb-2">Platform Users</h3>
                        <p class="text-sm text-neutral-500">Manage super administrators.</p>
                    </div>
                    <div class="p-6 rounded-xl bg-neutral-50 border border-neutral-100">
                        <h3 class="font-bold text-lg mb-2">Settings</h3>
                        <p class="text-sm text-neutral-500">Global platform configuration.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
