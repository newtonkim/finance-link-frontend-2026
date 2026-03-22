<template>
  <div v-if="show" class="fixed inset-0 z-[9999] flex items-center justify-center">

    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm z-[9998]" @click="cancelDelete"></div>

    <!-- Dialog -->
    <div
      class="relative z-[9999] w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 dark:border dark:border-neutral-800">

      <div class="flex items-start gap-4">
        <div 
        :class="currentStyle?.color"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ">
      <component
  :is="currentStyle?.icon"
  class="h-4 w-4"
 />
        </div>
        <div>
          <h3 class="text-base font-semibold text-neutral-900 dark:text-white">{{ title??currentStyle.title }}</h3>
          <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            <slot name="message" v-if="$slots.message" />
            <slot name="body" v-if="$slots.body" />
            <span v-else>
              Are you sure you want to delete <strong class="text-neutral-700 dark:text-neutral-200">{{ items?.name
                }}</strong>? This action cannot be undone.
            </span>
          </p>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3" >
        <button type="button" @click="cancelDelete"
          class="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Cancel
        </button>

        <button         :class="[  currentStyle?.bg,  currentStyle?.color]"
        type="button" @click="() => executeDelete(items)" :disabled="deleting"
          class="flex items-center gap-2 rounded-lg  px-4 py-2 text-sm font-medium text-white   transition-colors disabled:opacity-50">
          <span v-if="deleting" class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
          {{  currentStyle?.successText }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref,computed } from 'vue'; 
import { AlertTriangle, Info, Check ,Trash2} from 'lucide-vue-next'
const emit = defineEmits(['cancel', 'confirm', 'update:show']);

const deleting = ref(false);
const memberToDelete = ref(null);
const currentStyle = computed(() => ACtionStyle.value[props.type] || {})
const ACtionStyle = ref({
  warning: {
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    successText: "Continue",
    bg: "bg-red-100 dark:bg-red-900/30",
    title: "Warning"
  },
  info: {
    icon: Info,
    color: "text-blue-600 dark:text-blue-400",
    successText: "Continue",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    title: "information"

  },
  success: {
    icon: Check,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-700 dark:bg-green-900/30",
    successText: "Confirm",
    title: "success"

  },
  delete: {
    icon: Trash2,
    color: "text-red-600 dark:text-red-400 bg-red-500 text-white",
    successText: "Delete",
    bg: "bg-red-100 dark:bg-red-900/30",
    title: "Warning Deleted Item Will be Permanently Deleted"
  }
})

function cancelDelete() {
  emit('update:show', false);
  emit('cancel');
}

function executeDelete(member) {
  memberToDelete.value = member;
  emit('confirm', member);
  emit('update:show', false);
}

defineExpose({
  memberToDelete,
  cancelDelete,
  executeDelete
});

const props = defineProps({
  type: {
    type: String,
    default: "delete"
  },
  items: Object,
 
 
  title: { type: String, },
  show: { type: Boolean, default: false, required: true }
});
</script>