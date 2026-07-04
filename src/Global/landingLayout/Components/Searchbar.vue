<template>
    <!-- {{ appendSearchColumns }} -->
    <!-- WRAPPER -->
    <div class="relative w-full">

        <Teleport to="body">
            <Transition enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 translate-y-4 scale-95" enter-to-class="opacity-100 translate-y-0 scale-100"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 translate-y-0 scale-100"
                leave-to-class="opacity-0 translate-y-4 scale-95">
                <div v-if="Object.keys(searchBy)?.length || Object.keys(activeFilter)?.length"
                    :style="filterPositionDisplay" class="fixed z-[40]  w-[30vw]">

                    <!-- FLOATING PANEL (TABLE VERSION) -->
                    <div
                        class="relative overflow-auto rounded-md border border-white/20 bg-white/80 p-3 backdrop-blur-md shadow-xl dark:bg-neutral-900/80 scrollbar-hide">

                        <!-- GLOW -->
                        <div
                            class="pointer-events-none absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5" />

                        <!-- TABLE -->
                        <table class="w-full text-xs border-collapse">

                            <!-- HEADER -->
                            <thead>
                                <tr
                                    class="text-left text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                                    <th class="py-1 px-2">Type</th>
                                    <th class="py-1 px-2">Key</th>
                                    <th class="py-1 px-2">Value</th>
                                    <th class="py-1 px-2 w-8"></th>
                                </tr>
                            </thead>

                            <tbody>

                                <!-- SEARCH ROWS -->
                             
                                <template v-if="Object.keys(searchBy)?.length">
                                    <tr v-for="(value, index) in Object.keys(searchBy)" :key="'search-' + index"
                                        class="hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
                                        @click.stop="removeColumn(value)">
                                        <td class="py-2 px-2 text-blue-600 font-medium">
                                            Search
                                        </td>

                                        <td class="py-2 px-2 text-neutral-700 dark:text-neutral-200">
                                            {{ value }}
                                        </td>

                                        <td class="py-2 px-2 text-neutral-500">
                                            {{ searchQuery }}
                                        </td>

                                        <td class="py-2 px-2 text-right">
                                            <button class="text-xs text-red-500 hover:text-red-700">
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                </template>

                                <!-- FILTER ROWS -->
                                <template v-if="Object.keys(activeFilter)?.length">
                                    <tr v-for="(value, index) in Object.values(activeFilter)" :key="'filter-' + index"
                                        class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition"
                                        @click.stop="removeColumn(value.key)">
                                        <td class="py-2 px-2 text-neutral-600 dark:text-neutral-300 font-medium">
                                            Filter
                                        </td>

                                        <td class="py-2 px-2 text-neutral-700 dark:text-neutral-200">
                                            {{ value.label }}
                                        </td>

                                        <td class="py-2 px-2 text-neutral-500">
                                            {{ value.onSearch.type === 'date-range' ? formatRange(value.value)
                                                : value.value }}
                                        </td>

                                        <td class="py-2 px-2 text-right">
                                            <button class="text-xs text-red-500 hover:text-red-700">
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                </template>

                            </tbody>
                        </table>

                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>



    <div class="relative   w-[90%]  group z-[41] " ref="searchRef">
        <div class="flex items-center gap-2 mb-2 w-full">
            <div class="relative w-full">
                <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size="16" />
                <input v-model="searchQuery" @input="(e) => inputValue(e.target.value)" type="search" autocomplete="off"
                    placeholder="Search records…" :class='[
                        searchClass,
                        "w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-11 pr-4 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/15 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white [&::-webkit-search-cancel-button]:hidden"
                    ]' />
            </div>
            <button type="button" v-if="searchQuery" @click="() => triggerSearch()"
                class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-nfuko-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00343d]">
                <Search :size="15" /> <span class="hidden sm:inline">Search</span>
            </button>
        </div>

        <!-- Field menu: pick a column to search, or open its filter -->
        <div v-if="searchQuery"
            class="absolute top-full left-0 z-50 mt-2 w-full min-w-60 overflow-hidden rounded-xl border border-neutral-200 bg-white opacity-0 invisible shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 dark:border-neutral-700 dark:bg-neutral-900">
            <div class="border-b border-neutral-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:border-neutral-800">
                Search in field
            </div>
            <div class="max-h-60 overflow-auto p-1">
                <template v-for="col in removeActionInSupperseach" :key="col.key">
                    <div v-if="col?.onSearch"
                        class="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition hover:bg-neutral-50 dark:hover:bg-neutral-800">
                        <span class="capitalize text-neutral-700 dark:text-neutral-200">{{ col.label }}</span>
                        <button type="button" @click.stop="(e) => toggleFilter(col, e)"
                            class="inline-flex items-center gap-1 rounded-md bg-nfuko-primary/10 px-2 py-1 text-[11px] font-bold text-nfuko-primary transition hover:bg-nfuko-primary/20">
                            <SlidersHorizontal :size="12" /> Filter
                        </button>
                    </div>
                    <button v-else type="button" @click.stop="selectColumn(col)"
                        class="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-neutral-50 dark:hover:bg-neutral-800">
                        <span class="capitalize text-neutral-700 dark:text-neutral-200">{{ col.label }}</span>
                        <Plus :size="14" class="text-neutral-300" />
                    </button>
                </template>
            </div>
        </div>
    </div>

    <Teleport to="body" v-if="activeFilter[currentFilteClicked]">



        <!-- PANEL -->
        <div v-if="activeFilter[currentFilteClicked]" ref="panelRef" :style="filterPosition" class="fixed top-[20%]   w-[320px]
      bg-white dark:bg-neutral-900
      border border-neutral-200 dark:border-neutral-700
      shadow-2xl rounded-2xl p-4 z-[9999]
      transition-all duration-200">
            <!-- {{ activeFilter[currentFilteClicked] }} -->
            <div>
                <SearchableSelect v-if="activeFilter[currentFilteClicked]?.onSearch?.type === 'select'"
                    v-model="activeFilter[currentFilteClicked].value"
                    :options="activeFilter[currentFilteClicked]?.onSearch?.options" />

                <DatePicker v-else-if="activeFilter[currentFilteClicked]?.onSearch?.type === 'date-range'"
                    v-model="activeFilter[currentFilteClicked].value" range multi-calendars class="w-full" />
            </div>


        </div>
    </Teleport>
</template>
<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue';
import { Search, SlidersHorizontal, Plus } from 'lucide-vue-next';
import { SearchableSelect } from '@/Global';
import { nextTick } from 'vue';
const searchBy = ref({});
const searchQuery = ref('');
const activeFilter = ref({})
const panelRef = ref(null)
const searchRef = ref(null)
const currentFilteClicked = ref(null)
const filterPosition = ref({})
const filterPositionDisplay = ref({})

const emit = defineEmits(['search', 'filter']);
const props = defineProps({
    columns: { type: Array, required: true },
    removeInSearch: { type: Array, default: ["action"] },
    appendSearchColumns: { type: Array, default: [] },
    searchClass: ' rounded-2xl      transition-all placeholder:text-neutral-400   dark:text-white'
});
const removeActionInSupperseach = [...props.columns, ...props.appendSearchColumns].filter(col => ![...props.removeInSearch, 'actions'].includes(col.key))
const selectColumn = (col) => {
    nextTick(() => updatePosition())
    searchBy.value[col.label] = col.key


}
const save = (data, type = "save") => {
    emit("search", type, data)
};
const inputValue = (data, type = "filter") => {
    emit(type, data)


};
const removeColumn = (index) => {
    delete searchBy.value[index]
    delete activeFilter.value[index]
    console.log(index,activeFilter.value);
    
    save({ search_by: searchBy.value, search_key: searchQuery.value }, 'search')
}
function triggerSearch() {
    const v = Object.keys(searchBy.value ?? []), collection = {};
    const keySearch = { search_keyword: searchQuery.value, }
    if (v.length) keySearch.search_by = Object.values(searchBy.value).join(',');

    const obj = Object.values(activeFilter.value)
    // console.log(obj);



    obj.forEach(item => {

        if (item?.key && item?.value) {

            collection[item.key] = { value: item.value, type: item.onSearch.type }
        }
    })

    if (Object.keys(collection).length) {
        keySearch.search_filter = collection
        save({ ...keySearch, }, 'search')
    }
    // alert()

}


const handleClickOutside = (event) => {
    const el = panelRef.value

    if (!el) return

    if (!el.contains(event.target)) {
        // close panel
        currentFilteClicked.value = null
    }
}

const toggleFilter = (col, event) => {

   
    activeFilter.value[col.key] = col
    currentFilteClicked.value = col.key

    const rect = event.target.getBoundingClientRect()

    filterPosition.value = {
        top: rect.bottom + window.scrollY + "px",
        left: rect.left + window.scrollX + "px"
    }

    nextTick(() => updatePosition())


}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
    props.appendSearchColumns
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})
const updatePosition = () => {
    const rect = searchRef.value.getBoundingClientRect()

    filterPositionDisplay.value = {
        position: 'fixed',
        left: (rect.left + rect.width / 2) + 100 + 'px',
        top: rect.bottom + 130 + 'px',
        transform: 'translate(-50%, -100%)'
    }
}

const formatRange = (val) => {
    if (!Array.isArray(val)) return val

    const options = { year: 'numeric', month: 'short', day: 'numeric' }

    const fmt = (d) =>
        d ? new Date(d).toLocaleDateString(undefined, options) : ''

    return `${fmt(val[0])} → ${fmt(val[1])}`
}

</script>
<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
