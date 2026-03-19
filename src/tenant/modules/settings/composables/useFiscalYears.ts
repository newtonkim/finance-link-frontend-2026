import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { fiscalYearsApi } from '@/tenant/apis/fiscalYears/fiscalYearsApi'
import type { FiscalYear, Meta } from '../types'

export function useFiscalYears() {
  // ─── List state ───────────────────────────────────────────────────────────
  const showListDrawer = ref(false)
  const years = ref<FiscalYear[]>([])
  const meta = ref<Meta>({ current_page: 1, last_page: 1, total: 0 })
  const loading = ref(false)
  const search = ref('')
  let searchTimer: ReturnType<typeof setTimeout> | null = null

  const pages = computed(() =>
    Array.from({ length: meta.value.last_page }, (_, i) => i + 1)
  )

  async function fetch(page = 1) {
    loading.value = true
    try {
      const res = await fiscalYearsApi.list({ search: search.value || undefined, page })
      years.value = res.data?.data ?? []
      if (res.data?.meta) meta.value = res.data.meta
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load financial years.')
    } finally {
      loading.value = false
    }
  }

  watch(search, () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => fetch(1), 400)
  })

  function openListDrawer() {
    showListDrawer.value = true
    fetch(1)
  }

  function closeListDrawer() {
    showListDrawer.value = false
    search.value = ''
  }

  // ─── Add / Edit form ─────────────────────────────────────────────────────
  const showForm = ref(false)
  const formMode = ref<'add' | 'edit'>('add')
  const editId = ref(0)
  const processing = ref(false)
  const errors = ref<Record<string, any>>({})
  const form = ref({ name: '', start_date: '', end_date: '' })

  // Auto-calculate end date from start date
  watch(() => form.value.start_date, (val) => {
    if (!val) { form.value.end_date = ''; return }
    try {
      const start = new Date(val)
      const month = start.getMonth()
      const day = start.getDate()
      const year = start.getFullYear()
      if (month === 0 && day === 1) {
        form.value.end_date = `${year}-12-31`
      } else if (month === 5 && day === 1) {
        form.value.end_date = `${year}-07-31`
      } else {
        form.value.end_date = ''
      }
    } catch {
      form.value.end_date = ''
    }
  })

  function openAddForm() {
    formMode.value = 'add'
    editId.value = 0
    errors.value = {}
    form.value = { name: '', start_date: '', end_date: '' }
    showForm.value = true
  }

  function openEditForm(fy: FiscalYear) {
    formMode.value = 'edit'
    editId.value = fy.id
    errors.value = {}
    form.value = { name: fy.name, start_date: fy.start_date, end_date: fy.end_date }
    showForm.value = true
  }

  function closeForm() {
    showForm.value = false
    errors.value = {}
  }

  async function submitForm() {
    processing.value = true
    errors.value = {}

    const duplicate = years.value.find((fy) => {
      if (formMode.value === 'edit' && fy.id === editId.value) return false
      return fy.start_date === form.value.start_date && fy.end_date === form.value.end_date
    })
    if (duplicate) {
      toast.error(`Financial year with this date range already exists (${duplicate.name}).`)
      processing.value = false
      return
    }

    try {
      if (formMode.value === 'edit') {
        await fiscalYearsApi.update(editId.value, form.value)
        toast.success('Financial year updated successfully.')
      } else {
        await fiscalYearsApi.store(form.value)
        toast.success('Financial year created successfully.')
      }
      showForm.value = false
      await fetch(meta.value.current_page)
    } catch (err: any) {
      if (err?.response?.status === 422) {
        errors.value = err.response.data.errors || {}
      } else {
        toast.error(err?.response?.data?.message ?? 'Failed to save financial year.')
      }
    } finally {
      processing.value = false
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  const showDeleteDialog = ref(false)
  const deleteTarget = ref<FiscalYear | null>(null)

  function openDeleteDialog(fy: FiscalYear) {
    deleteTarget.value = fy
    showDeleteDialog.value = true
  }

  async function confirmDelete() {
    if (!deleteTarget.value) return
    try {
      await fiscalYearsApi.destroy(deleteTarget.value.id)
      toast.success('Financial year deleted successfully.')
      await fetch(meta.value.current_page)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete financial year.')
    } finally {
      showDeleteDialog.value = false
      deleteTarget.value = null
    }
  }

  function formatDate(d: string) {
    return d || '—'
  }

  return {
    showListDrawer, years, meta, loading, search, pages,
    fetch, openListDrawer, closeListDrawer,
    showForm, formMode, editId, processing, errors, form,
    openAddForm, openEditForm, closeForm, submitForm,
    showDeleteDialog, deleteTarget, openDeleteDialog, confirmDelete,
    formatDate,
  }
}
