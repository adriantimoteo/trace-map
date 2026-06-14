import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test/utils'
import { useDisplayState, useDisplayDispatch } from './DisplayContext'

function Consumer() {
  const state = useDisplayState()
  return (
    <div>
      <span data-testid="radius">{state.radius}</span>
      <span data-testid="intensity">{state.intensity}</span>
    </div>
  )
}

function DispatchConsumer() {
  useDisplayDispatch()
  return <div>ok</div>
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

  it('useDisplayDispatch throws a descriptive error when used outside DisplayProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<DispatchConsumer />, { wrapper: undefined })).toThrow(
      'useDisplayDispatch must be used within a DisplayProvider',
    )

    consoleSpy.mockRestore()
  })
})
