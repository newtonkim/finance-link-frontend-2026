<template>
    <!-- <button @click="tableRef.toggleDrawer">ww</button> -->

    <TableDrawer :drawerShowFooter="Store.showSaveButton ? true : false" ref="tableRef" u rl="/list" sta te="staff"
        :data="collection" drawerTitle="create Tenants" @save="saveUser" title="Tenants" :filters="filters"
        :columns="columns">
        <!-- <template #created_at="{ item }">
            {{ date(item.created_at) }}
</template> -->
        <template #searchSideAction>
            <div
                class="h-[5vh] flex rounded-lg border border-neutral-200 bg-neutral-50 p-[4px] dark:border-neutral-700 dark:bg-neutral-800">
                <button v-for="filter in ['all', 'active', 'suspended', 'trial']" :key="filter"
                    class="rounded-md px-3.5 py-1 text-xs font-medium capitalize transition-all" :class="statusFilter === filter
                        ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                        : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'"
                    @click="statusFilter = filter">
                    {{ filter }}
                </button>
            </div>
        </template>

        <template #drawer="{ action }">
            <StaffForm v-if="action == 'add'" v-model:form="formData" />
        </template>

    </TableDrawer>


</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import StaffForm from './Create.vue';
import { TableDrawer } from '@/Global';
import { tenantsApi } from '../apis';
import { pomPinia } from 'septor-store';

const Store = pomPinia(),
    formData = reactive({}), tableRef = ref()
const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    suspended: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
    trial: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    expired: { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400', dot: 'bg-neutral-400' },
};
const statusFilter = ref('all');


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


const { create, Erase } = tenantsApi()


const triggerAction: Record<string, Function> = {
    delete: (data: any) => Erase(data),
    // search: (data: any) => fetchStaff(data),
    create: () => create(formData)
}

function saveUser(type: string, data: any,) {
    triggerAction?.[type]?.(data)
    console.log(type, data);



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

const collection = {
    data: [


        // --- Auto-generated pattern for 6–30 ---
        ...Array.from({ length: 11 }, (_, i) => {
            const id = i + 6;
            return {
                id,
                full_name: `Test User ${id}`,
                email_address: `user${id}@example.com`,
                everified_at: id % 2 === 0 ? `2026-03-${(id % 28) + 1}T08:00:00Z` : null,
                is_admin: id % 7 === 0,
                status: id % 3 === 0 ? "inactive" : id % 5 === 0 ? "pending" : "active",
                factor_secret: id % 2 === 0 ? `SECRET${id}` : null,
                factor_recovery_codes:
                    id % 2 === 0 ? JSON.stringify([`rec${id}a`, `rec${id}b`]) : null,
                factor_confirmed_at:
                    id % 2 === 0 ? `2026-03-${(id % 28) + 1}T08:10:00Z` : null,
                created_at: `2026-02-${(id % 28) + 1}T07:00:00Z`,
                gender: id % 2 === 0 ? "female" : "male",
                marital_status: id % 4 === 0 ? "married" : "single",
                location: ["Kampala", "Entebbe", "Jinja", "Gulu", "Mbarara"][id % 5],
                other_contact: `+256700000${300 + id}`,
                nin_id: `CM10000${id}XX`,
                kin_details: `Next of Kin ${id} - Relative - +256700000${400 + id}`,
                phone_number: `+256700000${500 + id}`,
                date_of_birth: `199${id % 10}-0${(id % 9) + 1}-15`,
            };
        }),
    ],

    links: [
        { url: null, label: "&laquo; Previous", active: false },
        { url: "?page=1", label: "1", active: true },
        { url: "?page=2", label: "2", active: false },
        { url: "?page=2", label: "Next &raquo;", active: false }
    ],

    from: 1,
    to: 4,
    total: 4
}

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
