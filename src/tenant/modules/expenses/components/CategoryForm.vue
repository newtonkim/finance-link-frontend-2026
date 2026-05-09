<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { Form } from "@/Global";

const emits = defineEmits(["update:form"]);

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const loading = ref<boolean>(true);
const fields = ref<any[]>([]);

function initialize() {
  fields.value = [
    {
      label: "Category Name",
      name: "name",
      type: "text",
      required: true,
      placeholder: "e.g. Utilities, Marketing, Office Supplies",
      colSpan: 2,
    },
    {
        label: "Description",
        name: "description",
        type: "textarea",
        required: false,
        placeholder: "Brief description of what this category covers.",
        colSpan: 2,
    },
    {
      label: "Parent GL Account",
      name: "parent_account_id",
      type: "select",
      required: true,
      placeholder: "Select parent expense account",
      url: "chart-of-accounts?type=Expense&list=true",
      method: "get",
      optionLabel: "name",
      optionValue: "id",
      helper: "Select the GL expense account this category will post under.",
      colSpan: 2,
    },
  ];
}

onMounted(() => {
  initialize();
  loading.value = false;
});

watch(
  () => fields.value,
  (val) => {
    emits("update:form", val);
  },
  { deep: true }
);
</script>

<template>
  <div class="card shadow-md p-6 bg-white dark:bg-neutral-800 rounded-md h-[86vh] overflow-y-auto">
    <Form
      v-if="!loading"
      :action="data?.action"
      parentStyle="grid grid-cols-1 gap-4"
      v-model:form="fields"
    />
  </div>
</template>
