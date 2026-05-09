<script setup lang="ts">
import { Check, ChevronDown, Search, X } from 'lucide-vue-next';
import { ref, computed, onMounted, onUnmounted, watch, shallowRef } from 'vue';
import { fetchTableData } from './landingLayout/util';
import { pomPinia } from 'septor-store';
const Store = pomPinia() as any;
import debounce from 'lodash/debounce';
import { tryCatch } from './Helpers';


interface Option {
    id: string | number;
    name: string;
    [key: string]: any;
}

/**
 * dataOnMount - to fetch data on mount
 *  options - for static options its optional
 * url - for remote data
 * modelValue - for v-model
 * error - for error message
 * placeholder - for placeholder
 * label - for label
 * disabled - for disabled the select
 * remote - for remote data 
 * data -  data posted to the api {query}
 * saveData- keep data in store and pasistent
 * state - for your data store to use
 * reClean on every mount recall data
 * selectDefaultIndex - for default selected index
 * selectOnOneItem - for select only  when the options length is 1
 * appendOptions - for append options to any othe data [options]
 * method - for request method
 * **/
const props = defineProps<{
    modelValue: string | number | null;
    options?: Option[];
    placeholder?: string;
    label?: string;
    class?: string;
    helper?: string;
    error?: string;
    disabled?: boolean;
    remote?: boolean;
    url?: string;
    saveData?: boolean;
    state?: string
    reload?: string
    reClean?: boolean
    dataOnMount?: boolean
    selectDefaultIndex?: number
    selectOnOneItem?: boolean
    appendOptions?: Option[]
    data?: any;
    method?: string;
}>();

const emit = defineEmits(['update:modelValue', 'update:itemSelected']);
const remoteUrl = debounce(async (url: string) => {
    if (!url) return;
    tryCatch(async () => {

        const data = { ...props.data }
        if (searchQuery.value?.length >= 3) data.search_keyword = searchQuery.value
        const generateAstate = await props?.state ?? `${url}`.replace(/[^a-zA-Z0-9]/g, "-");
       
        
        const res = await fetchTableData({
            data: Object.keys(data).length > 0 ? data : null,
            saveData: props?.saveData ?? true,
            props: { url, reload: props.reload ?? false, state: generateAstate, method: props.method },
            Store,
        });
        // console.log(generateAstate);

        let checker = await Store?.[generateAstate]?.payload?.data ?? Store?.[generateAstate]?.payload ?? Store?.[generateAstate] ?? [];

        if (props.appendOptions) {
            if (Array.isArray(props.appendOptions))
                checker = [...(props.appendOptions ?? []), ...checker,]



        }
        collection.value =  checker

        if (props?.selectOnOneItem) {
            if (filteredOptions.value?.length < 1) {
                setTimeout(() => {
                    if (filteredOptions.value?.length === 1)
                        selectOption(filteredOptions.value[0]);
                }, 3000)
            } else {
                if (filteredOptions.value?.length === 1)
                    selectOption(filteredOptions.value[0])
            }
        }
    })
}, 1000);

const isOpen = ref(false);
const searchQuery = ref('');
const collection = shallowRef<any[]>([]);
const containerRef = ref<HTMLElement | null>(null);
const selectedOption = computed(() => {
    const options = props?.url ? collection.value : props.options
    if (!Array.isArray(options) || options?.length === 0) return null
    return options?.find(opt => opt.id === props.modelValue);
});

const filteredOptions = computed(() => {

    let options = props?.url ? collection.value : [...props.options, ...(props.appendOptions ?? [])]

    if (!Array.isArray(options)) return [];

    if (!searchQuery.value) return options;

    const query = searchQuery.value.toLowerCase();
    return options?.filter(opt =>
        opt.name.toLowerCase().includes(query)
    ) ?? [];
});

const selectOption = (option: Option) => {
    if (!option) return;
    emit('update:modelValue', option.id);
    emit('update:itemSelected', option);
    setTimeout(() => {
        isOpen.value = false;
    })
    searchQuery.value = '';
};

const toggleDropdown = async () => {
    if (props.disabled) return;
    isOpen.value = !isOpen.value;
    if (isOpen.value)
        searchQuery.value = '';
    fetchData()
};

function fetchData() {
    const generateAstate = props?.state ?? `${props?.url}`.replace(/[^a-zA-Z0-9]/g, "-");
    let DataAlreadyCollected = Store[generateAstate]?.payload?.data ?? Store[generateAstate]?.payload

    if (props.url && !DataAlreadyCollected?.length) {
        remoteUrl(props.url)
    } else {
        if (props.appendOptions) {
            if (Array.isArray(props.appendOptions))
                DataAlreadyCollected = [...(props.appendOptions ?? []), ...DataAlreadyCollected,]
        }

        collection.value = DataAlreadyCollected
    }
}
const closeDropdown = (e: MouseEvent) => {
    const target = e.target as Node;

    if (
        isOpen.value &&
        containerRef.value &&
        !containerRef.value.contains(target)
    ) {
        isOpen.value = false;
    }
};

onMounted(() => {
    // window.addEventListener('click', closeDropdown);
      window.addEventListener(
        'mousedown',
        closeDropdown
    );
    if (props.reClean) {
        const generateAstate = props?.state ?? `${props?.url}`.replace(/[^a-zA-Z0-9]/g, "-");
        Store[generateAstate] = []
    }
});

onUnmounted(() => {
    window.removeEventListener(
        'mousedown',
        closeDropdown
    );
    // window.removeEventListener('click', closeDropdown);
});

watch(props, async (newVal) => {
    if (newVal?.dataOnMount) {
        // searchQuery.value = String(props.modelValue ?? ''); new add this line and i have commented it bring 14 issues
        fetchData()
    }
    if (newVal?.selectDefaultIndex >= 0 && !props.modelValue) {
        setTimeout(() => {
            selectOption(filteredOptions.value[newVal.selectDefaultIndex ?? 0])
        }, 1000)
    }
    if (newVal?.selectOnOneItem) {


        if (filteredOptions.value?.length < 1) {
            setTimeout(() => {
                if (filteredOptions.value?.length === 1)
                    selectOption(filteredOptions.value[0]);
            }, 3000)
        } else {
            if (filteredOptions.value?.length === 1)
                selectOption(filteredOptions.value[0])
        }
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
    selectOption,
    isOpen,
    filteredOptions

});


const inputClass =
    'w-full rounded-lg border focus:border-nfuko-primary focus:ring-1 focus:ring- bg-nfuko-[#FCDC04]   bg-white px-3 py-2.5 text-sm outline-none transition  border-nfuko-primary/10 focus:ring-1 focus:ring-bg-nfuko-primary/90 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-[#8ba8a2]/90 dark:focus:ring-[#8ba8a2]/90';

</script>

<template>

    <div ref="containerRef" class="relative w-full " :class="[props?.class]">
        <div @click="toggleDropdown" :class="[
            inputClass,
            error ? 'border-red-500 focus-within:ring-red-500/10' : 'border-neutral-200 focus-within: border-nfuko-primary',
            disabled ? 'opacity-50 cursor-not-allowed bg-neutral-50 dark:bg-neutral-950' : 'hover:border-neutral-300 dark:hover:border-neutral-700'
        ]">
            <div class="flex items-center justify-between gap -2">
                <span v-if="selectedOption && selectedOption.id !== null && selectedOption.id !== undefined"
                    class="block truncate text-neutral-900 dark:text-neutral-100 font-medium">
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
            <div style="z-index:9999" v-if="isOpen"
                class="absolute   mt-2 w-full o verflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
                <div class="p-2 border-b border-neutral-100 dark:border-neutral-800">
                    <div class="relative flex items-center">
                        <!-- {{ searchQuery }}=== -->
                        <Search class="absolute left-3.5 h-4 w-4 text-neutral-400" />
                        <input v-model="searchQuery" type="text" :placeholder="'Search...' + placeholder"
                            class="w-full rounded-lg bg-neutral-50 dark:bg-neutral-950 px-10 py-2 text-sm outline-none focus:ring-0 placeholder:text-neutral-400"
                            @click.stop />
                        <button v-if="searchQuery" @click.stop="searchQuery = ''"
                            class="absolute right-3.5 p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors">
                            <X class="h-3 w-3 text-neutral-400" />
                        </button>
                    </div>
                </div>
                <!-- {{ filteredOptions }} -->

                <ul class="max-h-60 overflow-auto py-1 scrollbar-hide">
                    <li v-for="option in filteredOptions" :key="option.id" @click.stop="selectOption(option)"
                        class="relative flex cursor-pointer select-none items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        :class="[
                            option.id === modelValue ? 'bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                        ]">
                        <span class="block truncate">

                            <slot name="option" :item="option">
                                <span class="block truncate capitalize">{{ option?.name }}</span>
                            </slot>

                        </span>
                        <Check v-if="option.id === modelValue"
                            class="h-4 w-4  text-nfuko-primary dark:text-[#8ba8a2]" />
                    </li>
                    <li v-if="(filteredOptions as any)?.length === 0"
                        class="px-4 py-8 text-center text-sm text-neutral-400">
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
