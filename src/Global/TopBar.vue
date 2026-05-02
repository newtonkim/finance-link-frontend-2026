<script setup lang="ts">
import { Search, Bell, Plus, LayoutGrid, ChevronDown, Building2 } from 'lucide-vue-next'

import {
  Button,
  DropdownMenuTrigger,
  Input,
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  Form,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  DropdownMenuItem,
} from '@/Global'
import UserMenuContent from '@/Global/UserMenuContent.vue'
import { useAuthStore } from '@/stores/auth'
import { computed, onMounted, ref } from 'vue'
import {
  getInitials,
  getLocalValues,
  getSubdomainName,
  keysToUse,
  setLocalValues,
  tryCatch,
} from './Helpers'
import { tenantClient } from '@/tenant/apis/tenantClient'
import { apiClient } from '@/central/api/client'
import { pomPinia } from 'septor-store'
const Store: any = pomPinia()
const activeBranch = ref(null)
const subdomain = getSubdomainName()
// import { useBranchStore } from '@/stores/branchStore';
import SearchableSelect from './SearchableSelect.vue'
import { useTenantUserStore } from '@/stores/tenantUserStore'
import { useProfileStore } from '@/stores/profileStore'

const interceptor = subdomain ? tenantClient : apiClient

async function fetchBranches() {
    activeBranch.value = getLocalValues('activeBranch' as const) as any
    tryCatch(async () => {
        const collection = {
            reload: 0,
            StateStore: 'system-branches',
            time: 0,
            reqs: {
                url: 'settings/branches/branches-dropdown-list',
                method: 'post',
                data: {},
            },
            axiosInstance: interceptor,
            // mStore: { mUse: false },
            mStore: { mUse: true },
        }
        await (Store as any).stateGenaratorApi(collection)
        if(!getLocalValues('activeBranch' as const)){
            watchBranchchanges((Store as any)?.['system-branches']?.payload?.data[0]?.id)
        }
    })
}
defineProps<{
  title: string
}>()

function watchBranchchanges(branch: any) {
  activeBranch.value = branch
  setLocalValues('activeBranch' as const, branch)
  ;(Store as any).activeBranch = branch
  activeBranch.value = branch
}
const authStore = useAuthStore()
const tenantUserStore = useTenantUserStore()
const profileStore = useProfileStore()
const user = computed(() => profileStore.combinedProfile)
const userName = computed(() => String(user.value?.name ?? 'User'))

onMounted(async () => {
  tenantUserStore.load()
  profileStore.fetchFullProfile()
  watchBranchchanges(getLocalValues('activeBranch' as const))
  await fetchBranches()
})

function onBranchChange(val: number) {
  setLocalValues('activeBranch' as const, val)
  watchBranchchanges(val)
}
</script>

<template>
  <header
    class="flex h-16 shrink-0 items-center gap-2 px-6 border-b border-neutral-100 dark:border-white/10 bg-white/50 dark:bg-[#111111]/80 backdrop-blur-sm sticky top-0 z-10 justify-between"
  >
    <div class="flex items-center gap-3">
      <div
        class="size-8 rounded-lg bg-neutral-100 dark:bg-white/10 flex items-center justify-center"
      >
        <LayoutGrid class="size-4 text-neutral-600 dark:text-neutral-300" />
      </div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage class="text-neutral-900 dark:text-white font-bold text-sm"
              >{{ title }}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>

    <div class="flex items-center gap-4 flex-1 max-w-sm mx-12">
      <div class="relative w-full">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 dark:text-neutral-500"
        />
        <Input
          placeholder="Search anything"
          class="pl-10 h-10 bg-[#F1F5F9] dark:bg-white/10 border-none rounded-[14px] focus-visible:ring-1 focus-visible:ring-bg-nfuko-primary/5 dark:focus-visible:ring-white/10 text-sm dark:text-white dark:placeholder-neutral-500"
        />
        <div
          class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-[2px] text-[10px] font-bold text-neutral-400 dark:text-neutral-500"
        >
          <span
            class="bg-white/50 dark:bg-white/10 px-1 rounded border border-neutral-200/50 dark:border-white/10"
            >⌘</span
          >
          <span
            class="bg-white/50 dark:bg-white/10 px-1 rounded border border-neutral-200/50 dark:border-white/10"
            >K</span
          >
        </div>
      </div>
      <SearchableSelect
        :modelValue="activeBranch"
        :options="((Store as any)?.['system-branches']?.payload?.data as any) ?? []"
        @update:modelValue="onBranchChange"
        :selectDefaultIndex="0"
      />
    </div>

    <div class="flex items-center gap-4">
      <div class="flex -space-x-3 mr-2">
        <Avatar
          class="size-8 border-[2.5px] border-white dark:border-[#111111] hover:shadow-md transition-all cursor-pointer"
        >
          <AvatarImage src="https://i.pravatar.cc/150?u=1" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar
          class="size-8 border-[2.5px] border-white dark:border-[#111111] hover:shadow-md transition-all cursor-pointer"
        >
          <AvatarImage src="https://i.pravatar.cc/150?u=2" />
          <AvatarFallback>AS</AvatarFallback>
        </Avatar>
        <Avatar
          class="size-8 border-[2.5px] border-white dark:border-[#111111] hover:shadow-md transition-all cursor-pointer"
        >
          <AvatarImage src="https://i.pravatar.cc/150?u=3" />
          <AvatarFallback>WK</AvatarFallback>
        </Avatar>
        <div
          class="size-8 rounded-full bg-neutral-100 dark:bg-white/10 text-[10px] font-bold flex items-center justify-center text-neutral-500 dark:text-neutral-400 border-[2.5px] border-white dark:border-[#111111] cursor-pointer hover:bg-neutral-200 dark:hover:bg-white/20"
        >
          +2
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        class="rounded-lg bg-neutral-50 dark:bg-white/10 hover:bg-neutral-100 dark:hover:bg-white/20 size-9 border border-neutral-100 dark:border-white/10 shadow-sm"
      >
        <Plus class="size-4 text-neutral-600 dark:text-neutral-300" />
      </Button>

      <div class="h-6 w-px bg-neutral-200 dark:bg-white/10 mx-1"></div>

      <Button
        variant="ghost"
        size="icon"
        class="relative rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 size-9"
      >
        <Bell class="size-5 text-neutral-600 dark:text-neutral-300" />
        <span
          class="absolute -top-1 -right-1 size-5 bg-[#F1F5F9] dark:bg-white/10 border-2 border-white dark:border-[#111111] rounded-full flex items-center justify-center text-[9px] font-extrabold text-neutral-900 dark:text-white shadow-sm"
        >
          24
        </span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <div class="flex items-center gap-3 px-2 py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5 transition-all cursor-pointer border border-neutral-200/50 dark:border-white/10 shadow-sm group">
            <div
              class="size-8 rounded-full bg-nfuko-yellow text-[#0A2318] flex items-center justify-center font-bold text-xs shadow-inner overflow-hidden"
            >
              <img v-if="user?.avatar" :src="(user.avatar as string)" class="h-full w-full object-cover" />
              <span v-else>{{ getInitials(userName) }}</span>
            </div>
            <div class="hidden sm:flex flex-col text-left pr-1 min-w-[80px]">
              <span class="text-[12px] font-bold text-neutral-900 dark:text-white leading-tight group-hover:text-nfuko-primary dark:group-hover:text-bg-nfuko-yellow transition-colors">{{ userName }}</span>
              <span class="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 capitalize">{{ (user as any)?.role ?? 'User' }}</span>
            </div>
            <ChevronDown class="size-3.5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors mr-1" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-56 p-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-xl">
          <UserMenuContent :user="user" />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
