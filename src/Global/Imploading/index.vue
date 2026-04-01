<template>
    <div ref="dropdownRef" class="relative inline-block">
        <!-- Button -->
        <button @click="toggleDropdown"
            class="p-2 cursor-pointer hover:bg-nfuko-action hover:text-white hover:rounded-full hover:border hover:border-accent bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-800 hover:border-ugYellow rounded-sm transition-all">
            <component :is="resolvedIcon" :size="18" />
        </button>

        <!-- Dropdown -->
        <div v-if="isOpen"
            class="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50">
            <ul class="py-2 text-sm text-slate-700 dark:text-slate-200">
                <li v-for="(item, index) in items" :key="index" @click="onItemClick(item)" :class="[
                    'px-4 py-2 cursor-pointer rounded-lg capitalize text-sm truncate transition-colors',
                    item.danger
                        ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-800'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                ]">
                    {{ item.label }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue"
import * as icons from "lucide-vue-next"

const props = defineProps({
    items: {
        type: Array,
        default: () => []
    },
    icon: {
        type: String,
        default: "Upload"
    }
})

const emit = defineEmits(["select"])

const isOpen = ref(false)
const dropdownRef = ref(null)

const toggleDropdown = () => {
    isOpen.value = !isOpen.value
}

const onItemClick = (item) => {
    emit("select", item)
    isOpen.value = false
}


const handleClickOutside = (event) => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
        isOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener("click", handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside)
})

const resolvedIcon = computed(() => {
    return icons[props.icon] || icons.Upload
})
</script>