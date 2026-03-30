<template>
    <div class="flex h-full fle x-1 flex-col  px-10 py-6 ">
        <div class="flex items-center justify-between">
            <div v-if="$slots['header-action']" class='my-2'>
                <slot name="header-action" />
            </div>
            <div v-else>
                <div v-if='title'
                    class="text-4xl font-black text-[#0A2318] dark:text-white tracking-tight font-bold text-neutral-900 dark:text-white capitalize"
                    v-once>
                    <h3 v-html="title"></h3>
                </div>
            </div>
            <span>
                <span v-auth="haspermission('create')">
                    <button v-if="showAddButton" @click="createNewRecord"
                        class="justify-center  bg-nfuko-primary hover: bg-nfuko-primary/90 whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive  h-9 has-[>svg]:px-3 flex items-center gap-2 rounded-xl  px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-sm ">
                        <component :is="addButtonText.icon" :size="16" />
                        {{ addButtonText.text }}
                    </button>
                </span>
            </span>
        </div>
        <div v-if="$slots['sub-header']">
            <slot name="sub-header" />
        </div>
        <div
            class="rounded-xl border-0 border-neutral-200 b g-white dark:border-neutral-800 dark:bg-neutral-900  overflow-hidden ">
            <div v-if="showSearchbar || showTableAction"
                class="flex  items-center  my-2 px-1 justify-between rounded-xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div class=" items-center gap-2 board-r-1 pt-2" v-if="showSearchbar">
                    <Searchbar class="m-0 p-0 " @search="onSearch" :removeInSearch="removeInSearch" :columns="columns"
                        @filter="(v) => filterDataByString(v)" />
                </div>
                <div class="flex">
                    <div class="flex items-center gap-2 board-r-1 mx-2" v-if="showTableAction">
                        <button @click="handleExport"
                            class="p-2 cursor-pointer hover:bg-nfuko-action hover:text-white hover:rounded-full hover:border-1 hover:border-accent bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-800 hover:border-ugYellow rounded-sm transition-all">
                            <Download :size="18" />
                        </button>
                        <button @click="handlePrint"
                            class="p-2 cursor-pointer hover:bg-nfuko-action hover:text-white hover:rounded-full hover:border-1 hover:border-accent bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-800 hover:border-ugYellow rounded-sm transition-all">
                            <Printer :size="18" />
                        </button>
                        <div class="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
                    </div>
                    <slot name="searchSideAction" />
                </div>
            </div>
            <div class="rounded-2xl    bg-white pt-0 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]   dark:bg-neutral-900">
                <div
                    class="overflow-x-auto w-full  custom-scrollbar h-[64vh] border-neutral-100 bg-white dark:bg-neutral-900 shadow-sm dark:border-neutral-800 rounded-2xl">
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
    </div>
    <div v-if="DrawerMounted">
        <Drawer v-if="drawerOpen" :width="drawerWidth" :showFooter="drawerShooter2" v-model:open="drawerOpen"
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
import { formDataFormatV2, createUrl, feedback, } from '@/Global';
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
    await save('create', 'add');
    buttonTypeClicked.value = 'add'
    await toggleDrawer();
    provideDataTotheParent.value = null
    DrawerMounted.value = true
    // drawerShooter2

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
    /**
     * if  u want the drawer to make the create request   automaticly 
     * set automaticCreate to true
     * 
     * ***/
    automaticCreate: { type: Boolean, required: false, default: true },
    data: {
        type: Object,
        required: false,
        default: () => ({ data: [], links: [], from: null, to: null, total: 0 }),
    },
    columns: { type: Array, required: true },
    removeInSearch: { type: Array, default: () => ['action'] },
    showTableAction: { type: Boolean, default: false },
    showSearchbar: { type: Boolean, default: true },
    drawerRemount: { type: Boolean, required: false ,default: false},
    state: { type: String, required: false },
    url: { type: String, required: false },
    // module: { type: String, required: false },
    /**
     * {
     *  *@enum[create,edit,view,delete] Example:
 * @param
     * create:"permission",  * @param
     * edit:"permission",  * @param
     * view:"permision"  * @param
     delete:"permision"  * @param
     * }
     * 
     * **/
    permissions: { type: Object, required: false },
    /**
 * By default the system uses standard route names: edit, view, delete.
 * If you want to override those routes, you can provide `outerlinks`
 * to specify custom paths.
 *
 * Example:
 * @@@param
 * @@argument
 * outerlinks: {
 *   edit: 'edit-details',
 *   view: 'view-details',
 *   delete: 'delete-item'
 * }
 */
    outerlinks: { type: Object, required: false },
    actionSlot: { type: [String, null, Boolean], default: false },

});


async function handleExport(item: any) {
    let outerlinks = props?.outerlinks?.['export'] ?? "export"
    const res = await fetchTableData({
        data: item,
        props: {
            ...props,
            state: props?.state + "_" + outerlinks,
            url: createUrl(props.url, outerlinks)
        }, Store
    });
    // const response = feedback(res);
}


const drawerShooter2 = ref(props.drawerShowFooter)

const toggleDrawer = () => {
    (drawerOpen.value = !drawerOpen.value)
    if (drawerOpen.value) {
        //////
        Store.currentFormValues = {}
    }

};
function save(data: unknown, type = 'save') {
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
    drawerShooter2.value = type !== 'view'
    emit("save", type, data, submitChanges.value);
};

async function automaticCreateFun() {
    if (props.automaticCreate) {
        const data = Store.currentFormValues;
        let customeUrl = props?.actionSlot ?? props?.outerlinks?.['create'] ?? "create";
        if (props?.actionSlot) {
            customeUrl = props?.actionSlot;
        } else if (props?.outerlinks?.['create']) {
            customeUrl = props.outerlinks['create'];
        } else {
            customeUrl = "create";
        }
        // console.log(customeUrl);
        const formDataScoping: any = formDataFormatV2((data))
        const res = await fetchTableData({
            data: formDataScoping,
            props: {
                ...props,
                state: props?.state + "_" + customeUrl,
                url: createUrl(props?.url, customeUrl)
            }, Store
        });
        const response = feedback(res);
        if (response.success) {
            Store[props?.state] = res
            toggleDrawer()
            setTimeout(() => {
                submitChanges.value = false
            }, 2000)
            setTimeout(() => {
                toggleDrawer()
            }, 100) //  to make sure the drawer is cleaned 
            Store.currentFormValues = {};
            return true
        }
        return false
    }
}
async function saveDrawerData(data: any) {
    // alert()
    Store.isFormSubmitted = true;
    const AnyErrorsFoundInTheFOrm = Store.AnyErrorsFoundInTheFOrm;

    // if (AnyErrorsFoundInTheFOrm == undefined) {

    // } else
    if (AnyErrorsFoundInTheFOrm) {

    } else {
        const checker = await automaticCreateFun('create')
        // console.log(checker,'====2');

        if (checker) {
            // if (!checker) {
            return
        }


        save(data, 'create')

        setTimeout(() => {
            submitChanges.value = false
        }, 2000)
        if (props.drawerRemount) {
            toggleDrawer()
            setTimeout(() => {
                toggleDrawer()
            }, 100)

        }
        // if all it ok
        //Store.isSubmitted==false;
    }
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
            if (props?.outerlinks?.[action]) {
                outerlinks = props?.outerlinks[action]
            } else {
                if (action == 'edit') {
                    outerlinks = "edit-details"
                }
            }
            const res = await fetchTableData({
                data: item, props: {
                    ...props,
                    state: props?.state + "_" + outerlinks,
                    url: createUrl(props?.url, outerlinks)
                }, Store
            });
            provideDataTotheParent.value = res?.payload ?? res
        }
        if (action == 'view') {
            drawerShooter2.value = false

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
    // alert()
    save(page, "changePage");
};
const callNewPage = changeThePage;
const onSearch = (type: string, data: unknown) => {
    save(data, type);
};
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

function refresh() {
    if (props?.state && props?.url)
        fetchTableData({ data: null, props: { ...props, reload: false, time: 0 }, Store })
}

defineExpose({
    toggleDrawer,
    callNewPage,
    drawerOpen,
    changeThePage,
    handleAction,
    handlePrint,
    refresh,
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
