<script setup lang="ts">
import { ref, watch } from 'vue'
import { Form, Card } from '@/Global'
import { ACTION_CONFIG } from '@/Global/landingLayout/util';
import Table from '@/Global/landingLayout/Components/Table.vue';
const emits = defineEmits(['update:form']);
const permissionSelected = ref([])
const form = ref([
    {
        label: 'Name',
        name: 'name',
        type: 'text',
        required: true,

    },
    {
        label: 'default permissions',
        name: 'permission',
        type: 'select',
        url: "/central/settings/roles/permissions-drop-down",
        required: true, placeholder: 'Enter Description'
    },
    {
        label: 'description',
        name: 'dec',
        type: 'text',
        required: true, placeholder: 'Enter Description'
    },

])

const props = defineProps({
    isSubmit: {
        type: String,
        default: {},
        required: false
    },
    watcher: {
        type: Object,
        default: {},
        required: false
    }
})



watch(() => form.value, (value) => {
    if (value) {
        const permission = value.find((f: any) => f.name === 'permission') as any;
        if (permission?.value) {
            permissionSelected.value = [...new Set([permission.selected, ...permissionSelected.value.filter((p: any) => p.id !== permission.selected.id),])] as any;
        }
        emits('update:form', { ...value, selectedpermission: permissionSelected.value });
    }
}, { deep: true, })

 


function removePermission(permission: any) {
    permissionSelected.value = permissionSelected.value.filter(p => p.id !== permission.id)
}
const columns = [
    { key: 'name', label: 'Name' },
    { key: 'actions', label: 'Actions', show: ['close'] },
]

const actions: any = {
    close: (item: any) => removePermission(item)
}
function handleAction(item: any, action: string) {
    actions?.[action]?.(item)

}
</script>
<template>
    <div class="">
        <Card
            class="border-neutral-100 h-[79vh] dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-2xl overflow-hidden">
                <Form v-model:form="form" parentStyle="grid grid-cols-2 sm:grid-cols-1 gap-4 md:gap-6 px-4 py-0" />
                <div class="h-[40vh] overflow-auto">
                    <Table :action_config="ACTION_CONFIG" :handleAction="handleAction" :dataFilter="permissionSelected"
                        :data="permissionSelected" :columns="columns">
                    </Table>
            </div>
        </Card>
    </div>
</template>