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
import { fetchTableData } from './landingLayout/util'

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
            },
            axiosInstance: interceptor,
            mStore: { mUse: true },
        }
        await (Store as any).stateGenaratorApi(collection)
        const branches = (Store as any)?.['system-branches']?.payload?.data || []
        const currentActive = getLocalValues('activeBranch' as const)
        const exists = branches.find((b: any) => b.id == currentActive)

        if (!exists && branches.length > 0) {
            watchBranchchanges(branches[0].id)
        } else if (exists && currentActive) {
            // Ensure tenant_branch_context is in sync even when branch is already valid
            syncBranchContext(currentActive)
        }
    })
}
defineProps<{
  title: string
}>()

function syncBranchContext(branchId: any) {
  try {
    const raw = localStorage.getItem('tenant_branch_context')
    const ctx = raw ? JSON.parse(raw) : {}
    // Sanitize branchId - handle string "undefined"/"null" and NaN
    const sanitizedId = (branchId && branchId !== 'undefined' && branchId !== 'null' && !isNaN(Number(branchId))) 
        ? Number(branchId) 
        : null
    ctx.active_branch_id = sanitizedId
    localStorage.setItem('tenant_branch_context', JSON.stringify(ctx))
  } catch {
    const sanitizedId = (branchId && branchId !== 'undefined' && branchId !== 'null' && !isNaN(Number(branchId))) 
        ? Number(branchId) 
        : null
    localStorage.setItem('tenant_branch_context', JSON.stringify({ active_branch_id: sanitizedId }))
  }
}

function watchBranchchanges(branch: any) {
  activeBranch.value = branch
  setLocalValues('activeBranch' as const, branch)
  ;(Store as any).activeBranch = branch
  activeBranch.value = branch
  // Keep tenant_branch_context in sync so tenantClient interceptor
  // sends X-Acting-Branch-Id header on all requests
  syncBranchContext(branch)
}

const authStore = useAuthStore()
const tenantUserStore = useTenantUserStore()
const profileStore = useProfileStore()

const user = computed(() => {
  if (subdomain) {
    return tenantUserStore.user
  }
  return authStore.user
})

const userName = computed(() => user.value?.name || 'User')
const userEmail = computed(() => user.value?.email || '')
const initials = computed(() => getInitials(userName.value))
const avatarUrl = computed(() => profileStore.combinedProfile?.avatar || user.value?.avatar)

onMounted(async () => {
  watchBranchchanges(getLocalValues('activeBranch' as const))
  if (subdomain) {
    await fetchBranches()
  }
})
</script>

<template>
  <header
    class="flex h-14 items-center gap-4 border-b bg-white px-4 dark:bg-neutral-950 lg:h-[60px] lg:px-6 sticky top-0 z-50 shadow-sm"
  >
    <div class="flex items-center gap-4 lg:gap-6">
      <Breadcrumb class="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              {{ title }}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>

    <div class="ml-auto flex items-center gap-2 md:gap-4">
      <div v-if="subdomain" class="hidden sm:flex items-center gap-2 mr-2 min-w-[200px]">
        <SearchableSelect
          :options="(Store as any)?.['system-branches']?.payload?.data"
          v-model="activeBranch"
          @update:modelValue="watchBranchchanges"
          placeholder="Select Branch"
        >
          <template #icon>
            <Building2 class="h-4 w-4 text-neutral-500" />
          </template>
        </SearchableSelect>
      </div>

      <div class="relative hidden md:block w-full max-w-[300px]">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
        <Input
          type="search"
          placeholder="Search..."
          class="w-full bg-neutral-50 pl-8 text-sm focus-visible:ring-nfuko-action dark:bg-neutral-900"
        />
      </div>

      <Button
        variant="ghost"
        size="icon"
        class="h-9 w-9 rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        <Bell class="h-5 w-5" />
        <span class="sr-only">Notifications</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            class="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Avatar class="h-8 w-8 border-2 border-white shadow-sm dark:border-neutral-800">
              <AvatarImage :src="avatarUrl" :alt="userName" />
              <AvatarFallback class="bg-nfuko-action/10 text-xs font-semibold text-nfuko-action">
                {{ initials }}
              </AvatarFallback>
            </Avatar>
            <div class="hidden flex-col items-start text-left lg:flex">
              <span class="text-sm font-semibold text-neutral-900 dark:text-white leading-none">
                {{ userName }}
              </span>
              <span class="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-none">
                {{ userEmail }}
              </span>
            </div>
            <ChevronDown class="h-4 w-4 text-neutral-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-64 p-0 shadow-lg" :side-offset="8">
          <UserMenuContent :user="user" :initials="initials" />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>

<style scoped>
:deep(.avatar-ring) {
  box-shadow: 0 0 0 2px white;
}

.dark :deep(.avatar-ring) {
  box-shadow: 0 0 0 2px #0a0a0a;
}
</style>
