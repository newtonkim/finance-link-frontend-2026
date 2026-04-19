import { ref } from 'vue'
import { chartOfAccountsApi } from '@/tenant/apis/chartOfAccounts/chartOfAccountsApi'
import { savingsProductsApi, type SavingsProduct } from '@/tenant/apis/savingsProducts/api'

export function useProductFormSupport() {
  const chartAccounts = ref<Array<{ id: number; name: string; code: string }>>([])
  const savingsProductList = ref<SavingsProduct[]>([])

  async function loadSupportingData() {
    try {
      const [coaRes, productsRes] = await Promise.all([
        chartOfAccountsApi.list({ list: 1 }),
        savingsProductsApi.list(),
      ])
      chartAccounts.value = coaRes.data?.data ?? []
      savingsProductList.value = productsRes.data?.data ?? []
    } catch {
      // non-fatal — dropdowns show empty
    }
  }

  return { chartAccounts, savingsProductList, loadSupportingData }
}
