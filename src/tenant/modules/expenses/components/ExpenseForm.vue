<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { Form, scopeValues } from "@/Global";
import { useExpenseApi } from "@/tenant/apis/expenses/expenseApi";
import { Calculator, AlertTriangle, TrendingDown, ShieldCheck, ChevronRight, FileText, Calendar, TableProperties } from "lucide-vue-next";

const emits = defineEmits(["update:form"]);

interface FormProps {
  data?: Record<string, unknown>;
}

const props = defineProps<FormProps>();

interface JournalLine {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  type: "debit" | "credit";
}

interface BudgetStatus {
  budget_amount: number;
  spent_amount: number;
  remaining_budget: number;
  is_over_budget: boolean;
  gl_account_code?: string;
  gl_account_name?: string;
  journal_preview?: JournalLine[];
}

interface ApprovalLevel {
  level: number;
  required_role: string;
}

interface ExpenseApi {
  checkBudget: (categoryId: number, amount: number, date: string) => Promise<{ data?: BudgetStatus }>;
  getApprovalPath: (amount: number, isOverBudget: boolean) => Promise<{ data?: ApprovalLevel[] }>;
  [key: string]: unknown;
}

const expenseApi = useExpenseApi() as unknown as ExpenseApi;
const loading = ref<boolean>(true);
const fields = ref<Record<string, unknown>[]>([]);
const budgetStatus = ref<BudgetStatus | null>(null);
const approvalPath = ref<ApprovalLevel[]>([]);

const formValues = computed(() => scopeValues(fields.value));

const currentPeriod = computed(() => {
  if (!formValues.value.transaction_date) return new Date().toISOString().slice(0, 7);
  return (formValues.value.transaction_date as string).slice(0, 7);
});

watch(() => [formValues.value.expense_category_id, formValues.value.amount, formValues.value.transaction_date, formValues.value.receipt_attachment], async ([catId, amount, date, attachment]) => {
  const numAmount = Number(String(amount).replace(/,/g, ''));
  if (catId && numAmount > 0) {
    const budgetRes = await expenseApi.checkBudget(catId as number, numAmount, date as string);
    const isOverBudget = budgetRes?.data?.is_over_budget || false;
    
    const pathRes = await expenseApi.getApprovalPath(numAmount, isOverBudget);
    
    if (budgetRes?.data) budgetStatus.value = budgetRes.data;
    if (pathRes?.data) approvalPath.value = pathRes.data;

    // Enforce attachment required rule (UGX 100,000)
    updateAttachmentRequirement(numAmount, !!attachment);
  } else {
    budgetStatus.value = null;
    approvalPath.value = [];
  }
}, { deep: true });

function updateAttachmentRequirement(amount: number, hasAttachment: boolean) {
  const attachmentField = fields.value.find(f => f.name === 'receipt_attachment');
  if (attachmentField) {
    const isRequired = amount > 100000;
    attachmentField.required = isRequired;
    
    // Blink only if required AND missing
    const shouldBlink = isRequired && !hasAttachment;
    
    attachmentField.helper = shouldBlink 
      ? '<span class="animate-blink text-rose-600 font-bold">Upload a photo or PDF of the receipt (Required for amounts above 100k).</span>' 
      : isRequired && hasAttachment
        ? '<span class="text-emerald-600 font-bold">✓ Receipt attached. Compliance verified.</span>'
        : "Upload a photo or PDF of the receipt (Max 2MB).";
  }
}

function initialize(existing: Record<string, unknown> = {}) {
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
    if (newId !== undefined && newId !== oldId) {
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
    <!-- Period Indicator -->
    <div class="mb-6 flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
      <div class="flex items-center gap-2">
        <Calendar class="w-4 h-4 text-neutral-400" />
        <span class="text-xs font-bold text-neutral-500 uppercase">Fiscal Period</span>
      </div>
      <div class="px-3 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-[10px] font-black font-mono">
        {{ currentPeriod }}
      </div>
    </div>

    <Form
      v-if="!loading"
      :action="(props.data?.action as string)"
      parentStyle="grid grid-cols-1 md:grid-cols-2 gap-4"
      v-model:form="(fields as any)"
    />

    <!-- GL Account Preview -->
    <div v-if="budgetStatus?.gl_account_code" class="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-center gap-3">
      <FileText class="w-5 h-5 text-blue-600 dark:text-blue-400" />
      <div>
        <p class="text-[10px] font-bold text-blue-500 uppercase leading-none mb-1">GL Account Mapping</p>
        <p class="text-xs font-black text-blue-900 dark:text-white">
          {{ budgetStatus.gl_account_code }} &middot; {{ budgetStatus.gl_account_name }}
        </p>
      </div>
    </div>

    <!-- Budget Impact Section -->
    <div v-if="budgetStatus" class="mt-6 border-t border-neutral-100 dark:border-neutral-800 pt-6">
      <div class="flex items-center gap-3 mb-4 px-1">
        <Calculator class="w-5 h-5 text-nfuko-primary dark:text-nfuko-yellow" />
        <h3 class="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Real-time Budget Impact</h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-center">
          <p class="text-[10px] font-bold text-neutral-500 uppercase mb-1">Allocated</p>
          <p class="text-lg font-black text-neutral-900 dark:text-white">{{ budgetStatus.budget_amount.toLocaleString() }}</p>
        </div>
        
        <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-center">
          <p class="text-[10px] font-bold text-neutral-500 uppercase mb-1">Spent</p>
          <p class="text-lg font-black text-neutral-900 dark:text-white">{{ budgetStatus.spent_amount.toLocaleString() }}</p>
        </div>

        <div :class="[
          'p-4 rounded-xl border text-center',
          budgetStatus.is_over_budget 
            ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
        ]">
          <p class="text-[10px] font-bold uppercase mb-1">Remaining</p>
          <p class="text-lg font-black">{{ budgetStatus.remaining_budget.toLocaleString() }}</p>
        </div>
      </div>

      <div v-if="budgetStatus.is_over_budget" class="mt-4 p-3 rounded-lg bg-rose-100 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
        <AlertTriangle class="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-bold text-rose-800 dark:text-rose-300">Budget Exceeded!</p>
          <p class="text-xs text-rose-700 dark:text-rose-400">Requires additional board-level approval (Level 5).</p>
        </div>
      </div>
    </div>

    <!-- Journal Entry Preview -->
    <div v-if="budgetStatus?.journal_preview" class="mt-8 border-t border-neutral-100 dark:border-neutral-800 pt-6">
      <div class="flex items-center gap-3 mb-4 px-1">
        <TableProperties class="w-5 h-5 text-nfuko-action" />
        <h3 class="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Journal Entry Preview</h3>
      </div>

      <div class="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
        <table class="w-full text-left text-xs">
          <thead class="bg-neutral-50 dark:bg-neutral-900 text-[10px] font-black text-neutral-500 uppercase">
            <tr>
              <th class="px-4 py-3">Account</th>
              <th class="px-4 py-3 text-right">Debit</th>
              <th class="px-4 py-3 text-right">Credit</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="(line, idx) in budgetStatus.journal_preview" :key="idx" class="bg-white dark:bg-neutral-800">
              <td class="px-4 py-3">
                <p class="font-bold text-neutral-900 dark:text-white">{{ line.account_name }}</p>
                <p class="font-mono text-[10px] text-neutral-400">{{ line.account_code }}</p>
              </td>
              <td class="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {{ line.debit > 0 ? line.debit.toLocaleString() : '-' }}
              </td>
              <td class="px-4 py-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                {{ line.credit > 0 ? line.credit.toLocaleString() : '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Approval Chain Section -->
    <div v-if="approvalPath.length > 0" class="mt-8 border-t border-neutral-100 dark:border-neutral-800 pt-6">
      <div class="flex items-center gap-3 mb-4 px-1">
        <ShieldCheck class="w-5 h-5 text-nfuko-primary dark:text-nfuko-yellow" />
        <h3 class="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Required Approval Chain</h3>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <template v-for="(level, index) in approvalPath" :key="index">
          <div class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <div class="w-6 h-6 rounded-full bg-nfuko-primary/10 text-nfuko-primary dark:bg-nfuko-yellow/10 dark:text-nfuko-yellow flex items-center justify-center text-[10px] font-black">
              {{ level.level }}
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-neutral-400 uppercase leading-none mb-1">Level {{ level.level }}</span>
              <span class="text-xs font-black text-neutral-700 dark:text-neutral-200 capitalize">{{ level.required_role.replace('_', ' ') }}</span>
            </div>
          </div>
          <ChevronRight v-if="index < approvalPath.length - 1" class="w-4 h-4 text-neutral-300" />
        </template>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.animate-blink {
  animation: blink 0.8s step-end infinite;
}
</style>
