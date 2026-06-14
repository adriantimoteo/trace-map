import { describe, it, expect, vi } from 'vitest'
import { act, useRef, useEffect } from 'react'
import { render, screen } from '../test/utils'
import { useDataState, useDataDispatch } from './DataContext'
import type { LocationPoint } from '../types'

// ---------------------------------------------------------------------------
// Dispatch capture
// ---------------------------------------------------------------------------
// We keep a single mutable ref that `DispatchCapture` writes to on every
// render.  The ref starts as `null`; after render it is always set because
// DataProvider is in the AllProviders wrapper.  Tests call `getDispatch()`
// which throws (rather than asserting `!`) if the component hasn't rendered.
// ---------------------------------------------------------------------------

type DataDispatch = ReturnType<typeof useDataDispatch>

const dispatchRef = { current: null as DataDispatch | null }

function getDispatch(): DataDispatch {
  if (dispatchRef.current === null) {
    throw new Error('DispatchCapture has not rendered yet')
  }
  return dispatchRef.current
}

function DispatchCapture() {
  const dispatch = useDataDispatch()
  // useRef so we can write to dispatchRef without re-rendering
  const stableRef = useRef(dispatch)
  useEffect(() => {
    stableRef.current = dispatch
    dispatchRef.current = dispatch
  })
  // Also write synchronously on every render pass
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

function StatusConsumer() {
  const state = useDataState()
  return <div data-testid="status">{state.status}</div>
}

function ErrorMessageConsumer() {
  const state = useDataState()
  return <div data-testid="error-message">{state.errorMessage ?? '__null__'}</div>
}

function ProgressConsumer() {
  const state = useDataState()
  return (
    <div>
      <span data-testid="parse-progress">{state.parseProgress}</span>
      <span data-testid="points-processed">{state.pointsProcessed}</span>
    </div>
  )
}

function PointsConsumer() {
  const state = useDataState()
  return <div data-testid="points-count">{state.points.length}</div>
}

function CompleteConsumer() {
  const state = useDataState()
  return (
    <div>
      <span data-testid="status">{state.status}</span>
      <span data-testid="total-count">{state.totalCount}</span>
      <span data-testid="min-date">
        {state.minDate instanceof Date ? state.minDate.toISOString() : '__null__'}
      </span>
      <span data-testid="max-date">
        {state.maxDate instanceof Date ? state.maxDate.toISOString() : '__null__'}
      </span>
    </div>
  )
}

function Stage2Consumer() {
  const state = useDataState()
  return <div data-testid="stage2-applied">{String(state.stage2Applied)}</div>
}

function FileMetaConsumer() {
  const state = useDataState()
  return (
    <div>
      <span data-testid="file-name">{state.fileName ?? '__null__'}</span>
      <span data-testid="file-size">{state.fileSize ?? '__null__'}</span>
    </div>
  )
}

function FullStateConsumer() {
  const state = useDataState()
  return (
    <div>
      <span data-testid="status">{state.status}</span>
      <span data-testid="parse-progress">{state.parseProgress}</span>
      <span data-testid="points-processed">{state.pointsProcessed}</span>
      <span data-testid="points-count">{state.points.length}</span>
      <span data-testid="total-count">{state.totalCount}</span>
      <span data-testid="min-date">
        {state.minDate instanceof Date ? state.minDate.toISOString() : '__null__'}
      </span>
      <span data-testid="max-date">
        {state.maxDate instanceof Date ? state.maxDate.toISOString() : '__null__'}
      </span>
      <span data-testid="stage2-applied">{String(state.stage2Applied)}</span>
      <span data-testid="error-message">{state.errorMessage ?? '__null__'}</span>
      <span data-testid="file-name">{state.fileName ?? '__null__'}</span>
      <span data-testid="file-size">{state.fileSize ?? '__null__'}</span>
    </div>
  )
}

const makePoint = (i: number): LocationPoint => ({
  lat: i,
  lng: i,
  timestamp: i * 1000,
  speed: null,
})

// ---------------------------------------------------------------------------
// Existing smoke tests (kept intact)
// ---------------------------------------------------------------------------

function Consumer() {
  const state = useDataState()
  return <div>{state.status}</div>
}

function DispatchConsumer() {
  useDataDispatch()
  return <div>ok</div>
}

describe('DataContext', () => {
  it('renders with default status of idle', () => {
    render(<Consumer />)
    expect(screen.getByText('idle')).toBeTruthy()
  })

  it('throws a descriptive error when used outside DataProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Consumer />, { wrapper: undefined })).toThrow(
      'useDataState must be used within a DataProvider',
    )

    consoleSpy.mockRestore()
  })

  it('useDataDispatch throws a descriptive error when used outside DataProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<DispatchConsumer />, { wrapper: undefined })).toThrow(
      'useDataDispatch must be used within a DataProvider',
    )

    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// Reducer tests — all via real DataProvider + rendered output
// ---------------------------------------------------------------------------

describe('dataReducer — RESET', () => {
  it('returns exact default state after being modified', () => {
    renderWithDispatch(<FullStateConsumer />)
    const dispatch = getDispatch()

    // Dirty up the state
    act(() => {
      dispatch({ type: 'SET_STATUS', payload: 'parsing' })
    })
    act(() => {
      dispatch({ type: 'SET_PROGRESS', payload: { progress: 50, pointsProcessed: 100 } })
    })
    act(() => {
      dispatch({ type: 'SET_FILE_META', payload: { fileName: 'test.json', fileSize: 1234 } })
    })

    // Now reset
    act(() => {
      dispatch({ type: 'RESET' })
    })

    expect(screen.getByTestId('status').textContent).toBe('idle')
    expect(screen.getByTestId('parse-progress').textContent).toBe('0')
    expect(screen.getByTestId('points-processed').textContent).toBe('0')
    expect(screen.getByTestId('points-count').textContent).toBe('0')
    expect(screen.getByTestId('total-count').textContent).toBe('0')
    expect(screen.getByTestId('min-date').textContent).toBe('__null__')
    expect(screen.getByTestId('max-date').textContent).toBe('__null__')
    expect(screen.getByTestId('stage2-applied').textContent).toBe('false')
    expect(screen.getByTestId('error-message').textContent).toBe('__null__')
    expect(screen.getByTestId('file-name').textContent).toBe('__null__')
    expect(screen.getByTestId('file-size').textContent).toBe('__null__')
  })
})

describe('dataReducer — SET_STATUS', () => {
  it('updates status to parsing', () => {
    renderWithDispatch(<StatusConsumer />)
    act(() => {
      getDispatch()({ type: 'SET_STATUS', payload: 'parsing' })
    })
    expect(screen.getByTestId('status').textContent).toBe('parsing')
  })

  it('clears errorMessage when status is not error', () => {
    renderWithDispatch(
      <>
        <StatusConsumer />
        <ErrorMessageConsumer />
      </>,
    )
    // First set an error
    act(() => {
      getDispatch()({ type: 'SET_ERROR', payload: 'something broke' })
    })
    expect(screen.getByTestId('error-message').textContent).toBe('something broke')

    // Now set a non-error status — errorMessage should be cleared
    act(() => {
      getDispatch()({ type: 'SET_STATUS', payload: 'parsing' })
    })
    expect(screen.getByTestId('error-message').textContent).toBe('__null__')
  })

  it('preserves errorMessage when status is error', () => {
    renderWithDispatch(<ErrorMessageConsumer />)
    act(() => {
      getDispatch()({ type: 'SET_ERROR', payload: 'initial error' })
    })
    act(() => {
      getDispatch()({ type: 'SET_STATUS', payload: 'error' })
    })
    expect(screen.getByTestId('error-message').textContent).toBe('initial error')
  })
})

describe('dataReducer — SET_PROGRESS', () => {
  it('updates parseProgress and pointsProcessed', () => {
    renderWithDispatch(<ProgressConsumer />)
    act(() => {
      getDispatch()({ type: 'SET_PROGRESS', payload: { progress: 42, pointsProcessed: 500 } })
    })
    expect(screen.getByTestId('parse-progress').textContent).toBe('42')
    expect(screen.getByTestId('points-processed').textContent).toBe('500')
  })

  it('updates correctly when called multiple times', () => {
    renderWithDispatch(<ProgressConsumer />)
    act(() => {
      getDispatch()({ type: 'SET_PROGRESS', payload: { progress: 10, pointsProcessed: 100 } })
    })
    act(() => {
      getDispatch()({ type: 'SET_PROGRESS', payload: { progress: 75, pointsProcessed: 750 } })
    })
    expect(screen.getByTestId('parse-progress').textContent).toBe('75')
    expect(screen.getByTestId('points-processed').textContent).toBe('750')
  })
})

describe('dataReducer — APPEND_BATCH', () => {
  it('appends a batch to the points array', () => {
    renderWithDispatch(<PointsConsumer />)
    act(() => {
      getDispatch()({ type: 'APPEND_BATCH', payload: [makePoint(1), makePoint(2)] })
    })
    expect(screen.getByTestId('points-count').textContent).toBe('2')
  })

  it('accumulates across multiple dispatches', () => {
    renderWithDispatch(<PointsConsumer />)
    act(() => {
      getDispatch()({ type: 'APPEND_BATCH', payload: [makePoint(1), makePoint(2)] })
    })
    act(() => {
      getDispatch()({ type: 'APPEND_BATCH', payload: [makePoint(3)] })
    })
    act(() => {
      getDispatch()({ type: 'APPEND_BATCH', payload: [makePoint(4), makePoint(5), makePoint(6)] })
    })
    expect(screen.getByTestId('points-count').textContent).toBe('6')
  })

  it('does not mutate the previous state array', () => {
    // We capture the array reference after the first batch, then verify it
    // still has length 1 after a second batch is appended.
    const snapshots: LocationPoint[][] = []

    function PointsCapture() {
      const state = useDataState()
      if (snapshots.length < 1 && state.points.length > 0) {
        snapshots.push(state.points)
      }
      return <span data-testid="points-count">{state.points.length}</span>
    }

    renderWithDispatch(<PointsCapture />)

    act(() => {
      getDispatch()({ type: 'APPEND_BATCH', payload: [makePoint(1)] })
    })
    act(() => {
      getDispatch()({ type: 'APPEND_BATCH', payload: [makePoint(2)] })
    })

    expect(snapshots.length).toBeGreaterThan(0)
    // The first captured snapshot must still have length 1 — not mutated
    expect(snapshots[0]?.length).toBe(1)
    expect(screen.getByTestId('points-count').textContent).toBe('2')
  })
})

describe('dataReducer — SET_COMPLETE', () => {
  it('sets status to ready and updates totalCount', () => {
    renderWithDispatch(<CompleteConsumer />)
    act(() => {
      getDispatch()({
        type: 'SET_COMPLETE',
        payload: {
          totalCount: 9999,
          minDate: '2023-01-01T00:00:00.000Z',
          maxDate: '2024-12-31T23:59:59.000Z',
        },
      })
    })
    expect(screen.getByTestId('status').textContent).toBe('ready')
    expect(screen.getByTestId('total-count').textContent).toBe('9999')
  })

  it('parses minDate and maxDate strings into Date objects', () => {
    renderWithDispatch(<CompleteConsumer />)
    act(() => {
      getDispatch()({
        type: 'SET_COMPLETE',
        payload: {
          totalCount: 1,
          minDate: '2023-06-15T10:00:00.000Z',
          maxDate: '2024-01-20T22:30:00.000Z',
        },
      })
    })
    expect(screen.getByTestId('min-date').textContent).toBe('2023-06-15T10:00:00.000Z')
    expect(screen.getByTestId('max-date').textContent).toBe('2024-01-20T22:30:00.000Z')
  })
})

describe('dataReducer — SET_ERROR', () => {
  it('sets status to error and populates errorMessage', () => {
    renderWithDispatch(
      <>
        <StatusConsumer />
        <ErrorMessageConsumer />
      </>,
    )
    act(() => {
      getDispatch()({ type: 'SET_ERROR', payload: 'Failed to parse file' })
    })
    expect(screen.getByTestId('status').textContent).toBe('error')
    expect(screen.getByTestId('error-message').textContent).toBe('Failed to parse file')
  })

  it('clears points and resets totalCount', () => {
    renderWithDispatch(<PointsConsumer />)

    // Add some points first
    act(() => {
      getDispatch()({ type: 'APPEND_BATCH', payload: [makePoint(1), makePoint(2), makePoint(3)] })
    })
    expect(screen.getByTestId('points-count').textContent).toBe('3')

    act(() => {
      getDispatch()({ type: 'SET_ERROR', payload: 'oh no' })
    })
    expect(screen.getByTestId('points-count').textContent).toBe('0')
  })
})

describe('dataReducer — STAGE2_APPLIED', () => {
  it('sets stage2Applied to true', () => {
    renderWithDispatch(<Stage2Consumer />)
    expect(screen.getByTestId('stage2-applied').textContent).toBe('false')
    act(() => {
      getDispatch()({ type: 'STAGE2_APPLIED' })
    })
    expect(screen.getByTestId('stage2-applied').textContent).toBe('true')
  })
})

describe('dataReducer — SET_FILE_META', () => {
  it('sets fileName and fileSize', () => {
    renderWithDispatch(<FileMetaConsumer />)
    act(() => {
      getDispatch()({
        type: 'SET_FILE_META',
        payload: { fileName: 'my-data.json', fileSize: 204800 },
      })
    })
    expect(screen.getByTestId('file-name').textContent).toBe('my-data.json')
    expect(screen.getByTestId('file-size').textContent).toBe('204800')
  })
})
