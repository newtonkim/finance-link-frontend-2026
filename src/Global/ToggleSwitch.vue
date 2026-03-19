<script setup lang="ts">
defineProps<{ value: boolean; loading?: boolean; disabled?: boolean }>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    @click="$emit('toggle')"
    :disabled="loading || disabled"
    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
    :style="value ? 'background-color: var(--color-nfuko-primary)' : 'background-color: #d1d5db'"
  >
    <span
      class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200"
      :class="value ? 'translate-x-4' : 'translate-x-0'"
    />
  </button>
</template>
