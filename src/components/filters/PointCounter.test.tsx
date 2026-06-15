import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { render, screen } from '../../test/utils'
import { useDataDispatch } from '../../contexts/DataContext'
import { PointCounter } from './PointCounter'

function DispatchCapture({
  onDispatch,
}: {
  onDispatch: (d: ReturnType<typeof useDataDispatch>) => void
}) {
  const dispatch = useDataDispatch()
  onDispatch(dispatch)
  return null
}

function renderWithDataDispatch(ui: React.ReactElement) {
  let dispatch!: ReturnType<typeof useDataDispatch>
  render(
    <>
      <DispatchCapture
        onDispatch={(d) => {
          dispatch = d
        }}
      />
      {ui}
    </>,
  )
  return { getDispatch: () => dispatch }
}

function makeReady(dispatch: ReturnType<typeof useDataDispatch>, totalCount = 1_000) {
  act(() => {
    dispatch({
      type: 'SET_COMPLETE',
      payload: {
        totalCount,
        minDate: '2023-01-01T00:00:00.000Z',
        maxDate: '2024-01-01T00:00:00.000Z',
      },
    })
  })
}

describe('PointCounter', () => {
  it('is absent when status is idle (not ready)', () => {
    render(<PointCounter />)
    expect(screen.queryByText(/points shown/)).not.toBeInTheDocument()
  })

  it('is absent when status is parsing', () => {
    const { getDispatch } = renderWithDataDispatch(<PointCounter />)
    act(() => {
      getDispatch()({ type: 'SET_STATUS', payload: 'parsing' })
    })
    expect(screen.queryByText(/points shown/)).not.toBeInTheDocument()
  })

  it('is absent when status is error', () => {
    const { getDispatch } = renderWithDataDispatch(<PointCounter />)
    act(() => {
      getDispatch()({ type: 'SET_ERROR', payload: 'fail' })
    })
    expect(screen.queryByText(/points shown/)).not.toBeInTheDocument()
  })

  it('shows "X of Y points shown" where both equal totalCount in Phase 1', () => {
    const { getDispatch } = renderWithDataDispatch(<PointCounter />)
    makeReady(getDispatch(), 5_000)
    expect(screen.getByText('5,000 of 5,000 points shown')).toBeInTheDocument()
  })

  it('formats numbers with commas', () => {
    const { getDispatch } = renderWithDataDispatch(<PointCounter />)
    makeReady(getDispatch(), 1_234_567)
    expect(screen.getByText('1,234,567 of 1,234,567 points shown')).toBeInTheDocument()
  })

  it('visibleCount prop overrides the numerator', () => {
    const { getDispatch } = renderWithDataDispatch(<PointCounter visibleCount={3_000} />)
    makeReady(getDispatch(), 5_000)
    expect(screen.getByText('3,000 of 5,000 points shown')).toBeInTheDocument()
  })
})
