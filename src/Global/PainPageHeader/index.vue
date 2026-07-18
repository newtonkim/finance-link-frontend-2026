<template>
  <div  >
    <h1 class="text-3xl font-black dark:text-white tracking-tight"
      :class="titleColor ? '' : 'text-[#0050D8]'"
      :style="titleColor ? { color: titleColor } : undefined">
      {{ title }}
    </h1>

    <p class="text-sm text-neutral-500 max-w-lg py-2">
      {{ dec }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title?: string
  dec?: string
  titleColor?: string
}>()
</script>