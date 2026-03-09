<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Users, Search, Plus, Filter, MoreHorizontal } from 'lucide-vue-next'
import { membersApi } from '@/tenant/apis/members/membersApi'

const { fetchmembers } = membersApi()
const members = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const fetchMembersList = async () => {
  loading.value = true
  try {
    const res = await fetchmembers({})
    members.value = res?.data ?? []
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load members'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMembersList()
})
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Header -->
    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Members</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage your SACCO members and their accounts.</p>
      </div>
      <button
        class="inline-flex items-center justify-center rounded-lg bg-[#001d22] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#001d22]/90 transition-colors">
        <Plus class="mr-2 h-4 w-4" />
        Add Member
      </button>
    </div>

    <!-- Filters & Search -->
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input type="text" placeholder="Search members..."
          class="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#001d22] focus:ring-1 focus:ring-[#001d22] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
      </div>
      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
          <Filter class="h-4 w-4" />
          Filter
        </button>
      </div>
    </div>

    <!-- Members Table -->
    <div
      class="overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-neutral-50 border-b border-neutral-100 dark:bg-neutral-800/50 dark:border-neutral-800">
            <tr>
              <th class="px-6 py-4 font-semibold text-neutral-900 dark:text-white">Member Name</th>
              <th class="px-6 py-4 font-semibold text-neutral-900 dark:text-white">Member ID</th>
              <th class="px-6 py-4 font-semibold text-neutral-900 dark:text-white">Phone Number</th>
              <th class="px-6 py-4 font-semibold text-neutral-900 dark:text-white">Status</th>
              <th class="px-6 py-4 font-semibold text-neutral-900 dark:text-white text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <template v-if="loading">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td v-for="j in 5" :key="j" class="px-6 py-4">
                  <div class="h-4 w-3/4 rounded bg-neutral-100 dark:bg-neutral-800"></div>
                </td>
              </tr>
            </template>
            <tr v-else-if="members.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                <div class="flex flex-col items-center gap-2">
                  <Users class="h-8 w-8 text-neutral-300" />
                  <p>No members found.</p>
                </div>
              </td>
            </tr>
            <tr v-for="member in members" :key="member.id"
              class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-[#001d22]/10 text-[#001d22] font-semibold">
                    {{ member.name?.charAt(0) ?? 'M' }}
                  </div>
                  <span class="font-medium text-neutral-900 dark:text-white">{{ member.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ member.member_number }}</td>
              <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ member.phone }}</td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Active
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button class="text-neutral-400 hover:text-neutral-600 dark:hover:text-white">
                  <MoreHorizontal class="h-5 w-5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
