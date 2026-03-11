<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { ref } from 'vue'

const searchQuery = ref('')
</script>

<template>
    <div class="relative w-full max-w-md">
        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search class="w-4 h-4 text-neutral-400" />
        </div>
        <input v-model="searchQuery" type="text" placeholder="Search settings..."
            class="block w-full pl-10 pr-3 py-2 text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:ring-1 focus:ring-[#001d22] focus:border-[#001d22] outline-none transition-all dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:focus:ring-[#C9A84C] dark:focus:border-[#C9A84C]" />
    </div>
</template>
