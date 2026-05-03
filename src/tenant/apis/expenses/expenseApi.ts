import { fetchTableData, formDataFormat } from '@/Global'
import { notify } from '@/Global/Toasters'
import { pomPinia } from 'septor-store'

export function useExpenseApi() {
  const Store = pomPinia()

  function isSuccessResponse(response: any): boolean {
    if (!response || response?.error) return false
    const code = Number(response?.code)
    if (!Number.isNaN(code) && code > 0) return code >= 200 && code < 300
    return true
  }

  function extractErrorMessage(response: any): string {
    if (response?.error?.response?.data?.message) return response.error.response.data.message
    if (response?.error?.response?.data?.error) return response.error.response.data.error
    if (response?.error?.response?.data?.errors) {
      const firstError = Object.values(response.error.response.data.errors)?.[0] as any
      if (Array.isArray(firstError) && firstError[0]) return String(firstError[0])
    }
    if (response?.error?.message) return response.error.message
    return 'Request failed. Please try again.'
  }

  function emitFeedback(response: any, successMessage: string, failMessage: string) {
    if (isSuccessResponse(response)) {
      notify({ type: 'success', msg: successMessage })
      return
    }

    const details = extractErrorMessage(response)
    notify({ type: 'error', msg: details || failMessage })
  }

  async function createExpense(data: any) {
    const response = await fetchTableData({
      data: formDataFormat(data),
      Store,
      props: {
        url: '/expenses',
        method: 'post',
        time: 0,
        state: 'expenseList',
      },
    })
    emitFeedback(response, 'Expense recorded successfully.', 'Failed to record expense.')
    return response
  }

  async function updateExpense(id: number | string, data: any) {
    const response = await fetchTableData({
      data: formDataFormat(data),
      Store,
      props: {
        url: `/expenses/${id}`,
        method: 'put',
        time: 0,
        state: 'expenseList',
      },
    })
    emitFeedback(response, 'Expense updated successfully.', 'Failed to update expense.')
    return response
  }

  async function voidExpense(id: number | string) {
    const response = await fetchTableData({
      data: {},
      Store,
      props: {
        url: `/expenses/${id}/void`,
        method: 'post',
        time: 0,
        state: 'expenseList',
      },
    })
    emitFeedback(response, 'Expense voided successfully.', 'Failed to void expense.')
    return response
  }

  async function getExpenseStats() {
    const response = await fetchTableData({
      data: {},
      Store,
      props: {
        url: '/expenses/stats',
        method: 'get',
        time: 0,
        state: 'expenseStats',
      },
    })
    return response.payload
  }

  async function createExpenseCategory(data: any) {
    const response = await fetchTableData({
      data: formDataFormat(data),
      Store,
      props: {
        url: '/expenses/categories',
        method: 'post',
        time: 0,
        state: 'expenseCategoryList',
      },
    })
    emitFeedback(response, 'Expense category created successfully.', 'Failed to create expense category.')
    return response
  }

  async function approveExpense(id: number | string) {
    const response = await fetchTableData({
      data: {},
      Store,
      props: {
        url: `/expenses/${id}/approve`,
        method: 'put',
        time: 0,
        state: 'expenseList',
      },
    })
    emitFeedback(response, 'Expense approved successfully.', 'Failed to approve expense.')
    return response
  }

  async function payExpense(id: number | string, data: any) {
    const response = await fetchTableData({
      data: formDataFormat(data),
      Store,
      props: {
        url: `/expenses/${id}/pay`,
        method: 'put',
        time: 0,
        state: 'expenseList',
      },
    })
    emitFeedback(response, 'Expense payment recorded successfully.', 'Failed to record expense payment.')
    return response
  }

  return {
    createExpense,
    updateExpense,
    voidExpense,
    getExpenseStats,
    createExpenseCategory,
    approveExpense,
    payExpense,
  }
}
