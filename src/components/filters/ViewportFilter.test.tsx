import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { render, screen } from '../../test/utils'
import { ViewportFilter } from './ViewportFilter'
import { useFilterState } from '../../contexts/FilterContext'

// ---------------------------------------------------------------------------
// Consumer component — reads viewportEnabled from real FilterContext
// ---------------------------------------------------------------------------

function ViewportStateDisplay() {
  const { viewportEnabled } = useFilterState()
  return <span data-testid="viewportEnabled">{String(viewportEnabled)}</span>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ViewportFilter', () => {
  it('renders a checkbox labelled "Filter to visible area"', () => {
    render(<ViewportFilter />)
    const checkbox = screen.getByRole('checkbox', { name: /filter to visible area/i })
    expect(checkbox).toBeInTheDocument()
  })

  it('checkbox is checked by default (viewport filter on)', () => {
    render(<ViewportFilter />)
    const checkbox = screen.getByRole('checkbox', { name: /filter to visible area/i })
    expect(checkbox).toBeChecked()
  })

  it('unchecking the box dispatches SET_VIEWPORT_ENABLED: false — reflected in FilterContext state', () => {
    render(
      <>
        <ViewportFilter />
        <ViewportStateDisplay />
      </>,
    )
    expect(screen.getByTestId('viewportEnabled').textContent).toBe('true')

    const checkbox = screen.getByRole('checkbox', { name: /filter to visible area/i })
    act(() => {
      checkbox.click()
    })

    expect(screen.getByTestId('viewportEnabled').textContent).toBe('false')
    expect(checkbox).not.toBeChecked()
  })

  it('re-checking dispatches SET_VIEWPORT_ENABLED: true — reflected in FilterContext state', () => {
    render(
      <>
        <ViewportFilter />
        <ViewportStateDisplay />
      </>,
    )

    const checkbox = screen.getByRole('checkbox', { name: /filter to visible area/i })

    // Uncheck first (starts checked)
    act(() => {
      checkbox.click()
    })
    expect(screen.getByTestId('viewportEnabled').textContent).toBe('false')

    // Now re-check
    act(() => {
      checkbox.click()
    })
    expect(screen.getByTestId('viewportEnabled').textContent).toBe('true')
    expect(checkbox).toBeChecked()
  })

  it('does not throw when map is null (MapContext default) and the box is toggled', () => {
    // MapContext starts with map=null in the AllProviders test wrapper.
    // Toggling the viewport filter should succeed and the bounds dispatch is safely skipped.
    render(
      <>
        <ViewportFilter />
        <ViewportStateDisplay />
      </>,
    )
    const checkbox = screen.getByRole('checkbox', { name: /filter to visible area/i })

    expect(() => {
      act(() => {
        checkbox.click()
      })
    }).not.toThrow()

    expect(screen.getByTestId('viewportEnabled').textContent).toBe('false')
  })
})
