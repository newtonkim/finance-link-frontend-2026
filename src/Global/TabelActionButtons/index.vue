<template>
  <div class="w-full gap-1 flex items-center justify-center">
    <Button @click="handleClick" type="button" v-bind="$attrs"
      class="flex items-center capitalize rounded-full p-0   text-xs font-medium transition-colors duration-200 hover:bg-nfuko-primary/20 dark:text-neutral-700"
      :class="[colorClasses, customClass]">
      <component v-if="icons[icon]" :is="icons[icon]" size="10" class="mx-0" />
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

    // NEW
    info: 'hover:text-cyan-600 bg-cyan-100 hover:bg-cyan-200 text-gray-500 text-sm',
    secondary: 'hover:text-gray-700 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm',
    dark: 'hover:text-white bg-gray-800 hover:bg-gray-900 text-gray-200 text-sm',
    light: 'hover:text-gray-600 bg-gray-50 hover:bg-gray-100 text-gray-500 text-sm',

    // extra useful ones
    purple: 'hover:text-purple-600 bg-purple-100 hover:bg-purple-200 text-gray-500 text-sm',
    pink: 'hover:text-pink-600 bg-pink-100 hover:bg-pink-200 text-gray-500 text-sm',
    orange: 'hover:text-orange-600 bg-orange-100 hover:bg-orange-200 text-gray-500 text-sm',
    teal: 'hover:text-teal-600 bg-teal-100 hover:bg-teal-200 text-gray-500 text-sm',
    indigo: 'hover:text-indigo-600 bg-indigo-100 hover:bg-indigo-200 text-gray-500 text-sm',

    // status-like (very useful for your table errors)
    error: 'hover:text-red-700 bg-red-200 hover:bg-red-300 text-red-700 text-sm font-medium',
    neutral: 'hover:text-neutral-600 bg-neutral-100 hover:bg-neutral-200 text-neutral-500 text-sm',
  }

  return map[props.color] || 'text-gray-600 bg-gray-100'
})

const handleClick = () => {
  emit('action', props.item)
}
</script>