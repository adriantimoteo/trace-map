import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test/utils'
import { useUIState, useUIDispatch } from './UIContext'

function Consumer() {
  const state = useUIState()
  return <div>{state.screen}</div>
}

function DispatchConsumer() {
  useUIDispatch()
  return <div>ok</div>
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

  it('useUIDispatch throws a descriptive error when used outside UIProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<DispatchConsumer />, { wrapper: undefined })).toThrow(
      'useUIDispatch must be used within a UIProvider',
    )

    consoleSpy.mockRestore()
  })
})
