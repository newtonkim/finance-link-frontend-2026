<template>
    <div class="w-full">
        <div class="flex p-1 bg-gray-100/80 rounded-xl border border-gray-200/50 w-max">
            <button type="button" v-for="tab in tabs" :key="tab" @click="activeTab = tab" :class="[
                'px-6 py-2 text-sm font-medium transition-all duration-200 rounded-lg',
                activeTab === tab ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5': 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            ]">
                {{ tab }}
            </button>
        </div>
        <div class="mt-2">
            <div v-if="activeTab === 'None Existing'">
                <CreateNoneMember :data="data" v-model:form="formData" />
            </div>
            <div v-if="activeTab === 'Exiting'">
                <AddExistingMember :data="data" v-model:form="formData" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { AddExistingMember, CreateNoneMember } from '.'
const tabs = ['None Existing', 'Exiting']
const activeTab = ref('None Existing')
const props = defineProps({
    data: {
        type: Object,
        default: () => ({}),
    },
});
const formData = ref({})
const emits = defineEmits(['update:form'])
watch(formData, (val) => {
    emits('update:form', val)
}, { deep: true })
</script>