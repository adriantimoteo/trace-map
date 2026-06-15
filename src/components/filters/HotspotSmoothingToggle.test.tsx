import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { render, screen, fireEvent } from '../../test/utils'
import { HotspotSmoothingToggle } from './HotspotSmoothingToggle'
import { useDisplayState } from '../../contexts/DisplayContext'

// ---------------------------------------------------------------------------
// Helpers — reads state from real DisplayContext and renders it
// ---------------------------------------------------------------------------

function HotspotSmoothingDisplay() {
  const { hotspotSmoothing } = useDisplayState()
  return <div data-testid="hotspot-smoothing">{String(hotspotSmoothing)}</div>
}

function LogScaleDensityDisplay() {
  const { logScaleDensity } = useDisplayState()
  return <div data-testid="log-scale-density">{String(logScaleDensity)}</div>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HotspotSmoothingToggle', () => {
  it('renders unchecked by default', () => {
    render(<HotspotSmoothingToggle />)

    const checkbox = screen.getByRole('checkbox', { name: /smooth hotspots/i })
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()
  })

  it('clicking the checkbox dispatches TOGGLE_HOTSPOT_SMOOTHING and becomes checked', () => {
    render(
      <>
        <HotspotSmoothingDisplay />
        <HotspotSmoothingToggle />
      </>,
    )

    // Initial state via real provider
    expect(screen.getByTestId('hotspot-smoothing').textContent).toBe('false')

    act(() => {
      fireEvent.click(screen.getByRole('checkbox', { name: /smooth hotspots/i }))
    })

    // State reflected in both the display and the checkbox itself
    expect(screen.getByTestId('hotspot-smoothing').textContent).toBe('true')
    expect(screen.getByRole('checkbox', { name: /smooth hotspots/i })).toBeChecked()
  })

  it('clicking the checkbox twice returns it to unchecked', () => {
    render(
      <>
        <HotspotSmoothingDisplay />
        <HotspotSmoothingToggle />
      </>,
    )

    const checkbox = screen.getByRole('checkbox', { name: /smooth hotspots/i })

    act(() => {
      fireEvent.click(checkbox)
    })
    expect(checkbox).toBeChecked()

    act(() => {
      fireEvent.click(checkbox)
    })
    expect(checkbox).not.toBeChecked()
    expect(screen.getByTestId('hotspot-smoothing').textContent).toBe('false')
  })

  it('renders the description text', () => {
    render(<HotspotSmoothingToggle />)

    expect(
      screen.getByText(
        /caps color scale at 95th percentile density so frequently-visited spots don't drown out everything else/i,
      ),
    ).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// P6-02: Nested log-scale density toggle
// ---------------------------------------------------------------------------

describe('HotspotSmoothingToggle — log-scale density toggle', () => {
  it('log-scale toggle is disabled when hotspotSmoothing is false (default)', () => {
    render(<HotspotSmoothingToggle />)

    const logScaleCheckbox = screen.getByRole('checkbox', { name: /compress density curve/i })
    expect(logScaleCheckbox).toBeDisabled()
  })

  it('log-scale toggle is enabled when hotspotSmoothing is true', () => {
    render(<HotspotSmoothingToggle />)

    // Enable hotspot smoothing first
    act(() => {
      fireEvent.click(screen.getByRole('checkbox', { name: /smooth hotspots/i }))
    })

    const logScaleCheckbox = screen.getByRole('checkbox', { name: /compress density curve/i })
    expect(logScaleCheckbox).not.toBeDisabled()
  })

  it('clicking log-scale toggle when enabled dispatches TOGGLE_LOG_SCALE_DENSITY', () => {
    render(
      <>
        <LogScaleDensityDisplay />
        <HotspotSmoothingToggle />
      </>,
    )

    // Initial state
    expect(screen.getByTestId('log-scale-density').textContent).toBe('false')

    // Enable hotspot smoothing so the nested toggle is active
    act(() => {
      fireEvent.click(screen.getByRole('checkbox', { name: /smooth hotspots/i }))
    })

    // Click the log-scale toggle
    act(() => {
      fireEvent.click(screen.getByRole('checkbox', { name: /compress density curve/i }))
    })

    // State should now be true
    expect(screen.getByTestId('log-scale-density').textContent).toBe('true')
    expect(screen.getByRole('checkbox', { name: /compress density curve/i })).toBeChecked()
  })

  it('log-scale toggle is unchecked by default', () => {
    render(<HotspotSmoothingToggle />)

    const logScaleCheckbox = screen.getByRole('checkbox', { name: /compress density curve/i })
    expect(logScaleCheckbox).not.toBeChecked()
  })

  it('renders the log-scale description text', () => {
    render(<HotspotSmoothingToggle />)

    expect(
      screen.getByText(/uses log scale so mid-density spots are more visible/i),
    ).toBeInTheDocument()
  })
})
