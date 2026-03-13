<template>
    <div class="flex h-full flex-1 flex-col gap-4 p-6 ">

        <!-- HEADER -->
        <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-neutral-900 dark:text-white capitalize" v-once>{{ title }}</h3>

            <div v-if="$slots['header-action']">
                <slot name="header-action" />
            </div>
            <span v-else>
                <span v-auth="haspermission('create')">



                    <button v-if="showAddButton" @click="createNewRecord"
                        class="justify-center bg-[#001d22] hover:bg-[#001d22]/90 whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive  h-9 has-[>svg]:px-3 flex items-center gap-2 rounded-xl  px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-sm ">
                        <component :is="addButtonText.icon" :size="16" />
                        {{ addButtonText.text }}
                    </button>
                </span>
            </span>
        </div>

        <!-- SEARCH -->
        <div
            class="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm overflow-hidden p-4">
            <div class="flex  justify-between">
                <Searchbar v-if="showSearchbar" @search="onSearch" :removeInSearch="removeInSearch" :columns="columns"
                    @filter="(v) => filterDataByString(v)" />
                <slot name="searchSideAction" />
                <div class="flex items-center gap-2" v-if="showTableAction">
                    <button @click="handleExport"
                        class="p-2 bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-800 hover:border-ugYellow rounded-sm transition-all">
                        <Download :size="18" />
                    </button>
                    <!-- Print Button -->
                    <button @click="handlePrint"
                        class="p-2 bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-800 hover:border-ugYellow rounded-sm transition-all">
                        <Printer :size="18" />
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
                        :data="data" :columns="columns" :permissions="permissions">
                        <template v-for="(_, name) in $slots" #[name]="slotProps">
                            <slot :name="name" v-bind="slotProps || {}" />
                        </template>
                    </Table>

                </div>
                <Pagination @change="callNewPage" v-if="dataPageLinks?.links && dataPageLinks?.total"
                    :links="dataPageLinks?.links" :from="dataPageLinks?.from" :to="dataPageLinks?.to"
                    :total="dataPageLinks?.total" />
            </div>
        </div>
        <!-- DRAWER -->
    </div>
    <div v-if="DrawerMounted">
        <Drawer v-if="drawerOpen" :width="drawerWidth" :showFooter="drawerShowFooter" v-model:open="drawerOpen"
            :title="drawerTitle" @save="saveDrawerData">
            <template #body>

                <slot :data="provideDataTotheParent" name="drawer" :action="buttonTypeClicked"
                    :submit="submitChanges" />

            </template>
        </Drawer>
    </div>

    <ConfirmationDialog v-model:show="showDelete" items1="selectedItem"
        @confirm="() => save(selected ?? {}, 'delete')" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Pagination from '@/Global/Pagination.vue';
import Drawer from '../Drawer/Drawer.vue';
import { Plus } from 'lucide-vue-next';
import ConfirmationDialog from '../confirmationDialog/confirmationDialog.vue';
import Searchbar from './Components/Searchbar.vue';
import Table from './Components/Table.vue';
import { Download, Printer } from 'lucide-vue-next';
import { pomPinia } from 'septor-store';
import { ACTION_CONFIG, dataTabelFilter, fetchTableData } from './util';
const drawerOpen = ref(false);
const showDelete = ref(false);
const searchQuery = ref('');
const emit = defineEmits(['save', 'submit']);
const selected = ref<Record<string, unknown> | null>(null);
const Store = pomPinia();
const buttonTypeClicked = ref<any>(null);
const DrawerMounted = ref<boolean>(true);
const submitChanges = ref<any>(null);
const provideDataTotheParent = ref<any>([]);
async function createNewRecord() {
    DrawerMounted.value = false
    await toggleDrawer();
    await save('create', 'add');
    buttonTypeClicked.value = 'add'
    DrawerMounted.value = true

}
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
        default: () => ({ icon: Plus, text: 'Add New', link: '#' })
    },
    showAddButton: { type: Boolean, default: true },
    drawerShowFooter: { type: Boolean, default: true },
    drawerTitle: { type: String, default: 'Drawer Title' },
    drawerWidth: { type: String, default: '30rem' },
    title: { type: String, required: false },
    data: {
        type: Object,
        required: false,
        default: () => ({ data: [], links: [], from: null, to: null, total: 0 }),
    },
    columns: { type: Array, required: true },
    removeInSearch: { type: Array, default: () => ['action'] },
    showTableAction: { type: Boolean, default: false },
    showSearchbar: { type: Boolean, default: true },
    state: { type: String, required: false },
    url: { type: String, required: false },
    module: { type: String, required: false },
    permissions: { type: Object, required: false },
    /**
 * By default the system uses standard route names: edit, view, delete.
 * If you want to override those routes, you can provide `outerlinks`
 * to specify custom paths.
 *
 * Example:
 * outerlinks: {
 *   edit: 'edit-details',
 *   view: 'view-details',
 *   delete: 'delete-item'
 * }
 */
    outerlinks: { type: Object, required: false },
});




const toggleDrawer = () => {
    (drawerOpen.value = !drawerOpen.value)

};

const save = (data: unknown, type = 'save') => {
    if (type == 'search' && props?.state && props?.url) {
        fetchTableData({ data, props, Store })
        return
    }
    if (type == 'delete' && props?.state && props?.url) {
        const newprosDta = { ...props, url: createUrl(props?.url, 'delete') }
        fetchTableData({ data, props: newprosDta, Store })
        return
    }
    if (type === 'create' || type === 'save') {
        submitChanges.value = true
        setTimeout(() => {
            submitChanges.value = false
        }, 1000)
    }


    emit("save", type, data)

};

function createUrl(url: string, action: string) {
    const url2 = url.split("/")
    url2.length = url2.length - 1
    return url2.join("/") + `/${action}`
}

function saveDrawerData(data: any) {
    save(data, 'create')
    toggleDrawer()
    setTimeout(() => {

        submitChanges.value = false
    }, 2000)
    setTimeout(() => {
        toggleDrawer()
    }, 100)
}

const handleAction = async (item: any, action: keyof typeof ACTION_CONFIG) => {
    const fn = (ACTION_CONFIG?.[action] as { action?: (payload: any) => void } | undefined)?.action;
    if (action === 'delete') {
        showDelete.value = true;
        selected.value = item
        if (props?.state && props?.url) {
            return  // dont send the  action to the parent
        }
    } else if (["edit", "view"].includes(action)) {
        DrawerMounted.value = false

        if (fn) fn(item);
        toggleDrawer()// open the drawer on this action clicked
        if (props?.state && props?.url && ['edit', 'view'].includes(action)) {
            let outerlinks = "details"
            // const outerlinks = props?.outerlinks[action]?(props?.outerlinks[action]?props?.outerlinks[action]):"details";
            if(props?.outerlinks?.[action]){
                outerlinks = props?.outerlinks[action]
            }else{
                 if(action=='edit'){
                    outerlinks = "edit-details"
                }
            }
            const res = await fetchTableData({
                data: item, props: {
                    ...props,
                    state: props?.state + "_"+outerlinks,
                    url: createUrl(props?.url, outerlinks)
                }, Store
            });
            provideDataTotheParent.value = res?.payload ?? res
        }

        DrawerMounted.value = true
    }
    else {
        if (fn) fn(item);
    }


    save(item ?? selected.value, String(action));
    buttonTypeClicked.value = action

};
const changeThePage = (page: unknown) => {
    if (page && props?.state && props?.url) {
        fetchTableData({
            data: {
                page
                //    search_keyword:searchQuery.value  // i have avoided this coz it will look in the page  instead let goo globa
            }, props, Store
        })

    }
    save(page, "changePage");
};
const callNewPage = changeThePage;
const onSearch = (type: string, data: unknown) => save(data, type);
const dataFilter = computed(() => {
    const collection = (props?.state ? (Store[props.state as keyof typeof Store] as any)?.payload : null) ?? props.data ?? { data: [] }
    return dataTabelFilter(collection?.data, searchQuery.value);
})
const dataPageLinks = computed(() => {
    return (props?.state ? (Store[props.state as keyof typeof Store] as any)?.payload : null) ?? props.data ?? { data: [] }
})
function filterDataByString(value: string) {
    searchQuery.value = value
}
onMounted(async () => {
    callOnmount()

});

watch(() => props?.url, () => {
    callOnmount()
})
function callOnmount() {
    if (props?.state && props?.url)
        fetchTableData({ data: null, props, Store });
}

defineExpose({
    toggleDrawer,
    callNewPage,
    changeThePage,
    handleAction,
    handlePrint
})

function haspermission(permission = "") {
    return props.permissions?.[permission]

}

</script>
<style>
.text0ashfgdahsdga {
    width: "20em !important";
}
</style>
