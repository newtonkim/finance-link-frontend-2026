<script setup>
import { DetailsTable } from "@/Global";
import { onMounted, ref } from "vue";
const loading = ref(true);
const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});
const columns = [
  {
    header: "Plan Details",
    type: "Descriptions",
    column: 3,
    list: [
      { key: "code", label: "code", copy: true },
      { key: "staff_fall_name", label: "name" },
      { key: "staff_email", label: "email" },
      { key: "system_role", label: "role" },
      { key: "status", label: "status", type: "status" },
      { key: "total_members_onboarded", label: "total members on boarded" },
      { key: "created_at", label: "created", type: "dateTime" },
    ],
  },
  {
    header: "permission Details",
    type: "Table",
    column: [
      { key: "pemission", label: "pemission" },
      { key: "description", label: "description" },
    ],
    list: [],
  },
];
async function prepareTheFeaturesData() {
  loading.value = true;
  if (props.data.permissions)
    props.data.permissions.forEach((element) => {
      columns[1].list.push({ pemission: element.name, description: element.description });
    });
  loading.value = false;
}
onMounted(async () => {
  await prepareTheFeaturesData();
});
</script>

<template>
  <div v-if="loading">Loading...</div>
  <DetailsTable v-else :data="data" :columns="columns" />
</template>
