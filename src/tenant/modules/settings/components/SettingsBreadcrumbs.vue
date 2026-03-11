<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight, Home } from 'lucide-vue-next'

const route = useRoute()

const breadcrumbs = computed(() => {
    const paths = route.path.split('/').filter(p => p && p !== 'tenant')
    return paths.map((path, index) => {
        const fullPath = '/tenant/' + paths.slice(0, index + 1).join('/')
        return {
            name: path.charAt(0).toUpperCase() + path.slice(1),
            path: fullPath,
            isLast: index === paths.length - 1
        }
    })
})
</script>

<template>
    <nav class="flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400">
        <router-link to="/tenant/settings" class="hover:text-neutral-900 dark:hover:text-white flex items-center">
            <Home class="w-4 h-4" />
        </router-link>
        <div v-for="crumb in breadcrumbs" :key="crumb.path" class="flex items-center space-x-2">
            <ChevronRight class="w-4 h-4" />
            <router-link :to="crumb.path" :class="[
                'hover:text-neutral-900 dark:hover:text-white',
                crumb.isLast ? 'font-semibold text-neutral-900 dark:text-white pointer-events-none' : ''
            ]">
                {{ crumb.name }}
            </router-link>
        </div>
    </nav>
</template>
