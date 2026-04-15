<template>
  <div ref="dropdownRef" class="relative inline-block relative group inline-block">
    <!-- Button -->
    <button @click="toggleDropdown" :class="class">
      <component :is="resolvedIcon" :size="18" />
      <div class="absolute top-full mt-2 opacity-0 group-hover:opacity-100
              transition duration-300
              bg-nfuko-primary/90 text-white text-xs px-3 py-1 rounded z-50 whitespace-nowrap">

        {{ tooltip ?? icon }}

        <div class="absolute  transform -translate-x-1/2 bottom-full border-4 border-transparent border-b-gray-900">
        </div>
      </div>
    </button>
  </div>


  <Teleport to="body">
    <div v-if="isOpen" :style="dropdownStyle"
      class="fixed nazil-here max-h-[300px] overflow-auto w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-[9999]">
      <!-- {{ items }} -->
      <ul class="py-2 text-sm text-slate-700 dark:text-slate-200">
        <li v-for="(item, index) in items" :key="index" @click="onItemClick(item)" :class="[
          'px-4 py-2 cursor-pointer rounded-lg capitalize text-sm truncate transition-colors',
          item?.danger
            ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-800'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
        ]">
          {{ item.label }}
        </li>
      </ul>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue"
import * as icons from "lucide-vue-next"

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  icon: {
    type: String,
    default: "Upload"
  },
  tooltip: {
    type: String,
    default: null
  },
  class: {
    default:
      "p-2 cursor-pointer hover:bg-nfuko-action hover:text-white hover:rounded-full hover:border hover:border-accent bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-800 hover:border-ugYellow rounded-sm transition-all"
  }
})

const emit = defineEmits(["select"])

const isOpen = ref(false)
const dropdownRef = ref(null)
const dropdownStyle = ref({})

const toggleDropdown = async () => {
  isOpen.value = !isOpen.value

  if (isOpen.value) {
    await nextTick()
    positionDropdown()
  }
}

const positionDropdown = () => {
  const rect = dropdownRef.value.getBoundingClientRect()

  const dropdownWidth = 176
  const dropdownHeight = 100
  // const dropdownHeight = 300

  const spaceBelow = window.innerHeight - rect.bottom

  let top = 0

  if (spaceBelow < dropdownHeight) {
    // show above
    top = rect.top - dropdownHeight
  } else {
    // show below
    top = rect.bottom
  }

  dropdownStyle.value = {
    top: `${top}px`,
    left: `${rect.right - dropdownWidth}px`
  }
}

const onItemClick = (item) => {
  emit("select", item)
  isOpen.value = false
}

const handleClickOutside = (event) => {
  if (
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target)
  ) {
    isOpen.value = false
  }
}

const handleScroll = () => {
  if (isOpen.value) positionDropdown()
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside)
  window.addEventListener("scroll", handleScroll, true)
  window.addEventListener("resize", handleScroll)
})

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside)
  window.removeEventListener("scroll", handleScroll, true)
  window.removeEventListener("resize", handleScroll)
})

const resolvedIcon = computed(() => {
  return icons[props.icon] || icons.Upload
})
</script>