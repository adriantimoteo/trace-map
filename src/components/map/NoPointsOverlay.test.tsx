import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { render, screen } from '../../test/utils'
import { useDataDispatch } from '../../contexts/DataContext'
import { NoPointsOverlay } from './NoPointsOverlay'
import type { LocationPoint } from '../../types'

// ---------------------------------------------------------------------------
// Helper controller to drive DataContext from inside the provider tree
// ---------------------------------------------------------------------------

function DataController({
  onDispatch,
}: {
  onDispatch: (d: ReturnType<typeof useDataDispatch>) => void
}) {
  const dispatch = useDataDispatch()
  onDispatch(dispatch)
  return null
}

const samplePoint: LocationPoint = {
  lat: 51.5,
  lng: -0.1,
  timestamp: new Date('2024-01-01T12:00:00Z'),
  accuracyMeters: 10,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NoPointsOverlay', () => {
  it('returns null when status is idle', () => {
    const { container } = render(<NoPointsOverlay />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when status is ready and filteredCount > 0', () => {
    let dispatch!: ReturnType<typeof useDataDispatch>

    render(
      <>
        <DataController
          onDispatch={(d) => {
            dispatch = d
          }}
        />
        <NoPointsOverlay />
      </>,
    )

    act(() => {
      dispatch({ type: 'APPEND_BATCH', payload: [samplePoint] })
      dispatch({
        type: 'SET_COMPLETE',
        payload: {
          totalCount: 1,
          minDate: '2024-01-01T12:00:00Z',
          maxDate: '2024-01-01T12:00:00Z',
        },
      })
    })

    expect(screen.queryByText('No points match the current filters.')).not.toBeInTheDocument()
  })

  it('renders the message when status is ready and filteredCount === 0', () => {
    let dispatch!: ReturnType<typeof useDataDispatch>

    render(
      <>
        <DataController
          onDispatch={(d) => {
            dispatch = d
          }}
        />
        <NoPointsOverlay />
      </>,
    )

    act(() => {
      // No points appended — filteredCount will be 0
      dispatch({
        type: 'SET_COMPLETE',
        payload: {
          totalCount: 0,
          minDate: '2024-01-01T12:00:00Z',
          maxDate: '2024-01-01T12:00:00Z',
        },
      })
    })

    expect(screen.getByText('No points match the current filters.')).toBeInTheDocument()
  })

  it('renders the message when status is ready and filtered points array is empty', () => {
    let dispatch!: ReturnType<typeof useDataDispatch>

    render(
      <>
        <DataController
          onDispatch={(d) => {
            dispatch = d
          }}
        />
        <NoPointsOverlay />
      </>,
    )

    act(() => {
      dispatch({ type: 'SET_STATUS', payload: 'ready' })
      // points array is empty (default), so filteredCount === 0
    })

    expect(screen.getByText('No points match the current filters.')).toBeInTheDocument()
  })
})
