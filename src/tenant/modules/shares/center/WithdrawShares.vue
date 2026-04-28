<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { Form, pickAsettingKeyValue } from "@/Global";
import { shareCenterApi } from '@/tenant/apis/shares';
const { shareTransactionCharge } = shareCenterApi()
let debounceTimer: any = null
const emits = defineEmits(["update:form"]);
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const sharePrice = ref<number>(pickAsettingKeyValue("sacco-share-price-value"));
const loading = ref<boolean>(true);
const getField = (name: string) =>
  fields.value.find((f) => f.name === name);

function watcher() {
  setTimeout(() => {
    const field = getField('amount')
    const value = field.value ?? 0
    const member_id = getField('member_id')
    const shn = Math.floor(value / sharePrice.value)
    const theselectShares = member_id?.selected?.total_shares
    const share_no = fields.value.find((f: any) => f.name === 'share_no')
    member_id.helper = `You have ${theselectShares} shares`
    field.error = null;
    if (shn > theselectShares) {
      field.error = `You can't sell more than ${theselectShares} shares`
    } else if (value && sharePrice.value) {
      field.helper = `<span class="text-nfuko-primary">At UGX ${sharePrice.value} per share. How much is the customer is receiving on the account?`
    }
    share_no.value = shn
  }, 500)
}
const fields = ref([
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
    change: (value: any) => {
      watcher()

    }
  },
  {
    label: "Amount",
    name: "amount",
    type: "money",
    required: true,
    placeholder: "10,000",
    change: (value: number) => {
      watcher()
    },
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
    value: new Date().toISOString().split("T")[0],
  },
]);

onMounted(async () => {
  try {

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
    findACharge()

  },
  { deep: true }
);
function findACharge() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    const share_no = fields.value.find((f: any) => f.name === 'share_no')
    shareTransactionCharge({
      type: "withdrawal",
      shares: share_no?.value,
    }).then((res) => {
      const charge = fields.value.find((f: any) => f.name === 'charges_amount')
      if (charge)
        charge.value = res?.cost
    })
  }, 500)
}
</script>
<template>
  <div class="card shadow-md p-6 bg-white dark:bg-neutral-800 rounded-md h-[86vh] overflow-y-auto">
    <Form v-if="!loading" :action="data?.action" parentStyle="grid  grid-cols-1 gap-4 md:gap-6" v-model:form="fields" />
  </div>
</template>
