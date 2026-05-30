<template>
  <div  >
    <h1 class="text-3xl font-black text-[#0050D8] dark:text-white tracking-tight">
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
}>()
</script>