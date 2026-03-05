<template>
    <Teleport to="body">
        <Transition name="fade">
            <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="cancelDelete"></div>
                <div
                    class="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 dark:border dark:border-neutral-800">
                    <div class="flex items-start gap-4">
                        <div
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                            <AlertTriangle :size="20" class="text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Delete Member</h3>
                            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                <slot name="message" v-if="$slots.message" />
                                <slot name="body" v-if="$slots.body" />
                                <span v-else>
                                    Are you sure you want to delete <strong
                                        class="text-neutral-700 dark:text-neutral-200"> {{ items?.name }}</strong>? This
                                    action cannot be undone.
                                </span>
                                <!-- Are you sure you want to delete <strong
                                    class="text-neutral-700 dark:text-neutral-200">{{ items?.name
                                    }}</strong>? This action cannot be undone. -->
                            </p>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button @click="cancelDelete"
                            class="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                            Cancel
                        </button>
                        <button @click="() => executeDelete(items)" :disabled="deleting"
                            class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                            <span v-if="deleting"
                                class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
<script setup>
import { ref } from 'vue';
import { AlertTriangle } from 'lucide-vue-next';
import { onMounted } from 'vue';
const emit = defineEmits(['cancel', 'confirm', 'update:show']);

const deleting = ref(false);
const memberToDelete = ref(null);
function cancelDelete() { 
    emit('update:show', false);
}

function executeDelete(member) {
    memberToDelete.value = member;
    emit('confirm', member);
    emit('update:show', false);

}

defineExpose({
    memberToDelete,
    cancelDelete,
});
const props = defineProps({
    items: Object,
    title: "Delete item",
    show: {
        default: false,
        type: Boolean,
        required: true
    }
});

</script>