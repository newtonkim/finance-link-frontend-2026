<template>
  <DialogRoot :open="show" @update:open="(v) => emit('update:show', v)">
    
    <DialogPortal>

      <!-- Overlay -->
      <DialogOverlay
        class="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm
               data-[state=open]:animate-in
               data-[state=closed]:animate-out
               data-[state=closed]:fade-out-0
               data-[state=open]:fade-in-0"
        @click="cancelDelete"
      />

      <!-- Dialog Content -->
      <DialogContent
        class="fixed left-1/2 top-1/2 z-[10000] w-full max-w-md
               -translate-x-1/2 -translate-y-1/2
               rounded-2xl bg-white p-6 shadow-2xl
               dark:bg-neutral-900 dark:border dark:border-neutral-800

               data-[state=open]:animate-in
               data-[state=closed]:animate-out
               data-[state=closed]:fade-out-0
               data-[state=open]:fade-in-0
               data-[state=closed]:zoom-out-95
               data-[state=open]:zoom-in-95
               duration-200"
      >
        <!-- Content -->
        <div class="flex items-start gap-4">
          <div
            :class="currentStyle?.color"
            class="flex h-10 w-10 items-center justify-center rounded-full"
          >
            <component :is="currentStyle?.icon" class="h-4 w-4" />
          </div>

          <div>
            <h3 class="text-[14px] font-semibold text-neutral-900 dark:text-white mb-5">
              {{ title ?? currentStyle.title }}
            </h3>

            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              <slot name="message" v-if="$slots.message" />
              <slot name="body" v-else-if="$slots.body" />
            </p>

            <div
              v-if="!$slots.message && !$slots.body"
              class="text-[12px] text-neutral-500 dark:text-neutral-200 ml-3"
            >
              {{ des ?? `Are you sure you want to delete` }}
              <strong>{{ items?.name }}</strong>?
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-6 flex justify-end gap-3">
          <DialogClose as-child>
            <button
              class="rounded-lg border border-neutral-200 px-4 py-2 text-sm
                     text-neutral-600 hover:bg-neutral-50
                     dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
          </DialogClose>

          <button
            :class="[currentStyle?.bg]"
            @click="executeDelete(items)"
            class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm
                   text-white disabled:opacity-50"
          >
            <span
              v-if="deleting"
              class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"
            />
            {{ currentStyle?.successText }}
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup>
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogClose,
} from "reka-ui";

import { ref, computed } from "vue";
import { AlertTriangle, Info, Check, Trash2 } from "lucide-vue-next";

const emit = defineEmits(["cancel", "confirm", "update:show"]);

const props = defineProps({
  type: { type: String, default: "delete" },
  title: String,
  des: String,
  items: Object,
  show: { type: Boolean, required: true },
});

const deleting = ref(false);

const styles = {
  warning: {
    icon: AlertTriangle,
    color: "text-red-600 bg-red-100",
    bg: "bg-amber-600",
    successText: "Continue",
    title: "Warning",
  },
  info: {
    icon: Info,
    color: "text-blue-600 bg-blue-100",
    bg: "bg-blue-600",
    successText: "Continue",
    title: "Information",
  },
  success: {
    icon: Check,
    color: "text-green-600 bg-green-100",
    bg: "bg-green-600",
    successText: "Confirm",
    title: "Success",
  },
  delete: {
    icon: Trash2,
    color: "text-red-600 bg-red-100",
    bg: "bg-red-600",
    successText: "Delete",
    title: "Permanent Delete",
  },
};

const currentStyle = computed(() => styles[props.type] || {});

function cancelDelete() {
  emit("cancel");
  emit("update:show", false);
}

function executeDelete(item) {
  deleting.value = true;

  emit("confirm", item);

  setTimeout(() => {
    deleting.value = false;
    emit("update:show", false);
  }, 300);
}
</script>