import { fetchTableData, formDataFormat } from '@/Global'
import { notify } from '@/Global/Toasters'
import { pomPinia } from 'septor-store'

interface ApiResponse {
  data?: unknown;
  payload?: unknown;
  code?: number;
  error?: {
    response?: {
      data?: {
        message?: string;
        error?: string;
        errors?: Record<string, string[]>;
      };
    };
    message?: string;
  };
}

export function useExpenseApi() {
  const Store = pomPinia()

  function isSuccessResponse(response: ApiResponse): boolean {
    if (!response || response?.error) return false
    const code = Number(response?.code)
    if (!Number.isNaN(code) && code > 0) return code >= 200 && code < 300
    return true
  }

  function extractErrorMessage(response: ApiResponse): string {
    const errorData = response?.error?.response?.data
    if (errorData?.message) return errorData.message
    if (errorData?.error) return errorData.error
    if (errorData?.errors) {
      const firstError = Object.values(errorData.errors)?.[0]
      if (Array.isArray(firstError) && firstError[0]) return String(firstError[0])
    }
    if (response?.error?.message) return response.error.message
    return 'Request failed. Please try again.'
  }

  function emitFeedback(response: ApiResponse, successMessage: string, failMessage: string) {
    if (isSuccessResponse(response)) {
      notify({ type: 'success', msg: successMessage })
      return
    }

    const details = extractErrorMessage(response)
    notify({ type: 'error', msg: details || failMessage })
  }

  async function createExpense(data: Record<string, unknown>) {
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
    emitFeedback(response as ApiResponse, 'Expense recorded successfully.', 'Failed to record expense.')
    return response
  }

  async function updateExpense(id: number | string, data: Record<string, unknown>) {
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
    emitFeedback(response as ApiResponse, 'Expense updated successfully.', 'Failed to update expense.')
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
    emitFeedback(response as ApiResponse, 'Expense voided successfully.', 'Failed to void expense.')
    return response
  }

  async function getExpenseDetail(id: number | string) {
    const response = await fetchTableData({
      data: {},
      Store,
      props: {
        url: `/expenses/${id}`,
        method: 'get',
        time: 0,
        state: 'expenseDetail',
      },
    })
    return (response as ApiResponse).payload
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
    return (response as ApiResponse).payload
  }

  async function getExpenseCategories() {
    const response = await fetchTableData({
      data: {},
      Store,
      props: {
        url: '/expenses/categories',
        method: 'get',
        time: 0,
        state: 'expenseCategoryList',
      },
    })
    return response as ApiResponse
  }

  async function createExpenseCategory(data: Record<string, unknown>) {
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
    emitFeedback(response as ApiResponse, 'Expense category created successfully.', 'Failed to create expense category.')
    return response
  }

  async function approveExpense(id: number | string, data: Record<string, unknown> = {}) {
    const response = await fetchTableData({
      data: formDataFormat(data),
      Store,
      props: {
        url: `/expenses/${id}/approve`,
        method: 'put',
        time: 0,
        state: 'expenseList',
      },
    })
    emitFeedback(response as ApiResponse, 'Expense approved successfully.', 'Failed to approve expense.')
    return response
  }

  async function payExpense(id: number | string, data: Record<string, unknown>) {
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
    emitFeedback(response as ApiResponse, 'Expense payment recorded successfully.', 'Failed to record expense payment.')
    return response
  }

  async function getExpenseBudgets(fiscalYear: string) {
    const response = await fetchTableData({
      data: {},
      Store,
      props: {
        url: `/expenses/budgets?fiscal_year=${fiscalYear}`,
        method: 'get',
        time: 0,
        state: 'expenseBudgetList',
      },
    })
    return response as ApiResponse
  }

  async function allocateExpenseBudgets(allocations: Record<string, unknown>[]) {
    const formData = new FormData()
    allocations.forEach((alloc, index) => {
      Object.entries(alloc).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(`allocations[${index}][${key}]`, String(value))
        }
      })
    })

    const response = await fetchTableData({
      data: formData,
      Store,
      props: {
        url: '/expenses/budgets',
        method: 'post',
        time: 0,
        state: 'expenseBudgets',
      },
    })
    return response as ApiResponse
  }

  async function rejectExpense(id: number | string, comments: string) {
    const response = await fetchTableData({
      data: { comments },
      Store,
      props: {
        url: `/expenses/${id}/reject`,
        method: 'post',
        time: 0,
        state: 'expenseList',
      },
    })
    emitFeedback(response as ApiResponse, 'Expense rejected.', 'Failed to reject expense.')
    return response
  }

  async function queryExpense(id: number | string, comments: string) {
    const response = await fetchTableData({
      data: { comments },
      Store,
      props: {
        url: `/expenses/${id}/query`,
        method: 'post',
        time: 0,
        state: 'expenseList',
      },
    })
    emitFeedback(response as ApiResponse, 'Expense queried.', 'Failed to query expense.')
    return response
  }

  async function checkBudget(categoryId: number | string, amount: number, transactionDate: string | null = null) {
    let url = `/expenses/budgets/check?expense_category_id=${categoryId}&amount=${amount}`
    if (transactionDate) url += `&transaction_date=${transactionDate}`
    
    const response = await fetchTableData({
      data: {},
      Store,
      props: {
        url,
        method: 'get',
        time: 0,
        state: 'budgetCheck',
      },
    })
    return (response as ApiResponse).payload
  }

  async function getApprovalPath(amount: number, isOverBudget: boolean = false) {
    const response = await fetchTableData({
      data: {},
      Store,
      props: {
        url: `/expenses/thresholds/path?amount=${amount}&is_over_budget=${isOverBudget}`,
        method: 'get',
        time: 0,
        state: 'approvalPath',
      },
    })
    return (response as ApiResponse).payload
  }

  async function getExpenseLedger(period: string) {
    const response = await fetchTableData({
      data: {},
      Store,
      props: {
        url: `/expenses/reports/ledger?period=${period}`,
        method: 'get',
        time: 0,
        state: 'expenseLedger',
      },
    })
    return (response as ApiResponse).payload
  }

  async function getBudgetVariance(fiscalYear: string, period: string) {
    const response = await fetchTableData({
      data: {},
      Store,
      props: {
        url: `/expenses/reports/variance?fiscal_year=${fiscalYear}&period=${period}`,
        method: 'get',
        time: 0,
        state: 'budgetVariance',
      },
    })
    return (response as ApiResponse).payload
  }

  async function getUnreconciledExpenses() {
    const response = await fetchTableData({
      data: {},
      Store,
      props: {
        url: '/expenses/reports/unreconciled',
        method: 'get',
        time: 0,
        state: 'unreconciledExpenses',
      },
    })
    return (response as ApiResponse).payload
  }

  async function getBranchBreakdown(period: string) {
    const response = await fetchTableData({
      data: {},
      Store,
      props: {
        url: `/expenses/reports/branch-breakdown?period=${period}`,
        method: 'get',
        time: 0,
        state: 'branchBreakdown',
      },
    })
    return (response as ApiResponse).payload
  }

  async function getIEExtract(fiscalYear: string) {
    const response = await fetchTableData({
      data: {},
      Store,
      props: {
        url: `/expenses/reports/ie-extract?fiscal_year=${fiscalYear}`,
        method: 'get',
        time: 0,
        state: 'ieExtract',
      },
    })
    return (response as ApiResponse).payload
  }

  async function getTBContribution(asOf: string) {
    const response = await fetchTableData({
      data: {},
      Store,
      props: {
        url: `/expenses/reports/tb-contribution?as_of=${asOf}`,
        method: 'get',
        time: 0,
        state: 'tbContribution',
      },
    })
    return (response as ApiResponse).payload
  }

  return {
    createExpense,
    updateExpense,
    voidExpense,
    getExpenseDetail,
    getExpenseStats,
    getExpenseCategories,
    createExpenseCategory,
    approveExpense,
    payExpense,
    getExpenseBudgets,
    allocateExpenseBudgets,
    rejectExpense,
    queryExpense,
    checkBudget,
    getApprovalPath,
    getExpenseLedger,
    getBudgetVariance,
    getUnreconciledExpenses,
    getBranchBreakdown,
    getIEExtract,
    getTBContribution,
  }
}
