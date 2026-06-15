import { describe, it, expect, vi } from 'vitest'
import { act, useRef, useEffect } from 'react'
import { render, screen } from '../test/utils'
import { useDisplayState, useDisplayDispatch } from './DisplayContext'

// ---------------------------------------------------------------------------
// Dispatch capture
// ---------------------------------------------------------------------------

type DisplayDispatch = ReturnType<typeof useDisplayDispatch>

const dispatchRef = { current: null as DisplayDispatch | null }

function getDispatch(): DisplayDispatch {
  if (dispatchRef.current === null) {
    throw new Error('DispatchCapture has not rendered yet')
  }
  return dispatchRef.current
}

function DispatchCapture() {
  const dispatch = useDisplayDispatch()
  const stableRef = useRef(dispatch)
  useEffect(() => {
    stableRef.current = dispatch
    dispatchRef.current = dispatch
  })
  dispatchRef.current = dispatch
  return null
}

function renderWithDispatch(ui: React.ReactElement) {
  dispatchRef.current = null
  return render(
    <>
      <DispatchCapture />
      {ui}
    </>,
  )
}

// ---------------------------------------------------------------------------
// Consumer components
// ---------------------------------------------------------------------------

function Consumer() {
  const state = useDisplayState()
  return (
    <div>
      <span data-testid="radius">{state.radius}</span>
      <span data-testid="intensity">{state.intensity}</span>
      <span data-testid="hotspot-smoothing">{String(state.hotspotSmoothing)}</span>
      <span data-testid="log-scale-density">{String(state.logScaleDensity)}</span>
    </div>
  )
}

function DispatchConsumer() {
  useDisplayDispatch()
  return <div>ok</div>
}

// ---------------------------------------------------------------------------
// Smoke tests (existing)
// ---------------------------------------------------------------------------

describe('DisplayContext', () => {
  it('has default radius of 20 and intensity of 0.5', () => {
    render(<Consumer />)
    expect(screen.getByTestId('radius').textContent).toBe('20')
    expect(screen.getByTestId('intensity').textContent).toBe('0.5')
  })

  it('has default hotspotSmoothing of false', () => {
    render(<Consumer />)
    expect(screen.getByTestId('hotspot-smoothing').textContent).toBe('false')
  })

  it('throws a descriptive error when used outside DisplayProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Consumer />, { wrapper: undefined })).toThrow(
      'useDisplayState must be used within a DisplayProvider',
    )

    consoleSpy.mockRestore()
  })

  it('useDisplayDispatch throws a descriptive error when used outside DisplayProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<DispatchConsumer />, { wrapper: undefined })).toThrow(
      'useDisplayDispatch must be used within a DisplayProvider',
    )

    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// Reducer tests — all via real DisplayProvider + rendered output
// ---------------------------------------------------------------------------

describe('displayReducer — SET_RADIUS', () => {
  it('sets a valid radius (20)', () => {
    renderWithDispatch(<Consumer />)
    act(() => {
      getDispatch()({ type: 'SET_RADIUS', payload: 20 })
    })
    expect(screen.getByTestId('radius').textContent).toBe('20')
  })

  it('clamps value below minimum (3 → 5)', () => {
    renderWithDispatch(<Consumer />)
    act(() => {
      getDispatch()({ type: 'SET_RADIUS', payload: 3 })
    })
    expect(screen.getByTestId('radius').textContent).toBe('5')
  })

  it('clamps value above maximum (80 → 60)', () => {
    renderWithDispatch(<Consumer />)
    act(() => {
      getDispatch()({ type: 'SET_RADIUS', payload: 80 })
    })
    expect(screen.getByTestId('radius').textContent).toBe('60')
  })

  it('accepts the minimum boundary value (5)', () => {
    renderWithDispatch(<Consumer />)
    act(() => {
      getDispatch()({ type: 'SET_RADIUS', payload: 5 })
    })
    expect(screen.getByTestId('radius').textContent).toBe('5')
  })

  it('accepts the maximum boundary value (60)', () => {
    renderWithDispatch(<Consumer />)
    act(() => {
      getDispatch()({ type: 'SET_RADIUS', payload: 60 })
    })
    expect(screen.getByTestId('radius').textContent).toBe('60')
  })

  it('does not affect intensity when radius changes', () => {
    renderWithDispatch(<Consumer />)
    act(() => {
      getDispatch()({ type: 'SET_RADIUS', payload: 30 })
    })
    expect(screen.getByTestId('intensity').textContent).toBe('0.5')
  })
})

describe('displayReducer — SET_INTENSITY', () => {
  it('sets a valid intensity (0.5)', () => {
    renderWithDispatch(<Consumer />)
    act(() => {
      getDispatch()({ type: 'SET_INTENSITY', payload: 0.5 })
    })
    expect(screen.getByTestId('intensity').textContent).toBe('0.5')
  })

  it('clamps value below 0 (-0.2 → 0)', () => {
    renderWithDispatch(<Consumer />)
    act(() => {
      getDispatch()({ type: 'SET_INTENSITY', payload: -0.2 })
    })
    expect(screen.getByTestId('intensity').textContent).toBe('0')
  })

  it('clamps value above 1 (1.5 → 1)', () => {
    renderWithDispatch(<Consumer />)
    act(() => {
      getDispatch()({ type: 'SET_INTENSITY', payload: 1.5 })
    })
    expect(screen.getByTestId('intensity').textContent).toBe('1')
  })

  it('accepts the minimum boundary value (0)', () => {
    renderWithDispatch(<Consumer />)
    act(() => {
      getDispatch()({ type: 'SET_INTENSITY', payload: 0 })
    })
    expect(screen.getByTestId('intensity').textContent).toBe('0')
  })

  it('accepts the maximum boundary value (1)', () => {
    renderWithDispatch(<Consumer />)
    act(() => {
      getDispatch()({ type: 'SET_INTENSITY', payload: 1 })
    })
    expect(screen.getByTestId('intensity').textContent).toBe('1')
  })

  it('does not affect radius when intensity changes', () => {
    renderWithDispatch(<Consumer />)
    act(() => {
      getDispatch()({ type: 'SET_INTENSITY', payload: 0.8 })
    })
    expect(screen.getByTestId('radius').textContent).toBe('20')
  })
})

describe('displayReducer — TOGGLE_HOTSPOT_SMOOTHING', () => {
  it('toggles hotspotSmoothing from false to true', () => {
    renderWithDispatch(<Consumer />)
    expect(screen.getByTestId('hotspot-smoothing').textContent).toBe('false')
    act(() => {
      getDispatch()({ type: 'TOGGLE_HOTSPOT_SMOOTHING' })
    })
    expect(screen.getByTestId('hotspot-smoothing').textContent).toBe('true')
  })

  it('toggles hotspotSmoothing from true back to false (dispatch twice)', () => {
    renderWithDispatch(<Consumer />)
    act(() => {
      getDispatch()({ type: 'TOGGLE_HOTSPOT_SMOOTHING' })
    })
    expect(screen.getByTestId('hotspot-smoothing').textContent).toBe('true')
    act(() => {
      getDispatch()({ type: 'TOGGLE_HOTSPOT_SMOOTHING' })
    })
    expect(screen.getByTestId('hotspot-smoothing').textContent).toBe('false')
  })

  it('does not affect radius or intensity when toggling hotspotSmoothing', () => {
    renderWithDispatch(<Consumer />)
    act(() => {
      getDispatch()({ type: 'TOGGLE_HOTSPOT_SMOOTHING' })
    })
    expect(screen.getByTestId('radius').textContent).toBe('20')
    expect(screen.getByTestId('intensity').textContent).toBe('0.5')
  })
})

describe('DisplayContext — logScaleDensity initial state', () => {
  it('has default logScaleDensity of false', () => {
    render(<Consumer />)
    expect(screen.getByTestId('log-scale-density').textContent).toBe('false')
  })
})

describe('displayReducer — TOGGLE_LOG_SCALE_DENSITY', () => {
  it('toggles logScaleDensity from false to true', () => {
    renderWithDispatch(<Consumer />)
    expect(screen.getByTestId('log-scale-density').textContent).toBe('false')
    act(() => {
      getDispatch()({ type: 'TOGGLE_LOG_SCALE_DENSITY' })
    })
    expect(screen.getByTestId('log-scale-density').textContent).toBe('true')
  })

  it('toggles logScaleDensity from true back to false (dispatch twice)', () => {
    renderWithDispatch(<Consumer />)
    act(() => {
      getDispatch()({ type: 'TOGGLE_LOG_SCALE_DENSITY' })
    })
    expect(screen.getByTestId('log-scale-density').textContent).toBe('true')
    act(() => {
      getDispatch()({ type: 'TOGGLE_LOG_SCALE_DENSITY' })
    })
    expect(screen.getByTestId('log-scale-density').textContent).toBe('false')
  })

  it('does not affect hotspotSmoothing or radius when toggling logScaleDensity', () => {
    renderWithDispatch(<Consumer />)
    act(() => {
      getDispatch()({ type: 'TOGGLE_LOG_SCALE_DENSITY' })
    })
    expect(screen.getByTestId('hotspot-smoothing').textContent).toBe('false')
    expect(screen.getByTestId('radius').textContent).toBe('20')
  })
})
