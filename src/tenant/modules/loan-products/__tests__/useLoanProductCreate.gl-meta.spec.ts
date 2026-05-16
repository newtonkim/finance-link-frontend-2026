/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest'

vi.mock('septor-store', () => ({ getBearerToken: () => null, pomPinia: () => ({}) }))
vi.mock('@/tenant/apis/tenantClient', () => ({
  tenantClient: { interceptors: { request: { use: vi.fn() } } },
}))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {} }),
  useRouter: () => ({ push: vi.fn() }),
}))

import { GL_FIELD_META } from '../composables/useLoanProductCreate'

describe('GL_FIELD_META', () => {
  it('contains exactly 8 entries', () => {
    expect(GL_FIELD_META).toHaveLength(8)
  })

  it('each entry has field, type, parent_gl_code, label, placeholder', () => {
    for (const m of GL_FIELD_META) {
      expect(m).toHaveProperty('field')
      expect(m).toHaveProperty('type')
      expect(m).toHaveProperty('parent_gl_code')
      expect(m).toHaveProperty('label')
      expect(m).toHaveProperty('placeholder')
    }
  })

  it('each entry has type ASSET or INCOME', () => {
    for (const m of GL_FIELD_META) {
      expect(['ASSET', 'INCOME']).toContain(m.type)
    }
  })

  it('parent_gl_code matches the canonical table (regression guard)', () => {
    const byField = Object.fromEntries(GL_FIELD_META.map((m) => [m.field, m.parent_gl_code]))
    expect(byField).toEqual({
      loan_portfolio_account_id: '11300',
      interest_income_account_id: '41100',
      interest_receivable_account_id: '11500',
      disbursement_account_id: '11100',
      penalty_income_account_id: '41400',
      penalty_receivable_account_id: '11600',
      charges_income_account_id: '42000',
      charges_receivable_account_id: '11700',
    })
  })

  it('fields cover every GL account on the form (regression guard)', () => {
    const fields = GL_FIELD_META.map((m) => m.field).sort()
    expect(fields).toEqual([
      'charges_income_account_id',
      'charges_receivable_account_id',
      'disbursement_account_id',
      'interest_income_account_id',
      'interest_receivable_account_id',
      'loan_portfolio_account_id',
      'penalty_income_account_id',
      'penalty_receivable_account_id',
    ])
  })
})
