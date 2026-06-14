import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test/utils'
import { useUIState } from './UIContext'

function Consumer() {
  const state = useUIState()
  return <div>{state.screen}</div>
}

describe('UIContext', () => {
  it('has default screen of upload', () => {
    render(<Consumer />)
    expect(screen.getByText('upload')).toBeTruthy()
  })

  it('throws a descriptive error when used outside UIProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Consumer />, { wrapper: undefined })).toThrow(
      'useUIState must be used within a UIProvider',
    )

    consoleSpy.mockRestore()
  })
})
