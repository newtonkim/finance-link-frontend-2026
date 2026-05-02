<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { onMounted, ref, watch } from "vue";

const emits = defineEmits(["update:form"]);

const loading = ref<boolean>(true);

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const createRow = (index: number, values: any = {}) => [
  {
    label: "Type",
    key: "type",
    name: `rows[${index}][type]`,
    type: "select",
    required: true,
    value: values.type || "",
    options: [
      { name: "Fixed", id: "fixed" },
      { name: "Percentage", id: "percentage" },
    ],
  },
  {
    label: "Charge Method",
    key: "method",
    name: `rows[${index}][method]`,
    type: "select",
    required: true,
    value: values.method || "",
    options: [
      { name: "selling", id: "selling" },
      { name: "buying", id: "buying" },
      { name: "transfer", id: "transfer" },
      { name: "withdraw", id: "withdraw" },
    ],
  },
  {
    label: "Minimum Shares",
    key: "minimum_amount",
    name: `rows[${index}][minimum_amount]`,
    type: "money",
    required: true,
    value: values.minimum_amount || "",
  },
  {
    label: "Maximum Shares",
    key: "maximum_amount",
    name: `rows[${index}][maximum_amount]`,
    type: "money",
    required: true,
    value: values.maximum_amount || "",
  },
  {
    label: "Charge",
    key: "amount",
    name: `rows[${index}][amount]`,
    type: "money",
    required: true,
    value: values.amount || "",
  },
  {
    label: "id",
    name: "id",
    type: "number",
    disabled: true,
    hidden: true,
    required: true,
    value: props?.data?.id || "",
  },
  {
    label: "Status",
    key: "status",
    name: `rows[${index}][status]`,
    type: "select",
    required: true,
    value: values.status || "Active",
    options: [
      { name: "Active", id: "Active" },
      { name: "Inactive", id: "Inactive" },
    ],
  },
];

const rows = ref<any[]>([createRow(0)]);
function loadForm() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 300);
}
function mapApiToForm(data: any) {
  if (!data || !data.id) return;
  const mapped = {
    type: data.charge_type,
    method: data.type,
    minimum_amount: data.minimum_shares,
    maximum_amount: data.maximum_shares,
    amount: data.charge,
    status: data.status === "active" ? "Active" : "Inactive",
  };

  rows.value = [createRow(0, mapped)];
}

watch(
  () => props.data,
  (val) => {
    mapApiToForm(val);
    loadForm();
  },
  { immediate: true }
);

onMounted(() => {
  mapApiToForm(props.data);
  loadForm();
});
</script>

<template>
  <div class="p-2 bg-gray-50 dark:bg-neutral-900 h-[86vh] overflow-y-auto">
    <div
      v-for="(row, index) in rows"
      :key="index"
      class="mb-2 border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-sm"
    >
      <div
        class="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900"
      >
      
      </div>

      <div class="p-4">
        <div v-if="loading"></div>

        <Form
          :action="data?.action"
          parentStyle="grid grid-cols-1    md:grid-cols-1 gap-5"
          v-model:form="rows[index]"
        />
      </div>
    </div>
  </div>
</template>