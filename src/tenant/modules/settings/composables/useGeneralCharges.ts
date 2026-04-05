import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { tenantClient } from '@/tenant/apis/tenantClient'
import { savingsProductsApi } from '@/tenant/apis/savingsProducts/api'
import type { GeneralCharge } from '../types'

const emptyForm = () => ({
  is_revenue: '',
  name: '',
  application: '',
  saving_product_ids: [] as string[],
  loan_product_ids: [] as string[],
  charge_type: '',
  amount: 0,
  credit_account_id: '',
  where_to_apply: 'loans',
  is_fine: '',
  interval_type: '',
  interval: 1 as string | number,
})

export function useGeneralCharges() {
  // ─── List ─────────────────────────────────────────────────────────────────
  const charges = ref<GeneralCharge[]>([])
  const loading = ref(false)
  const toggling = ref<number | null>(null)
  const reversibleToggling = ref<number | null>(null)
  const deleting = ref<number | null>(null)

  async function fetch() {
    loading.value = true
    try {
      const res = await tenantClient.get('/general-charges')
      charges.value = res.data?.data ?? []
    } catch {
      toast.error('Failed to load charges.')
    } finally {
      loading.value = false
    }
  }

  async function toggleActive(charge: GeneralCharge) {
    toggling.value = charge.id
    try {
      const res = await tenantClient.patch(`/general-charges/${charge.id}/toggle`)
      const updated = res.data?.data
      const idx = charges.value.findIndex(c => c.id === charge.id)
      if (idx !== -1) charges.value[idx] = updated
    } catch {
      toast.error('Failed to toggle charge.')
    } finally {
      toggling.value = null
    }
  }

  async function toggleReversible(charge: GeneralCharge) {
    reversibleToggling.value = charge.id
    try {
      const res = await tenantClient.patch(`/general-charges/${charge.id}/toggle-reversible`)
      const updated = res.data?.data
      const idx = charges.value.findIndex(c => c.id === charge.id)
      if (idx !== -1) charges.value[idx] = updated
    } catch {
      toast.error('Failed to toggle reversible.')
    } finally {
      reversibleToggling.value = null
    }
  }

  async function remove(charge: GeneralCharge) {
    if (!confirm(`Delete charge "${charge.name}"? This cannot be undone.`)) return
    deleting.value = charge.id
    try {
      await tenantClient.delete(`/general-charges/${charge.id}`)
      charges.value = charges.value.filter(c => c.id !== charge.id)
      toast.success('Charge deleted.')
    } catch {
      toast.error('Failed to delete charge.')
    } finally {
      deleting.value = null
    }
  }

  function applicationLabel(app: string): string {
    const map: Record<string, string> = {
      on_registration: 'On Registration',
      on_shares: 'On Shares',
      on_loan_application: 'On Loan Application',
      other: 'Other',
    }
    return map[app] ?? app
  }

  // ─── Options ──────────────────────────────────────────────────────────────
  const savingProductOptions = ref<{ id: string | number; name: string }[]>([])
  const loanProductOptions = ref<{ id: string | number; name: string }[]>([])
  const creditAccountOptions = ref<{ id: string | number; name: string }[]>([])

  async function fetchOptions() {
    try {
      const [savRes, coaRes, loanRes] = await Promise.allSettled([
        savingsProductsApi.list(),
        tenantClient.get('/chart-of-accounts', {
          params: { list: true, account_type: 'INCOME', is_postable: true },
        }),
        tenantClient.post('/global/loan-products'),
      ])

      if (savRes.status === 'fulfilled') {
        const sp = savRes.value.data?.data ?? savRes.value.data ?? []
        savingProductOptions.value = Array.isArray(sp)
          ? sp.map((p: any) => ({ id: p.id, name: p.name ?? 'Product ' + p.id }))
          : []
      }

      if (coaRes.status === 'fulfilled') {
        const coa = coaRes.value.data?.payload?.data ?? coaRes.value.data?.data ?? coaRes.value.data ?? []
        creditAccountOptions.value = Array.isArray(coa)
          ? coa.map((a: any) => ({
              id: a.id,
              name: a.gl_code ? `${a.gl_code} - ${a.name}` : (a.name ?? 'Account ' + a.id),
            }))
          : []
        
        // Auto-select the first available income account if nothing is selected
        if (!form.value.credit_account_id && creditAccountOptions.value.length > 0) {
          form.value.credit_account_id = creditAccountOptions.value[0].id as any
        }
      }

      if (loanRes.status === 'fulfilled') {
        const lp = loanRes.value.data?.payload?.data ?? loanRes.value.data?.data ?? loanRes.value.data ?? []
        loanProductOptions.value = Array.isArray(lp)
          ? lp.map((p: any) => ({ id: p.id, name: p.name ?? 'Loan ' + p.id }))
          : []
      }
    } catch (err) {
      console.error('Error fetching charge options:', err)
    }
  }

  // ─── Add / Edit form ──────────────────────────────────────────────────────
  const showDrawer = ref(false)
  const editingCharge = ref<GeneralCharge | null>(null)
  const form = ref(emptyForm())
  const processing = ref(false)
  const errors = ref<Record<string, string>>({})

  function openAddDrawer() {
    editingCharge.value = null
    form.value = emptyForm()
    errors.value = {}
    showDrawer.value = true
  }

  function openEditDrawer(charge: GeneralCharge) {
    editingCharge.value = charge
    form.value = {
      is_revenue: (charge as any).is_revenue ? 'yes' : 'no',
      name: charge.name,
      application: charge.application,
      saving_product_ids: (charge as any).saving_product_ids ?? [],
      loan_product_ids: (charge as any).loan_product_ids ?? [],
      charge_type: charge.charge_type ?? '',
      amount: Number(charge.amount),
      credit_account_id: (charge as any).credit_account_id ?? '',
      where_to_apply: charge.where_to_apply ?? 'loans',
      is_fine: (charge as any).is_fine ? 'yes' : 'no',
      interval_type: (charge as any).interval_type ?? '',
      interval: (charge as any).interval ?? 1,
    }
    errors.value = {}
    showDrawer.value = true
  }

  function closeDrawer() {
    editingCharge.value = null
    showDrawer.value = false
    errors.value = {}
  }

  async function submit() {
    errors.value = {}
    processing.value = true
    try {
      if (editingCharge.value) {
        const res = await tenantClient.put(`/general-charges/${editingCharge.value.id}`, form.value)
        const updated = res.data?.data
        const idx = charges.value.findIndex(c => c.id === editingCharge.value!.id)
        if (idx !== -1) charges.value[idx] = updated
        toast.success('Charge updated successfully.')
      } else {
        await tenantClient.post('/general-charges', form.value)
        toast.success('Charge added successfully.')
        fetch()
      }
      closeDrawer()
    } catch (err: any) {
      const data = err?.response?.data
      if (data?.errors) {
        errors.value = Object.fromEntries(
          Object.entries(data.errors as Record<string, string[]>).map(([k, v]) => [k, v[0] ?? ''])
        )
        toast.error('Please fix the errors below.')
      } else {
        toast.error(data?.message ?? 'Failed to save charge.')
      }
    } finally {
      processing.value = false
    }
  }

  return {
    charges, loading, toggling, reversibleToggling, deleting,
    fetch, toggleActive, toggleReversible, remove, applicationLabel,
    savingProductOptions, loanProductOptions, creditAccountOptions, fetchOptions,
    showDrawer, editingCharge, form, processing, errors,
    openAddDrawer, openEditDrawer, closeDrawer, submit,
  }
}
