<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { onMounted, ref } from "vue";

const emits = defineEmits(["update:form"]);
const loading = ref<boolean>(true);
const props = defineProps({
  data: {
    type: Object,
    default: {},
  },
});

const createRow = (index: number) => [
  {
    label: "Type",
    name: `rows[${index}][type]`,
    type: "select",
    required: true,
    options: [
      { name: "Fixed", id: "fixed" },
      { name: "Percentage", id: "percentage" },
    ],
  },
  {
    label: "Charge Type",
    name: `rows[${index}][method]`,
    type: "select",
    required: true,

    options: [
      { name: "selling", id: "selling" },
      { name: "buying", id: "buying" },
      { name: "transfer", id: "transfer" },
      { name: "withdraw", id: "withdraw" },
    ],
  },
  {
    label: "Minimum Amount",
    name: `rows[${index}][minimum_amount]`,
    type: "money",
    placeholder: "0",
    required: true,

  },
  {
    label: "Maximum Amount",
    name: `rows[${index}][maximum_amount]`,
    type: "money",
    placeholder: "0",
    required: true,

  },
  {
    label: "Charge Amount",
    name: `rows[${index}][amount]`,
    type: "money",
    placeholder: "0",
    required: true,

  },
  {
    label: "Status",
    name: `rows[${index}][status]`,
    type: "select",
    value: "Active",
    required: true,
    options: [
      { name: "Active", id: "Active" },
      { name: "Inactive", id: "Inactive" },
    ],
  },
];

const rows = ref<any[]>([createRow(0)]);

const addRow = () => {
  const nextIndex = rows.value.length;
  rows.value.push(createRow(nextIndex));
  loadForm()

};


const removeRow = (index: number) => {
  if (rows.value.length > 1) {
    rows.value.splice(index, 1);

    rows.value = rows.value.map((_, i) => createRow(i));
    loadForm()
  }
};
function loadForm() {
  loading.value = true
  setTimeout(() => {
    loading.value = !loading.value
  }, 500)
}

onMounted(() => {
  loadForm()
})

</script>

<template>
  <div class="p-2 bg-gray-50 dark:bg-neutral-900   h-[86vh] overflow-y-auto">
    <div class="  ">
      <div class="flex justify-end w-full p-2 fixed right-2  top-10">
        <Plus @click="addRow"
          class="text-sm border rounded-full border-gray-300    bg-nfuko-primary-200 hover:nfuko-primary-200 dark:bg-neutral-800 dark:border-neutral-600 dark:hover:bg-neutral-700 " />
      </div>


    </div>
    <div v-for="(row, index) in rows" :key="index"
      class="mb-2 border border-gray-200 dark:border-neutral-700   bg-white dark:bg-neutral-800 rounded-sm">
      <div
        class="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
          Row {{ index + 1 }}
        </span>

        <button v-if="rows.length > 1" @click="removeRow(index)" class="text-xs text-nfuko-danger hover:underline">
          Remove
        </button>
      </div>

      <div class="p-4">
        <div v-if="loading"></div>
        <Form :action="data?.action" parentStyle="grid grid-cols-1 xl:grid-cols-6 sm:grid-cols-2 md:grid-cols-3 gap-5"
          v-model:form="rows[index]" />
      </div>
    </div>



  </div>
</template>