<script setup lang="ts">
import { onMounted } from 'vue'
import { Settings2, X } from 'lucide-vue-next'
import { Spinner, Label } from '@/Global'
import { useGeneralLoanSettings } from '../composables/useGeneralLoanSettings'

const { showDrawer, loading, saving, form, fetchSettings, openDrawer, closeDrawer, save } =
  useGeneralLoanSettings()

onMounted(() => {
  void fetchSettings()
})

defineExpose({ openDrawer })
</script>

<template>
      <div class="flex h-[90vh] flex-col">
           

            <div class="flex-1 overflow-y-auto px-6   ">
              <div v-if="loading" class="flex items-center justify-center py-10">
                <Spinner class="h-8 w-8 text-neutral-400" />
              </div>

              <div v-else class="space-y-6">
                <div class="space-y-3">
                  <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300"
                    >Approval Workflow</Label
                  >
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-medium text-neutral-500 mb-1">Minimum Approvers</label>
                      <input
                        v-model.number="form.min_approvers"
                        type="number"
                        min="1"
                        class="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-neutral-500 mb-1">Maximum Approvers</label>
                      <input
                        v-model.number="form.max_approvers"
                        type="number"
                        min="1"
                        class="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800"
                      />
                    </div>
                  </div>
                </div>

                <div class="space-y-4">
                  <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Feature Toggles</Label>

                  <label class="flex items-center gap-3">
                    <input
                      v-model="form.allow_top_up"
                      type="checkbox"
                      class="h-4 w-4 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-bg-nfuko-yellow"
                    />
                    <span class="text-sm text-neutral-700 dark:text-neutral-300">Allow Loan Top-Ups</span>
                  </label>

                  <label class="flex items-center gap-3">
                    <input
                      v-model="form.allow_reschedule"
                      type="checkbox"
                      class="h-4 w-4 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-bg-nfuko-yellow"
                    />
                    <span class="text-sm text-neutral-700 dark:text-neutral-300">Allow Loan Rescheduling</span>
                  </label>

                  <label class="flex items-center gap-3">
                    <input
                      v-model="form.auto_penalty"
                      type="checkbox"
                      class="h-4 w-4 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-bg-nfuko-yellow"
                    />
                    <span class="text-sm text-neutral-700 dark:text-neutral-300">Apply Auto Penalties</span>
                  </label>
                </div>
              </div>
            </div>


            <div  class="flex w-full gap-2   items-center justify-between">
              <div class="w-1/3 ">
                <Button
                  variant="outline"
                  class="flex-1 h-11 w-full mx-2 font-bold border-neutral-200 dark:border-neutral-800"
                  @click="closeDrawer"
                >
                  Close
                </Button>
              </div>

              <div class="w-1/3 ">
                <!-- @click="handleSave" -->
                <Button
                  type="submit"
                    :disabled="saving"
                @click="save"
                  class="flex-1 h-11  mr-5 w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                >
                <Spinner v-if="saving" class="h-4 w-4" />

                  Save
                </Button>
              </div>
            </div> 
          </div>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.25s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
