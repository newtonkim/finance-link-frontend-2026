<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
    loans: any[];
    actionColor: string;
    formatDate: (d?: string) => string;
    formatDateTime: (d?: string) => string;
    formatCurrency: (v?: string | number) => string;
}>();

// emits (same pattern as transactions)
const emit = defineEmits<{
    view: [loan: any];
}>();

// state
const currentPage = ref(1);
const perPage = ref(10);
const searchQuery = ref('');
const startDate = ref('');
const endDate = ref('');

// normalize loans
const normalizedLoans = computed(() => {
    return (props.loans || []).map((loan: any) => ({
        id: loan.id,
        applicationNo: loan.application_no,
        amount: Number(loan.requested_amount),
        term: loan.requested_term,
        purpose: loan.purpose,
        status: loan.status,
        repaymentSource: loan.repayment_source,
        submittedAt: loan.submitted_at,
        createdAt: loan.created_at,
    }));
});

// filtering (same UX logic)
const filtered = computed(() => {
    let data = normalizedLoans.value;

    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        data = data.filter(l =>
            l.applicationNo?.toLowerCase().includes(q) ||
            l.purpose?.toLowerCase().includes(q) ||
            l.status?.toLowerCase().includes(q)
        );
    }

    if (startDate.value)
        data = data.filter(l => (l.submittedAt || '').slice(0, 10) >= startDate.value);

    if (endDate.value)
        data = data.filter(l => (l.submittedAt || '').slice(0, 10) <= endDate.value);

    return data;
});

const totalPages = computed(() => Math.ceil(filtered.value.length / perPage.value));

const paginated = computed(() => {
    const start = (currentPage.value - 1) * perPage.value;
    return filtered.value.slice(start, start + perPage.value);
});

const clearDates = () => {
    startDate.value = '';
    endDate.value = '';
};
</script>

<template>
<div class="flex flex-col">

    <!-- Top Controls (IDENTICAL STYLE) -->
    <div class="py-4 bg-transparent flex flex-wrap gap-4 justify-between items-center px-4 md:px-6">
        <div class="flex items-center gap-3">
            <input v-model="startDate" type="date"
                class="h-10 px-4 rounded-full bg-[#f1f5f9] border-0 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#cda434]/50 cursor-pointer min-w-[140px]" />
            <input v-model="endDate" type="date"
                class="h-10 px-4 rounded-full bg-[#f1f5f9] border-0 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#cda434]/50 cursor-pointer min-w-[140px]" />
            <button @click="clearDates"
                class="h-10 px-5 text-[13px] font-bold rounded-full bg-[#f1f5f9] text-gray-700 hover:bg-[#e2e8f0] transition-colors">
                Clear
            </button>
        </div>
    </div>

    <!-- Filters Row -->
    <div class="py-2 pb-5 flex flex-col sm:flex-row justify-between items-center gap-4 px-4 md:px-6">
        <div class="flex items-center gap-2 text-[13px] text-[#64748b]">
            Show
            <select v-model="perPage" @change="currentPage = 1"
                class="h-8 px-2 rounded-md bg-[#f1f5f9] border-0 text-gray-700 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#cda434]/50 cursor-pointer">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
            </select>
            entries
        </div>

        <div class="flex items-center gap-2 text-[13px] text-[#64748b]">
            Search:
            <input v-model="searchQuery" @input="currentPage = 1"
                class="h-9 w-[200px] sm:w-[250px] px-3 rounded-md bg-[#f1f5f9] border-0 text-gray-700 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#cda434]/50"
                placeholder="Application, purpose, status..." />
        </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto border-y border-gray-100">
        <table class="w-full text-left min-w-[900px]">
            <thead>
                <tr class="border-b border-gray-100 bg-transparent text-[#64748b]">
                    <th class="py-4 px-6 text-[11px] font-bold uppercase">S/N</th>
                    <th class="py-4 px-6 text-[11px] font-bold uppercase">Application</th>
                    <th class="py-4 px-6 text-[11px] font-bold uppercase">Amount</th>
                    <th class="py-4 px-6 text-[11px] font-bold uppercase">Term</th>
                    <th class="py-4 px-6 text-[11px] font-bold uppercase">Purpose</th>
                    <th class="py-4 px-6 text-[11px] font-bold uppercase">Status</th>
                    <th class="py-4 px-6 text-[11px] font-bold uppercase">Submitted</th>
                    <th class="py-4 px-6 text-[11px] font-bold uppercase">Date Added</th>
                    <th class="py-4 px-6 text-[11px] font-bold uppercase text-center">Action</th>
                </tr>
            </thead>

            <tbody>
                <tr v-if="!paginated.length">
                    <td colspan="9" class="py-8 text-center text-[13px] text-muted-foreground">
                        No loans found.
                    </td>
                </tr>

                <tr v-for="(loan, index) in paginated" :key="loan.id"
                    class="border-b border-transparent hover:bg-accent/30 transition-colors">

                    <td class="py-3.5 px-5 text-[13px] text-muted-foreground">
                        {{ (currentPage - 1) * perPage + index + 1 }}.
                    </td>

                    <td class="py-3.5 px-5 font-mono text-[13px]">
                        {{ loan.applicationNo }}
                    </td>

                    <td class="py-3.5 px-5">
                        <span class="text-[14px] font-mono font-bold text-emerald-600">
                            {{ formatCurrency(loan.amount) }}
                        </span>
                    </td>

                    <td class="py-3.5 px-5 text-[13px]">
                        {{ loan.term }} months
                    </td>

                    <td class="py-3.5 px-5 text-[13px]">
                        {{ loan.purpose }}
                    </td>

                    <td class="py-3.5 px-5">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                            :class="{
                                'bg-amber-100 text-amber-700': loan.status === 'submitted',
                                'bg-blue-100 text-blue-700': loan.status === 'reviewed',
                                'bg-emerald-100 text-emerald-700': loan.status === 'approved',
                                'bg-red-100 text-red-700': loan.status === 'rejected'
                            }">
                            {{ loan.status }}
                        </span>
                    </td>

                    <td class="py-3.5 px-5 text-[13px]">
                        {{ formatDate(loan.submittedAt) }}
                    </td>

                    <td class="py-3.5 px-5 text-[13px]">
                        {{ formatDateTime(loan.createdAt) }}
                    </td>

                    <td class="py-3.5 px-5 text-center">
                        <button @click="emit('view', loan)"
                            class="text-blue-600 hover:text-blue-800 text-[13px]">
                            View
                        </button>
                    </td>

                </tr>
            </tbody>
        </table>
    </div>

    <!-- Pagination (IDENTICAL STYLE) -->
    <div class="py-5 px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[13px] text-[#64748b]">
        <div>
            Showing {{ filtered.length ? (currentPage - 1) * perPage + 1 : 0 }}
            to {{ Math.min(currentPage * perPage, filtered.length) }}
            of {{ filtered.length }} entries
        </div>

        <div class="flex items-center gap-2">
            <button @click="currentPage--" :disabled="currentPage === 1"
                class="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 disabled:opacity-50">
                &lsaquo;
            </button>

            <button :class="['w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[12px]', actionColor]">
                {{ currentPage }}
            </button>

            <button @click="currentPage++" :disabled="currentPage === totalPages"
                class="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 disabled:opacity-50">
                &rsaquo;
            </button>
        </div>
    </div>

</div>
</template>