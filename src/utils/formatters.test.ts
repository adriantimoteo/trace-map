import { describe, it, expect } from 'vitest'
import { formatFileSize, formatDateRange } from './formatters'

describe('formatFileSize', () => {
  it('formats 0 bytes as "0 KB"', () => {
    expect(formatFileSize(0)).toBe('0 KB')
  })

  it('formats 500 bytes as "0 KB" (rounds down to nearest KB)', () => {
    expect(formatFileSize(500)).toBe('0 KB')
  })

  it('formats 1_048_576 bytes as "1.0 MB"', () => {
    expect(formatFileSize(1_048_576)).toBe('1.0 MB')
  })

  it('formats 1_500_000 bytes as ~"1.4 MB"', () => {
    expect(formatFileSize(1_500_000)).toBe('1.4 MB')
  })

  it('formats 1_073_741_824 bytes as "1.00 GB"', () => {
    expect(formatFileSize(1_073_741_824)).toBe('1.00 GB')
  })

  it('formats 2_400_000_000 bytes as ~"2.24 GB"', () => {
    expect(formatFileSize(2_400_000_000)).toBe('2.24 GB')
  })
})

describe('formatDateRange', () => {
  it('formats a min/max Date pair as "MMM D, YYYY – MMM D, YYYY"', () => {
    const min = new Date(2023, 0, 1) // Jan 1, 2023 (local)
    const max = new Date(2024, 11, 31) // Dec 31, 2024 (local)
    expect(formatDateRange(min, max)).toBe('Jan 1, 2023 – Dec 31, 2024')
  })

  it('formats a same-day range with both dates equal', () => {
    const day = new Date(2023, 5, 15) // Jun 15, 2023 (local)
    expect(formatDateRange(day, day)).toBe('Jun 15, 2023 – Jun 15, 2023')
  })
})
