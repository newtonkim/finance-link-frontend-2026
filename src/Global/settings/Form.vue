<!-- this used in more than one place -->
<template>
  <div v-if='fields?.length > 0' class="h-[90vh] overflow-y-auto">
    <div
      class="mb-1 justify-between px-0 py-1 rounded-xl dark:border-neutral-800 hover:shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:hover:shadow-sm dark:hover:border-neutral-700 capitalize  dark:bg-neutral-900   border-neutral-200  "
      v-for="(field, indx) in fields">

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
        <div v-if="field?.settings_action?.['children-fields']" class="flex flex-col items-end gap-3">
          <!-- Toggle -->
          <button type="button" @click="() => { toggleSwitchForChildren(field) }" :class="[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 shadow-sm',
            field.settings_action.action
              ? 'bg-nfuko-primary dark:bg-nfuko-yellow'
              : 'bg-neutral-300 dark:bg-neutral-700'
          ]">
            <span :class="[
              'inline-flex h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300',
              field.settings_action.action
                ? 'translate-x-5'
                : 'translate-x-1'
            ]" />
          </button>

          <!-- Children -->
          <div v-if="
            field?.settings_action?.['children-fields']?.length > 0 &&
            field.settings_action.action
          " class="w-[420px] rounded-2xl ">
            <div v-for="(childField, ci) in field.settings_action['children-fields']" :key="ci" class="space-y-2">
              <div v-if="childField?.type === 'multiselect'" class="flex flex-col gap-2">

                <!-- :defaultValues="`${childField.action}`.replace(/(?!^){{/g, ',{{').map(v => ({id: v, name: v}))" -->

                <!-- {{ childField.action.replace(/(?!^){{/g, ',{{') }}=== -->
                <MultiSearchableSelect   :defaultValues="mutipleCleanerDefaultVal(childField.action)"
                  :options="childField.options" class="w-full" @update:item-selected="
                    (v) => multiselectedOptions(v, indx, ci, field.id)
                  " />

                <p class="px-4 py-2   bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-medium border-top border-neutral-200 dark:border-neutral-700"
                  v-if="(childrenValues?.[field?.id]?.['settings_action']?.['children-fields'] || field.settings_action['children-fields']?.[ci]?.action)">
                  Code Display Template: <br />
                  <input type="text" @change="(v) => changeInMultipleSelectValue(v, ci, field)" class="w-full rounded border px-2 py-1 text-sm" 
                  :value="((childrenValues[field.id]?.['settings_action']?.['children-fields']?.[ci]?.action ?? 
                  field.settings_action['children-fields']?.[ci]?.action))" />


                </p>
                <div class="w-full flex justify-end bg-neutral-100 dark:bg-neutral-800">
                  <!-- {{ childrenValues?.[field?.id]?.['settings_action']?.['children-fields']?.[ci]?.action }} -->
                  <Button
                    class="prounded-full w-[90px] p-2 rounded-md m-2   bg-nfuko-accent text-neutral-700 dark:text-neutral-200 text-xs font-medium border border-neutral-200 dark:border-neutral-700"
                    @click="() => storeLocalChanages(field.id, childrenValues?.[field?.id], { ...(childrenValues?.[field?.id] ?? field), id: field.id },)">
                    save {{ childrenValues?.[field?.id]?.action }}
                  </Button>
                </div>

              </div>
            </div>
          </div>
        </div>
        <button v-else
          class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-300"
          type="button"
          @click="() => storeLocalChanages(field.id, String(field.settings_action.action = !field.settings_action.action), field,)"
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
  <div v-else>
    <p class="text-center text-sm text-neutral-400">
      <EmptySvg />

    </p>
  </div>
  <ConfirmDialog type='warning' v-model:show="showDelete.show" @confirm="() => confirmAndSaveChanges()">
    <template #body>
      {{ showDelete.warning }}
    </template>

  </ConfirmDialog>
</template>
<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from "vue";
import { appendOnAjsonStore, ConfirmDialog, createUrl, EmptySvg, fetchTableData, keysToUse } from "..";
import { pomPinia } from 'septor-store';
import MultiSearchableSelect from "../MultiSearchableSelect.vue";
const childrenValues = ref<any>({});

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
    required: true,

  },
  inputClass: {
    type: String,
    required: true,

    default: 'w-[13em] rounded-lg border focus:border-nfuko-primary/50 focus:ring-1    bg-white px-2 py-1 text-sm outline-none transition  border-nfuko-primary/10 focus:ring-1 focus:ring-bg-nfuko-primary/90 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-[#8ba8a2]/90 dark:focus:ring-[#8ba8a2]/90',
  },
});

const fields = computed(() => {
  const theListData = stateGenerator(props?.outerlinks?.['list'] ?? props?.state ?? "settings-list");
  return Object.values((Store as any)[theListData]?.payload ?? {}) as any[]
})
const emit = defineEmits(["update:modelValue"]);
const internalValue = ref(props.modelValue);
const showDelete = ref({ show: false, warning: "" });
const collectedData = ref<any>({});
const defa = ref<any>({});

watch(internalValue, (val) => {
  emit("update:modelValue", val);
});
function storeLocalChanages(id: string, value: string, action: string) {

  // console.log(action);
  // return

  collectedData.value = action
  showDelete.value = {
    warning: (action as any)?.actiondescription,
    show: !showDelete.value.show
  }

}
async function confirmAndSaveChanges(data?: any) {

  const customeUrl = props?.outerlinks?.['create'] ?? "save-changed-settings";
  const { id, settings_action } = collectedData.value
  console.log(collectedData.value);
  // return


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
  if (res.payload) {
    storeSettings(Object.values(res.payload))
      ; (Store as any).fullRemount = Math.random()


  }
}

function storeSettings(useStoreAlltheGotSettings: any[]) {
  const newsettings = {}
  useStoreAlltheGotSettings.forEach((value: any, index: number) => {
    (newsettings as any)[value.name] = value?.['settings_action']?.['action'] ?? value;
  })
  console.log({ newsettings });

  appendOnAjsonStore({ data: newsettings, key: keysToUse.systemSettings })
}

function formatName(name: string) {
  return name.replace(/-/g, " ");
}
function stateGenerator(name: string) {
  return `${name}`.replace(/\W+/g, "-");
}
async function intializetheData() {
  // const customeUrl = props?.outerlinks?.['list'] ?? null //?? "settings-list";
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
  console.log(res);
  if (res?.payload) {

    storeSettings(Object.values(res.payload))
  }
}
onMounted(() => {
  nextTick(() => {
    intializetheData()
  })

});
function multiselectedOptions(value: any, parentIndex: any, childIndex: any, settingId) {

  fields.value[parentIndex]['settings_action']['action'] = true
  fields.value[parentIndex]['settings_action']['children-fields'][childIndex].action = value.map(v => (v.id)).join(',')

  childrenValues.value[settingId] = fields.value[parentIndex]
}
const codeSequnceCustom = (val) => val.replace(/[{}]/g, "");



function toggleSwitchForChildren(field: any) {
  field.settings_action.action = !field.settings_action.action
  // console.log(field.settings_action.action);
  if (field.settings_action.action == false) {
    storeLocalChanages(field.id, childrenValues?.[field?.id], field,)
  }

}

function mutipleCleanerDefaultVal(text: string) {
  if(!text) return
  const maker = text.replace(/}}\s*.*?\s*{{/g, '}},{{')
  console.log(maker);
  
  if (text.includes('{{') && text.includes('}}'))
    return maker.split(',').map(v => ({ id: v, name: v.replace(/[^a-zA-Z0-9]/g, '') }))
  else {
    return maker.split(',').map(v => ({ id: v, name: v }))

  }

}

function changeInMultipleSelectValue(v, ci, field) {
  const value = v?.target?.value ?? '';
  childrenValues.value[field.id]= {['settings_action']:{}};
  childrenValues.value[field.id].settings_action['children-fields'] ??= [];
  childrenValues.value[field.id].settings_action['children-fields'][ci] ??= {};

  childrenValues.value[field.id]={
    "settings_action":{
      ...field.settings_action,
      
    }
  }
   childrenValues.value[field.id].settings_action['children-fields'][ci].action = value
    
}

</script>