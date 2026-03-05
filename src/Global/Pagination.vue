<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-vue-next';

defineProps<{
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    from?: number | null;
    to?: number | null;
    total?: number;
}>();

const formatLabel = (label: string) => {
    if (label.includes('Previous')) return 'Previous';
    if (label.includes('Next')) return 'Next';
    return label;
};
</script>

<template>
    <div v-if="links.length > 3" class="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-100 dark:border-neutral-800 pt-5 mt-5">
        
        <!-- Results Summary (optional) -->
        <div v-if="total !== undefined" class="text-sm text-neutral-500 dark:text-neutral-400">
            Showing <span class="font-medium text-neutral-900 dark:text-white">{{ from || 0 }}</span> to <span class="font-medium text-neutral-900 dark:text-white">{{ to || 0 }}</span> of <span class="font-medium text-neutral-900 dark:text-white">{{ total }}</span> results
        </div>
        <div v-else class="text-sm text-neutral-500 dark:text-neutral-400">
            <!-- Fallback if from/to/total not passed -->
        </div>

        <!-- Page Links -->
        <nav class="flex items-center gap-1.5" aria-label="Pagination">
            <template v-for="(link, key) in links" :key="key">
                <!-- Previous Button -->
                <Component
                    :is="link.url ? Link : 'span'"
                    v-if="link.label.includes('Previous')"
                    :href="link.url"
                    class="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                    :class="link.url 
                        ? 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800' 
                        : 'text-neutral-300 cursor-not-allowed dark:text-neutral-700'"
                    preserve-scroll
                >
                    <ChevronLeft :size="16" />
                    <span class="hidden sm:inline">Prev</span>
                </Component>
                
                <!-- Next Button -->
                <Component
                    :is="link.url ? Link : 'span'"
                    v-else-if="link.label.includes('Next')"
                    :href="link.url"
                    class="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                    :class="link.url 
                        ? 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800' 
                        : 'text-neutral-300 cursor-not-allowed dark:text-neutral-700'"
                    preserve-scroll
                >
                    <span class="hidden sm:inline">Next</span>
                    <ChevronRight :size="16" />
                </Component>
                
                <!-- Dots -->
                <span 
                    v-else-if="link.label === '...'"
                    class="flex items-center justify-center w-8 h-8 text-neutral-400 dark:text-neutral-600"
                >
                    <MoreHorizontal :size="16" />
                </span>

                <!-- Normal Page Links -->
                <Link
                    v-else
                    :href="link.url || '#'"
                    class="flex items-center justify-center min-w-[32px] h-8 px-2 text-sm font-medium rounded-lg transition-colors"
                    :class="link.active
                        ? 'bg-[#10C469] text-white shadow-sm'
                        : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'"
                    preserve-scroll
                >
                    {{ formatLabel(link.label) }}
                </Link>
            </template>
        </nav>
    </div>
</template>
