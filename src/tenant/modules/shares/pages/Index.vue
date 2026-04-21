<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ComingSoon } from '@/tenant/components/globals'

const route = useRoute()

const pageTitle = computed(() => {
    const path = route.path.toLowerCase()
    if (path.includes('share-transactions')) return 'Share Transactions Coming Soon'
    if (path.includes('shareholders')) return 'Shareholders Coming Soon'
    return 'Share Center Coming Soon'
})
</script>

<template>
  <div class="flex h-full flex-1 flex-col bg-[#f8faf9] dark:bg-[#0a0a0a]">
    <ComingSoon :title="pageTitle" description="We are building this feature out to bring you an integrated share management experience. Check back soon!" />
  </div>
</template>
