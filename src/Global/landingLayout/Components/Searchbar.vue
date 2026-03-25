<template>
    <div class="relative w-full max-w-[600px] lg:w-1/3 md:w-80 sm:w-full group">
        <!-- Search Section -->
        <div class="flex items-center gap-2 mb-2">
            <div class="relative w-full">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size="16" />
                <input v-model="searchQuery"
                 @input="(e)=>inputValue(e.target.value)"
                type="search" autocomplete="off"
                    placeholder="Search by name, member number, phone, or email..."
                    :class='[
                    searchClass,
                    "w-full focus:rounded-full    bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition border-nfuko-primary/10 focus:border-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    ]'
                     />
            </div>
            <button
            type="button"
             v-if="searchQuery" @click="() => {
                const v = Object.keys(searchBy ?? []);
                const obj = { search_keyword: searchQuery, }
          
                if (v.length)
                    obj.search_by = v

                save(obj, 'search');
                
            

            }" class="flex items-center justify-center rounded-lg  bg-nfuko-primary px-2.5 py-2.5 text-white 
           hover:bg-[#00343d] transition-colors">
                <Search size="16" />
            </button>

        </div>

        <!-- Dropdown -->
        <!-- Dropdown -->
        <div v-if="searchQuery" class="absolute top-full mt-1 w-full max-h-[200px] overflow-auto 
         bg-white shadow-lg rounded-lg z-50 dark:bg-neutral-900
         opacity-0 invisible 
         group-hover:opacity-100 group-hover:visible
         group-focus-within:opacity-100 group-focus-within:visible
         transition-all duration-200">
            <div v-for="col in removeActionInSupperseach" :key="col.key" class="px-3 py-2 text-sm cursor-pointer
           hover:bg-neutral-100 dark:hover:bg-neutral-800" @click="selectColumn(col)">
                {{ col.label }}
            </div>
        </div>

        <!-- Pills -->
        <div v-if="Object.keys(searchBy)?.length" class="flex flex-wrap gap-1 my-1">
            <div v-for="(value, index) in Object.keys(searchBy)" :key="index"
                class="flex items-center gap-2 px-2 py-1    text-xs font-medium    bg-white    text-neutral-600   dark: bg-nfuko-primary hover: bg-nfuko-primary/90 dark:text-white   rounded-full capitalize   transition-all duration-200">
                <span>{{ value }}</span>
                <button @click.stop="removeColumn(value)" class="ml-1 text-red-200/80 hover:text-red-300 hover:dark:text-red-500 hover:rounded-full hover:bg-red-50 hover:px-1  hover:dark:bg-red-900 text-xs ">
                    ✕
                </button>
            </div>
        </div>

    </div>
</template>
<script setup>
import { ref } from 'vue';
import { Search, } from 'lucide-vue-next';

const searchBy = ref({});
const searchQuery = ref('');
const emit = defineEmits(['search','filter']);

const props = defineProps({
    columns: { type: Array, required: true },
    removeInSearch: { type: Array, default: ["action"] },
    searchClass:' rounded-2xl      transition-all placeholder:text-neutral-400   dark:text-white'
});

const removeActionInSupperseach = props.columns.filter(col => ![...props.removeInSearch, 'actions'].includes(col.key))

const selectColumn = (col) => {
    // prevent duplicates 
    searchBy.value[col.label] = col.key
}

const save = (data, type = "save") => {
    emit("search", type, data)
    
};
const inputValue = (data, type = "filter") => {
                 emit(type, data)
                

};

const removeColumn = (index) => {
    // searchBy.value.splice(index, 1)
    delete searchBy.value[index]
    save({ search_by: searchBy.value, search_key: searchQuery.value }, 'search')
}
</script>
