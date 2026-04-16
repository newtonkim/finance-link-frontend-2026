<script setup lang="ts">
import { ref } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/Global/ui/dialog'
import { Button } from '@/Global/ui/button'

const props = defineProps<{
  loan: any
}>()

const emit = defineEmits<{
  (e: 'success'): void
  (e: 'close'): void
}>()

const open = ref(false)

function show() {
  open.value = true
}

function close() {
  open.value = false
  emit('close')
}

defineExpose({
  show,
  close
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Loan Topup</DialogTitle>
      </DialogHeader>
      
      <div class="py-4">
        <p class="text-sm text-neutral-500">
          This feature is currently under development. Topup functionality will allow refinancing or topping up an existing active loan.
        </p>
      </div>

      <div class="flex justify-end gap-3">
        <Button variant="outline" @click="close">Close</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
