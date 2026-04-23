<template>
    <div class="relative   w-[90%]  group">
        <div class="flex items-center gap-2 mb-2 w-full">
            <div class="relative w-full">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size="15" />
                <input v-model="searchQuery" @input="(e) => inputValue(e.target.value)" type="search" autocomplete="off"
                    placeholder="Search by name, member number, phone, or email..." :class='[
                        searchClass,
                        "w-full focus:rounded-full bg-white py-2.5 pl-11 pr-3 text-sm outline-none transition border-nfuko-primary/10 focus:border-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    ]' />
            </div>
            <button type="button" v-if="searchQuery" @click="() => triggerSearch()" class="flex items-center justify-center rounded-lg  bg-nfuko-primary px-2.5 py-2.5 text-white 
           hover:bg-[#00343d] transition-colors">
                <Search :size="15" />
            </button>
        </div>
        <div v-if="searchQuery" class="absolute top-full mt-1 w-full max-h-[200px] overflow-auto  bg-white shadow-lg rounded-lg z-50 dark:bg-neutral-900 opacity-0 invisible  group-hover:opacity-100 group-hover:visible
         group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200">
            <div v-for="col in removeActionInSupperseach" :key="col.key"
                class="px-3 py-2 text-sm cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                @click="selectColumn(col)">
                <div class="flex items-center justify-between" v-if="col?.onSearch">
                    <div class="text-neutral-700 dark:text-neutral-200">
                        {{ col.label }}
                    </div>
                    <div v-if="col.onSearch" @click.stop="(e) => toggleFilter(col, e)"
                        class="text-xs text-nfuko-primary hover:underline">
                        filter
                    </div>
                </div>
                <div v-else class="text-neutral-700 dark:text-neutral-200">
                    {{ col.label }}
                </div>
            </div>
        </div>
        <div v-if="Object.keys(searchBy)?.length"
            class="flex flex-wrap gap-1 my-1 h-[3vh] overflow-auto scrollbar-hide flex flex-wrap gap-1 my-1 max-h-[6vh] overflow-auto  ">
            <div v-for="(value, index) in Object.keys(searchBy)" :key="index"
                class="flex items-center gap-2 px-2 py-1    text-xs font-medium    bg-white    text-neutral-600   dark: bg-nfuko-primary hover: bg-nfuko-primary/90 dark:text-white   rounded-full capitalize   transition-all duration-200">
                <span>{{ value }}</span>
                <button @click.stop="removeColumn(value)"
                    class="ml-1 text-red-500 hover:text-white hover:dark:text-red-500 hover:rounded-full hover:bg-red-300  px-1  hover:dark:bg-red-900 text-xs ">✕
                </button>
            </div>
        </div>
    </div>
    <Teleport to="body" v-if="activeFilter[currentFilteClicked]">
        <!-- {{ filterPosition }} -->


        <!-- PANEL -->
        <div v-if="activeFilter[currentFilteClicked]" ref="panelRef" :style="filterPosition" class="fixed top-[20%]   w-[320px]
      bg-white dark:bg-neutral-900
      border border-neutral-200 dark:border-neutral-700
      shadow-2xl rounded-2xl p-4 z-[9999]
      transition-all duration-200">
            <div>
                <SearchableSelect v-if="activeFilter[currentFilteClicked]?.onSearch?.type === 'select'"
                    v-model="filterValues[activeFilter]" :options="activeFilter[currentFilteClicked].options" />

                <!-- DATE RANGE -->
                <DatePicker v-else-if="activeFilter[currentFilteClicked]?.onSearch?.type === 'date-range'"
                    v-model="activeFilter[currentFilteClicked].value" range multi-calendars class="w-full" />
            </div>


        </div>
    </Teleport>
</template>
<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue';
import { Search, } from 'lucide-vue-next';
const searchBy = ref({});
const searchQuery = ref('');
const activeFilter = ref({})
const panelRef = ref(null)
const currentFilteClicked = ref(null)
const filterPosition = ref({})

const emit = defineEmits(['search', 'filter']);
const props = defineProps({
    columns: { type: Array, required: true },
    removeInSearch: { type: Array, default: ["action"] },
    searchClass: ' rounded-2xl      transition-all placeholder:text-neutral-400   dark:text-white'
});
const removeActionInSupperseach = props.columns.filter(col => ![...props.removeInSearch, 'actions'].includes(col.key))
const selectColumn = (col) => {
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
    save({ search_by: searchBy.value, search_key: searchQuery.value }, 'search')
}
function triggerSearch() {
    const v = Object.keys(searchBy.value ?? []), collection = {};
    const keySearch = { search_keyword: searchQuery.value, }
    if (v.length) keySearch.search_by = Object.values(searchBy.value).join(',');

    const obj = Object.values(activeFilter.value)
    obj.forEach(item => {
        if (item?.key && item?.value) {
            collection[item.key] = { value: item.value, type: item.onSearch.type }
        }
    })
    if (Object.keys(collection).length)
        keySearch.search_filter = collection
    save({ ...keySearch, }, 'search')
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
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>
