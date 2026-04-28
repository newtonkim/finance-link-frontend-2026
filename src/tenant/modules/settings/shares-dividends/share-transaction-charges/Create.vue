<script setup lang="ts">
import { values } from 'lodash';
import { ref, onMounted, reactive, computed, watch } from 'vue'; ;
const emits = defineEmits(['update:form']);
 
const loading = ref(true) 
const props = defineProps({
  data: {
    type: Object,
    default: {},
  },
})
const fields = ref<any[]>([ 

{
  label: "Type",
  name: "type",
  type: "select",
  required: true,
  options: [
    { name: "Fixed", id: "fixed" },
    { name: "Percentage", id: "percentage" },
  ],
},

{
  label: "Minimum Amount",
  name: "minimum_amount",
  type: "money",
  placeholder: "0",
},

{
  label: "Maximum Amount",
  name: "maximum_amount",
  type: "money",
  placeholder: "0",
},

{
  label: "Charge Amount",
  name: "amount",
  type: "money",
  placeholder: "0",
},

{
  label: "Status",
  name: "status",
  type: "select",
  values : "active",
  required: true,
  options: [
    { name: "Active", id: "Active" },
    { name: "Inactive", id: "Inactive" },
  ],
},

{
  label: "Charge Type",
  name: "method",
  type: "select",
  options: [
    { name: "selling", id: "selling" },
    { name: "buying", id: "buying" },
    { name: "transfer", id: "transfer" },
    { name: "withdraw", id: "withdraw" },
  ],
}, 

 
]);
 
</script>
<template>
  <div class="card shadow-md p-4 py-10 bg-white dark:bg-neutral-800 rounded-md h -[86vh] over flow-y-auto">
 
    <Form :action="data?.action"  parentStyle="grid  grid-cols-1 gap-4 md:gap-6" v-model:form="fields" />
   
  </div>
</template>