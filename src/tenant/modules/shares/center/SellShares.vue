<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { Form, pickAsettingKeyValue } from "@/Global";
const emits = defineEmits(["update:form"]);
import { shareCenterApi } from '@/tenant/apis/shares';
const { shareTransactionCharge } = shareCenterApi()
let debounceTimer: any = null
import { pomPinia } from 'septor-store';
const Store = pomPinia() as any;
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const sharePrice = ref<number>(0);
const loading = ref<boolean>(true);
const maxShare = pickAsettingKeyValue("sacco-share-maximum-share-numbers-one-should-have");
const fields = ref([

]);

function intialize() {

  fields.value = [
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
      change: async (value: any) => {
        Store['member-account-select'] = []// clear the state manualy

        const memebr = fields.value.find((f: any) => f.name === 'member_id')
        const account_id = fields.value.find((f: any) => f.name === 'account_id')
        const payment_mode = fields.value.find((f: any) => f.name === 'payment_mode')
        const shn = Number(Math.floor(value / sharePrice.value)) + Number(memebr?.value?.selected?.total_shares ?? 0)
        const field = fields.value.find((f: any) => f.name === 'amount')
        const share_no = fields.value.find((f: any) => f.name === 'share_no')
        if ((maxShare <= shn)) {
          emits("update:form", []);// prevent form submission
          field.helper = `<span class="text-red-500">You can't sell more than ${maxShare} shares</span>`
        }
        share_no.value = shn
        account_id.url = 'global/member-saving-accounts-dropdown-list?member_id=' + value// update url for account
        await findACharge()
        payment_mode.value = null


      }
    },
    {
      label: "Buyer Payment mode",
      name: "payment_mode",
      type: "select",
      required: true,
      value: "cash",
      placeholder: "Select an account receiving money",
      options: [
        { name: "select", id: null },
        { name: "Account", id: "Account" },
        { name: "Cash", id: "cash" },
        { name: "Bank", id: "bank" },
      ],
      helper: "How does the customer want to pay for the shares?",
      colSpan: 2,
    },
    {
      label: "Member Account",
      name: "account_id",
      type: "select",
      saveData: false,
      required: true,
      selectOnOneItem: true,
      state: "member-account-select",
      placeholder: "Select an account receiving money",
      dependsOn: {
        conditions: [
          {
            field: 'payment_mode',
            condition: (val: any) => `${val}`.toLowerCase() === 'account',
          }
        ],
      }

    },
    {
      label: "Amount",
      name: "amount",
      type: "money",
      required: true,
      placeholder: "10,000",
      change: (value: number) => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          const memebr = fields.value.find((f: any) => f.name === 'member_id')
          const field = fields.value.find((f: any) => f.name === 'amount')
          const shn = (Math.floor(value / sharePrice.value)) + Number(memebr?.value?.selected?.total_shares ?? 0)
          field.helper = null
          field.helper = `<span class="text-nfuko-primary">Warning:At UGX ${shn} per share. (price of ${sharePrice.value}) How much is the customer paying?`
          const share_no = fields.value.find((f: any) => f.name === 'share_no')
          if (value && shn > maxShare) {
            field.helper = `<span class="text-red-500">Memeber reached maximum shares of ${maxShare}/${shn}</span>`
          }
          share_no.value = shn
          findACharge()
        }, 900)
      },
    },
    {
      label: "charge",
      name: "charges_amount",
      type: "number",
      required: false,
      disabled: true,
      placeholder: "10,000",

    },
    {
      label: "price",
      name: "price",
      hidden: true,
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
      value: new Date().toISOString().split("T")[0],
    },
  ]
}
onMounted(async () => {
  try {
    const res = await pickAsettingKeyValue("sacco-share-price-value");
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
    // findACharge()
    if (total_shares >= maxShare) {
      emits("update:form", []);// prevent form submission
    } else {
      emits("update:form", val);
    }
  },
  { deep: true }
);
function findACharge() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    const share_no = fields.value.find((f: any) => f.name === 'share_no')
    shareTransactionCharge({
      type: "selling",
      shares: share_no?.value,
    }).then((res) => {
      const charge = fields.value.find((f: any) => f.name === 'charges_amount')
      if (charge)
        charge.value = res?.cost
    });
  }, 500)
}

</script>
<template>
  <div class="card shadow-md p-6 bg-white dark:bg-neutral-800 rounded-md h-[86vh] overflow-y-auto">
    <Form v-if="!loading" :action="data?.action" parentStyle="grid  grid-cols-1 gap-3" v-model:form="fields" />
  </div>
</template>
