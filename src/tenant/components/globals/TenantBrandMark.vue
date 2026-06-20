<script setup lang="ts">
/**
 * Renders a tenant's logo when available, otherwise a clean initials monogram
 * tinted with the tenant's accent colour. Sizing is controlled by the parent
 * via the wrapping element; this component fills it (size-full).
 */
withDefaults(
  defineProps<{
    logoUrl?: string | null
    initials?: string
    accent?: string
    /** Tailwind text-size class for the monogram initials, e.g. "text-4xl". */
    textClass?: string
  }>(),
  {
    logoUrl: null,
    initials: '',
    accent: '#052659',
    textClass: 'text-xl',
  },
)
</script>

<template>
  <img v-if="logoUrl" :src="logoUrl" alt="Tenant logo" class="size-full object-contain" />
  <div
    v-else
    class="size-full flex items-center justify-center font-black tracking-tight text-white select-none"
    :class="textClass"
    :style="{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }"
  >
    {{ initials }}
  </div>
</template>
