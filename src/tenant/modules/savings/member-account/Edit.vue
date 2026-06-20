<template>
  <div class="flex h-[84vh] flex-col overflow-hidden">
    <!-- ───────────── Member identity header ───────────── -->
    <section
      class="relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-nfuko-primary-900 via-nfuko-primary-800 to-nfuko-primary-600 shadow-md shadow-nfuko-primary-900/20">
      <div class="pointer-events-none absolute inset-0 opacity-[0.07]" :style="{
        backgroundImage: 'repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 34px)',
      }" />
      <div class="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-nfuko-accent/20 blur-3xl" />

      <div class="relative flex items-center justify-between gap-4 p-5">
        <div class="flex min-w-0 items-center gap-3.5">
          <div class="size-12 shrink-0 overflow-hidden rounded-xl bg-white/10 ring-2 ring-white/25">
            <img v-if="data?.member_image" :src="data.member_image" :alt="data?.member_name"
              class="size-full object-cover" />
            <div v-else class="flex size-full items-center justify-center text-sm font-black text-white/90">
              {{ memberInitials(data?.member_name) }}
            </div>
          </div>
          <div class="min-w-0">
            <span class="text-[10px] font-semibold uppercase tracking-[0.16em] text-nfuko-accent/80">Editing account</span>
            <h2 class="truncate text-base font-bold leading-tight text-white">
              {{ data?.member_name || 'Unnamed member' }}
            </h2>
            <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span v-if="data?.account_code"
                class="font-mono text-[11px] tracking-wide text-nfuko-accent">{{ data.account_code }}</span>
              <span v-if="data?.product"
                class="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold capitalize text-white/90 ring-1 ring-inset ring-white/15">
                <Wallet :size="11" class="text-nfuko-accent" /> {{ data.product }}
              </span>
            </div>
          </div>
        </div>

        <div class="shrink-0 text-right">
          <p class="text-[9px] font-semibold uppercase tracking-[0.16em] text-nfuko-accent/80">Balance</p>
          <p class="text-xl font-black tabular-nums tracking-tight text-white">
            {{ formatMoneyValue(Number(data?.blc ?? 0)) }}
          </p>
          <p class="text-[10px] font-medium text-white/50">{{ currencyCode }}</p>
        </div>
      </div>
    </section>

    <!-- ───────────── Form body ───────────── -->
    <div class="mt-4 flex-1 overflow-auto pr-0.5">
      <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div v-for="i in 6" :key="i" class="space-y-2" :class="i === 1 || i === 6 ? 'sm:col-span-2' : ''">
          <div class="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          <div class="h-11 w-full rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        </div>
      </div>

      <div v-else
        class="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 class="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
          <span class="h-3.5 w-1 rounded-full bg-nfuko-primary" /> Account details
        </h3>
        <Form
          :action="data?.action"
          parentStyle="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3"
          v-model:form="fields"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { Wallet } from "lucide-vue-next";
import { exptendAformField, Form, getSystemSetting, tryCatch, formatMoneyValue } from "@/Global";
import { useCurrencyStore } from "@/stores/currency";
import { memberAccountApi } from "@/tenant/apis";
const { getProductCharges } = memberAccountApi();

const currencyStore = useCurrencyStore();
const { currencyCode } = storeToRefs(currencyStore);

function memberInitials(name?: string) {
  const n = name?.trim();
  if (!n) return "--";
  const parts = n.split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

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
      class: "sm:col-span-2",
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
      class: "sm:col-span-2",
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
        label: 'Accounts',
        name: 'credit_account_id',
        type: 'select',
        url: "global/chart-of-accounts",
        data: { account_type: 'INCOME' },
        dataOnMount: true,
        options: [],
        placeholder: 'Select income account',
        // condition: (val: string) => ['on_registration', 'on_loan_application'].includes(val)
    },
    {
      label: "Opening Balance",
      name: "opening_balance",
      type: "number",
      required: true,
      placeholder: "Enter Opening Balance",
      class: "sm:col-span-2",
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
