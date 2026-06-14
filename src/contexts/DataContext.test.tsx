import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test/utils'
import { useDataState, useDataDispatch } from './DataContext'

function Consumer() {
  const state = useDataState()
  return <div>{state.status}</div>
}

function DispatchConsumer() {
  useDataDispatch()
  return <div>ok</div>
}

describe('DataContext', () => {
  it('renders with default status of idle', () => {
    render(<Consumer />)
    expect(screen.getByText('idle')).toBeTruthy()
  })

  it('throws a descriptive error when used outside DataProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Consumer />, { wrapper: undefined })).toThrow(
      'useDataState must be used within a DataProvider',
    )

    consoleSpy.mockRestore()
  })

  it('useDataDispatch throws a descriptive error when used outside DataProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<DispatchConsumer />, { wrapper: undefined })).toThrow(
      'useDataDispatch must be used within a DataProvider',
    )

    consoleSpy.mockRestore()
  })
})
