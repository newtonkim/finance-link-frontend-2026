<template>
  <div :title="String(show ?? copy)" v-if="show ?? copy" class="w-full flex items-center justify-between   bg-white dark:bg-neutral-900 rounded-lg ">
    <div class="flex-1 min-w-0">
      <p class="text-sm text-neutral-500 dark:text-neutral-200 truncate line-clamp-2" :class="props.class">
        <slot v-if="$slots['text']" name="text" :item="show ?? copy" />
        <span v-else>
          {{ show ?? copy }}
        </span>
      </p>
    </div>

    <Button @click="handleCopy" 
      class="flex items-center justify-center p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
      title="Copy" type="button">
      <Copy class="h-4 w-4 text-neutral-500 hover:text-nfuko-primary" />
    </Button>

  </div>
</template>

<script setup lang="ts">
import { copyToClipboard } from '@/Global'
import { Copy } from 'lucide-vue-next'
const props = defineProps({
  class: { type: String, required: false },
  show: { type: String, required: false },
  copy: { type: [String, Number, Object], required: false },
})
const handleCopy = () => {
  copyToClipboard(String(props.copy ?? props?.show))
}
</script>
  // appendOnAjsonStore({ data: newsettings, key: keysToUse.systemSettings })
