<script setup>

import { DetailsTable } from '@/Global/DetailsTable';
import { onMounted, ref } from 'vue';
const loading = ref(true)
const props = defineProps({
  data: {
    type: Object,
    required: true
  }
});
const columns = [
  {
    header: "Sacco Details",
    type: "Descriptions",
    column: 3,
    list: [
      { key: "name", label: "Role" },
      { key: "created_at", label: "Created At" },
      { key: "dec", label: "description" }, 
    ]
  },
  {
    header: 'Permissions Details',
    type: 'Table',
    column: [
      { key: 'name', label: 'name' },
      { key: 'module', label: 'module' },
      { key: 'description', label: 'description' },
    ],
    list: []
  }
]
async function prepareData() {
  loading.value = true
  if (props.data.permissions)
    for (const key in props.data.permissions) {
      columns[1].list.push({
        name: props.data.permissions[key].name,
        module: props.data.permissions[key].module,
        description: props.data.permissions[key].description
      })
    }
  loading.value = false
}
onMounted(async () => {
  await prepareData()
})
</script>
<template>
  <DetailsTable v-if="!loading" :data="props.data" :columns="columns" />
</template>