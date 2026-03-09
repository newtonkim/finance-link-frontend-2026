<script setup lang="ts">
import { Check, ChevronDown, Search, X } from 'lucide-vue-next';
import { ref, computed, onMounted, onUnmounted, watch, shallowRef } from 'vue';
import { fetchTableData } from './landingLayout/util';
import { pomPinia } from 'septor-store';
const Store = pomPinia();
import debounce from 'lodash/debounce'; // install lodash if not already: npm i lodash
import { tryCatch } from './Helpers';

// import { ACTION_CONFIG, dataTabelFilter, fetchTableData } from './util';

interface Option {
    id: string | number;
    name: string;
    [key: string]: any;
}

const props = defineProps<{
    modelValue: string | number;
    options: Option[];
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    remote?: boolean;
    url?: string;
}>();

const emit = defineEmits(['update:modelValue']);
const remoteUrl = debounce(async (url: string) => {
    if (!url) return;
    tryCatch(async () => {
        const data = { }
        if(searchQuery.value?.length >= 3)
         data.search_keyword = searchQuery.value
         const res = await fetchTableData({
            data:data?.search_keyword?data:null,
            props: { url, reload: false },
            Store,
        });
        if (res.success !== false)
            collection.value = res?.payload?.data ?? res?.payload ?? res ?? [];
    })
}, 1000);



const isOpen = ref(false);
const searchQuery = ref('');
const collection = shallowRef<any[]>([]);
const containerRef = ref<HTMLElement | null>(null);
const selectedOption = computed(() => {
    const options = props?.url ? collection.value : props.options
    return options.find(opt => opt.id === props.modelValue);
});

const filteredOptions = computed(() => {
    const options = props?.url ? collection.value : props.options
    if (!searchQuery.value) return options;
    const query = searchQuery.value.toLowerCase();
    return options.filter(opt =>
        opt.name.toLowerCase().includes(query)
    );
});

const selectOption = (option: Option) => {
    emit('update:modelValue', option.id);
    isOpen.value = false;
    searchQuery.value = '';
};

const toggleDropdown = () => {
    if (props.disabled) return;
    isOpen.value = !isOpen.value;
    if (isOpen.value) {
        searchQuery.value = '';
    }

    if (props.url) {
        remoteUrl(props.url)
    }

};

const closeDropdown = (e: MouseEvent) => {
    if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
        isOpen.value = false;
    }
};

onMounted(() => {
    window.addEventListener('click', closeDropdown);
});

onUnmounted(() => {
    window.removeEventListener('click', closeDropdown);
});

watch(isOpen, (newVal) => {
    if (newVal) {
        // Optional: focus searchable input
    }
});
watch(searchQuery, (newVal) => {
    if (searchQuery.value?.length >= 3 && props.url) {
        remoteUrl(props.url)
    }
}, { immediate: true, deep: true });



</script>

<template>
    <div ref="containerRef" class="relative w-full">

        <!-- <label v-if="label" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 ">
            {{ label }}
        </label> -->

        <div @click="toggleDropdown"
            class="relative w-full cursor-pointer rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-[#001d22]/10 focus-within:border-[#001d22] dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
            :class="[
                error ? 'border-red-500 focus-within:ring-red-500/10' : 'border-neutral-200 focus-within:border-[#001d22]',
                disabled ? 'opacity-50 cursor-not-allowed bg-neutral-50 dark:bg-neutral-950' : 'hover:border-neutral-300 dark:hover:border-neutral-700'
            ]">
            <div class="flex items-center justify-between gap-2">
                <span v-if="selectedOption" class="block truncate text-neutral-900 dark:text-neutral-100 font-medium">
                    {{ selectedOption.name }}
                </span>
                <span v-else class="block truncate text-neutral-400">
                    {{ placeholder || 'Select option' }}
                </span>
                <ChevronDown class="h-4 w-4 text-neutral-400 transition-transform duration-200"
                    :class="{ 'rotate-180': isOpen }" />
            </div>
        </div>

        <Transition enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in" leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0">
            <div v-if="isOpen"
                class="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
                <div class="p-2 border-b border-neutral-100 dark:border-neutral-800">
                    <div class="relative flex items-center">
                        <Search class="absolute left-3.5 h-4 w-4 text-neutral-400" />
                        <input v-model="searchQuery" type="text" placeholder="Search..."
                            class="w-full rounded-lg bg-neutral-50 dark:bg-neutral-950 px-10 py-2 text-sm outline-none focus:ring-0 placeholder:text-neutral-400"
                            @click.stop />
                        <button v-if="searchQuery" @click.stop="searchQuery = ''"
                            class="absolute right-3.5 p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors">
                            <X class="h-3 w-3 text-neutral-400" />
                        </button>
                    </div>
                </div>

                <ul class="max-h-60 overflow-auto py-1 scrollbar-hide">
                    <li v-for="option in filteredOptions" :key="option.id" @click.stop="selectOption(option)"
                        class="relative flex cursor-pointer select-none items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        :class="[
                            option.id === modelValue ? 'bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                        ]">
                        <span class="block truncate">{{ option.name }}</span>
                        <Check v-if="option.id === modelValue" class="h-4 w-4 text-[#001d22] dark:text-[#8ba8a2]" />
                    </li>
                    <li v-if="filteredOptions.length === 0" class="px-4 py-8 text-center text-sm text-neutral-400">
                        No results found
                    </li>
                </ul>
            </div>
        </Transition>

        <p v-if="error" class="mt-1.5 text-xs font-medium text-red-500 px-1">
            {{ error }}
        </p>
    </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
