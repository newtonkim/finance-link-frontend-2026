
<template>
  <div  class="card shadow-md p-4 py-10 bg-white dark:bg-neutral-800 rounded-md">
    <span v-if='loading'></span>
    <Form :action="data?.action" v-else parentStyle="grid  grid-cols-1 gap-4 md:gap-6" v-model:form="fields" /> 
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch } from 'vue';
import { Form, getSystemSetting, pickAsettingKeyValue } from '@/Global'; 
const emits = defineEmits(['update:form']),
loading = ref(true), settingList = ref({}) ,
yesNoOptions =  [{ id: 1, name: 'Yes' }, { id: "0", name: 'No' }],
 props = defineProps({
  data: {
    type: Object,
    default: {},
  },
}), fields = ref([
  {
    label: 'Member',
    name: 'member',
    type: 'select',
    required: true,
    url:"members/member-dropdown-list",
    placeholder: 'select a member',
        dataOnMount: true,
  },
  {
    label: 'charges',
    name: 'charges',
    type: 'select',
    required: true,
    options: [],
    placeholder: 'Enter charges', 
  },
  {
    label: 'savings product',
    name: 'product_id',
    type: 'select',
    required: true,
    options: [],
    placeholder: 'Enter a savings product',
  url: "global/savings-products",
      dataOnMount: true,

  },
  {
    label: 'is New Account',
    name: 'new_account',
    type: 'select',
    required: true,
    options: yesNoOptions,
    placeholder: 'Enter is New Account',   
  },
  {
    label: 'Status',
    name: 'Status',
    type: 'select',
    value:"active",
    required: true,
    options: [{id:"active",name:"active"},{name:"dormant",id:"dormant"}],
    placeholder: 'Enter account Status',
  },
  {
    label: 'consider Minimun Balance',
    name: 'cm_balance',
    type: 'select',
    required: true,
    options: yesNoOptions,
    placeholder: 'Enter consider Minimun Balance',
    required: true,
  },
]);
async function promtValueOnUpdate() {
  loading.value = true
  if (props.data) {
    const data = { tenant_id: props.data.tenant_id, plan: props.data.plan_id, date: [props.data.starts, props.data.expires], status: props.data.status }
    await Object.entries(data).forEach(([key, value]) => {
      const field = fields.value.find((f: any) => f.name === key)
      if (field) field.value = value
    });
  }  
  loading.value = false
}
function checkForSettings() {
  const checkForVaailableSetting = getSystemSetting()
  settingList.value = {
    "hide-initial-deposit-field": (checkForVaailableSetting['hide-initial-deposit-field'] ?? 0),
  }
}
watch(() => fields.value,(val) => {
    if (settingList.value['hide-initial-deposit-field']) {
      const initalDepositIndex = val.findIndex(f => f.name === 'in_deposit'),
      referredByIndex = val.findIndex(f => f.name === 'cm_balance')
      if (initalDepositIndex === -1 && referredByIndex !== 1) {
        fields.value.splice(referredByIndex + 1, 0, {
          label: 'inital deposit',
          name: 'in_deposit',
          type: 'number',
          value: 0,
          required: true,
          placeholder: 'Select initial deposit',
        })
      }
    }
  },
  { deep: true })
onMounted(() => {
  promtValueOnUpdate()
  checkForSettings()
})
</script>