<script setup lang="ts">
import { useRouter } from 'vue-router';
import { LogOut, Settings, LayoutGrid } from 'lucide-vue-next';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/Global/ui/dropdown-menu';
import UserInfo from '@/Global/UserInfo.vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const props = defineProps<{
    user: any;
}>();

const handleLogout = async () => {
    await authStore.logout();
    router.push('/login');
};

const navigate = (path: string) => {
    router.push(path);
};
</script>

<template>
    <DropdownMenuLabel class="p-0 font-normal">
        <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <UserInfo :user="user" :show-email="true" />
        </div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator class="bg-white/10" />
    <DropdownMenuGroup>
        <DropdownMenuItem @click="navigate('/settings/profile')" class="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white">
            <Settings class="mr-2 h-4 w-4" />
            Settings
        </DropdownMenuItem>
        <DropdownMenuItem @click="navigate('/settings/system')" class="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white">
            <LayoutGrid class="mr-2 h-4 w-4" />
            System Settings
        </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator class="bg-white/10" />
    <DropdownMenuItem
        class="cursor-pointer text-red-400 hover:bg-red-400/10 focus:bg-red-400/10 focus:text-red-400"
        @click="handleLogout"
        data-test="logout-button"
    >
        <LogOut class="mr-2 h-4 w-4" />
        Log out
    </DropdownMenuItem>
</template>
