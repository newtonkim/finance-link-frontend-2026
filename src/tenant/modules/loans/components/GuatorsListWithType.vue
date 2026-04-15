<script setup lang="ts">
import { formatCurrency, Modal } from '@/Global';
import { HandCoins } from 'lucide-vue-next';
import { ref } from 'vue';
import FormField from '@/Global/FormField.vue';
import MoneyInput from '@/Global/MoneyInput.vue';
const emit = defineEmits(['select', 'action'])
const props = withDefaults(
  defineProps<{
    title: string
    items: any[]
    emptyText?: string
    labelKey?: string
    typeKey?: string
    actionKey?: string
  }>(),
  {
    emptyText: 'No items available',
    labelKey: 'name',
    typeKey: 'type',
  }
)
const modalOpen = ref({ show: false, item: {} })
function getValue(item: any, key: string) {
  return item?.[key] ?? ''
}
function actionClick(index: any) {
  modalOpen.value = { show: !modalOpen.value.show, index }
}
</script>
<template>
  <div class="">
    <h4 class="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
      {{ title }}
    </h4>
  <div v-if="items?.length" class="space-y-2">
  <div
    v-for="(item, index) in items"
    :key="index"
    @click="() => {
      if (actionKey === 'show') return
      item.action = actionKey
      actionClick(index)
    }"
    class="group flex items-center justify-between px-4 py-2 rounded-xl 
           bg-white dark:bg-neutral-900 
           border border-neutral-200 dark:border-neutral-800
           hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700
           transition-all duration-200 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:hover:shadow-md dark:hover:border-neutral-700  capitalize"
  >
    <div class="flex flex-col min-w-0">
      <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate text-[12px]">
        {{ getValue(item, labelKey) }}
      </span>
      <span class="text-[10px] text-neutral-400 dark:text-neutral-500">
        {{ getValue(item, typeKey) }}
      </span>
    </div>

    <div class="flex flex-col items-end gap-1">
      <div
        v-if="item.contribution > 0"
        class="text-[10px] font-semibold text-nfuko-action"
      >
        {{ formatCurrency(item.contribution) }}
      </div>

      <div
        v-else-if="actionKey !== 'show'" 
        class="flex items-center gap-1 text-xs text-nfuko-yellow 
               opacity-80 group-hover:opacity-100 transition"
      >
        <HandCoins class="h-4 w-4" />
        <span class="hidden sm:inline">Contribute</span>
      </div>
    </div>
  </div>
</div>
    <div v-else class="text-xs text-neutral-400 italic">
      {{ emptyText }}
    </div>
  </div>
  <Modal v-model="modalOpen.show" :title="'Contribute from ' + getValue(items[modalOpen.index], labelKey)">
    <template #body>
      <FormField>
        <label>Amount</label>
        <div class="flex">
          <MoneyInput v-model="items[modalOpen.index].contribution" />
        </div>
      </FormField>
    </template>
  </Modal>
</template>