    <div>
        <div class="p-3 max-w-6xl mx-auto h-[80vh]   bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg">
            <h1 class="text-lg font-extrabold mb-4 text-gray-800 dark:text-gray-100 text-center">
                Excel Upload Table {{ submit }}
            </h1>
            <div class="border-2 border-dashed border-gray-300 dark:border-gray-700 p-10 text-center rounded-2xl cursor-pointer transition-all
             hover:border-gray-400 hover:bg-nfuko-primary/10 dark:hover:bg-gray-800 mb-8" @dragover.prevent
                @drop.prevent="handleDrop" @click="triggerFileInput">
                <Upload size="15"
                    class="mx-auto mb-3 w-12 h-12 text-nfuko-primary dark:text-blue-400 dark:text-blue-300" />
                <p class="text-gray-600 dark:text-gray-400 text-lg font-medium">
                    Drag & drop your Excel file here <br />
                    <span class="text-sm text-gray-400 dark:text-gray-500">(or click to select)</span>
                </p>
                <input type="file" ref="fileInput" class="hidden" @change="handleFileChange" accept=".xlsx, .xls" />
            </div>
            <div v-if="duplicates.length" class="mb-4 p-4 bg-red-100 dark:bg-red-800 text-red-700 rounded-lg">
                Found {{ duplicates.length }} duplicated row(s) by <strong>{{ duplicateKey }}</strong>.
            </div>
 

            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-x-auto h-[47vh]">
                <failedUploads :data="failedChunks"  v-if="Store?.['import-data']"/>
                <Table v-if="excelData.length && excelColumns.length" :dataFilter="excelData" :columns="excelColumns"
                    :data="{}" :handleAction="handleAction" :action_config="ACTION_CONFIG" />
                <div v-else class="py-16 text-center text-gray-400 dark:text-gray-500 text-lg">
                    No data loaded. Upload an Excel file to get started.
                </div>
            </div>
        </div>

        <SheetFooter
            class="p-2 z-50 sticky bottom-0 border-0 border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">

            <div class="flex w-full gap-3 items-center justify-between">
                <div>
                    <Button variant="outline" disabled
                        class="flex-1 h-11 w-full  font-bold border-neutral-200 dark:border-neutral-800">
                        Close
                    </Button>
                </div>

                <div>
                    <!-- @click="handleSave" -->
                    <Button type="button" @click="submitImportData"
                        class="flex-1 h-11  w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors">
                        <span type="button"> Save</span>

                    </Button>
                </div>
            </div>

        </SheetFooter>
    </div>