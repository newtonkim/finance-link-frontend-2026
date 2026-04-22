<template>
  <div class="card shadow-md p-4 py-10 bg-white dark:bg-neutral-800 rounded-md h-[84vh] overflow-auto">
    
    <span v-if="loading"></span>
    <Form
      :action="data?.action"
      v-else
      parentStyle="grid  grid-cols-1 gap-4 md:gap-6"
      v-model:form="fields"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { exptendAformField, Form, getSystemSetting, tryCatch } from "@/Global";
import { memberAccountApi } from "@/tenant/apis";
const { getProductCharges } = memberAccountApi();

const emits = defineEmits(["update:form"]),
  loading = ref(true),
  settingList = ref({}),
  yesNoOptions = [
    { id: 1, name: "Yes" },
    { id: "0", name: "No" },
  ],
  props = defineProps({
    data: {
      type: Object,
      default: {},
    },
  }),
  fields = ref<any[]>([
    {
      hidden: 1,
      name: "id",
      type: "number",
      required: true,
      value: props?.data?.id,
    },
    {
      label: "Member",
      name: "member",
      type: "select",
      required: true,
      url: "global/member-dropdown-list",
      placeholder: "select a member",
      dataOnMount: true,
    },
    {
      label: "savings product",
      name: "product_id",
      type: "select",
      required: true,
      options: [],
      placeholder: "Enter a savings product",
      url: "global/savings-products",
      dataOnMount: true,
      change: async (val: any) => {
        const amount = fields.value.find((f: any) => f.name === "in_deposit")?.value;
        if (amount) watchChangeInProductOrCharges(fields, amount);
      },
    },
    {
      label: "is New Account",
      name: "new_account",
      type: "select",
      required: true,
      options: yesNoOptions,
      value: 1,
      disabled: true,
      placeholder: "Enter is New Account",
    },
    {
      label: "consider Minimun Balance",
      name: "cm_balance",
      type: "select",
      required: true,
      options: yesNoOptions,
      placeholder: "Enter consider Minimun Balance",
    },
    {
        label: "inital deposit",
            name: "in_deposit",
            type: "number",
            value: 0,
            required: true,
            placeholder: "Select initial deposit",
             dependsOn: {
            conditions: [
              {
                field: 'product_id',
                condition: (val: any) => settingList.value['hide-initial-deposit-field'],
              }
            ],
          }
    },
    {
      label: "Status",
      name: "Status",
      type: "select",
      value: "active",
      required: true,
      options: [
        { id: "active", name: "active" },
        { name: "dormant", id: "dormant" },
      ],
      placeholder: "Enter account Status",
    },
    {
      label: "Opening Balance",
      name: "opening_balance",
      type: "number",
      required: true,
      placeholder: "Enter Opening Balance",
    },
    // ,
  ] as any[])
async function promtValueOnUpdate() {
  loading.value = true;

  if (props.data) {
    const data = {
      product_id: props.data.savings_product_id,
      member: props.data.member_id,
      opening_balance: props.data.opening_balance,
      cm_balance: props.data.consider_min_balance,
      status: props.data.status,
    };
    await Object.entries(data).forEach(([key, value]) => {
      const field = fields.value.find((f: any) => f.name === key);
      if (field) field.value = value;
    });
  }
  loading.value = false;
}
function checkForSettings() {
  const checkForVaailableSetting = getSystemSetting();
  settingList.value = {
    "hide-initial-deposit-field":
      checkForVaailableSetting?.["hide-initial-deposit-field"] ?? 0,
  };
}
// watch(
//   () => fields.value,
//   (val) => {
//     if (true) {
//       // if (settingList.value['hide-initial-deposit-field']) {
//       const initalDepositIndex = val.findIndex((f) => f.name === "in_deposit"),
//         referredByIndex = val.findIndex((f) => f.name === "cm_balance");
//       if (initalDepositIndex === -1 && referredByIndex !== 1) {
//         exptendAformField({
//           fields,
//           nextto: "cm_balance",
//           field: {
//             label: "inital deposit",
//             name: "in_deposit",
//             type: "number",
//             value: 0,
//             required: true,
//             placeholder: "Select initial deposit",
//             onChange: async (val) => {
//               const amount = val?.target ? val.target.value : val;
//               watchChangeInProductOrCharges(fields, amount);
//             },
//           },
//         });
//       }
//     }
//   },
//   { deep: true }
// );
function watchChangeInProductOrCharges(fields: any, amount: any) {
  const finedProduct = fields.value.find((f: any) => f.name === "product_id");
  const chargeField = fields.value.find((f: any) => f.name === "charges");
  const existsIndex = fields.value.findIndex((f: any) => f.name === "product_id");
  if (!finedProduct || !finedProduct.value) return;
  tryCatch(async () => {
    if (existsIndex > 0 && amount > 0) {
      exptendAformField({
        fields,
        nextto: "product_id",
        field: {
          label: "charges",
          name: "text",
          type: "select",
          required: true,
          disabled: true,
          placeholder: "Enter charges",
        },
      });
    }
    const res: any = await getProductCharges({
      product_id: finedProduct.value,
      amount: amount,
      type: "deposit",
    });
    if (chargeField) {
      chargeField.value = (res?.cost ?? 0) + " (charges)";
      chargeField.hidden = false;
      chargeField.label = "charges";
    }
  });
}

onMounted(() => {
  promtValueOnUpdate();
  checkForSettings();
});
</script>
