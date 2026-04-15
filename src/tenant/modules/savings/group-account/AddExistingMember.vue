<template>
    <div class="col-span-5">
        <Form :action="data?.action" parentStyle="grid  grid-cols-1 gap-4  " v-model:form="fields" />
    </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { Form } from '@/Global'
const emits = defineEmits(['update:form']),
    props = defineProps({
        data: {
            type: Object,
            default: {},
        },
    }),
    fields = ref([
        {
            label: 'add group member',
            name: 'memberslist',
            type: 'multi-select',
            required: true,
            url: 'group-account-savings/add-member-group-dropdown-list?group_id=' + props.data?.item?.id,
            placeholder: 'Enter member name',

        },
        {
            label: 'Group description',
            name: 'group_description',
            type: 'textarea',
            required: false,
            placeholder: 'Enter Group description/objective/purpose',
        },
        {
            name: 'add_existing_members_ogroup',
            type: 'textarea',
            required: true,
            hidden:"true",
            value:true
        },
    ])


watch(() => fields.value, () => {
    emits('update:form', fields.value)
})

</script>
