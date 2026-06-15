import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { render, screen } from '../../test/utils'
import { useUIState, useUIDispatch } from '../../contexts/UIContext'
import { AdvancedOptions } from './AdvancedOptions'

// ---------------------------------------------------------------------------
// Helper — reads advancedOptionsOpen from real UIContext and renders it
// ---------------------------------------------------------------------------

function AdvancedOptionsStateDisplay() {
  const { advancedOptionsOpen } = useUIState()
  return <span data-testid="advanced-options-open">{String(advancedOptionsOpen)}</span>
}

// ---------------------------------------------------------------------------
// Helper — lets tests pre-set advancedOptionsOpen via dispatch
// ---------------------------------------------------------------------------

function UIDispatchCapture({
  onDispatch,
}: {
  onDispatch: (d: ReturnType<typeof useUIDispatch>) => void
}) {
  const dispatch = useUIDispatch()
  onDispatch(dispatch)
  return null
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdvancedOptions', () => {
  it('renders a button labelled "Advanced Options"', () => {
    render(<AdvancedOptions />)
    expect(screen.getByRole('button', { name: /advanced options/i })).toBeInTheDocument()
  })

  it('is collapsed by default — panel body not in DOM', () => {
    render(<AdvancedOptions />)
    expect(screen.queryByText(/advanced options coming soon/i)).not.toBeInTheDocument()
  })

  it('header button has aria-expanded="false" when collapsed', () => {
    render(<AdvancedOptions />)
    const button = screen.getByRole('button', { name: /advanced options/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking the header dispatches TOGGLE_ADVANCED_OPTIONS — panel body appears in DOM', () => {
    render(
      <>
        <AdvancedOptionsStateDisplay />
        <AdvancedOptions />
      </>,
    )

    // Initially collapsed
    expect(screen.getByTestId('advanced-options-open').textContent).toBe('false')
    expect(screen.queryByText(/advanced options coming soon/i)).not.toBeInTheDocument()

    // Click to open
    act(() => {
      screen.getByRole('button', { name: /advanced options/i }).click()
    })

    // State reflected via real UIContext — body now in DOM
    expect(screen.getByTestId('advanced-options-open').textContent).toBe('true')
    expect(screen.getByText(/advanced options coming soon/i)).toBeInTheDocument()
  })

  it('clicking the header a second time collapses the panel again', () => {
    render(
      <>
        <AdvancedOptionsStateDisplay />
        <AdvancedOptions />
      </>,
    )

    const button = screen.getByRole('button', { name: /advanced options/i })

    act(() => {
      button.click()
    })
    expect(screen.getByTestId('advanced-options-open').textContent).toBe('true')

    act(() => {
      button.click()
    })
    expect(screen.getByTestId('advanced-options-open').textContent).toBe('false')
    expect(screen.queryByText(/advanced options coming soon/i)).not.toBeInTheDocument()
  })

  it('when advancedOptionsOpen is true in context: panel body is visible in DOM', () => {
    let uiDispatch!: ReturnType<typeof useUIDispatch>

    render(
      <>
        <UIDispatchCapture onDispatch={(d) => (uiDispatch = d)} />
        <AdvancedOptions />
      </>,
    )

    // Pre-open via dispatch (simulating context already being open)
    act(() => {
      uiDispatch({ type: 'TOGGLE_ADVANCED_OPTIONS' })
    })

    expect(screen.getByText(/advanced options coming soon/i)).toBeInTheDocument()
    const button = screen.getByRole('button', { name: /advanced options/i })
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('when advancedOptionsOpen is false: panel body is not in DOM', () => {
    render(<AdvancedOptions />)
    // Default state is false
    expect(screen.queryByText(/advanced options coming soon/i)).not.toBeInTheDocument()
    const button = screen.getByRole('button', { name: /advanced options/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })
})
