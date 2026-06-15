import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { render, screen } from '../../test/utils'
import { useDataDispatch } from '../../contexts/DataContext'
import { FileMetaBadge } from './FileMetaBadge'

// Helper to get a dispatch handle inside the AllProviders tree
function DispatchCapture({
  onDispatch,
}: {
  onDispatch: (d: ReturnType<typeof useDataDispatch>) => void
}) {
  const dispatch = useDataDispatch()
  onDispatch(dispatch)
  return null
}

function renderWithDataDispatch() {
  let dispatch!: ReturnType<typeof useDataDispatch>
  render(
    <>
      <DispatchCapture
        onDispatch={(d) => {
          dispatch = d
        }}
      />
      <FileMetaBadge />
    </>,
  )
  return { getDispatch: () => dispatch }
}

describe('FileMetaBadge', () => {
  it('is absent when status is idle (not ready)', () => {
    render(<FileMetaBadge />)
    expect(screen.queryByText(/points/)).not.toBeInTheDocument()
  })

  it('is absent when status is parsing', () => {
    const { getDispatch } = renderWithDataDispatch()
    act(() => {
      getDispatch()({ type: 'SET_STATUS', payload: 'parsing' })
    })
    expect(screen.queryByText(/points/)).not.toBeInTheDocument()
  })

  it('is absent when status is error', () => {
    const { getDispatch } = renderWithDataDispatch()
    act(() => {
      getDispatch()({ type: 'SET_ERROR', payload: 'something went wrong' })
    })
    expect(screen.queryByText(/points/)).not.toBeInTheDocument()
  })

  it('displays fileName when status is ready', () => {
    const { getDispatch } = renderWithDataDispatch()
    act(() => {
      getDispatch()({
        type: 'SET_FILE_META',
        payload: { fileName: 'records.json', fileSize: 1_048_576 },
      })
    })
    act(() => {
      getDispatch()({
        type: 'SET_COMPLETE',
        payload: {
          totalCount: 100,
          minDate: '2023-01-01T00:00:00.000Z',
          maxDate: '2024-01-01T00:00:00.000Z',
        },
      })
    })
    expect(screen.getByText(/records\.json/)).toBeInTheDocument()
  })

  it('displays file size formatted correctly when status is ready', () => {
    const { getDispatch } = renderWithDataDispatch()
    act(() => {
      // 1 MB exactly
      getDispatch()({
        type: 'SET_FILE_META',
        payload: { fileName: 'data.json', fileSize: 1_048_576 },
      })
    })
    act(() => {
      getDispatch()({
        type: 'SET_COMPLETE',
        payload: {
          totalCount: 50,
          minDate: '2023-01-01T00:00:00.000Z',
          maxDate: '2024-01-01T00:00:00.000Z',
        },
      })
    })
    expect(screen.getByText(/1\.0 MB/)).toBeInTheDocument()
  })

  it('displays totalCount formatted with commas when status is ready', () => {
    const { getDispatch } = renderWithDataDispatch()
    act(() => {
      getDispatch()({ type: 'SET_FILE_META', payload: { fileName: 'big.json', fileSize: 500_000 } })
    })
    act(() => {
      getDispatch()({
        type: 'SET_COMPLETE',
        payload: {
          totalCount: 912_440,
          minDate: '2023-01-01T00:00:00.000Z',
          maxDate: '2024-01-01T00:00:00.000Z',
        },
      })
    })
    expect(screen.getByText(/912,440 points/)).toBeInTheDocument()
  })
})
