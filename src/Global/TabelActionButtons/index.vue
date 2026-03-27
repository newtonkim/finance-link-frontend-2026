<template>
  <div class="w-full gap-2 flex items-center justify-center">
    <Button
      @click="handleClick"
      class="flex items-center capitalize rounded-full p-2   text-xs font-bold transition-colors duration-200 hover:bg-nfuko-primary/20 dark:text-neutral-700"
      :class="[colorClasses, customClass]"
    >
      <component
        v-if="icons[icon]"
        :is="icons[icon]"
        size="13"
        class="mx-2"
      />
      {{ title }}
    </Button>
  </div>
</template>

<script setup>
import * as icons from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  item: Object,
  icon: String,
  title: String,
  color: String,        
  customClass: String,  
})

const emit = defineEmits(['action'])

const colorClasses = computed(() => {
  const map = {
    primary: 'hover:text-blue-600 bg-blue-100 hover:bg-blue-200 text-gray-500 text-sm',
    success: 'hover:text-green-600 bg-green-100 hover:bg-green-200 text-gray-500 text-sm',
    danger: 'hover:text-red-500 bg-red-100 hover:bg-red-200 text-gray-500 text-sm',
    warning: 'hover:text-yellow-600 bg-yellow-100 hover:bg-yellow-200 text-gray-500 text-sm',
  }

  return map[props.color] || 'text-gray-600 bg-gray-100'
})

const handleClick = () => {
  emit('action', props.item)
}
</script>