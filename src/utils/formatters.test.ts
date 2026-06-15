import { describe, it, expect } from 'vitest'
import { formatFileSize } from './formatters'

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
