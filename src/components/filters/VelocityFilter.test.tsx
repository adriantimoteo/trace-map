import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { render, screen, fireEvent } from '../../test/utils'
import { useFilterState, useFilterDispatch } from '../../contexts/FilterContext'
import { VelocityFilter } from './VelocityFilter'

// ---------------------------------------------------------------------------
// Helper components to capture / expose context state inside AllProviders
// ---------------------------------------------------------------------------

/** Renders a text node showing the current velocityEnabled value as a string */
function VelocityEnabledDisplay() {
  const { velocityEnabled } = useFilterState()
  return <div data-testid="velocity-enabled">{String(velocityEnabled)}</div>
}

/** Renders a text node showing the current velocityThreshold value */
function VelocityThresholdDisplay() {
  const { velocityThreshold } = useFilterState()
  return <div data-testid="velocity-threshold">{String(velocityThreshold)}</div>
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

/** Render VelocityFilter inside AllProviders with optional state consumers. */
function renderVelocityFilter({ showStateDisplay = false }: { showStateDisplay?: boolean } = {}) {
  let filterDispatch!: ReturnType<typeof useFilterDispatch>

  const utils = render(
    <>
      <FilterDispatchCapture onDispatch={(d) => (filterDispatch = d)} />
      {showStateDisplay && <VelocityEnabledDisplay />}
      {showStateDisplay && <VelocityThresholdDisplay />}
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
  it('renders "Off" radio selected by default', () => {
    renderVelocityFilter()

    const offRadio = screen.getByRole('radio', { name: 'Off' })
    expect(offRadio).toBeInTheDocument()
    expect(offRadio).toBeChecked()
  })

  it('renders "On" radio unchecked by default', () => {
    renderVelocityFilter()

    // Find all radios — Off and On
    const onRadio = screen.getByRole('radio', { name: /^On —/ })
    expect(onRadio).toBeInTheDocument()
    expect(onRadio).not.toBeChecked()
  })

  it('"On" label displays the current threshold value (default 15 km/h)', () => {
    renderVelocityFilter()

    expect(screen.getByText('On — 15 km/h')).toBeInTheDocument()
  })

  it('clicking "On" radio dispatches SET_VELOCITY_ENABLED: true — verified via real provider', () => {
    renderVelocityFilter({ showStateDisplay: true })

    // Initial state: Off
    expect(screen.getByTestId('velocity-enabled').textContent).toBe('false')

    act(() => {
      fireEvent.click(screen.getByRole('radio', { name: /^On —/ }))
    })

    // DOM reflects state change via real context
    expect(screen.getByTestId('velocity-enabled').textContent).toBe('true')
    expect(screen.getByRole('radio', { name: /^On —/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Off' })).not.toBeChecked()
  })

  it('clicking "Off" radio dispatches SET_VELOCITY_ENABLED: false — verified via real provider', () => {
    const { getFilterDispatch } = renderVelocityFilter({ showStateDisplay: true })

    // Pre-enable the filter so we can test turning it off
    act(() => {
      getFilterDispatch()({ type: 'SET_VELOCITY_ENABLED', payload: true })
    })

    expect(screen.getByTestId('velocity-enabled').textContent).toBe('true')

    act(() => {
      fireEvent.click(screen.getByRole('radio', { name: 'Off' }))
    })

    expect(screen.getByTestId('velocity-enabled').textContent).toBe('false')
    expect(screen.getByRole('radio', { name: 'Off' })).toBeChecked()
    expect(screen.getByRole('radio', { name: /^On —/ })).not.toBeChecked()
  })

  it('threshold label updates reactively when velocityThreshold changes in context', () => {
    const { getFilterDispatch } = renderVelocityFilter()

    // Default threshold is 15 km/h
    expect(screen.getByText('On — 15 km/h')).toBeInTheDocument()

    // Update threshold to 30 km/h via dispatch
    act(() => {
      getFilterDispatch()({ type: 'SET_VELOCITY_THRESHOLD', payload: 30 })
    })

    expect(screen.getByText('On — 30 km/h')).toBeInTheDocument()
    expect(screen.queryByText('On — 15 km/h')).not.toBeInTheDocument()
  })
})
