/* @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { APPLICATION_OPTIONS, WHERE_TO_APPLY_OPTIONS } from '../constants'

describe('charge option constants', () => {
  it('APPLICATION_OPTIONS no longer contains on_loan_application', () => {
    const ids = APPLICATION_OPTIONS.map((o) => o.id)
    expect(ids).not.toContain('on_loan_application')
  })

  it('APPLICATION_OPTIONS keeps on_shares, on_registration, other', () => {
    const ids = APPLICATION_OPTIONS.map((o) => o.id)
    expect(ids).toEqual(expect.arrayContaining(['on_shares', 'on_registration', 'other']))
  })

  it('WHERE_TO_APPLY_OPTIONS no longer contains loans', () => {
    const ids = WHERE_TO_APPLY_OPTIONS.map((o) => o.id)
    expect(ids).not.toContain('loans')
  })

  it('WHERE_TO_APPLY_OPTIONS keeps savings and shares', () => {
    const ids = WHERE_TO_APPLY_OPTIONS.map((o) => o.id)
    expect(ids).toEqual(expect.arrayContaining(['savings', 'shares']))
  })
})
