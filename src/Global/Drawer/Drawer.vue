<script setup lang="ts">
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/Global';
import { Button } from '@/Global/ui/button';

const props = withDefaults(defineProps<{
    open: boolean;
    title: string;
    width?: string;
    showFooter?: boolean;
}>(), {
    width: 'w-2/3 sm:full'
});

const emit = defineEmits(['update:open', 'save', 'cancel', 'submit']);

const handleSave = () => {
    emit('save');
    emit('submit')
};

const handleCancel = () => {
    emit('cancel');
    emit('update:open', false);
};


</script>

<template>
    <div class="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm">
        <Sheet :open="props.open" @update:open="emit('update:open', $event)">
            <SheetContent side="right" :class="props.width + ' sm:max-w-none bg-white dark:bg-neutral-900'" class="">
                <SheetHeader class="p-6 border-b border-neutral-100 dark:border-neutral-800">
                    <SheetTitle class="text-xl font-bold text-neutral-900 dark:text-white capitalize">
                        <!-- {{ props.title.toLocaleLowerCase() }} -->
                        <span v-html="props.title"></span>
                        <slot name="drawer-title" />
                    </SheetTitle>
                </SheetHeader>
                <div class="">
                    <form @submit.prevent="handleSave" style="height: 90vh;overflow: auto;">
                        <div
                            class="flex- overflow-auto p-5 py-2 border-b border-neutral-100 dark:border-neutral-800 h-[96vh] overflow-auto">
                            <slot name="body" />
                        </div>
                        <SheetFooter v-if="props.showFooter"
                            class="p-2 z-50 sticky bottom-0 border-0 border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">
                            <div v-if="$slots.actions">
                                <slot name="actions" ></slot>
                            </div>

                            <div v-else class="flex w-full gap-3 items-center justify-between">
                                <div>
                                    <Button variant="outline"
                                        class="flex-1 h-11 w-full  font-bold border-neutral-200 dark:border-neutral-800"
                                        @click="handleCancel">
                                        Close
                                    </Button>
                                </div>

                                <div>
                                    <!-- @click="handleSave" -->
                                    <Button type="submit"
                                        class="flex-1 h-11  w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors">
                                        <button type="submit"> Save</button>

                                    </Button>
                                </div>
                            </div>

                        </SheetFooter>
                    </form>
                </div>

            </SheetContent>
        </Sheet>
    </div>
</template>