<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { Form, pickAsettingKeyValue } from "@/Global";

const emits = defineEmits(["update:form"]);

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const sharePrice = ref<number>(0);
const loading = ref<boolean>(true);


const fields = ref([
  {
    label: "Select Member Transferring Shares",
    name: "transferring_member_id",
    type: "select",
    required: true,
    placeholder: "Search member",
    url: "global/member-share-total-dropdown-list",
    helper: "A member transferring the shares. Only shareholders appear here",
  },
  {
    label: "Select Member Receiving Shares",
    name: "receiving_member_id",
    type: "select",
    required: true,
    placeholder: "Search member",
    url: "global/member-share-total-dropdown-list",
    helper: "A member buying the shares. Only shareholders appear here",
  },
  {
    label: "Number of Shares",
    name: "share_no",
    type: "number",
    required: true,
    placeholder: "10.0",
    helper: "The number of shares being transferred",
  },  
  {
    label: "Transaction Date",
    name: "trans_date",
    type: "date",
    required: true,
    helper: "The date this transaction occurred.",
    colSpan: 2,
    default: new Date().toISOString().split("T")[0],
  },
]);

onMounted(async () => {
  try {
    const res = await pickAsettingKeyValue("sacco-share-price-value");
    sharePrice.value = Number(res || 0);
  } catch (e) {
    console.warn("Failed to load share price");
  } finally {
    loading.value = false;
  }
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
    <Form v-if="!loading" :action="data?.action" parentStyle="grid  grid-cols-1 gap-4 md:gap-6" v-model:form="fields" />
  </div>
</template>
