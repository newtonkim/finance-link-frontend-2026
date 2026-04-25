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
  
]);

function intialize() {
  
  fields.value=[
  {
    label: "Select Member",
    name: "member_id",
    type: "select",
    required: true,
    placeholder: "Search member",
    url: "global/member-share-total-dropdown-list",
    optionLabel: "salutation_name",
    optionValue: "id",
    helper: "A member buying the shares. Only shareholders appear here",
    colSpan: 2,
  },
  {
    label: "Buyer Payment mode",
    name: "payment_mode",
    type: "select",
    required: true,
    placeholder: "Select an account receiving money",
    options: [
      { name: "Account", id: "Account" },
      { name: "Cash", id: "cash" },
      { name: "Bank", id: "bank" },
    ],
    helper: "How does the customer want to pay for the shares?",
    colSpan: 2,
  },
  {
    label: "Amount",
    name: "amount",
    type: "money",
    required: true,
    placeholder: "10,000",
    change: (value: number) => {
      const field = fields.value.find((f: any) => f.name === 'amount')
      const shn = Math.floor(value / sharePrice.value)
      if (value && sharePrice.value) {
        field.helper = `<span class="text-nfuko-primary">Warning:At UGX ${shn} per share. (price of ${sharePrice.value}) How much is the customer paying?`
        const share_no = fields.value.find((f: any) => f.name === 'share_no')
        share_no.value = shn
      }
    },
  },
  {
    label: "price",
    name: "price",
    // hidden: true,
    type: "number",
    required: true,
    disabled: true,
    placeholder: "10,000",
    value: sharePrice.value,
  },
  {
    label: "share no",
    name: "share_no",
    type: "number",
    required: true,
    placeholder: "10,000",
    dependsOn: {
      conditions: [
        {
          field: 'amount',
          condition: (val: any) => Number(val) > 0
        }
      ],
    },
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
]
}
onMounted(async () => {
  try {
    const res = await pickAsettingKeyValue("sacco-share-price-value");
    console.log(res);

    
    sharePrice.value = Number(res || 0);
    intialize()
  } catch (e) {
    console.warn("Failed to load share price");
  } finally {
    loading.value = false;
  }
});
watch(
  () => fields.value,
  (val) => {
    const total_shares = fields.value.find((f: any) => f.name === 'share_no')
    const memebr = fields.value.find((f: any) => f.name === 'member_id')
    const maxShare = pickAsettingKeyValue("sacco-share-maximum-share-values-on-should-have");
    emits("update:form", val);
    const field = fields.value.find((f: any) => f.name === 'amount')
    if (memebr.selected?.total_shares >= maxShare) {
      field.helper = `<span class="text-red-500">Memeber reached maximum shares of ${memebr.selected?.total_shares}</span>`
      emits("update:form", []);// prevent form submission
    } else {
      console.log(maxShare, '===');

      if ((maxShare <= total_shares.value)) {
        emits("update:form", []);// prevent form submission
        field.helper = `<span class="text-red-500">You can't sell more than ${maxShare} shares</span>`
        total_shares.value = maxShare
      }
    }
  },
  { deep: true }
);
</script>
<template>
  <div class="card shadow-md p-6 bg-white dark:bg-neutral-800 rounded-md h-[86vh] overflow-y-auto">
    <Form v-if="!loading" :action="data?.action" parentStyle="grid  grid-cols-1 gap-4 md:gap-6" v-model:form="fields" />
  </div>
</template>
