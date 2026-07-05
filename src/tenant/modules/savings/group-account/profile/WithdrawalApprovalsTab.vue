<template>
  <div class="p-4 space-y-8">
    <!-- Designated approvers -->
    <section>
      <div class="flex items-center gap-2 mb-3">
        <ShieldCheck :size="16" class="text-[#cda434]" />
        <h3 class="text-sm font-black uppercase tracking-wide text-[#182538]">Designated Approvers</h3>
      </div>
      <p class="text-xs text-[#788896] mb-3">
        Only members flagged here can approve or reject withdrawals. This group requires
        <span class="font-bold text-[#182538]">{{ requiredApprovals }}</span> approval(s) per withdrawal.
      </p>
      <div class="grid gap-2 sm:grid-cols-2">
        <div v-for="m in groupMembers" :key="m.id"
          class="flex items-center justify-between rounded-xl border border-neutral-100 bg-white px-3 py-2.5 shadow-sm">
          <div class="min-w-0">
            <div class="truncate text-sm font-semibold text-[#182538]">{{ m.member_name || m.name }}</div>
            <div class="truncate text-[11px] text-[#788896]">{{ m.member_code }}<span v-if="m.approver_role"> · {{ m.approver_role }}</span></div>
          </div>
          <button type="button" @click="toggleApprover(m)" :disabled="busy"
            :class="[
              'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors disabled:opacity-50',
              isApprover(m) ? 'bg-[#cda434] text-white hover:bg-[#b8912e]' : 'bg-gray-100 text-[#788896] hover:bg-gray-200'
            ]">
            <ShieldCheck :size="12" />
            {{ isApprover(m) ? 'Approver' : 'Make approver' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Pending requests -->
    <section>
      <div class="flex items-center gap-2 mb-3">
        <Clock :size="16" class="text-amber-500" />
        <h3 class="text-sm font-black uppercase tracking-wide text-[#182538]">Pending Withdrawals</h3>
      </div>
      <div v-if="pending.length === 0" class="rounded-xl border border-dashed border-neutral-200 py-8 text-center text-sm text-[#788896]">
        No withdrawals awaiting approval.
      </div>
      <div v-else class="space-y-3">
        <div v-for="r in pending" :key="r.id" class="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="text-sm font-bold text-[#182538]">{{ r.requester_name }} <span class="text-[11px] font-normal text-[#788896]">({{ r.requester_code }})</span></div>
              <div class="text-lg font-black text-[#182538]">{{ formatCurrency(r.amount) }}</div>
              <div v-if="r.narration" class="mt-1 text-xs text-[#788896]">{{ r.narration }}</div>
              <div class="mt-1 text-[11px] text-[#788896]">Account {{ r.account_code }} · {{ r.created_at }}</div>
            </div>
            <span class="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-600/20">
              {{ r.approvals_count }}/{{ r.required_approvals }} approved
            </span>
          </div>

          <div v-if="r.approvals?.length" class="mt-2 flex flex-wrap gap-1.5">
            <span v-for="a in r.approvals" :key="a.approver_code"
              :class="['rounded-full px-2 py-0.5 text-[10px] font-semibold',
                a.decision === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700']">
              {{ a.approver_name }}: {{ a.decision }}
            </span>
          </div>

          <div class="mt-3 flex flex-wrap items-end gap-2">
            <label class="flex flex-col text-[11px] font-semibold text-[#788896]">
              Approving as
              <select v-model="voterFor[r.id]"
                class="mt-1 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-[#182538]">
                <option :value="undefined" disabled>Select approver</option>
                <option v-for="a in eligibleApprovers(r)" :key="a.id" :value="a.id">{{ a.member_name || a.name }}</option>
              </select>
            </label>
            <input v-model="commentFor[r.id]" placeholder="Comment (optional)"
              class="min-w-[10rem] flex-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-[#182538]" />
            <button type="button" @click="act(r, 'approved')" :disabled="busy || !voterFor[r.id]"
              class="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
              <Check :size="14" /> Approve
            </button>
            <button type="button" @click="act(r, 'rejected')" :disabled="busy || !voterFor[r.id]"
              class="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">
              <X :size="14" /> Reject
            </button>
            <button type="button" @click="cancel(r)" :disabled="busy"
              class="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-[#788896] hover:bg-gray-200 disabled:opacity-50">
              Cancel request
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- History -->
    <section v-if="history.length">
      <div class="flex items-center gap-2 mb-3">
        <FileText :size="16" class="text-[#788896]" />
        <h3 class="text-sm font-black uppercase tracking-wide text-[#182538]">History</h3>
      </div>
      <div class="overflow-x-auto rounded-xl border border-neutral-100">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-[11px] uppercase text-[#788896]">
            <tr>
              <th class="px-3 py-2">Member</th>
              <th class="px-3 py-2">Amount</th>
              <th class="px-3 py-2">Status</th>
              <th class="px-3 py-2">Resolved</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in history" :key="r.id" class="border-t border-neutral-100">
              <td class="px-3 py-2 text-[#182538]">{{ r.requester_name }}</td>
              <td class="px-3 py-2 font-semibold text-[#182538]">{{ formatCurrency(r.amount) }}</td>
              <td class="px-3 py-2">
                <span :class="['rounded-full px-2 py-0.5 text-[11px] font-bold', statusClass(r.status)]">{{ r.status }}</span>
              </td>
              <td class="px-3 py-2 text-[#788896]">{{ r.resolved_at || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ShieldCheck, Clock, Check, X, FileText } from "lucide-vue-next";
import { formatCurrency } from "../../../../../Global/index";
import { groupSavingsApi } from "../../../../apis/savings/group-savingsApi";

const props = defineProps<{
  members: any[];
  requiredApprovals?: number;
}>();
const emit = defineEmits<{ reload: []; count: [n: number] }>();

const {
  listGroupWithdrawalRequests,
  actOnGroupWithdrawalRequest,
  cancelGroupWithdrawalRequest,
  toggleGroupWithdrawalApprover,
} = groupSavingsApi();

const requests = ref<any[]>([]);
const busy = ref(false);
const voterFor = ref<Record<number, number | undefined>>({});
const commentFor = ref<Record<number, string>>({});

const groupMembers = computed(() => (Array.isArray(props.members) ? props.members : []));
const requiredApprovals = computed(() => props.requiredApprovals ?? 1);
const pending = computed(() => requests.value.filter((r) => r.status === "pending"));
const history = computed(() => requests.value.filter((r) => r.status !== "pending"));

function isApprover(m: any) {
  return m.is_approver === true || m.is_approver === 1 || m.is_approver === "1";
}
function eligibleApprovers(r: any) {
  return groupMembers.value.filter((m) => isApprover(m) && Number(m.id) !== Number(r.member_id));
}
function statusClass(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "executed") return "bg-emerald-100 text-emerald-700";
  if (s === "rejected") return "bg-rose-100 text-rose-700";
  if (s === "cancelled") return "bg-gray-100 text-gray-600";
  return "bg-amber-100 text-amber-700";
}

async function load() {
  requests.value = (await listGroupWithdrawalRequests()) || [];
  emit("count", pending.value.length);
}

async function act(r: any, decision: "approved" | "rejected") {
  const approver = voterFor.value[r.id];
  if (!approver) return;
  busy.value = true;
  try {
    const ok = await actOnGroupWithdrawalRequest(r.id, approver, decision, commentFor.value[r.id]);
    if (ok) {
      voterFor.value[r.id] = undefined;
      commentFor.value[r.id] = "";
      await load();
      emit("reload");
    }
  } finally {
    busy.value = false;
  }
}

async function cancel(r: any) {
  busy.value = true;
  try {
    if (await cancelGroupWithdrawalRequest(r.id)) await load();
  } finally {
    busy.value = false;
  }
}

async function toggleApprover(m: any) {
  busy.value = true;
  try {
    const next = !isApprover(m);
    if (await toggleGroupWithdrawalApprover(Number(m.id), next, m.approver_role)) {
      m.is_approver = next;
    }
  } finally {
    busy.value = false;
  }
}

onMounted(load);
defineExpose({ load });
</script>
