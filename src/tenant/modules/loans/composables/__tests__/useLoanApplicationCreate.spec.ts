/* @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'

const api = vi.hoisted(() => ({ create: vi.fn(), submit: vi.fn() }))
const push = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('@/tenant/apis/loans/loanApplicationsApi', () => ({ loanApplicationsApi: api }))
vi.mock('@/tenant/apis/tenantClient', () => ({
  tenantClient: { get: vi.fn().mockResolvedValue({ data: {} }), post: vi.fn().mockResolvedValue({ data: {} }) },
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
vi.mock('vue-sonner', () => ({ toast }))
vi.mock('@/Global/Helpers', () => ({ getLocalValues: () => null, keysToUse: { activeBranch: 'branch' } }))
vi.mock('../useLoanApplicationForm', () => ({
  useLoanApplicationForm: () => ({
    form: ref({ member_id: 1, loan_product_id: 2 }),
    errors: ref({}),
    fetchProducts: vi.fn(),
    fetchMembers: vi.fn(),
  }),
}))

import { useLoanApplicationCreate } from '../useLoanApplicationCreate'

function setup() {
  let result!: ReturnType<typeof useLoanApplicationCreate>
  mount(defineComponent({
    setup() {
      result = useLoanApplicationCreate()
      return () => null
    },
  }))
  return result
}

function validationError(errors: Record<string, string[]>) {
  return { response: { status: 422, data: { message: Object.values(errors)[0][0], errors } } }
}

describe('useLoanApplicationCreate saveAndSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens the submitted application on success', async () => {
    api.create.mockResolvedValue({ data: { data: { id: 42 } } })
    api.submit.mockResolvedValue({})

    await setup().saveAndSubmit()

    expect(push).toHaveBeenCalledWith({ name: 'tenant-loans-show', params: { id: 42 } })
    expect(toast.success).toHaveBeenCalled()
  })

  it('opens the saved draft when submission is refused, so it is not saved twice', async () => {
    api.create.mockResolvedValue({ data: { data: { id: 42 } } })
    api.submit.mockRejectedValue(
      validationError({ guarantors: ['This loan needs at least 1 guarantor(s); 0 added.'] }),
    )

    const { saveAndSubmit, errors } = setup()
    await saveAndSubmit()

    expect(push).toHaveBeenCalledWith({ name: 'tenant-loans-show', params: { id: 42 } })
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('saved as a draft'), expect.objectContaining({
      description: 'This loan needs at least 1 guarantor(s); 0 added.',
    }))
    expect(errors.value).toEqual({})
  })

  it('stays on the form with field errors when the application could not be saved', async () => {
    const errs = { requested_amount: ['The requested amount is required.'] }
    api.create.mockRejectedValue(validationError(errs))

    const { saveAndSubmit, errors } = setup()
    await saveAndSubmit()

    expect(api.submit).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    expect(errors.value).toEqual(errs)
    expect(toast.error).toHaveBeenCalledWith('The requested amount is required.')
  })
})
