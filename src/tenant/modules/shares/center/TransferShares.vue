<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { Form, pickAsettingKeyValue } from "@/Global";
import { notify } from "@/Global/Toasters";

const emits = defineEmits(["update:form"]);

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const sharePrice = ref<number>(pickAsettingKeyValue("sacco-share-price-value"));
const loading = ref<boolean>(true);

const fields = ref<any[]>([
  {
    label: "Select Member Transferring Shares",
    name: "transferring_member_id",
    type: "select",
    required: true,
    placeholder: "Search member",
    url: "global/member-share-total-dropdown-list",
    helper: "",
  },
  {
    label: "Select Member Receiving Shares",
    name: "receiving_member_id",
    type: "select",
    required: true,
    placeholder: "Search member",
    url: "global/member-share-total-dropdown-list",
    helper: "",
  },
  {
    label: "Number of Shares",
    name: "share_no",
    type: "number",
    required: true,
    placeholder: "10,000 shares",
    helper: "",
  },
  {
    label: "price per share",
    name: "share_price",
    type: "money",
    required: true,
    hidden: true,
    placeholder: "100.0",
    value: sharePrice.value,
  },
  {
    label: "Amount",
    name: "amount",
    type: "money",
    required: true,
    disabled: true,
    placeholder: "100.0",
    helper: "",
  },
  {
    label: "Transaction Date",
    name: "trans_date",
    type: "date",
    required: true,
    colSpan: 2,
    value: new Date().toISOString().split("T")[0],
  },
]);

/**
 * Helpers
 */
const getField = (name: string) =>
  fields.value.find((f) => f.name === name);

/**
 * Computed values
 */
const transferringMember = computed(
  () => getField("transferring_member_id")?.selected
);

const receivingMember = computed(
  () => getField("receiving_member_id")?.selected
);

const shareNo = computed(
  () => Number(getField("share_no")?.value || 0)
);

watch(transferringMember, (member) => {
  const field = getField("transferring_member_id");
  if (!field) return;

  const shares = member?.total_shares || 0;

  field.helper =
    shares > 0
      ? `<span class="text-nfuko-success">You have ${shares} shares</span>`
      : `<span class="text-red-500">You have no shares to transfer</span>`;

  if (shares <= 0) {
    // emits("update:form", []);
  }
});


watch([transferringMember, receivingMember], ([from, to]) => {
  const toField = getField("receiving_member_id");
  if (!toField) return;
  toField.error = "";
  if (from?.id && to?.id && from.id === to.id) {
    toField.error = `<span class="text-red-500">
      Cannot transfer shares to the same member
    </span>`;
    toField.value = null;
    toField.selected = null;
    // emits("update:form", []);
    notify({
      type: "error",
      msg: "Cannot transfer shares to the same member",
    });
  }
});


watch([shareNo, receivingMember], ([shares, receiver]) => {
  const amountField = getField("amount");
  const receiverField = getField("receiving_member_id");
  const fromField = getField("transferring_member_id");
  if (!amountField || !receiverField || !fromField) return;
  amountField.error=null

  const fromShares = fromField.selected?.total_shares || 0;
  const currentShares = receiver?.total_shares || 0;

  // Validate transfer limit
  const totalAmount = shares * sharePrice.value;

  amountField.value = totalAmount;

  if (shares > fromShares) {
    amountField.error='Cannot transfer more than your total shares'; 
    return;
  }

  receiverField.helper = `<span class="text-nfuko-action">
    New total shares: ${currentShares + shares}
  </span>`;

  amountField.helper = `<span class="text-nfuko-primary">
    UGX ${sharePrice.value} per share → Total: UGX ${totalAmount}
  </span>`;

});


watch(
  fields,
  (val) => {
    emits("update:form", val);
  },
  { deep: true }
);


onMounted(async () => {
  try { 
  } catch {
    console.warn("Failed to load share price");
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="card shadow-md p-6 bg-white dark:bg-neutral-800 rounded-md h-[86vh] overflow-y-auto">
    <!-- {{ fields }} -->
    <Form v-if="!loading" :action="data?.action" parentStyle="grid grid-cols-1 gap-4 md:gap-6" v-model:form="fields" />
  </div>
</template>