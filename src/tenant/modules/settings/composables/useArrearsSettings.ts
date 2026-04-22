import { ref, reactive } from 'vue'
import { toast } from 'vue-sonner'
import { loanSettingsApi } from '@/tenant/apis/settings/loanSettingsApi'

interface ArrearsSettingsForm {
  auto_penalty: boolean
  penalty_grace_days: number
  penalty_type: 'flat' | 'percentage'
  penalty_rate: number
  penalty_applies_to: 'outstanding_balance' | 'principal_due' | 'installment_due'
}

export function useArrearsSettings() {
  const showDrawer = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const hasLoaded = ref(false)
  const baseline = ref('')

  const form = reactive<ArrearsSettingsForm>({
    auto_penalty: false,
    penalty_grace_days: 0,
    penalty_type: 'percentage',
    penalty_rate: 0,
    penalty_applies_to: 'outstanding_balance',
  })

  function toPayload(): ArrearsSettingsForm {
    return {
      auto_penalty: Boolean(form.auto_penalty),
      penalty_grace_days: Number(form.penalty_grace_days ?? 0),
      penalty_type: form.penalty_type,
      penalty_rate: Number(form.penalty_rate ?? 0),
      penalty_applies_to: form.penalty_applies_to,
    }
  }

  function snapshot(value: ArrearsSettingsForm): string {
    return JSON.stringify(value)
  }

  async function openDrawer() {
    showDrawer.value = true
    await fetchSettings()
  }

  function closeDrawer() {
    showDrawer.value = false
  }

  async function fetchSettings(force = false) {
    if (loading.value) return
    if (!force && hasLoaded.value) return

    loading.value = true
    try {
      const res = await loanSettingsApi.get({ force })
      if (res.data?.data) {
        const data = res.data.data as any
        if (data.auto_penalty !== undefined) form.auto_penalty = data.auto_penalty
        if (data.penalty_grace_days !== undefined)
          form.penalty_grace_days = data.penalty_grace_days
        if (data.penalty_type !== undefined) form.penalty_type = data.penalty_type
        if (data.penalty_rate !== undefined) form.penalty_rate = data.penalty_rate
        if (data.penalty_applies_to !== undefined)
          form.penalty_applies_to = data.penalty_applies_to
        baseline.value = snapshot(toPayload())
        hasLoaded.value = true
      }
    } catch {
      toast.error('Failed to load arrears settings.')
    } finally {
      loading.value = false
    }
  }

  async function save() {
    if (saving.value) return

    const payload = toPayload()
    if (baseline.value && snapshot(payload) === baseline.value) {
      closeDrawer()
      return
    }

    saving.value = true
    try {
      const res = await loanSettingsApi.update(payload)
      if (res.data?.data) {
        const data = res.data.data as any
        Object.assign(form, {
          auto_penalty: data.auto_penalty ?? form.auto_penalty,
          penalty_grace_days: data.penalty_grace_days ?? form.penalty_grace_days,
          penalty_type: data.penalty_type ?? form.penalty_type,
          penalty_rate: data.penalty_rate ?? form.penalty_rate,
          penalty_applies_to: data.penalty_applies_to ?? form.penalty_applies_to,
        })
        baseline.value = snapshot(toPayload())
        hasLoaded.value = true
      }
      toast.success('Arrears settings saved successfully.')
      closeDrawer()
    } catch {
      toast.error('Failed to save arrears settings.')
    } finally {
      saving.value = false
    }
  }

  return {
    showDrawer,
    loading,
    saving,
    form,
    fetchSettings,
    openDrawer,
    closeDrawer,
    save,
  }
}
