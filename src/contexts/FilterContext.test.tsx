import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test/utils'
import { useFilterState } from './FilterContext'

function Consumer() {
  const state = useFilterState()
  return (
    <div>
      <span data-testid="velocityEnabled">{String(state.velocityEnabled)}</span>
      <span data-testid="velocityThreshold">{state.velocityThreshold}</span>
    </div>
  )
}

describe('FilterContext', () => {
  it('has default velocityEnabled of false and velocityThreshold of 15', () => {
    render(<Consumer />)
    expect(screen.getByTestId('velocityEnabled').textContent).toBe('false')
    expect(screen.getByTestId('velocityThreshold').textContent).toBe('15')
  })

  it('throws a descriptive error when used outside FilterProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Consumer />, { wrapper: undefined })).toThrow(
      'useFilterState must be used within a FilterProvider',
    )

    consoleSpy.mockRestore()
  })
})
