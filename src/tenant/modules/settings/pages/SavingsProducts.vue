<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Landmark, Plus, Trash2, Edit, ChevronLeft, Eye } from 'lucide-vue-next'
import { savingsProductsApi, type SavingsProduct } from '../../../apis/savingsProducts/api'
import SavingsProductChargesModal from '../components/SavingsProductChargesModal.vue'
import { toast } from 'vue-sonner'
import { Spinner } from '@/Global'

const products = ref<SavingsProduct[]>([])
const loading = ref(true)

const selectedProductForCharges = ref<SavingsProduct | null>(null)
const showChargesModal = ref(false)

const loadProducts = async () => {
    loading.value = true
    try {
        const response = await savingsProductsApi.list()
        products.value = response.data.data
    } catch (error) {
        toast.error('Failed to load savings products')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadProducts()
})

const deleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this savings product?')) return

    try {
        await savingsProductsApi.delete(id)
        toast.success('Savings product deleted successfully')
        loadProducts()
    } catch (error) {
        toast.error('Failed to delete savings product')
    }
}

const openChargesModal = (product: SavingsProduct) => {
    selectedProductForCharges.value = product
    showChargesModal.value = true
}
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <RouterLink to="/tenant/settings/savings" class="mr-2 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition">
                <ChevronLeft class="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </RouterLink>
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Landmark class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div class="flex-1">
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Savings Products List</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage rules and configurations for savings products</p>
            </div>

            <RouterLink to="/tenant/settings/savings-products/create"
                class="flex items-center gap-2 rounded-lg  bg-nfuko-primary dark:bg-nfuko-yellow px-4 py-2 text-sm font-medium text-white dark: text-nfuko-primary hover: bg-nfuko-primary/90 dark:hover:bg-nfuko-yellow/90 transition-colors shadow-sm">
                <Plus class="h-4 w-4" />
                <span>Create Product</span>
            </RouterLink>
        </div>

        <div class="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm text-neutral-500 dark:text-neutral-400">
                    <thead class="bg-neutral-50 text-xs uppercase text-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400">
                        <tr>
                            <th scope="col" class="px-6 py-4 font-semibold">Name</th>
                            <th scope="col" class="px-6 py-4 font-semibold">Type</th>
                            <th scope="col" class="px-6 py-4 font-semibold">Min Balance</th>
                            <th scope="col" class="px-6 py-4 font-semibold text-center">Status</th>
                            <th scope="col" class="px-6 py-4 font-semibold text-center">Charges</th>
                            <th scope="col" class="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="6" class="px-6 py-10 text-center">
                                <div class="flex items-center justify-center gap-2 text-sm text-neutral-500">
                                    <Spinner class="h-4 w-4" />
                                    Loading savings products...
                                </div>
                            </td>
                        </tr>
                        <tr v-else-if="products.length === 0">
                            <td colspan="6" class="px-6 py-8 text-center text-neutral-500">No savings products found. Click "Create Product" to add one.</td>
                        </tr>
                        <tr v-for="product in products" :key="product.id" class="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50 transition-colors">
                            <td class="whitespace-nowrap px-6 py-4 font-medium text-neutral-900 dark:text-white">
                                {{ product.name }}
                            </td>
                            <td class="whitespace-nowrap px-6 py-4 capitalize">
                                {{ product.type }}
                            </td>
                            <td class="whitespace-nowrap px-6 py-4">
                                {{ Number(product.minimum_balance).toLocaleString() }}
                            </td>
                            <td class="whitespace-nowrap px-6 py-4 text-center">
                                <span :class="[
                                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                    product.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400'
                                ]">
                                    {{ product.status }}
                                </span>
                            </td>
                            <td class="whitespace-nowrap px-6 py-4 text-center">
                                <button @click="openChargesModal(product)" class="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline">
                                    <Eye class="h-3.5 w-3.5" />
                                    <span>View ({{ (product.charges?.length || 0) + (product.monthly_fee_enabled ? 1 : 0) }})</span>
                                </button>
                            </td>
                            <td class="whitespace-nowrap px-6 py-4 text-right">
                                <div class="flex items-center justify-end gap-2">
                                    <RouterLink :to="`/tenant/settings/savings-products/${product.id}/edit`" class="p-1.5 text-neutral-500 hover: text-nfuko-primary dark:hover:text-bg-nfuko-yellow transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                        <Edit class="h-4 w-4" />
                                    </RouterLink>
                                    <button @click="deleteProduct(product.id!)" class="p-1.5 text-neutral-500 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                        <Trash2 class="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <SavingsProductChargesModal
            :is-open="showChargesModal"
            :product="selectedProductForCharges"
            @close="showChargesModal = false"
        />
    </div>
</template>
