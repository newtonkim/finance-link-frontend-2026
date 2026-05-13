/* @vitest-environment node */

import { describe, expect, it } from 'vitest'
import { levenshtein, isNearMatch } from '../levenshtein'

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('cash', 'cash')).toBe(0)
  })

  it('returns the number of single-character edits', () => {
    expect(levenshtein('cash', 'casm')).toBe(1)
    expect(levenshtein('cash', 'cashm')).toBe(1)
    expect(levenshtein('cash', 'csh')).toBe(1)
    expect(levenshtein('kitten', 'sitting')).toBe(3)
  })

  it('is case-insensitive after lowercasing inputs', () => {
    expect(levenshtein('CASH', 'cash')).toBe(0)
  })

  it('trims whitespace before comparing', () => {
    expect(levenshtein('  cash ', 'cash')).toBe(0)
  })
})

describe('isNearMatch', () => {
  it('returns true when needle is a case-insensitive substring of haystack', () => {
    expect(isNearMatch('sms', 'SMS Notification Fee')).toBe(true)
  })

  it('returns true when Levenshtein distance is <= 2', () => {
    expect(isNearMatch('SMS Notification Fee', 'SMS Notifcation Fee')).toBe(true)
  })

  it('returns false when neither rule matches', () => {
    expect(isNearMatch('Bank Charge', 'SMS Notification Fee')).toBe(false)
  })

  it('returns false for an exact-name match (caller wants near, not exact)', () => {
    expect(isNearMatch('SMS Notification Fee', 'SMS Notification Fee')).toBe(false)
  })

  it('ignores leading/trailing whitespace and case', () => {
    expect(isNearMatch('  sms  ', 'SMS Notification Fee')).toBe(true)
  })
})
