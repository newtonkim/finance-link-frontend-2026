<template>
    <div class="flex h-full flex-1 flex-col gap-4 p-6 ">

        <!-- HEADER -->
        <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-neutral-900 dark:text-white capitalize">{{ title }}</h3>

            <div v-if="$slots['header-action']">
                <slot name="header-action" />
            </div>
            <span v-else>

                <button v-if="showAddButton" @click="toggleDrawer"
                    class="justify-center bg-[#001d22] hover:bg-[#001d22]/90 whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive  h-9 has-[>svg]:px-3 flex items-center gap-2 rounded-xl  px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-sm ">
                    <component :is="addButtonText.icon" size="16" />
                    {{ addButtonText.text }}
                </button>
            </span>
        </div>

        <!-- SEARCH -->
        <div
            class="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm overflow-hidden p-4">
            <div class="flex  justify-between">

                <Searchbar v-if="showSearchbar" @search="(type, data) => { save(data, type) }"
                    :removeInSearch="removeInSearch" :columns="columns" />


                <div class="flex items-center gap-2" v-if="showTableAction">
                    <button @click="handleExport"
                        class="p-2 bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-800 hover:border-ugYellow rounded-sm transition-all">
                        <Download size="18" />
                    </button>

                    <!-- Print Button -->
                    <button @click="handlePrint"
                        class="p-2 bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-800 hover:border-ugYellow rounded-sm transition-all">
                        <Printer size="18" />
                    </button>

                    <!-- Divider -->
                    <div class="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
                </div>
            </div>
            <!-- TABLE -->
            <div
                class="rounded-2xl  border-neutral-100 bg-white py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
                <div class="overflow-x-auto flex-grow custom-scrollbar h-[64vh]">

                    <Table :handleAction="handleAction" :action_config="ACTION_CONFIG" :dataFilter="dataFilter"
                        :data="data" :columns="columns" />
                </div>


                <Pagination @change="callNewPage" :pagination="Store[props?.state]?.payload ?? props.data"
                    v-if="data?.links && data?.total" :links="data?.links" :from="data?.from" :to="data?.to"
                    :total="data?.total" />
            </div>
        </div>
        <!-- DRAWER -->

    </div>
    <Drawer :width="drawerWidth" v-model:open="drawerOpen" :title="drawerTitle" @save="save">
        <template #body>
            <slot name="drawer" />
        </template>
    </Drawer>

    <ConfirmationDialog v-model:show="showDelete" items1="selectedItem" @confirm="() => save(selected.value, 'delete')" />
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import Pagination from '@/Global/Pagination.vue';
import Drawer from '../Drawer/Drawer.vue';
import { UserCircle2 } from 'lucide-vue-next';
import ConfirmationDialog from '../confirmationDialog/confirmationDialog.vue';
// import { EmptySvg } from '..';
import Searchbar from './Components/Searchbar.vue';
import Table from './Components/Table.vue';
import { Download, Printer } from 'lucide-vue-next';
const drawerOpen = ref(false);
const showDelete = ref(false);
const searchQuery = ref('');
const emit = defineEmits(['save']);
const selected = ref(null);
import { pomPinia } from 'septor-store';
import { ACTION_CONFIG, dataTabelFilter, fetchTableData } from './util';
const Store = pomPinia();

function handleExport() {
    // Your export logic here
    console.log('Export clicked');
}

function handlePrint() {
    window.print();
}
const props = defineProps({
    addButtonText: {
        type: Object,
        default: () => ({ icon: UserCircle2, text: 'Add New', link: '#' })
    },
    showAddButton: { type: Boolean, default: true },
    drawerTitle: { type: String, default: 'Drawer Title' },
    drawerWidth: "",
    title: { type: String, required: true },
    data: { type: Object, required: true },
    columns: { type: Array, required: true },
    removeInSearch: { type: Array, default: ["action"] },
    showTableAction: { type: Boolean, default: false },
    showSearchbar: { type: Boolean, default: true },
    state: { type: String, required: false },
    url: { type: String, required: false },
});




const toggleDrawer = () => drawerOpen.value = !drawerOpen.value;
const save = (data, type = "save") => {
    if (type == 'search' && props?.state && props?.url) {
        fetchTableData({ data, props, Store })
    }
    emit("save", type, data)
};

const handleAction = (item, action) => {
    const fn = ACTION_CONFIG?.[action]?.action;
    if (action === 'delete') {
        showDelete.value = true;
        selected.value = item
    } else {
        if (fn) fn(item);
    }
    save(item ?? selected.value, action);
};
const changeThePage = (item) => {

    save(item, "changePage");
};



const dataFilter = () => {
    const collection = Store[props?.state]?.payload ?? props.data ?? { data: [] }
    return dataTabelFilter(collection?.data, searchQuery.value);
}

onMounted(async () => {
    if (props?.state && props?.url)
        await fetchTableData({ props, Store });
});

</script>
<style>
.text0ashfgdahsdga {
    width: "20em !important";
}
</style>
