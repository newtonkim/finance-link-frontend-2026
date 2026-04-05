<template>
    <table class="table-auto text-left border-collapse w-full striped-table">
        <thead class="sticky top-0 z-40 bg-white shadow-sm dark:bg-neutral-900">
            <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th v-for="col in columns" :key="col.key"
                    class="p-2 px-3 py-4 text-xs font-semibold tracking-wide text-neutral-700 capitalize">
                    {{ col.label }}
                </th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="n in 13" :key="'loader-' + n" class="animate-pulse">

                <td v-for="col in columns" :key="col.key" class="px-3 py-3">

                    <div v-if="col.type === 'image' || col.key?.includes('profile')" class="flex items-center gap-2">
                        <div class="skeleton w-8 h-8 rounded-full"></div>
                        <div class="skeleton h-3 w-24"></div>
                    </div>

                    <div v-else-if="col.type === 'actions'" class="flex justify-center gap-2">
                        <div class="skeleton w-6 h-6 rounded"></div>
                        <div class="skeleton w-6 h-6 rounded"></div>
                        <div class="skeleton w-6 h-6 rounded"></div>
                    </div>

                    <div v-else>
                        <div class="skeleton h-4" :class="[
                            n % 3 === 0 ? 'w-3/4' :
                                n % 2 === 0 ? 'w-1/2' :
                                    'w-full'
                        ]"></div>
                    </div>

                </td>

            </tr>
        </tbody>

    </table>
</template>

<script setup>
const props = defineProps({
    columns: { type: Array, required: true },
    numberindex: { type: Boolean, default: false }
});
</script>


<style scoped>
.skeleton {
    position: relative;
    overflow: hidden;
    border-radius: 6px;
    background: #e5e7eb;
}

.dark .skeleton {
    background: #262626;
}

.skeleton::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg,
            transparent,
            rgba(255, 255, 255, 0.5),
            transparent);
    transform: translateX(-100%);
    animation: shimmer 1.4s infinite;
}

.dark .skeleton::before {
    background: linear-gradient(90deg,
            transparent,
            rgba(255, 255, 255, 0.08),
            transparent);
}

@keyframes shimmer {
    100% {
        transform: translateX(100%);
    }
}
</style>