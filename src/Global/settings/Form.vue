<!-- this used in more than one place -->
<template>
  <div v-if='fields?.length > 0' class="h-[90vh] overflow-y-auto">
    <div
      class="mb-1 justify-between px-0 py-1 rounded-xl dark:border-neutral-800 hover:shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:hover:shadow-sm dark:hover:border-neutral-700 capitalize  dark:bg-neutral-900   border-neutral-200  "
      v-for="field in fields">

      <div>

        <label :for="field.name" class="block font-medium capitalize">{{ field.label }}</label>

      </div>
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
        <button class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-300"
          type="button"
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
  <ConfirmDialog type='warning' v-model:show="showDelete.show" @confirm="() => confirmAndSaveChanges()">
    <template #body>
      {{ showDelete.warning }}
    </template>

  </ConfirmDialog>
</template>
<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from "vue";
import { appendOnAjsonStore, ConfirmDialog, createUrl, fetchTableData, keysToUse } from "..";
import { pomPinia } from 'septor-store';
const Store = pomPinia();

const props = defineProps({
  from: {
    type: String,
    required: false
  },
  outerlinks: {
    type: Object,
    required: false
  },
  state: {
    type: String,
    required: false,
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

const fields = computed(() => {
  const theListData = stateGenerator(props?.outerlinks?.['list'] ?? props?.state ?? "settings-list");
  return Object.values(Store[theListData]?.payload ?? {})
})
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
  const url = createUrl(props?.url, customeUrl)
  const generateAstate = props?.state ?? `${url}`.replace(/[^a-zA-Z0-9]/g, "-");

  const res = await fetchTableData({
    data: { id, settings_action, from: props?.from },
    props: {
      ...props,
      state: generateAstate,
      url: url
    }, Store
  });
  if (res.payload)
    storeSettings(Object.values(res.payload))
}

function storeSettings(useStoreAlltheGotSettings) {
  const newsettings = {}
  useStoreAlltheGotSettings.forEach((value: any, index: number) => {
    newsettings[value.name] = value?.['settings_action']?.['action'] ?? value;
  })
  appendOnAjsonStore({ data: newsettings, key: keysToUse.systemSettings })
}

function formatName(name: string) {
  return name.replace(/-/g, " ");
}
function stateGenerator(name: string) {
  return `${name}`.replace(/\W+/g, "-");
}
async function intializetheData() {
  const customeUrl = props?.outerlinks?.['list'] ?? null //?? "settings-list";
  // const state = createUrl(props?.url, customeUrl);
  const theListData = stateGenerator(props?.outerlinks?.['list'] ?? props?.state ?? "settings-list");
  const res = await fetchTableData({
    data: {},
    props: {
      ...props,
      state: theListData,
      url: props?.url
    }, Store
  });
  if (res.payload) {
    console.log(res.payload);

    storeSettings(Object.values(res.payload))
  }
}
onMounted(() => {
  nextTick(() => {
    intializetheData()
  })

});


</script>