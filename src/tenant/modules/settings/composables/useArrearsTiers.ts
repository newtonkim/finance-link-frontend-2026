import { ref, reactive, toRaw } from 'vue'
import { toast } from 'vue-sonner'
import { loanArrearsTiersApi, type LoanArrearsTier } from '@/tenant/apis/settings/loanArrearsTiersApi'

export function useArrearsTiers() {
  const loading = ref(false)
  const saving = ref(false)
  const isDrawerOpen = ref(false)
  const hasLoaded = ref(false)

  // Initialize with the 4 default tiers
  const tiers = ref<LoanArrearsTier[]>([
    {
      from_day: 0,
      to_day: 30,
      charge_type: 'percentage',
      charge_value: 0,
      applies_to: 'outstanding_balance',
      is_active: false,
    },
    {
      from_day: 31,
      to_day: 60,
      charge_type: 'percentage',
      charge_value: 0,
      applies_to: 'outstanding_balance',
      is_active: false,
    },
    {
      from_day: 61,
      to_day: 90,
      charge_type: 'percentage',
      charge_value: 0,
      applies_to: 'outstanding_balance',
      is_active: false,
    },
    {
      from_day: 91,
      to_day: null,
      charge_type: 'percentage',
      charge_value: 0,
      applies_to: 'outstanding_balance',
      is_active: false,
    },
  ])

  /**
   * Load existing tiers and merge them securely into our 4 default ranges.
   */
  async function loadTiers(force = false) {
    if (!force && hasLoaded.value) return

    loading.value = true
    try {
      const res = await loanArrearsTiersApi.get({ force })
      if (res.data?.data && res.data.data.length > 0) {
        const fetchedTiers = res.data.data

        // Merge fetched tiers into the correct ranges based on from_day
        fetchedTiers.forEach((fetchedTier) => {
          const index = tiers.value.findIndex((t) => t.from_day === fetchedTier.from_day)
          if (index !== -1) {
            tiers.value[index] = { ...tiers.value[index], ...fetchedTier }
          }
        })
      }
      hasLoaded.value = true
    } catch (error) {
      toast.error('Failed to load arrears tiers')
    } finally {
      loading.value = false
    }
  }

  async function save() {
    saving.value = true
    try {
      // Send the entire array as the payload
      const payload = { tiers: tiers.value.map(t => toRaw(t)) }
      await loanArrearsTiersApi.bulkUpdate(payload)
      
      toast.success('Arrears penalty tiers saved')
      closeDrawer()
    } catch (error) {
      toast.error('Failed to save arrears tiers')
    } finally {
      saving.value = false
    }
  }

  function openDrawer() {
    isDrawerOpen.value = true
    if (!hasLoaded.value) {
      loadTiers()
    }
  }

  function closeDrawer() {
    isDrawerOpen.value = false
  }

  return {
    loading,
    saving,
    isDrawerOpen,
    tiers,
    loadTiers,
    save,
    openDrawer,
    closeDrawer,
  }
}
