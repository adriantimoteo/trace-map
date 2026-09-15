import { describe, it, expect } from 'vitest'
import { toISODate, isPresetAvailable } from './dateRangeUtils'

describe('toISODate', () => {
  it('formats a local Date as "YYYY-MM-DD"', () => {
    expect(toISODate(new Date(2023, 0, 5))).toBe('2023-01-05')
  })

  it('pads single-digit month and day', () => {
    expect(toISODate(new Date(2023, 8, 9))).toBe('2023-09-09')
  })

  it('handles December correctly', () => {
    expect(toISODate(new Date(2023, 11, 31))).toBe('2023-12-31')
  })
})

describe('isPresetAvailable', () => {
  it('returns true when the span exactly equals the requested months', () => {
    expect(isPresetAvailable(12, new Date(2022, 0, 1), new Date(2023, 0, 1))).toBe(true)
  })

  it('returns false when the span is shorter than requested months', () => {
    expect(isPresetAvailable(12, new Date(2023, 0, 1), new Date(2023, 6, 1))).toBe(false)
  })
})
