<script setup>
import Details from '@/Global/DetailsTable/Details.vue';
import { onMounted, ref } from 'vue'
const loading = ref(true)
const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})
const columns = [
  {
    header: 'Plan Details',
    type: 'Descriptions',
    column: 3,
    list: [
      { key: 'plan_name', label: 'name' },
      { key: 'slug', label: 'slug' },
      { key: 'billing_type', label: 'type' },
      { key: 'cost', label: 'cost' },
      { key: 'mx_mbrs', label: 'members' },
      { key: 'mxusrs', label: 'users' },
      { key: 'created_at', label: 'Created Date', },
    ]
  },
  {
    header: 'Features Details',
    type: 'Table',
    column: [
      { key: 'feature', label: 'feature' },
      { key: 'accessbility', label: 'accessbility' },
    ],
    list: []
  }
]
async function prepareTheFeaturesData() {
  loading.value = true
  for (const key in props.data.features) {
    columns[1].list.push({ feature: key, accessbility: key })
  }
  loading.value = false

}
onMounted(async() => {
 await prepareTheFeaturesData()
})
</script>

<template>
  <div v-if="loading">Loading...</div>
  <Details v-else :data="data" :columns="columns" />


</template>