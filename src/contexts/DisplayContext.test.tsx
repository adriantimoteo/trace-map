import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test/utils'
import { useDisplayState } from './DisplayContext'

function Consumer() {
  const state = useDisplayState()
  return (
    <div>
      <span data-testid="radius">{state.radius}</span>
      <span data-testid="intensity">{state.intensity}</span>
    </div>
  )
}

describe('DisplayContext', () => {
  it('has default radius of 20 and intensity of 0.5', () => {
    render(<Consumer />)
    expect(screen.getByTestId('radius').textContent).toBe('20')
    expect(screen.getByTestId('intensity').textContent).toBe('0.5')
  })

  it('throws a descriptive error when used outside DisplayProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Consumer />, { wrapper: undefined })).toThrow(
      'useDisplayState must be used within a DisplayProvider',
    )

    consoleSpy.mockRestore()
  })
})
