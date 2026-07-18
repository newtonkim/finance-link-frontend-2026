<template>
  <Sheet :open="props.open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="right"
      :class="[
        props.width,
        'bg-gray-50 dark:bg-neutral-900',
        'p-0',
        'transition-all duration-300 ease-in-out',
        props.open ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
      ]"
      @click.stop
    >
      <SheetHeader class="shrink-0 px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <SheetTitle class="text-xl font-bold text-neutral-900 dark:text-white capitalize">
          <span>
            <span v-html='props?.title.toLocaleLowerCase()'></span>
          </span>
          
        </SheetTitle>
      </SheetHeader>
      <div class="w-full min-w-0 flex-1 overflow-hidden">
        <form @submit.prevent="handleSave" class="flex h-full min-h-0 w-full min-w-0 flex-col">
          <div
            class="flex-1 min-h-0 px-5 py-4 overflow-y-auto overflow-x-hidden w-full min-w-0"
          >
            <!-- class="px-4 py-1 border-b border-neutral-100 dark:border-neutral-800 max-h-[calc(100vh-150px)] overflow-y-auto overflow-x-hidden" -->
            <slot name="body" />
          </div>
          <SheetFooter
            v-if="props.showFooter"
            class="shrink-0 z-50 border-t border-neutral-100 p-4 dark:border-neutral-800 bg-white dark:bg-neutral-900"
          >
            <div v-if="$slots.actions">
              <slot name="actions"></slot>
            </div>

            <div v-else class="flex w-full items-center justify-between gap-3">
              <div class="w-36">
                <Button
                  variant="outline"
                  type="button"
                  :disabled="isSaving"
                  class="h-10 w-full font-bold border-neutral-200 dark:border-neutral-800"
                  @click="()=>handleCancel()"
                >
                  {{ props.cancelButtonText }}
                </Button>
              </div>

              <div class="w-36">
                <Button
                  type="submit"
                  :disabled="isSaving || props.saveDisabled"
                  :title="props.saveDisabledTitle"
                  class="h-10 w-full font-bold text-white transition-colors flex items-center justify-center gap-2"
                  :class="props.saveButtonClass || 'bg-emerald-600 hover:bg-[#052659]/90 shadow-sm'"
                >
                  <Spinner v-if="isSaving" class="w-4 h-4" />
                  <span v-else>{{ props.saveButtonText }}</span>
                  <span v-if="isSaving">{{ props.saveLoadingText }}</span>
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
import { computed } from "vue";

const formStore = formawtacher();

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    width?: string;
    showFooter?: boolean;
    saveButtonClass?: string;
    saveButtonText?: string;
    cancelButtonText?: string;
    saveLoadingText?: string;
    loading?: boolean;
    saveDisabled?: boolean;
    saveDisabledTitle?: string;
  }>(),
  {
    width: "w-full sm:max-w-[520px]",
    showFooter: true,
    saveButtonText: "Save",
    cancelButtonText: "Cancel",
    saveLoadingText: "Saving...",
    loading: false,
    saveDisabled: false,
    saveDisabledTitle: "",
  }
);

const emit = defineEmits(["update:open", "save", "cancel", "submit"]);
const isSaving = computed(() => props.loading || formStore.loading);

const handleSave = () => {
  
  if (isSaving.value || props.saveDisabled) return;
  emit("save", "create");
  emit("submit");
};

const handleCancel = () => {

  if (isSaving.value) return;
  emit("cancel");
  emit("update:open", false);
};
</script>
