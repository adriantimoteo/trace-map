import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { render, screen, fireEvent } from '../../test/utils'
import { HotspotSmoothingToggle } from './HotspotSmoothingToggle'
import { useDisplayState } from '../../contexts/DisplayContext'

// ---------------------------------------------------------------------------
// Helper — reads hotspotSmoothing from real DisplayContext and renders it
// ---------------------------------------------------------------------------

function HotspotSmoothingDisplay() {
  const { hotspotSmoothing } = useDisplayState()
  return <div data-testid="hotspot-smoothing">{String(hotspotSmoothing)}</div>
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
