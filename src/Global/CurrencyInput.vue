<script setup lang="ts">
import { ref, watch } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  modelValue: number | string | null | undefined
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

// Local display string updated synchronously on every keystroke.
// Using a ref (not a computed) avoids the async prop round-trip that
// causes commas to appear only on blur when using emit() in a setter.
const display = ref('')

watch(
  () => props.modelValue,
  (val) => {
    const num = typeof val === 'string'
      ? parseFloat(val.replace(/[^0-9.]/g, ''))
      : (val ?? NaN)
    const formatted = Number.isFinite(num) ? num.toLocaleString('en-US') : ''
    // Don't overwrite while the user is mid-type with the same numeric value
    const current = parseFloat(display.value.replace(/[^0-9.]/g, ''))
    if (current !== num) display.value = formatted
  },
  { immediate: true },
)

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const numericStr = raw.replace(/[^0-9.]/g, '')
  const num = parseFloat(numericStr)
  // Update the display ref immediately — Vue syncs the DOM in the same tick
  display.value = Number.isFinite(num) ? num.toLocaleString('en-US') : ''
  emit('update:modelValue', Number.isFinite(num) ? num : null)
}
</script>

<template>
  <input
    :value="display"
    @input="onInput"
    v-bind="$attrs"
    type="text"
    inputmode="decimal"
  />
</template>
