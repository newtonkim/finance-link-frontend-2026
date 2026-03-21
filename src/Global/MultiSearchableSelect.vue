<script setup lang="ts">
import { Check, ChevronDown, Search, X } from 'lucide-vue-next';
import { ref, computed, onMounted, onUnmounted, watch, shallowRef } from 'vue';
import { fetchTableData } from './landingLayout/util';
import { pomPinia } from 'septor-store';
const Store = pomPinia();
import debounce from 'lodash/debounce';
import { tryCatch } from './Helpers';

interface Option {
    id: string | number;
    name: string;
    [key: string]: any;
}

const props = defineProps<{
    modelValue: (string | number)[];
    options: Option[];
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    remote?: boolean;
    url?: string;
    state: string
    dataOnMount?: boolean
}>();

const emit = defineEmits(['update:modelValue', 'update:itemSelected']);
const remoteUrl = debounce(async (url: string) => {
    if (!url) return;
    tryCatch(async () => {
        const data: any = {}
        if (searchQuery.value?.length >= 3)
            data.search_keyword = searchQuery.value
        const res = await fetchTableData({
            data: data?.search_keyword ? data : null,
            props: { url, reload: false, state: props?.state },
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

const selectedOptions = computed(() => {
    const options = props?.url ? collection.value : props.options
    if (!props.modelValue || !Array.isArray(props.modelValue)) return [];
    return options.filter(opt => props.modelValue.includes(opt.id));
});

const filteredOptions = computed(() => {
    const options = props?.url ? collection.value : props.options
    if (!searchQuery.value) return options;
    const query = searchQuery.value.toLowerCase();
    return options.filter(opt =>
        opt.name.toLowerCase().includes(query)
    );
});

const toggleSelectOption = (option: Option) => {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = current.indexOf(option.id);
    if (index === -1) {
        current.push(option.id);
    } else {
        current.splice(index, 1);
    }
    emit('update:modelValue', current);
    emit('update:itemSelected', selectedOptions.value); // emit all selected
    // don't close, let them select multiple
};

const toggleDropdown = () => {
    if (props.disabled) return;
    isOpen.value = !isOpen.value;
    if (isOpen.value) 
        searchQuery.value = '';
    if (props.url) 
        remoteUrl(props.url)
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

watch(props, async(newVal) => {
    if (newVal?.dataOnMount) { 
        searchQuery.value = '';
        await toggleDropdown();
        await toggleDropdown();
    }
}, { immediate: true, deep: true });

watch(searchQuery, (newVal) => {
    if (searchQuery.value?.length >= 3 && props.url) {
        remoteUrl(props.url)
    }
}, { immediate: true, deep: true });

defineExpose({
    toggleDropdown,
    closeDropdown,
    toggleSelectOption,
    isOpen,
    filteredOptions
});

const inputClass =
    'w-full rounded-lg border focus:border-nfuko-primary focus:ring-1 focus:ring- bg-nfuko-[#FCDC04]   bg-white px-3 py-2.5 text-sm outline-none transition  border-nfuko-primary/10 focus:ring-1 focus:ring-[ bg-nfuko-primary]/90 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-[#8ba8a2]/90 dark:focus:ring-[#8ba8a2]/90';

</script>

<template>
    <div ref="containerRef" class="relative w-full">
        <div @click="toggleDropdown"
            :class="[
                inputClass,
                error ? 'border-red-500 focus-within:ring-red-500/10' : 'border-neutral-200 focus-within: border-nfuko-primary',
                disabled ? 'opacity-50 cursor-not-allowed bg-neutral-50 dark:bg-neutral-950' : 'hover:border-neutral-300 dark:hover:border-neutral-700'
            ]">
            <div class="flex items-center justify-between gap-2">
                <span v-if="selectedOptions.length" class="block truncate text-neutral-900 dark:text-neutral-100 font-medium">
                    {{ selectedOptions.map(o => o.name).join(', ') }}
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
                    <li v-for="option in filteredOptions" :key="option.id" @click.stop="toggleSelectOption(option)"
                        class="relative flex cursor-pointer select-none items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        :class="[
                            (modelValue || []).includes(option.id) ? 'bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                        ]">
                        <span class="block truncate">{{ option.name }}</span>
                        <Check v-if="(modelValue || []).includes(option.id)" class="h-4 w-4 text-nfuko-primary dark:text-[#8ba8a2]" />
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
