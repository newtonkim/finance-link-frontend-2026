<script setup lang="ts">
import { CreditCard, Plus, Pencil, Trash2, Eye, ArrowLeft, Search, ToggleLeft, ToggleRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useLoanProducts } from '../composables/useLoanProducts'
import LoanProductDeleteDialog from '../components/LoanProductDeleteDialog.vue'

const router = useRouter()

const {
    products, loading, search, meta, pages,
    fetch,
    openCreate, openEdit,
    showDeleteDialog, deleteTarget, deleting,
    openDeleteDialog, confirmDelete,
    interestMethodLabel,
} = useLoanProducts()
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">

        <!-- Header -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <button
                    class="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    @click="router.back()"
                >
                    <ArrowLeft class="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                </button>
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <CreditCard class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Loan Products</h1>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage loan types and their configurations</p>
                </div>
            </div>
            <button
                class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white hover:bg-nfuko-primary/90 transition-colors dark:bg-bg-nfuko-yellow dark:text-black"
                @click="openCreate"
            >
                <Plus class="h-4 w-4" />
                New Product
            </button>
        </div>

        <!-- Search -->
        <div class="relative max-w-sm">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
                v-model="search"
                type="text"
                placeholder="Search loan products…"
                class="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
            />
        </div>

        <!-- Table -->
        <div class="rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <div v-if="loading" class="flex items-center justify-center py-16 text-sm text-neutral-400">
                Loading…
            </div>
            <div v-else-if="products.length === 0" class="flex flex-col items-center justify-center py-16 gap-2">
                <CreditCard class="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                <p class="text-sm text-neutral-500 dark:text-neutral-400">No loan products found.</p>
                <button
                    class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0 mt-2 text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline"
                    @click="openCreate"
                >
                    Create your first loan product
                </button>
            </div>
            <table v-else class="w-full text-sm">
                <thead class="border-b border-neutral-100 dark:border-neutral-800">
                    <tr class="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        <th class="px-6 py-3">Name</th>
                        <th class="px-6 py-3">Interest Method</th>
                        <th class="px-6 py-3">Interest Rate</th>
                        <th class="px-6 py-3">Duration</th>
                        <th class="px-6 py-3">Status</th>
                        <th class="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
                    <tr
                        v-for="product in products"
                        :key="product.id"
                        class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                        <td class="px-6 py-4 font-medium text-neutral-900 dark:text-white">{{ product.name }}</td>
                        <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ interestMethodLabel(product.interest_method) }}</td>
                        <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                            {{ product.interest_rate != null ? `${product.interest_rate}%` : '—' }}
                        </td>
                        <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                            {{ product.loan_duration != null ? `${product.loan_duration} ${product.duration_type ?? ''}` : '—' }}
                        </td>
                        <td class="px-6 py-4">
                            <span
                                class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                                :class="product.is_active
                                    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'"
                            >
                                <component :is="product.is_active ? ToggleRight : ToggleLeft" class="h-3 w-3" />
                                {{ product.is_active ? 'Active' : 'Inactive' }}
                            </span>
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex items-center justify-end gap-2">
                                <button
                                    class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    title="View"
                                    @click="router.push({ name: 'tenant-settings-loan-products-show', params: { id: product.id } })"
                                >
                                    <Eye class="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                                </button>
                                <button
                                    class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    title="Edit"
                                    @click="openEdit(product)"
                                >
                                    <Pencil class="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                                </button>
                                <button
                                    class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Delete"
                                    @click="openDeleteDialog(product)"
                                >
                                    <Trash2 class="h-4 w-4 text-red-500" />
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div v-if="meta.last_page > 1" class="flex items-center justify-center gap-1">
            <button
                v-for="page in pages"
                :key="page"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors"
                :class="page === meta.current_page
                    ? 'bg-nfuko-primary text-white dark:bg-bg-nfuko-yellow dark:text-black'
                    : 'hover:bg-neutral-100 text-neutral-600 dark:hover:bg-neutral-800 dark:text-neutral-400'"
                @click="fetch(page)"
            >
                {{ page }}
            </button>
        </div>

        <!-- Delete Dialog -->
        <LoanProductDeleteDialog
            :show="showDeleteDialog"
            :product-name="deleteTarget?.name"
            :deleting="deleting"
            @confirm="confirmDelete"
            @cancel="showDeleteDialog = false"
        />

    </div>
</template>
