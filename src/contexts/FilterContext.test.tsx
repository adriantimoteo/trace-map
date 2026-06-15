import { describe, it, expect, vi } from 'vitest'
import { act, useRef, useEffect } from 'react'
import { render, screen } from '../test/utils'
import { useFilterState, useFilterDispatch } from './FilterContext'
import type { MapBounds } from '../types'

// ---------------------------------------------------------------------------
// Dispatch capture
// ---------------------------------------------------------------------------

type FilterDispatch = ReturnType<typeof useFilterDispatch>

const dispatchRef = { current: null as FilterDispatch | null }

function getDispatch(): FilterDispatch {
  if (dispatchRef.current === null) {
    throw new Error('DispatchCapture has not rendered yet')
  }
  return dispatchRef.current
}

function DispatchCapture() {
  const dispatch = useFilterDispatch()
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

function DateRangeConsumer() {
  const state = useFilterState()
  return (
    <div>
      <span data-testid="date-start">{state.dateRange.start ?? '__null__'}</span>
      <span data-testid="date-end">{state.dateRange.end ?? '__null__'}</span>
    </div>
  )
}

function VelocityConsumer() {
  const state = useFilterState()
  return (
    <div>
      <span data-testid="velocityEnabled">{String(state.velocityEnabled)}</span>
      <span data-testid="velocityThreshold">{state.velocityThreshold}</span>
    </div>
  )
}

function ViewportConsumer() {
  const state = useFilterState()
  return (
    <div>
      <span data-testid="viewportEnabled">{String(state.viewportEnabled)}</span>
      <span data-testid="viewportBounds">
        {state.viewportBounds !== null ? JSON.stringify(state.viewportBounds) : '__null__'}
      </span>
    </div>
  )
}

function BucketConsumer() {
  const state = useFilterState()
  return (
    <div>
      <span data-testid="dateBucketOverride">
        {state.dateBucketOverride !== null ? state.dateBucketOverride.label : '__null__'}
      </span>
    </div>
  )
}

function FullStateConsumer() {
  const state = useFilterState()
  return (
    <div>
      <span data-testid="date-start">{state.dateRange.start ?? '__null__'}</span>
      <span data-testid="date-end">{state.dateRange.end ?? '__null__'}</span>
      <span data-testid="velocityEnabled">{String(state.velocityEnabled)}</span>
      <span data-testid="velocityThreshold">{state.velocityThreshold}</span>
      <span data-testid="viewportEnabled">{String(state.viewportEnabled)}</span>
      <span data-testid="viewportBounds">
        {state.viewportBounds !== null ? JSON.stringify(state.viewportBounds) : '__null__'}
      </span>
      <span data-testid="dateBucketOverride">
        {state.dateBucketOverride !== null ? state.dateBucketOverride.label : '__null__'}
      </span>
    </div>
  )
}

const sampleBounds: MapBounds = { north: 51.5, south: 51.4, east: -0.1, west: -0.2 }

// ---------------------------------------------------------------------------
// Smoke tests (existing)
// ---------------------------------------------------------------------------

function Consumer() {
  const state = useFilterState()
  return (
    <div>
      <span data-testid="velocityEnabled">{String(state.velocityEnabled)}</span>
      <span data-testid="velocityThreshold">{state.velocityThreshold}</span>
    </div>
  )
}

function DispatchConsumer() {
  useFilterDispatch()
  return <div>ok</div>
}

describe('FilterContext', () => {
  it('has default velocityEnabled of false and velocityThreshold of 15', () => {
    render(<Consumer />)
    expect(screen.getByTestId('velocityEnabled').textContent).toBe('false')
    expect(screen.getByTestId('velocityThreshold').textContent).toBe('15')
  })

  it('throws a descriptive error when used outside FilterProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Consumer />, { wrapper: undefined })).toThrow(
      'useFilterState must be used within a FilterProvider',
    )

    consoleSpy.mockRestore()
  })

  it('useFilterDispatch throws a descriptive error when used outside FilterProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<DispatchConsumer />, { wrapper: undefined })).toThrow(
      'useFilterDispatch must be used within a FilterProvider',
    )

    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// Reducer tests — all via real FilterProvider + rendered output
// ---------------------------------------------------------------------------

describe('filterReducer — SET_DATE_RANGE', () => {
  it('sets both start and end dates', () => {
    renderWithDispatch(<DateRangeConsumer />)
    act(() => {
      getDispatch()({
        type: 'SET_DATE_RANGE',
        payload: { start: '2023-01-01', end: '2023-12-31' },
      })
    })
    expect(screen.getByTestId('date-start').textContent).toBe('2023-01-01')
    expect(screen.getByTestId('date-end').textContent).toBe('2023-12-31')
  })

  it('allows start to be null (no lower bound)', () => {
    renderWithDispatch(<DateRangeConsumer />)
    act(() => {
      getDispatch()({
        type: 'SET_DATE_RANGE',
        payload: { start: null, end: '2023-12-31' },
      })
    })
    expect(screen.getByTestId('date-start').textContent).toBe('__null__')
    expect(screen.getByTestId('date-end').textContent).toBe('2023-12-31')
  })

  it('allows end to be null (no upper bound)', () => {
    renderWithDispatch(<DateRangeConsumer />)
    act(() => {
      getDispatch()({
        type: 'SET_DATE_RANGE',
        payload: { start: '2023-01-01', end: null },
      })
    })
    expect(screen.getByTestId('date-start').textContent).toBe('2023-01-01')
    expect(screen.getByTestId('date-end').textContent).toBe('__null__')
  })

  it('allows both to be null (clear range)', () => {
    renderWithDispatch(<DateRangeConsumer />)
    // Set a range first
    act(() => {
      getDispatch()({
        type: 'SET_DATE_RANGE',
        payload: { start: '2023-01-01', end: '2023-12-31' },
      })
    })
    // Then clear it
    act(() => {
      getDispatch()({
        type: 'SET_DATE_RANGE',
        payload: { start: null, end: null },
      })
    })
    expect(screen.getByTestId('date-start').textContent).toBe('__null__')
    expect(screen.getByTestId('date-end').textContent).toBe('__null__')
  })
})

describe('filterReducer — SET_VELOCITY_ENABLED', () => {
  it('sets velocityEnabled to true', () => {
    renderWithDispatch(<VelocityConsumer />)
    act(() => {
      getDispatch()({ type: 'SET_VELOCITY_ENABLED', payload: true })
    })
    expect(screen.getByTestId('velocityEnabled').textContent).toBe('true')
  })

  it('sets velocityEnabled back to false', () => {
    renderWithDispatch(<VelocityConsumer />)
    act(() => {
      getDispatch()({ type: 'SET_VELOCITY_ENABLED', payload: true })
    })
    act(() => {
      getDispatch()({ type: 'SET_VELOCITY_ENABLED', payload: false })
    })
    expect(screen.getByTestId('velocityEnabled').textContent).toBe('false')
  })

  it('does not affect velocityThreshold when toggled', () => {
    renderWithDispatch(<VelocityConsumer />)
    act(() => {
      getDispatch()({ type: 'SET_VELOCITY_ENABLED', payload: true })
    })
    expect(screen.getByTestId('velocityThreshold').textContent).toBe('15')
  })
})

describe('filterReducer — SET_VELOCITY_THRESHOLD', () => {
  it('sets a valid threshold value', () => {
    renderWithDispatch(<VelocityConsumer />)
    act(() => {
      getDispatch()({ type: 'SET_VELOCITY_THRESHOLD', payload: 60 })
    })
    expect(screen.getByTestId('velocityThreshold').textContent).toBe('60')
  })

  it('clamps value below minimum (3 → 5)', () => {
    renderWithDispatch(<VelocityConsumer />)
    act(() => {
      getDispatch()({ type: 'SET_VELOCITY_THRESHOLD', payload: 3 })
    })
    expect(screen.getByTestId('velocityThreshold').textContent).toBe('5')
  })

  it('clamps value above maximum (150 → 120)', () => {
    renderWithDispatch(<VelocityConsumer />)
    act(() => {
      getDispatch()({ type: 'SET_VELOCITY_THRESHOLD', payload: 150 })
    })
    expect(screen.getByTestId('velocityThreshold').textContent).toBe('120')
  })

  it('accepts the minimum boundary value (5)', () => {
    renderWithDispatch(<VelocityConsumer />)
    act(() => {
      getDispatch()({ type: 'SET_VELOCITY_THRESHOLD', payload: 5 })
    })
    expect(screen.getByTestId('velocityThreshold').textContent).toBe('5')
  })

  it('accepts the maximum boundary value (120)', () => {
    renderWithDispatch(<VelocityConsumer />)
    act(() => {
      getDispatch()({ type: 'SET_VELOCITY_THRESHOLD', payload: 120 })
    })
    expect(screen.getByTestId('velocityThreshold').textContent).toBe('120')
  })
})

describe('filterReducer — SET_VIEWPORT_ENABLED', () => {
  it('sets viewportEnabled to true', () => {
    renderWithDispatch(<ViewportConsumer />)
    act(() => {
      getDispatch()({ type: 'SET_VIEWPORT_ENABLED', payload: true })
    })
    expect(screen.getByTestId('viewportEnabled').textContent).toBe('true')
  })

  it('sets viewportEnabled to false and clears viewportBounds', () => {
    renderWithDispatch(<ViewportConsumer />)
    // Enable viewport and set bounds
    act(() => {
      getDispatch()({ type: 'SET_VIEWPORT_ENABLED', payload: true })
    })
    act(() => {
      getDispatch()({ type: 'SET_VIEWPORT_BOUNDS', payload: sampleBounds })
    })
    expect(screen.getByTestId('viewportBounds').textContent).not.toBe('__null__')

    // Now disable — bounds should be cleared
    act(() => {
      getDispatch()({ type: 'SET_VIEWPORT_ENABLED', payload: false })
    })
    expect(screen.getByTestId('viewportEnabled').textContent).toBe('false')
    expect(screen.getByTestId('viewportBounds').textContent).toBe('__null__')
  })

  it('preserves null viewportBounds when enabling (no existing bounds)', () => {
    renderWithDispatch(<ViewportConsumer />)
    act(() => {
      getDispatch()({ type: 'SET_VIEWPORT_ENABLED', payload: true })
    })
    expect(screen.getByTestId('viewportBounds').textContent).toBe('__null__')
  })
})

describe('filterReducer — SET_VIEWPORT_BOUNDS', () => {
  it('updates viewportBounds when viewportEnabled is true', () => {
    renderWithDispatch(<ViewportConsumer />)
    act(() => {
      getDispatch()({ type: 'SET_VIEWPORT_ENABLED', payload: true })
    })
    act(() => {
      getDispatch()({ type: 'SET_VIEWPORT_BOUNDS', payload: sampleBounds })
    })
    expect(screen.getByTestId('viewportBounds').textContent).toBe(JSON.stringify(sampleBounds))
  })

  it('leaves state unchanged when viewportEnabled is false', () => {
    renderWithDispatch(<ViewportConsumer />)
    // viewportEnabled defaults to false — dispatch bounds without enabling
    act(() => {
      getDispatch()({ type: 'SET_VIEWPORT_BOUNDS', payload: sampleBounds })
    })
    expect(screen.getByTestId('viewportEnabled').textContent).toBe('false')
    expect(screen.getByTestId('viewportBounds').textContent).toBe('__null__')
  })

  it('allows setting bounds to null when enabled', () => {
    renderWithDispatch(<ViewportConsumer />)
    act(() => {
      getDispatch()({ type: 'SET_VIEWPORT_ENABLED', payload: true })
    })
    act(() => {
      getDispatch()({ type: 'SET_VIEWPORT_BOUNDS', payload: sampleBounds })
    })
    act(() => {
      getDispatch()({ type: 'SET_VIEWPORT_BOUNDS', payload: null })
    })
    expect(screen.getByTestId('viewportBounds').textContent).toBe('__null__')
  })
})

describe('filterReducer — SET_DATE_BUCKET_OVERRIDE', () => {
  it('sets dateBucketOverride', () => {
    renderWithDispatch(<BucketConsumer />)
    const bucket = { start: new Date('2023-01-01'), end: new Date('2023-01-31'), label: 'Jan 23' }
    act(() => {
      getDispatch()({ type: 'SET_DATE_BUCKET_OVERRIDE', payload: bucket })
    })
    expect(screen.getByTestId('dateBucketOverride').textContent).toBe('Jan 23')
  })

  it('clears dateBucketOverride with null', () => {
    renderWithDispatch(<BucketConsumer />)
    const bucket = { start: new Date('2023-01-01'), end: new Date('2023-01-31'), label: 'Jan 23' }
    act(() => {
      getDispatch()({ type: 'SET_DATE_BUCKET_OVERRIDE', payload: bucket })
    })
    act(() => {
      getDispatch()({ type: 'SET_DATE_BUCKET_OVERRIDE', payload: null })
    })
    expect(screen.getByTestId('dateBucketOverride').textContent).toBe('__null__')
  })
})

describe('filterReducer — RESET', () => {
  it('returns exact default state after being modified', () => {
    renderWithDispatch(<FullStateConsumer />)
    const dispatch = getDispatch()

    // Dirty up the state
    act(() => {
      dispatch({ type: 'SET_DATE_RANGE', payload: { start: '2023-01-01', end: '2023-12-31' } })
    })
    act(() => {
      dispatch({ type: 'SET_VELOCITY_ENABLED', payload: true })
    })
    act(() => {
      dispatch({ type: 'SET_VELOCITY_THRESHOLD', payload: 80 })
    })
    act(() => {
      dispatch({ type: 'SET_VIEWPORT_ENABLED', payload: true })
    })
    act(() => {
      dispatch({ type: 'SET_VIEWPORT_BOUNDS', payload: sampleBounds })
    })
    act(() => {
      dispatch({
        type: 'SET_DATE_BUCKET_OVERRIDE',
        payload: { start: new Date('2023-01-01'), end: new Date('2023-01-31'), label: 'Jan 23' },
      })
    })

    // Now reset
    act(() => {
      dispatch({ type: 'RESET' })
    })

    expect(screen.getByTestId('date-start').textContent).toBe('__null__')
    expect(screen.getByTestId('date-end').textContent).toBe('__null__')
    expect(screen.getByTestId('velocityEnabled').textContent).toBe('false')
    expect(screen.getByTestId('velocityThreshold').textContent).toBe('15')
    expect(screen.getByTestId('viewportEnabled').textContent).toBe('false')
    expect(screen.getByTestId('viewportBounds').textContent).toBe('__null__')
    expect(screen.getByTestId('dateBucketOverride').textContent).toBe('__null__')
  })
})
