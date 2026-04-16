<template>
  <div class="card shadow-md p-4 py-5 bg-white dark:bg-neutral-800 rounded-md h-[82vh] overflow-hidden">
    <span v-if="loading"></span>
    <div class="" v-else>
     
      <div class="col-span-5">
        <Form :action="data?.action" parentStyle="grid  grid-cols-1 gap-4  " v-model:form="fields" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted,   } from 'vue'
import { Form,  } from '@/Global'
import { pomPinia } from 'septor-store'
const Store = pomPinia()

const loading = ref(true),
  props = defineProps({
    data: {
      type: Object,
      default: {},
    },
  }),
  fields = ref([

  {
      label: 'savings product',
      name: 'product_id',
      type: 'select',
      required: true,
      options: [],
      placeholder: 'Enter a savings product',
      url: 'global/savings-products',
      dataOnMount: true,
       
    },
  {
      label: 'new account',
      name: 'new_account',
      type: 'select',
      required: true,
      value: '1',
      options: [{ id: '1', name: 'yes' }, { id: '0', name: 'no' }],
      placeholder: 'check new account',
     
    },
    {
      label: 'opening balance',
      name: 'opening_balance',
      type: 'money',
      required: true,
      placeholder: 'Enter opening balance', 
      dependsOn: {
         conditions: [
        {
          field: 'new_account',
          condition: (val: any) => val === '0'
        }
      ],
      }
    },
    {
      label: 'initial balance',
      name: 'initial_balance',
      type: 'money',
      required: true,
      placeholder: 'Enter initial balance',
       dependsOn: {
         conditions: [
        {
          field: 'new_account',
          condition: (val: any) => val === '1'
        }
      ],
      }
    },
    {
      label: 'Date Create',
      name: 'dcreated',
      type: 'date',
      required: true,
      placeholder: 'Enter Date Create',
    },
    {
      label: 'location',
      name: 'address',
      type: 'text',
      required: true,
      placeholder: 'Enter location',
    },
   
  ])
async function promtValueOnUpdate() {
  loading.value = true
  // if (props.data) {
  //   const data = {
  //     tenant_id: props.data.tenant_id,
  //     plan: props.data.plan_id,
  //     date: [props.data.starts, props.data.expires],
  //     status: props.data.status,
  //   }
  //   await Object.entries(data).forEach(([key, value]) => {
  //     const field = fields.value.find((f: any) => f.name === key)
  //     if (field) field.value = value
  //   })
  // }
  loading.value = false
}
onMounted(() => {
  promtValueOnUpdate()
})

</script>
