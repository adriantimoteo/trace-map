import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test/utils'
import { useDataState } from './DataContext'

function Consumer() {
  const state = useDataState()
  return <div>{state.status}</div>
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
})
