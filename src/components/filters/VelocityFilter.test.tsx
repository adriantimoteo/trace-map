import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { render, screen } from '../../test/utils'
import { useFilterState, useFilterDispatch } from '../../contexts/FilterContext'
import { VelocityFilter } from './VelocityFilter'

// ---------------------------------------------------------------------------
// Helper components to capture / expose context state inside AllProviders
// ---------------------------------------------------------------------------

function VelocityEnabledDisplay() {
  const { velocityEnabled } = useFilterState()
  return <div data-testid="velocity-enabled">{String(velocityEnabled)}</div>
}

function FilterDispatchCapture({
  onDispatch,
}: {
  onDispatch: (d: ReturnType<typeof useFilterDispatch>) => void
}) {
  const dispatch = useFilterDispatch()
  onDispatch(dispatch)
  return null
}

function renderVelocityFilter({ showStateDisplay = false }: { showStateDisplay?: boolean } = {}) {
  let filterDispatch!: ReturnType<typeof useFilterDispatch>

  const utils = render(
    <>
      <FilterDispatchCapture onDispatch={(d) => (filterDispatch = d)} />
      {showStateDisplay && <VelocityEnabledDisplay />}
      <VelocityFilter />
    </>,
  )

  return {
    ...utils,
    getFilterDispatch: () => filterDispatch,
  }
}

// ---------------------------------------------------------------------------
// VelocityFilter unit tests
// ---------------------------------------------------------------------------

describe('VelocityFilter', () => {
  it('renders a switch labelled "Show In-Transit Points"', () => {
    renderVelocityFilter()
    expect(screen.getByRole('switch', { name: 'Show In-Transit Points' })).toBeInTheDocument()
  })

  it('switch is off by default (velocity filter active — in-transit points hidden)', () => {
    renderVelocityFilter({ showStateDisplay: true })

    const toggle = screen.getByRole('switch', { name: 'Show In-Transit Points' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    // velocityEnabled: true means the filter is active by default
    expect(screen.getByTestId('velocity-enabled').textContent).toBe('true')
  })

  it('turning the switch on dispatches SET_VELOCITY_ENABLED: false — reflected in FilterContext state', () => {
    renderVelocityFilter({ showStateDisplay: true })

    const toggle = screen.getByRole('switch', { name: 'Show In-Transit Points' })

    act(() => {
      toggle.click()
    })

    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('velocity-enabled').textContent).toBe('false')
  })

  it('turning the switch back off dispatches SET_VELOCITY_ENABLED: true — reflected in FilterContext state', () => {
    renderVelocityFilter({ showStateDisplay: true })

    const toggle = screen.getByRole('switch', { name: 'Show In-Transit Points' })

    act(() => {
      toggle.click() // on
    })
    act(() => {
      toggle.click() // off again
    })

    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByTestId('velocity-enabled').textContent).toBe('true')
  })

  it('reflects an externally-dispatched velocityEnabled change', () => {
    const { getFilterDispatch } = renderVelocityFilter()

    act(() => {
      getFilterDispatch()({ type: 'SET_VELOCITY_ENABLED', payload: false })
    })

    expect(screen.getByRole('switch', { name: 'Show In-Transit Points' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })
})
