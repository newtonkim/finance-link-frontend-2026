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

function initialize(existing: Record<string, any> = {}) {
  const isEditing = Boolean(existing?.id);
  const today = new Date().toISOString().split("T")[0];

  fields.value = [
    {
      label: "Expense Title / Name",
      name: "title",
      type: "text",
      required: true,
      placeholder: "e.g. Office Rent, January Salaries",
      helper: "A short descriptive name for this expense.",
      value: existing?.title ?? "",
      colSpan: 2,
    },
    {
      label: "Expense Category",
      name: "expense_category_id",
      type: "select",
      required: true,
      placeholder: "Select category",
      url: "expenses/categories",
      method: "get",
      optionLabel: "name",
      optionValue: "id",
      helper: "Select the expense category for this record.",
      value: existing?.expense_category_id ?? "",
      colSpan: 2,
    },
    {
      label: "Payment Method",
      name: "payment_method",
      type: "select",
      required: true,
      placeholder: "How was this paid?",
      options: [
        { name: "Cash", id: "cash" },
        { name: "Bank Transfer", id: "bank" },
        { name: "Mobile Money", id: "mobile_money" },
        { name: "Cheque", id: "cheque" },
      ],
      value: existing?.payment_method ?? "",
      colSpan: 1,
    },
    {
      label: "Amount",
      name: "amount",
      type: "money",
      required: true,
      placeholder: "0.00",
      value: existing?.amount ?? "",
      colSpan: 1,
    },
    {
      label: "Recipient / Vendor",
      name: "vendor_name",
      type: "text",
      required: true,
      placeholder: "e.g. NWSC, Landlord, etc.",
      value: existing?.vendor_name ?? "",
      colSpan: 2,
    },
    {
      label: "Transaction Date",
      name: "transaction_date",
      type: "date",
      required: true,
      default: isEditing ? undefined : today,
      value: existing?.transaction_date ?? today,
      colSpan: 1,
    },
    {
      label: "Reference Number",
      name: "reference_no",
      type: "text",
      required: false,
      placeholder: "Receipt or Invoice #",
      value: existing?.reference_no ?? "",
      colSpan: 1,
    },
    {
      label: "Description / Narration",
      name: "description",
      type: "textarea",
      required: true,
      placeholder: "What was this expense for?",
      value: existing?.description ?? "",
      colSpan: 2,
    },
    {
      label: "Is this a recurring expense?",
      name: "is_recurring",
      type: "select",
      options: [
        { name: "No", id: false },
        { name: "Yes (Weekly/Monthly/etc.)", id: true },
      ],
      required: true,
      default: isEditing ? undefined : false,
      value: existing?.is_recurring === true || existing?.is_recurring === 1 || existing?.is_recurring === "1",
      colSpan: 2,
    },
    {
      label: "Frequency",
      name: "recurring_frequency",
      type: "select",
      required: true,
      options: [
        { name: "Weekly", id: "weekly" },
        { name: "Bi-Weekly", id: "bi_weekly" },
        { name: "Monthly", id: "monthly" },
        { name: "Quarterly", id: "quarterly" },
        { name: "Annually", id: "annually" },
      ],
      dependsOn: {
        conditions: [{ field: "is_recurring", value: true }],
      },
      value: existing?.recurring_frequency ?? "",
      colSpan: 1,
    },
    {
      label: "Next Due Date",
      name: "next_due_date",
      type: "date",
      required: true,
      dependsOn: {
        conditions: [{ field: "is_recurring", value: true }],
      },
      value: existing?.next_due_date ?? "",
      colSpan: 1,
    },
    {
      label: "Attach Receipt",
      name: "receipt_attachment",
      type: "profile", // Using the profile type for file upload support in DynamicForm
      required: false,
      helper: "Upload a photo or PDF of the receipt (Max 2MB).",
      colSpan: 2,
    },
  ];
}

onMounted(() => {
  initialize(props.data ?? {});
  loading.value = false;
});

watch(
  () => props.data?.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      initialize(props.data ?? {});
    }
  }
);

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
      parentStyle="grid grid-cols-1 md:grid-cols-2 gap-4"
      v-model:form="fields"
    />
  </div>
</template>
