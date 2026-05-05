<template>
  <div :class="[gridClass, 'my-1']">
    <Card v-for="stat in (data as any[])" :key="stat.title"
      class="border-neutral-100 dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white !border-none">
      <CardContent class="p-1 px-3 flex gap-3 items-center">

        <div v-if="stat.icon"
          :class="['size-10 rounded-lg flex items-center justify-center dark:bg-white/10 shrink-0', stat.bgColor]">
          <component :is="stat.icon" :class="['size-4', stat.iconColor]" />
        </div>

        <div class="flex-1 min-w-0">
          <span class="text-xs capitalize font-medium text-neutral-500 dark:text-neutral-400 truncate block">
            {{ stat.title }}
          </span>

          <div class="flex flex-col text-sm truncate line-clamp-2">
            <span v-if="stat.value"
              class=" font-bold capitalize text-neutral-900 dark:text-white tracking-tight">
              <span v-if="stat?.type=='money'">
                {{ formatCurrency(stat.value) }}
              </span>
              <span v-else-if="stat?.type=='number'">
                {{ addNumberCommas(stat.value) }}
              </span>
              <span v-else>
                {{ stat.value }}
              </span>
              <span v-if="stat.suffix" class="ml-0.5 text-xs font-medium text-neutral-500">
                {{ stat.suffix }}
              </span>
            </span>

            <span v-if="stat.trend" :class="['text-[10px] capitalize font-semibold mt-0', stat.trendColor]">
              {{ stat.trend }}
            </span>
          </div>
        </div>

      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { addNumberCommas, Card, CardContent, formatCurrency } from '@/Global';

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  gridClass: {
    type: String,
    default: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
  }
})
</script>