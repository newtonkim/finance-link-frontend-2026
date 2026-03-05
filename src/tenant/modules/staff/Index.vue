<template>

    <TableDrawer url="/list" state="staff" drawerTitle="create Staff" @save="saveUser" title="Staff" :filters="filters"
        :columns="columns">
        <!-- <template #created_at="{ item }">
            {{ date(item.created_at) }}
</template> -->

        <template #drawer>
            <StaffForm v-model:form="formData" />
        </template>

    </TableDrawer>


</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import StaffForm from './Create.vue';
import { StaffApi } from '../../apis/staff/staffApi';
import { TableDrawer } from '@/Global';

const formData = reactive({})


const props = defineProps<{
    members: {
        data: Array<{
            id: number;
            member_number: string;
            name: string;
            phone: string;
            email: string;
            gender: string;
            status: string;
            joined_at: string;
            created_at: string;
            avatar_url: string | null;
        }>;
        links: Array<any>;
        from: number | null;
        to: number | null;
        total: number;
    };
    filters: {
        search?: string;
    };
}>();


const { create, fetchStaff, fetchPositions, Erase } = StaffApi()


const triggerAction: Record<string, Function> = {
    delete: (data: any) => Erase(data),
    // search: (data: any) => fetchStaff(data),
    create: () => create(formData)
}

function saveUser(type: string, data: any,) {
    triggerAction?.[type]?.(data)


}



const columns = [
    { key: 'id', label: '#', width: '10' },
    { key: 'full_name', label: 'Name', width: '40', sticky: 'left' },
    { key: 'email_address', label: 'Email' },
    { key: 'everified_at', label: 'Verified', type: 'dateTime' },
    { key: 'phone_number', label: 'Phone' },
    { key: 'is_admin', label: 'is_admin' },
    { key: 'status', label: 'status' },
    { key: 'created_at', label: 'Created', sticky: 'right', type: 'date' },
    { key: 'actions', label: 'actions', show: ['view', 'edit', 'delete'] },
];


</script>
<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
