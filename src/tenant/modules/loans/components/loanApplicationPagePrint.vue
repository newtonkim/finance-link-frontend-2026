<script setup lang="ts">
import { formatCurrency, printElementId } from '@/Global';
import { watch } from 'vue';
const props = defineProps<{ data: any, print: boolean }>();
const emit = defineEmits(['close'])
watch(() => props.print, (v) => {
    if (v) {
        setTimeout(() => {
            printElementId('loan-application-print')
            setTimeout(() => emit('close'), 1000)
        }, 100)
    }
}, { immediate: true })
</script>

<template>
    <div class="p-6 bg-white text-[13px] text-gray-800" id="loan-application-print">

        <!-- Header -->
        <div class="flex items-center justify-between mb-6 border-b pb-4">
            <div>
                <h1 class="text-2xl font-bold text-nfuko-primary">
                    Loan Application Summary
                </h1>
                <p class="text-xs text-gray-500">
                    Generated on: {{ new Date().toLocaleDateString() }}
                </p>
            </div>

            <!-- Highlight Amount -->
            <div class="text-right">
                <p class="text-xs text-gray-500">Requested Amount</p>
                <p class="text-lg font-bold text-green-600">
                    {{ formatCurrency(data?.requested_amount) }}
                </p>
            </div>
        </div>

        <!-- GRID SECTIONS -->
        <div class="grid grid-cols-2 gap-4">

            <!-- Member Info -->
            <div class="bg-gray-50 rounded-xl p-4 border">
                <h2 class="font-semibold text-sm mb-3 text-gray-700">
                    Member Information
                </h2>

                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-500">Name</span>
                        <span class="font-medium">{{ data?.member_details?.name }}</span>
                    </div>

                    <div class="flex justify-between">
                        <span class="text-gray-500">Member No</span>
                        <span class="font-medium">{{ data?.member_details?.member_no }}</span>
                    </div>

                    <div class="flex justify-between">
                        <span class="text-gray-500">Savings</span>
                        <span class="font-semibold text-blue-600">
                            {{ formatCurrency(data?.member_details?.savings_account.balance) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Loan Request -->
            <div class="bg-gray-50 rounded-xl p-4 border">
                <h2 class="font-semibold text-sm mb-3 text-gray-700">
                    Loan Request
                </h2>

                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-500">Term</span>
                        <span class="font-medium">{{ data?.requested_term }} months</span>
                    </div>

                    <div class="flex justify-between">
                        <span class="text-gray-500">Purpose</span>
                        <span class="font-medium">{{ data?.purpose }}</span>
                    </div>

                    <div class="flex justify-between">
                        <span class="text-gray-500">Repayment</span>
                        <span class="font-medium">{{ data?.repayment_source }}</span>
                    </div>

                    <div class="flex justify-between">
                        <span class="text-gray-500">Officer</span>
                        <span class="font-medium">{{ data?.loan_officer_name }}</span>
                    </div>
                </div>
            </div>

        </div>

        <!-- Product Details -->
        <div class="mt-5 bg-gray-50 rounded-xl p-4 border">
            <h2 class="font-semibold text-sm mb-3 text-gray-700">
                Loan Product Details
            </h2>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <p class="text-gray-500 text-xs">Product</p>
                    <p class="font-medium">{{ data?.loan_product_details?.name }}</p>
                </div>

                <div>
                    <p class="text-gray-500 text-xs">Interest</p>
                    <p class="font-medium">
                        {{ data?.loan_product_details?.interest_rate }}% / month
                    </p>
                </div>

                <div>
                    <p class="text-gray-500 text-xs">Method</p>
                    <p class="font-medium">{{ data?.loan_product_details?.interest_method }}</p>
                </div>

                <div>
                    <p class="text-gray-500 text-xs">Repayment</p>
                    <p class="font-medium">{{ data?.loan_product_details?.repayment_structure }}</p>
                </div>
            </div>
        </div>

        <!-- Charges -->
        <div class="mt-5">
            <h2 class="font-semibold text-sm mb-2 text-gray-700">
                Charges
            </h2>

            <table class="w-full text-sm border rounded-xl overflow-hidden">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="px-3 py-2 text-left">Charge</th>
                        <th class="px-3 py-2 text-left">Type</th>
                        <th class="px-3 py-2 text-right">Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(charge, index) in data?.loan_product_details?.charges" :key="index" class="border-t">
                        <td class="px-3 py-2">{{ charge.name }}</td>
                        <td class="px-3 py-2 capitalize">{{ charge.charge_type }}</td>
                        <td class="px-3 py-2 text-right font-medium">
                            <span v-if="charge.charge_type === 'percentage'">
                                {{ charge.value }}%
                            </span>
                            <span v-else>
                                {{ formatCurrency(charge.value) }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Signature -->
        <div class="mt-10 grid grid-cols-2 gap-10 text-center">
            <div>
                <div class="border-t border-gray-400 mt-10 border-dashed"></div>
                <p class="mt-2 text-sm text-gray-600">Member Signature</p>
            </div>

            <div>
                <div class="border-t border-gray-400 mt-10 border-dashed"></div>
                <p class="mt-2 text-sm text-gray-600">Authorized Signature</p>
            </div>
        </div>

    </div>
</template>