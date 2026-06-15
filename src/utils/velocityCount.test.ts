import { describe, it, expect } from 'vitest'
import { countExcludedAtThreshold } from './velocityCount'

describe('countExcludedAtThreshold', () => {
  it('returns 0 for an empty array', () => {
    expect(countExcludedAtThreshold([], 15)).toBe(0)
  })

  it('returns 0 when all speeds are below the threshold', () => {
    expect(countExcludedAtThreshold([5, 10, 14], 15)).toBe(0)
  })

  it('returns 0 when all speeds are at exactly the threshold (boundary: = is NOT excluded)', () => {
    expect(countExcludedAtThreshold([15, 15, 15], 15)).toBe(0)
  })

  it('returns the full array length when all speeds are above the threshold', () => {
    expect(countExcludedAtThreshold([20, 30, 50, 100], 15)).toBe(4)
  })

  it('returns the correct count for a mixed array', () => {
    // sortedSpeeds: [5, 10, 15, 20, 60]
    // threshold 15 → exclude only those > 15 → [20, 60] → 2
    expect(countExcludedAtThreshold([5, 10, 15, 20, 60], 15)).toBe(2)
  })

  it('boundary: value exactly equal to threshold is NOT excluded (filter is > not >=)', () => {
    // sortedSpeeds: [14, 15, 16]
    // threshold 15 → only 16 is > 15 → excluded count = 1
    expect(countExcludedAtThreshold([14, 15, 16], 15)).toBe(1)
  })

  it('returns 0 when threshold is above all speeds', () => {
    expect(countExcludedAtThreshold([5, 10, 15, 20], 120)).toBe(0)
  })

  it('returns array length when threshold is below all speeds', () => {
    expect(countExcludedAtThreshold([10, 20, 30], 5)).toBe(3)
  })

  it('handles a single-element array — element equals threshold (not excluded)', () => {
    expect(countExcludedAtThreshold([15], 15)).toBe(0)
  })

  it('handles a single-element array — element above threshold (excluded)', () => {
    expect(countExcludedAtThreshold([16], 15)).toBe(1)
  })

  it('handles duplicate speeds around the threshold', () => {
    // sortedSpeeds: [15, 15, 15, 16, 16]
    // threshold 15 → only values > 15 are excluded → [16, 16] → 2
    expect(countExcludedAtThreshold([15, 15, 15, 16, 16], 15)).toBe(2)
  })
})
