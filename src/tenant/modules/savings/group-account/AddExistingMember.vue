<template>
    <div class="col-span-5">
        <Form :action="data?.action" parentStyle="grid  grid-cols-1 gap-4  " v-model:form="fields" />
    </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
const emits = defineEmits(['update:form']),
    props = defineProps({
        data: {
            type: Object,
            default: {},
        },
    });
const groupId = computed(() => props.data?.item?.id ?? props.data?.id ?? props.data?.group_id)
const fields = ref([
    {
        label: 'add group member',
        name: 'memberslist',
        type: 'multi-select',
        required: true,
        url: `group-account-savings/add-member-group-dropdown-list?group_id=${groupId.value}`,
        state: `group-add-member-dropdown-${groupId.value}`,
        dataOnMount: true,
        reClean: true,
        placeholder: 'Enter member name',

    },
    {
        label: 'Account Code',
        name: 'account_code',
        type: 'select',
        required: false,
        url: `group-account-savings/collect-group-saving-account-list?group_id=${groupId.value}`,
        state: `group-account-code-dropdown-${groupId.value}`,
        dataOnMount: true,
        reClean: true,
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
        hidden: "true",
        value: true
    },
])

watch(groupId, (id) => {
    const membersField: any = fields.value.find((field: any) => field.name === 'memberslist')
    if (membersField) {
        membersField.url = `group-account-savings/add-member-group-dropdown-list?group_id=${id}`
        membersField.state = `group-add-member-dropdown-${id}`
    }

    const accountField: any = fields.value.find((field: any) => field.name === 'account_code')
    if (accountField) {
        accountField.url = `group-account-savings/collect-group-saving-account-list?group_id=${id}`
        accountField.state = `group-account-code-dropdown-${id}`
    }
})


watch(() => fields.value, () => {
    emits('update:form', fields.value)
})

</script>
