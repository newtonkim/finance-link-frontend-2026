<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Spinner } from '@/Global'

defineProps<{
  open: boolean
  accountNo?: string
  deleting: boolean
  error?: string
}>()

const emit = defineEmits<{
  'update:open': [v: boolean]
  confirm: []
}>()
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-sm !bg-white dark:!bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl">
      <DialogHeader>
        <DialogTitle>Delete Savings Account</DialogTitle>
      </DialogHeader>
      <p class="text-sm text-neutral-600 dark:text-neutral-400">
        Are you sure you want to delete account
        <span class="font-semibold text-neutral-900 dark:text-white">{{ accountNo }}</span>?
        This action cannot be undone.
      </p>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <DialogFooter class="flex justify-end gap-2 pt-2">
        <button
          @click="emit('update:open', false)"
          class="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="emit('confirm')"
          :disabled="deleting"
          class="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          <Spinner v-if="deleting" class="h-4 w-4" />
          Delete
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
