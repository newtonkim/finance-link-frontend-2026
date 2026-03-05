<script setup lang="ts">
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/Global/ui/sheet';
import { Button } from '@/Global/ui/button';

const props = withDefaults(defineProps<{
    open: boolean;
    title: string;
    width?: string;
}>(), {
    width: 'w-2/3 sm:full'
});

const emit = defineEmits(['update:open', 'save', 'cancel', "submit"]);

const handleSave = () => {
    emit('save');
};

const handleCancel = () => {
    emit('cancel');
    emit('update:open', false);
};
// const emits = defineEmits(['submit', 'clear', 'update:form']);

</script>

<template>
    <Sheet :open="props.open" @update:open="emit('update:open', $event)">
        <SheetContent side="right" :class="props.width + ' sm:max-w-none'">
            <SheetHeader class="p-6 border-b border-neutral-100 dark:border-neutral-800">
                <SheetTitle class="text-xl font-bold text-neutral-900 dark:text-white capitalize">
                    {{ props.title.toLocaleLowerCase() }}
                </SheetTitle>
            </SheetHeader>

            <div class="flex- overflow-auto p-6">
                <form @submit.prevent="$emit('submit')">


                    <slot name="body" />
                </form>
            </div>

            <SheetFooter
                class="p-2 border-0 border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">
                <slot name="actions">

                    <div class="flex w-full gap-3 items-center justify-between">
                        <div>
                            <Button variant="outline"
                                class="flex-1 h-11 w-full  font-bold border-neutral-200 dark:border-neutral-800"
                                @click="handleCancel">
                                Close
                            </Button>
                        </div>

                        <div>
                            <Button type="submit"
                                class="flex-1 h-11  w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                                @click="handleSave">
                                Save
                            </Button>
                        </div>
                    </div>
                </slot>
            </SheetFooter>
        </SheetContent>
    </Sheet>
</template>