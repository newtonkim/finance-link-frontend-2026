<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { MultiSearchableSelect, StatusButtonsHorizontal } from '@/Global'
import Button from '@/Global/ui/button/Button.vue';
import { loanApplicationsApi2 } from '@/tenant/apis/loans';
import GuatorsListWithType from './GuatorsListWithType.vue';
const { saveLoanApplicationGuarantors } = loanApplicationsApi2()
const props = defineProps<{
  application: any
}>()
const emit = defineEmits<{
  updated: [value: any[]]
}>()
const statusFilter = ref<string>('Group')
const guarantors = ref<Record<string, any>>({})
const selected = ref<any[]>([])
const memberSelected = ref<any[]>([])
const filters = ['Group', 'Individual']
function getLabel(item: any) {
  return item?.name || ''
}
function handleSelected(item: any) {
  const type = statusFilter.value === 'Group' ? 'group' : 'individual'
  for (const i of item) {
    guarantors.value[`${i.id}-${type}`] = {
      ...i,
      type
    }
  }
  // emit('updated', Object.values(guarantors.value))
}
const filteredGuarantors = computed(() => {
  const data = Object.values(guarantors.value)
  return data
})
watch(statusFilter, (val) => {
  if (val === 'Group') {
    selected.value = []
  } else {
    memberSelected.value = []
  }
})
async function saveLoanGuarantors() {
  await saveLoanApplicationGuarantors({
    application_id: props.application.id,
    guarantors: Object.values(guarantors.value)
  })

  emit('updated', 1)
}
</script>
<template>
  <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <!-- Header -->
    <div class="mb-5 flex items-center justify-between">
      <div>
        <h3 class="text-[14px] font-semibold text-neutral-900 dark:text-white">
          Add Guarantors
        </h3>
        <p class="text-xs text-neutral-500 mt-1 text-gray-400 text-sm">
          groups,individuals on loan
        </p>
      </div>

    </div>

    <!-- Toggle -->
    <StatusButtonsHorizontal :filters="filters" v-model="statusFilter" />

    <!-- Select Area -->
    <div class="mt-5 space-y-3">
      <MultiSearchableSelect v-if="statusFilter === 'Group'" v-model="selected" :url="application?.group_memberships === 'allowed_to_be_guaranteed_by_other_groups'
        ? 'group-account-savings/groups-drop-down-list'
        : undefined
        " :options="application?.group_memberships !== 'allowed_to_be_guaranteed_by_other_groups'
          ? application?.group_memberships
          : undefined
          " placeholder="Select groups" @update:itemSelected="handleSelected" />

      <MultiSearchableSelect v-else v-model="memberSelected" url="global/member-dropdown-list"
        placeholder="Select members" @update:itemSelected="handleSelected" />
    </div>

    <!-- Selected Guarantors -->
    <div v-if="filteredGuarantors.length" class="mt-6">
      <div class="flex flex-col justify-between mb-2">
        <GuatorsListWithType title="Selected Guarantors" :items="filteredGuarantors"
          empty-text="No guarantors added yet" label-key="name" type-key="type" />
        <br>

        <Button type="button" @click="saveLoanGuarantors"
          class="px-3 py-1 text-xs font-medium bg-nfuko-primary-600 text-white rounded-md hover:bg-nfuko-primary-700 active:scale-95 transition">
          Save
        </Button>
      </div>

    </div>

    <div v-else class="mt-4 text-xs text-neutral-400 italic">
      No guarantors selected
    </div>

    <!-- Divider -->
    <div class="my-6 border-t border-neutral-200 dark:border-neutral-800"></div>

    <!-- Current Guarantors -->
    <GuatorsListWithType title="Current Guarantors" :items="application?.loan_guarantors"
      empty-text="No guarantors added yet" label-key="name" type-key="type" />

    <div v-if="application?.loan_guarantors && application?.loan_guarantors.length ==0" class="mb-1 flex animate-pulse items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950/40 mt-4 text-[10px] text-neutral-400  dark:text-neutral-500 text-red-500 capitalize">
       This loan application currently has no guarantors.
      guarantors are Required for this loan application. Please add guarantors before submitting the application.
    </div>
  </div>
</template>