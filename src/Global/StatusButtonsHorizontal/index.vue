<template>
    <div
        class=" flex rounded-lg border border-neutral-200 bg-neutral-50 p-[4px] dark:border-neutral-700 dark:bg-neutral-800">
        <button v-for="filter in filters" :key="filter"
            class="rounded-md px-3.5 py-1 text-xs font-medium capitalize transition-all"
            :class="filter === modelValue ? activeFilterClass : inactiveFilterClass"
            @click="() => updateStatusFilter(filter)">
            {{ filter }}
        </button>
    </div>

</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['update:modelValue',]);

const props = defineProps({
    filters: { type: Array, required: true },
    modelValue: { type: String, default: "" }

});

const activeFilterClass = 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
const inactiveFilterClass = 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'

function updateStatusFilter(filter) {
    // statusFilter.value = filter
      emit('update:modelValue', filter)

}
</script>