<script setup>
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import { formatCurrency, getLocalValues, Table } from '@/Global'
import { transaferApi } from '@/tenant/apis'

const api = transaferApi()

const response = ref({})
const details = computed(() => response.value || {})


const transferList = computed(() => {
    return details.value?.transfer || []
})

const transactionList = computed(() => {
    return details.value?.transactionList || []
})

const detailsTable = computed(() => {
    if (!details.value) return []

    return [ 
        {
            field: 'Transfer From Product',
            value: details.value?.transfer_from_product
        },
        {
            field: 'Transfer To Product',
            value: details.value?.transfer_to_product
        },
        {
            field: 'From Product Code',
            value: details.value?.from_product_code
        },
        {
            field: 'To Product Code',
            value: details.value?.to_product_code
        },
        {
            field: 'branch details',
            value: details.value?.branch_details
        },
        {
            field: 'Narration',
            value: details.value?.narration || details.value?.natation
        },
        {
            field: 'Created By',
            value: details.value?.created_by
        },
        {
            field: 'Created At',
            value: details.value?.created_at
        },
          {
            field: 'Transaction Date',
            value: details.value?.transaction_date
        },
    ]
})


const detailColumns = [
    {
        key: 'field',
        label: 'Field',
        width: '18em',
        sticky: 'left'
    },
    {
        key: 'value',
        label: 'Value',
        width: '25em'
    }
]


const transfercolumns = [

    {
        key: 'code',
        label: 'Transfer Code',
        sticky: 'left',
        width: '14em',
        copy: true
    },
    {
        key: 'from_member_name',
        label: 'Member',
        width: '16em'
    },
    {
        key: 'from_account_code',
        label: 'Transfer From',
        width: '14em',
        copy: true
    },
    {
        key: 'to_account_code',
        label: 'Transfer From',
        width: '14em',
        copy: true
    },
    {
        key: 'status',
        label: 'status',
        type: 'status'
    },

    {
        key: 'transfer_amount',
        label: 'Amount',
        type: 'money'
    },
    {
        key: 'account_balance',
        label: 'Balance',
        type: 'money'
    },

    {
        key: 'created_at',
        label: 'Created At',
        type: 'date',
        width: '14em'
    }
]


const columns = [
    {
        key: 'reference',
        label: 'Reference',
        sticky: 'left',
        width: '14em',
        copy: true
    },
    {
        key: 'transaction_type',
        label: 'Transaction Type',
        width: '14em'
    },
    {
        key: 'amount',
        label: 'Amount',
        type: 'money'
    },
    {
        key: 'charge',
        label: 'Charge',
        type: 'money' 
    },
    {
        key: 'transfer_form_product',
        label: 'From Product',
        width: '14em'
    },
    {
        key: 'transfer_to_product',
        label: 'To Product',
        width: '15em'
    },
    {
        key: 'created_by',
        label: 'Created By',
        width: '15em'
    },
    {
        key: 'completed_at',
        label: 'Completed At',
        type: 'date',
        width: '14em'
    },
    {
        key: 'created_at',
        label: 'Created At',
        type: 'date',
        width: '14em'
    }
]

const initials = computed(() => {
    return `${details.value?.member_name || ''}`
        .split(' ')
        .map(i => i[0])
        .join('')
        .substring(0, 2)
})


const currency = (value) => {
return formatCurrency(value)
}


async function init() {
    const result = await api.fullTranferDetails(
        getLocalValues('transaferDetails')
    )

    response.value = result || {}
}

onBeforeMount(() => {
    init()
})
const statCards = computed(() => [
    {
        label: 'Transfer Amount',
        value: currency(details.value?.transfer_amount),
        class: 'text-2xl'
    },
    {
        label: 'Total Transfer',
        value: currency(details.value?.total_transfer),
        class: 'text-2xl'
    },
    {
        label: 'Current Balance',
        value: currency(details.value?.account_balance),
        class: 'text-2xl'
    },
    {
        label: 'Status',
        value: details.value?.status || 'N/A',
        class: 'text-2xl capitalize'
    }
])

</script>

<template>
    <div class="space-y-4 mt-2">

        <div
            class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

            <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">

                <div class="flex items-center gap-4">

                    <div
                        class="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-2xl font-bold uppercase text-neutral-600 dark:bg-neutral-800 dark:text-neutral-200">
                        <img v-if="details.to_member_image" :src="details?.to_member_image" alt="Avatar"
                            class="rounded-full border-2 border-white" />
                        <span v-else>{{ initials }}</span>
                    </div>

                    <div>
                        <h2 class="text-xl font-semibold text-neutral-900 dark:text-white">
                            {{ details?.member_name || 'N/A' }}
                        </h2>

                        <p class="text-sm text-neutral-500 py-1">
                            Member Code :
                            <span
                                class=" rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{{
                                    details?.member_code || 'N/A' }}</span>

                        </p>
                        <p class="text-sm  text-neutral-500 ">
                            Reference Code : <span
                                class=" rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{{
                                    details?.code || 'N/A' }}</span>
                        </p>


                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 lg:min-w-[450px]">

                    <div
                        class="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">

                        <p class="text-sm text-neutral-500">
                            Transfer Amount
                        </p>

                        <h3 class="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
                            {{ currency(details?.transfer_amount) }}
                        </h3>
                    </div>

                    <div
                        class="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">

                        <p class="text-sm text-neutral-500">
                            Account Balance
                        </p>

                        <h3 class="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
                            {{ currency(details?.account_balance) }}
                        </h3>
                    </div>

                </div>

            </div>
        </div>

    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">

        <div
            v-for="(item, index) in statCards"
            :key="index"
            class="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

            <p class="text-sm text-neutral-500">
                {{ item.label }}
            </p>

            <h2
                class="mt-2 font-bold text-neutral-900 dark:text-white"
                :class="item.class">

                {{ item.value }}
            </h2>
        </div>

    </div>

        <div
            class="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

            <div class="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">

                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                    Full Transfer Details
                </h3>
            </div>

            <Table :dataFilter="detailsTable" :columns="detailColumns" />
        </div>

        <div
            class="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

            <div class="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">

                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                    Transfer History
                </h3>
            </div>

            <Table :dataFilter="transferList" :columns="transfercolumns" />
        </div>

        <div
            class="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

            <div class="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">

                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                    Transaction History
                </h3>
            </div>

            <Table :dataFilter="transactionList" :columns="columns" />
        </div>

    </div>
</template>