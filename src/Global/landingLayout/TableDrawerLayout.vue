<template>
    <div class="flex h-full fle x-1 flex-col  px-1 py-3 " v-auth="permission">
     
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
                <span v-if="$slots['add-action']" class=''>
                    <slot name="add-action" />

                </span>
                <span v-auth="haspermission('create')" v-else>
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
                        <!-- {{ downloadItems }} -->
                        <Imploading
                            v-if="showTableAction == true || (Array.isArray(showTableAction) && showTableAction.includes('download'))"
                            icon="Download" :items="downloadItems" @select="handleDownload" />
                        <Imploading
                            v-if="showTableAction == true || (Array.isArray(showTableAction) && showTableAction.includes('migrate'))"
                            :items="exportItems" @select="handleImport" />
                        <Imploading
                            v-if="printSizes?.length && (showTableAction == true || (Array.isArray(showTableAction) && showTableAction.includes('print')))"
                            icon="Printer" :items="printItems?.length ? printItems : sizePapers(printSizes ?? [])"
                            @select="handlePrint" />
                        <div class="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
                    </div>
                    <slot name="searchSideAction" />
                </div>
            </div>
            <div class="rounded-2xl    bg-white pt-0 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]   dark:bg-neutral-900">
                <div :class='tableDetaultHeight'
                    class="overflow-x-auto w-full  custom-scrollbar  border-neutral-100 bg-white dark:bg-neutral-900 shadow-sm dark:border-neutral-800 rounded-2xl">
                    <Table :check="checkBox" :handleAction="handleAction" :action_config="ACTION_CONFIG"
                        :dataFilter="dataFilter" :data="data" :columns="columns" :permissions="permissions">
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
    <slot name="footer" />
    <div v-if="DrawerMounted">
        <Drawer v-if="drawerOpen" :width="drawerWidth" :showFooter="drawerShooter2" v-model:open="drawerOpen"
            :title="drawerTitle" @save="saveDrawerData">
            <template #body>
                <!-- {{ drawerShowFooter }} -->
                <div id="print-container-drawer">

                    <div>
                        <button v-if="printTable" @click="printDataInDrawer"
                            class="  gap-1 px-5 absolute  rounded-md top-4 right-12 no-print bg-nfuko-primary-600  text-white text-sm font-medium  ">
                            <Printer class="h-10 " />
                            <span>Print</span>
                        </button>
                    </div>

                    <div v-if="buttonTypeClicked == 'download-template'">
                        <UploadTemplateColumn :defaults="importDefaults" :title="title" :templateDisplayLabels="templateDisplayLabels"
                            :data="provideDataTotheParent" />
                    </div>
                    <div v-else-if="buttonTypeClicked == 'import-data'">
                        <uploadTemplateColumData :title="title" :url="url" />
                    </div>
                    <span v-else>
                        <slot :data="provideDataTotheParent" name="drawer" :action="buttonTypeClicked"
                            :submit="submitChanges" />
                    </span>
                </div>

            </template>
        </Drawer>
    </div>
    <ConfirmationDialog v-model:show="showDelete" items1="selectedItem"
        @confirm="() => save(selected ?? {}, 'delete')" />
</template>

<script setup>
import Pagination from '@/Global/Pagination.vue';
import Drawer from '../Drawer/Drawer.vue';
import { Plus } from 'lucide-vue-next';
import ConfirmationDialog from '../confirmationDialog/confirmationDialog.vue';
import Searchbar from './Components/Searchbar.vue';
import { Imploading, UploadTemplateColumn, uploadTemplateColumData, sizePapers, } from '@/Global';
import Table from './Components/Table.vue';
import useTableHelpers from './util/tableHelpers.ts';


const props = defineProps({
    templateDisplayLabels: { type: Array, default: null, required: false },
    permission: { type: String, default: null, required: false },
    addButtonText: {
        type: Object,
        default: () => ({ icon: Plus, text: 'Add New', link: '#' })
    },
    printSizes: {
        type: Array,
        default: [
            'Pages', 'Us'
        ]

    },
    printItems: {
        type: Array,
        default: () => []
    },
    downloadItems: {
        type: Array, default: () => [
            { label: 'PDF', value: 'PDF', route: 'export-pdf' },
            { label: 'Excel', value: 'xlsx', route: 'export-excel' },
        ]
    },
    exportItems: {
        type: Array, default: () => [
            { label: "template", value: "template", route: "download-template", drawer: true },
            { label: "Import Data", value: "import", route: "import-data", drawer: true },
        ]
    },
    tableDetaultHeight: { type: String, default: 'h-[64vh]' },
    checkBox: { type: Boolean, default: true },
    showAddButton: { type: Boolean, default: true },
    drawerShowFooter: { type: Boolean, default: true },
    drawerTitle: { type: String, default: 'Drawer Title' },
    drawerWidth: { type: String, default: '30rem' },
    importDefaults: { type: Array, default: ['id', 'branch_id'], required: false },
    title: { type: String, required: false },
    /**
     * if  u want the drawer to make the create request   automaticly 
     * set automaticCreate to true
     * 
     * ***/
    automaticCreate: { type: Boolean, required: false, default: true },
    printTable: { type: Boolean, required: false, default: false },
    data: {
        type: Object,
        required: false,
        default: () => ({ data: [], links: [], from: null, to: null, total: 0 }),
    },
    columns: { type: Array, required: true },
    removeInSearch: { type: Array, default: () => ['action'] },
    showTableAction: { type: [Boolean, Array], default: false, required: false },
    showSearchbar: { type: Boolean, default: true },
    drawerRemount: { type: Boolean, required: false, default: true },
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


const emit = defineEmits(['save', 'submit', 'update:title']);
const { dataPageLinks,
    submitChanges,
    dataFilter,
    handleAction,
    changeThePage,
    callNewPage,
    onSearch,
    save,
    printDataInDrawer,
    // drawerTitle,
    drawerShooter2,
    drawerWidth,
    drawerOpen,
    toggleDrawer,
    filterDataByString,
    refresh,
    currentPage,
    haspermission,
    selected,
    provideDataTotheParent,
    buttonTypeClicked,
    handleDownload,
    handleImport,
    handleTableAction,
    handlePrint,
    saveDrawerData,
    showDelete, ACTION_CONFIG,
    createNewRecord, dropdownDownload, DrawerMounted
} = useTableHelpers(props, emit);


defineExpose({
    toggleDrawer,
    saveDrawerData,
    callNewPage,
    drawerOpen,
    buttonTypeClicked,
    changeThePage,
    handleAction,
    handlePrint,
    handleDownload,
    refresh,
})
</script>

<style>
@media print {



    /* Remove spacing from container */
    #print-container-drawer {
        width: 100vw;
        margin: 0;
        border: none !important;
        padding: 0;
    }


}

@media print {
    .space-y-2 {
        width: 100vw !important;
        max-width: 100% !important;
    }
}

@media print {
    body {
        font-size: 12px;
    }

    input,
    textarea {
        border: none !important;
        background: rgb(108, 114, 116) !important;
    }
}
</style>
