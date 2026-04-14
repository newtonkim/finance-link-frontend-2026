<template>
  <div class="inline-flex">
    <button
      @click="handleClick"
      type="button"
      v-bind="$attrs"
      class="flex items-center gap-1 px-3 py-2 text-center rounded-full text-[14px] font-small text-gray-600   
             transition-all duration-200 leading-none whitespace-nowrap"
      :class="[colorClasses, customClass]"
    >
      <component
        v-if="icons[icon]"
        :is="icons[icon]"
        size="12"
        class="shrink-0"
      />
      <span class="truncate">{{ title }}</span>
    </button>
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
    primary: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
    success: 'text-green-600 bg-green-50 hover:bg-green-100',
    danger: 'text-red-600 bg-red-50 hover:bg-red-100',
    warning: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100',

    info: 'text-cyan-600 bg-cyan-50 hover:bg-cyan-100',
    secondary: 'text-gray-600 bg-gray-100 hover:bg-gray-200',
    dark: 'text-white bg-gray-800 hover:bg-gray-900',
    light: 'text-gray-500 bg-gray-50 hover:bg-gray-100',

    purple: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
    pink: 'text-pink-600 bg-pink-50 hover:bg-pink-100',
    orange: 'text-orange-600 bg-orange-50 hover:bg-orange-100',
    teal: 'text-teal-600 bg-teal-50 hover:bg-teal-100',
    indigo: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100',

    error: 'text-red-700 bg-red-100 hover:bg-red-200 font-semibold',
    neutral: 'text-neutral-600 bg-neutral-100 hover:bg-neutral-200',

    custom:
      'flex items-center gap-1   text-[11px] font-semibold rounded-full border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100',
  }

  return map[props.color] || 'text-gray-600 bg-gray-100 hover:bg-gray-200'
})

const handleClick = () => {
  emit('action', props.item)
}
</script>