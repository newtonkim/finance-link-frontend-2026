<template>
  <div v-if='fields?.length > 0' class="">

    <div class="mb-4 " v-for="field in fields">

      <label :for="field.name" class="block font-medium capitalize">{{ field.label }}</label>
      <div v-if="field.settings_action.attr === 'switch'"
        class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
        <div>
          <p class="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200 capitalize">
            {{ formatName(field.name) }}
          </p>
          <p class="text-[11px] text-neutral-400 mt-0.5 capitalize">
            {{ field.description }}
          </p>
        </div>
        <button
          @click="() => storeLocalChanages(field.id, field.settings_action.action = !field.settings_action.action, field,)"
          :class="[
            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-300',
            field.settings_action.action ? ' bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'
          ]">
          <span :class="[
            'inline-flex h-4 w-4 rounded-full bg-white shadow transition-transform duration-300',
            field.settings_action.action ? 'translate-x-4' : 'translate-x-0.5'
          ]" />
        </button>
      </div>

      <!-- Text / Number Input -->
      <div v-else-if="['text', 'number'].includes(field.settings_action?.attr)"
        class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 capitalize">
        <div>
          <p class="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
            {{ formatName(field.name) }}
          </p>
          <p class="text-[11px] text-neutral-400 mt-0.5">
            {{ field.description }}
          </p>
        </div>
        <input @change="() => storeLocalChanages(field.id, field.settings_action.action, field,)"
          :type="field.settings_action.attr" v-model="field.settings_action.action" :class="inputClass"
          class="p-2 rounded border" />
      </div>
    </div>
  </div>
  <ConfirmDialog v-model:show="showDelete.show" @confirm="() => confirmAndSaveChanges()">
    <template #body>
      {{ showDelete.warning }}

    </template>

  </ConfirmDialog>
</template>
<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { appendOnAjsonStore, ConfirmDialog, createUrl, fetchTableData, keysToUse } from "..";
import { pomPinia } from 'septor-store';
import SystemSettings from "@/tenant/modules/settings/pages/SystemSettings.vue";
const Store = pomPinia();

const props = defineProps({
  outerlinks: {

  },
  url: {
    type: String,
    required: true,
  },

  modelValue: {
    type: [Boolean, String, Number],
    default: null,
  },
  inputClass: {
    type: String,
    default: 'w-[13em] rounded-lg border focus:border-nfuko-primary/50 focus:ring-1    bg-white px-2 py-1 text-sm outline-none transition  border-nfuko-primary/10 focus:ring-1 focus:ring-bg-nfuko-primary/90 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-[#8ba8a2]/90 dark:focus:ring-[#8ba8a2]/90',
  },
});

const fields = computed(() => Object.values(Store['member-onboarding-settings-list']?.payload ?? {}))
const emit = defineEmits(["update:modelValue"]);
const internalValue = ref(props.modelValue);
const showDelete = ref({ show: false, warning: "" });
const collectedData = ref({});

watch(internalValue, (val) => {
  emit("update:modelValue", val);
});
function storeLocalChanages(id: string, value: string, action: string) {
  collectedData.value = action
  showDelete.value = {
    warning: action?.actiondescription,
    show: !showDelete.value.show
  }

}
async function confirmAndSaveChanges(data: any) {
  const customeUrl = props?.outerlinks?.['create'] ?? "save-changed-settings";
  const { id, settings_action } = collectedData.value
  const res = await fetchTableData({
    data: { id, settings_action },
    props: {
      ...props,
      state: props?.state + "_" + customeUrl,
      url: createUrl(props?.url, customeUrl)
    }, Store
  });
  const newsettings = {
    name: collectedData.value.name
    , settings_action: collectedData.value.settings_action
  }
  appendOnAjsonStore({ data: newsettings, key: keysToUse.systemSettings })
}


function formatName(name: string) {
  return name.replace(/-/g, " ");
}

</script>