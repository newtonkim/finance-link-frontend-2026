<script setup lang="ts">
import { computed } from 'vue'
import { Plus } from 'lucide-vue-next'

const props = defineProps<{
  accountType: 'ASSET' | 'INCOME'
  parentGlCode: string
  label?: string
}>()

const emit = defineEmits<{
  (e: 'click', payload: { accountType: 'ASSET' | 'INCOME'; parentGlCode: string }): void
}>()

const displayLabel = computed(() => {
  if (props.label) return props.label
  const typeWord = props.accountType.toLowerCase()
  return `Create new ${typeWord} account`
})

function onClick() {
  emit('click', { accountType: props.accountType, parentGlCode: props.parentGlCode })
}
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1 text-xs font-semibold text-nfuko-primary hover:underline"
    @click="onClick"
  >
    <Plus class="size-3.5" />
    <span>{{ displayLabel }}</span>
  </button>
</template>
