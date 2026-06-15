import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { render, screen, fireEvent } from '../../test/utils'
import { useUIState, useUIDispatch } from '../../contexts/UIContext'
import { useFilterState } from '../../contexts/FilterContext'
import { useDataDispatch } from '../../contexts/DataContext'
import { AdvancedOptions } from './AdvancedOptions'
import type { LocationPoint } from '../../types'

// ---------------------------------------------------------------------------
// Helper — reads advancedOptionsOpen from real UIContext and renders it
// ---------------------------------------------------------------------------

function AdvancedOptionsStateDisplay() {
  const { advancedOptionsOpen } = useUIState()
  return <span data-testid="advanced-options-open">{String(advancedOptionsOpen)}</span>
}

// ---------------------------------------------------------------------------
// Helper — reads velocityThreshold from real FilterContext and renders it
// ---------------------------------------------------------------------------

function FilterStateDisplay() {
  const { velocityThreshold } = useFilterState()
  return <span data-testid="velocity-threshold">{velocityThreshold}</span>
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
// Helper — lets tests inject points into DataContext
// ---------------------------------------------------------------------------

function DataDispatchCapture({
  onDispatch,
}: {
  onDispatch: (d: ReturnType<typeof useDataDispatch>) => void
}) {
  const dispatch = useDataDispatch()
  onDispatch(dispatch)
  return null
}

function makePoint(speed: number | null): LocationPoint {
  return { lat: 51.5, lng: -0.1, timestamp: 1_000_000, speed }
}

// ---------------------------------------------------------------------------
// Helper — open the advanced options panel
// ---------------------------------------------------------------------------

function openPanel() {
  act(() => {
    screen.getByRole('button', { name: /advanced options/i }).click()
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdvancedOptions', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a button labelled "Advanced Options"', () => {
    render(<AdvancedOptions />)
    expect(screen.getByRole('button', { name: /advanced options/i })).toBeInTheDocument()
  })

  it('is collapsed by default — slider not in DOM', () => {
    render(<AdvancedOptions />)
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
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
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()

    // Click to open
    openPanel()

    // State reflected via real UIContext — slider now in DOM
    expect(screen.getByTestId('advanced-options-open').textContent).toBe('true')
    expect(screen.getByRole('slider')).toBeInTheDocument()
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
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
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

    expect(screen.getByRole('slider')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: /advanced options/i })
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('when advancedOptionsOpen is false: panel body is not in DOM', () => {
    render(<AdvancedOptions />)
    // Default state is false
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    const button = screen.getByRole('button', { name: /advanced options/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  // ---------------------------------------------------------------------------
  // Slider-specific tests
  // ---------------------------------------------------------------------------

  it('slider renders with default threshold of 15 km/h when panel is opened', () => {
    render(<AdvancedOptions />)
    openPanel()

    const slider = screen.getByRole('slider')
    expect(slider).toHaveValue('15')
    // Value label shows current threshold
    expect(screen.getByText('15 km/h')).toBeInTheDocument()
  })

  it('slider has correct min, max and step attributes', () => {
    render(<AdvancedOptions />)
    openPanel()

    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('min', '5')
    expect(slider).toHaveAttribute('max', '120')
    expect(slider).toHaveAttribute('step', '1')
  })

  it('dragging the slider updates the local display value immediately', () => {
    vi.useFakeTimers()

    render(<AdvancedOptions />)
    openPanel()

    const slider = screen.getByRole('slider')

    act(() => {
      fireEvent.change(slider, { target: { value: '50' } })
    })

    // The displayed label should update immediately (no wait)
    expect(screen.getByText('50 km/h')).toBeInTheDocument()
    expect(slider).toHaveValue('50')
  })

  it('dispatches SET_VELOCITY_THRESHOLD after the 300ms debounce period', () => {
    vi.useFakeTimers()

    render(
      <>
        <FilterStateDisplay />
        <AdvancedOptions />
      </>,
    )

    openPanel()

    const slider = screen.getByRole('slider')

    act(() => {
      fireEvent.change(slider, { target: { value: '50' } })
    })

    // Context should NOT have updated yet (debounce still pending)
    expect(screen.getByTestId('velocity-threshold').textContent).toBe('15')

    // Advance timers past the debounce threshold
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Now the context should be updated
    expect(screen.getByTestId('velocity-threshold').textContent).toBe('50')
  })

  it('does NOT dispatch on every drag frame — only after debounce settles', () => {
    vi.useFakeTimers()

    render(
      <>
        <FilterStateDisplay />
        <AdvancedOptions />
      </>,
    )

    openPanel()

    const slider = screen.getByRole('slider')

    // Simulate rapid dragging
    act(() => {
      fireEvent.change(slider, { target: { value: '30' } })
      fireEvent.change(slider, { target: { value: '60' } })
      fireEvent.change(slider, { target: { value: '90' } })
    })

    // Context still unchanged — debounce hasn't fired
    expect(screen.getByTestId('velocity-threshold').textContent).toBe('15')

    // Advance past debounce
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Should dispatch the LAST value only
    expect(screen.getByTestId('velocity-threshold').textContent).toBe('90')
  })

  it('exclusion count label renders and shows 0 when no data is loaded', () => {
    render(<AdvancedOptions />)
    openPanel()

    // No data points, so exclusion count should be 0
    expect(screen.getByText(/0 points would be excluded/i)).toBeInTheDocument()
  })

  it('exclusion count reflects only the velocity threshold against the full dataset', () => {
    let dataDispatch!: ReturnType<typeof useDataDispatch>

    render(
      <>
        <DataDispatchCapture onDispatch={(d) => (dataDispatch = d)} />
        <AdvancedOptions />
      </>,
    )

    // Seed points: 2 with null speed, 1 slow (5 km/h), 1 fast (60 km/h)
    act(() => {
      dataDispatch({
        type: 'APPEND_BATCH',
        payload: [makePoint(null), makePoint(null), makePoint(5), makePoint(60)],
      })
    })

    openPanel()

    // At default threshold=15, only the 60 km/h point is excluded (60 > 15)
    expect(screen.getByText(/1 point would be excluded/i)).toBeInTheDocument()
  })

  it('exclusion count updates immediately when slider is dragged', () => {
    vi.useFakeTimers()

    let dataDispatch!: ReturnType<typeof useDataDispatch>

    render(
      <>
        <DataDispatchCapture onDispatch={(d) => (dataDispatch = d)} />
        <AdvancedOptions />
      </>,
    )

    // Seed: speeds [10, 20, 30, 40, 50]
    act(() => {
      dataDispatch({
        type: 'APPEND_BATCH',
        payload: [makePoint(10), makePoint(20), makePoint(30), makePoint(40), makePoint(50)],
      })
    })

    openPanel()

    const slider = screen.getByRole('slider')

    // At default threshold=15, values >15 are [20,30,40,50] → 4 excluded
    expect(screen.getByText(/4 points would be excluded/i)).toBeInTheDocument()

    // Drag to 35 — values >35 are [40,50] → 2 excluded
    act(() => {
      fireEvent.change(slider, { target: { value: '35' } })
    })

    // Count should update immediately, no timer needed
    expect(screen.getByText(/2 points would be excluded/i)).toBeInTheDocument()
  })
})
