<template>
  <Sheet :open="props.open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="right"
      :class="[
        props.width,
        'sm:max-w-none bg-gray-50 dark:bg-neutral-900',
        'transition-all duration-300 ease-in-out',
        props.open ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
      ]"
      @click.stop
    >
      <SheetHeader class="py-4 border-b border-neutral-100 dark:border-neutral-800">
        <SheetTitle class="text-xl font-bold text-neutral-900 dark:text-white capitalize">
          <span>
            <span v-html='props?.title.toLocaleLowerCase()'></span>
          </span>
          
        </SheetTitle>
      </SheetHeader>
      <div class="w-full min-w-0">
        <form @submit.prevent="handleSave" class="flex flex-col h-screen w-full min-w-0">
          <div
            class="px-4 py-1 border-b border-neutral-100 dark:border-neutral-800 max-h-[calc(100vh-100px)] overflow-y-auto overflow-x-hidden w-full min-w-0"
          >
            <!-- class="px-4 py-1 border-b border-neutral-100 dark:border-neutral-800 max-h-[calc(100vh-150px)] overflow-y-auto overflow-x-hidden" -->
            <slot name="body" />
          </div>
          <SheetFooter
            v-if="props.showFooter"
            class="p-2 z-50 sticky bottom-0 border-0 border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/50"
          >
            <div v-if="$slots.actions">
              <slot name="actions"></slot>
            </div>

            <div v-else class="flex w-full gap-2   items-center justify-between">
              <div class="w-1/3 ">
                <Button
                  variant="outline"
                  type="button"
                  :disabled="formStore.loading"
                  class="flex-1 h-11 w-full mx-2 font-bold border-neutral-200 dark:border-neutral-800"
                  @click="()=>handleCancel()"
                >
                  Close
                </Button>
              </div>

              <div class="w-1/3 ">
                <Button
                  type="submit"
                  :disabled="formStore.loading"
                  class="flex-1 h-11 mr-5 w-full font-bold text-white transition-colors flex items-center justify-center gap-2"
                  :class="props.saveButtonClass || 'bg-emerald-600 hover:bg-[#052659]/90 shadow-sm'"
                >
                  <Spinner v-if="formStore.loading" class="w-4 h-4" />
                  <span v-else>Save</span>
                  <span v-if="formStore.loading">Saving...</span>
                </Button>
              </div>
            </div>
          </SheetFooter>
        </form>
      </div>
    </SheetContent>
  </Sheet>
</template>
<script setup lang="ts">
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, Spinner } from "@/Global";
import { Button } from "@/Global";
import { formawtacher } from "@/Global/Forminputs/formWatcher";

const formStore = formawtacher();

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    width?: string;
    showFooter?: boolean;
    saveButtonClass?: string;
  }>(),
  {
    width: "w-2/3 sm:full",
  }
);

const emit = defineEmits(["update:open", "save", "cancel", "submit"]);

const handleSave = () => {
  
  if (formStore.loading) return;
  emit("save", "create");
  emit("submit");
};

const handleCancel = () => {

  if (formStore.loading) return;
  emit("cancel");
  emit("update:open", false);
};
</script>

