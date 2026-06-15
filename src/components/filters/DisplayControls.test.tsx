import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { render, screen, fireEvent } from '../../test/utils'
import { useDisplayState, useDisplayDispatch } from '../../contexts/DisplayContext'
import { useDataDispatch } from '../../contexts/DataContext'
import { DisplayControls } from './DisplayControls'

// ---------------------------------------------------------------------------
// Helper — reads radius/intensity from real DisplayContext and renders them
// ---------------------------------------------------------------------------

function RadiusDisplay() {
  const { radius } = useDisplayState()
  return <div data-testid="radius-value">{String(radius)}</div>
}

function IntensityDisplay() {
  const { intensity } = useDisplayState()
  return <div data-testid="intensity-value">{String(intensity)}</div>
}

// ---------------------------------------------------------------------------
// Helper — captures DisplayDispatch and DataDispatch for pre-seeding state
// ---------------------------------------------------------------------------

function DisplayDispatchCapture({
  onDispatch,
}: {
  onDispatch: (d: ReturnType<typeof useDisplayDispatch>) => void
}) {
  const dispatch = useDisplayDispatch()
  onDispatch(dispatch)
  return null
}

function DataDispatchCapture({
  onDispatch,
}: {
  onDispatch: (d: ReturnType<typeof useDataDispatch>) => void
}) {
  const dispatch = useDataDispatch()
  onDispatch(dispatch)
  return null
}

// ---------------------------------------------------------------------------
// Render helper — defaults to not showing state displays
// ---------------------------------------------------------------------------

function renderDisplayControls({
  showStateDisplay = false,
  seedReady = false,
}: { showStateDisplay?: boolean; seedReady?: boolean } = {}) {
  let displayDispatch!: ReturnType<typeof useDisplayDispatch>
  let dataDispatch!: ReturnType<typeof useDataDispatch>

  const utils = render(
    <>
      <DisplayDispatchCapture onDispatch={(d) => (displayDispatch = d)} />
      <DataDispatchCapture onDispatch={(d) => (dataDispatch = d)} />
      {showStateDisplay && <RadiusDisplay />}
      {showStateDisplay && <IntensityDisplay />}
      <DisplayControls />
    </>,
  )

  if (seedReady) {
    act(() => {
      dataDispatch({
        type: 'SET_COMPLETE',
        payload: {
          totalCount: 1,
          minDate: '2024-01-01T00:00:00.000Z',
          maxDate: '2024-12-31T23:59:59.000Z',
        },
      })
    })
  }

  return {
    ...utils,
    getDisplayDispatch: () => displayDispatch,
    getDataDispatch: () => dataDispatch,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DisplayControls', () => {
  it('is hidden when data status is not ready', () => {
    renderDisplayControls()
    // Neither slider should be in the DOM
    expect(screen.queryByRole('slider', { name: 'Radius' })).not.toBeInTheDocument()
    expect(screen.queryByRole('slider', { name: 'Intensity' })).not.toBeInTheDocument()
  })

  it('renders both sliders once data is ready', () => {
    renderDisplayControls({ seedReady: true })
    expect(screen.getByRole('slider', { name: 'Radius' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Intensity' })).toBeInTheDocument()
  })

  it('Radius slider has correct default value (20), min (5), max (60), step (1)', () => {
    renderDisplayControls({ seedReady: true })
    const slider: HTMLInputElement = screen.getByRole('slider', { name: 'Radius' })
    expect(slider.value).toBe('20')
    expect(slider.min).toBe('5')
    expect(slider.max).toBe('60')
    expect(slider.step).toBe('1')
  })

  it('Intensity slider has correct default value (0.5), min (0), max (1), step (0.01)', () => {
    renderDisplayControls({ seedReady: true })
    const slider: HTMLInputElement = screen.getByRole('slider', { name: 'Intensity' })
    expect(slider.value).toBe('0.5')
    expect(slider.min).toBe('0')
    expect(slider.max).toBe('1')
    expect(slider.step).toBe('0.01')
  })

  it('shows the current radius value label (e.g. "20px")', () => {
    renderDisplayControls({ seedReady: true })
    expect(screen.getByText('20px')).toBeInTheDocument()
  })

  it('shows low/medium/high labels for Intensity slider', () => {
    renderDisplayControls({ seedReady: true })
    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('renders "Scale adjusts to current filter." label beneath Intensity slider', () => {
    renderDisplayControls({ seedReady: true })
    expect(screen.getByText('Scale adjusts to current filter.')).toBeInTheDocument()
  })

  it('dragging Radius slider dispatches SET_RADIUS — verified via real DisplayProvider', () => {
    renderDisplayControls({ seedReady: true, showStateDisplay: true })

    // Default radius = 20
    expect(screen.getByTestId('radius-value').textContent).toBe('20')

    act(() => {
      fireEvent.change(screen.getByRole('slider', { name: 'Radius' }), {
        target: { value: '35' },
      })
    })

    // State should update to 35 via real DisplayContext
    expect(screen.getByTestId('radius-value').textContent).toBe('35')
    // Label also updates
    expect(screen.getByText('35px')).toBeInTheDocument()
  })

  it('dragging Intensity slider dispatches SET_INTENSITY — verified via real DisplayProvider', () => {
    renderDisplayControls({ seedReady: true, showStateDisplay: true })

    // Default intensity = 0.5
    expect(screen.getByTestId('intensity-value').textContent).toBe('0.5')

    act(() => {
      fireEvent.change(screen.getByRole('slider', { name: 'Intensity' }), {
        target: { value: '0.75' },
      })
    })

    expect(screen.getByTestId('intensity-value').textContent).toBe('0.75')
  })

  it('radius value label updates when slider changes', () => {
    renderDisplayControls({ seedReady: true })

    act(() => {
      fireEvent.change(screen.getByRole('slider', { name: 'Radius' }), {
        target: { value: '50' },
      })
    })

    expect(screen.getByText('50px')).toBeInTheDocument()
    expect(screen.queryByText('20px')).not.toBeInTheDocument()
  })
})
