<template>
  <div  >
    <h1 class="text-3xl font-black text-[#0A2318] dark:text-white tracking-tight">
      {{ title }}
    </h1>

    <p class="text-sm text-neutral-500 max-w-lg py-4">
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