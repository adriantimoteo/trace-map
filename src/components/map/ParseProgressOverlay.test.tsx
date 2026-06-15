import { describe, it, expect } from 'vitest'
import { render, screen, act } from '../../test/utils'
import { useDataDispatch } from '../../contexts/DataContext'
import { useUIDispatch } from '../../contexts/UIContext'
import { ParseProgressOverlay } from './ParseProgressOverlay'

function DataAndUIController({
  onDataDispatch,
  onUIDispatch,
}: {
  onDataDispatch: (d: ReturnType<typeof useDataDispatch>) => void
  onUIDispatch: (d: ReturnType<typeof useUIDispatch>) => void
}) {
  const dataDispatch = useDataDispatch()
  const uiDispatch = useUIDispatch()
  onDataDispatch(dataDispatch)
  onUIDispatch(uiDispatch)
  return null
}

describe('ParseProgressOverlay', () => {
  it('returns null when status is idle and screen is upload', () => {
    const { container } = render(<ParseProgressOverlay />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when status is ready', () => {
    let dataDispatch!: ReturnType<typeof useDataDispatch>
    let uiDispatch!: ReturnType<typeof useUIDispatch>

    render(
      <>
        <DataAndUIController
          onDataDispatch={(d) => {
            dataDispatch = d
          }}
          onUIDispatch={(d) => {
            uiDispatch = d
          }}
        />
        <ParseProgressOverlay />
      </>,
    )

    act(() => {
      uiDispatch({ type: 'SET_SCREEN', payload: 'app' })
      dataDispatch({ type: 'SET_STATUS', payload: 'ready' })
    })

    expect(screen.queryByRole('status')).toBeNull()
  })

  it('returns null when screen is upload even if parsing', () => {
    let dataDispatch!: ReturnType<typeof useDataDispatch>

    render(
      <>
        <DataAndUIController
          onDataDispatch={(d) => {
            dataDispatch = d
          }}
          onUIDispatch={() => {}}
        />
        <ParseProgressOverlay />
      </>,
    )

    // screen stays 'upload' (default), set parsing
    act(() => {
      dataDispatch({ type: 'SET_STATUS', payload: 'parsing' })
    })

    expect(screen.queryByRole('status')).toBeNull()
  })

  it('renders spinner and progress when status is parsing and screen is app', () => {
    let dataDispatch!: ReturnType<typeof useDataDispatch>
    let uiDispatch!: ReturnType<typeof useUIDispatch>

    render(
      <>
        <DataAndUIController
          onDataDispatch={(d) => {
            dataDispatch = d
          }}
          onUIDispatch={(d) => {
            uiDispatch = d
          }}
        />
        <ParseProgressOverlay />
      </>,
    )

    act(() => {
      uiDispatch({ type: 'SET_SCREEN', payload: 'app' })
      dataDispatch({ type: 'SET_STATUS', payload: 'parsing' })
      dataDispatch({ type: 'SET_PROGRESS', payload: { progress: 42, pointsProcessed: 1234 } })
    })

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('42%')).toBeInTheDocument()
    expect(screen.getByText('1,234 points processed')).toBeInTheDocument()
  })

  it('shows processing message when parsing', () => {
    let dataDispatch!: ReturnType<typeof useDataDispatch>
    let uiDispatch!: ReturnType<typeof useUIDispatch>

    render(
      <>
        <DataAndUIController
          onDataDispatch={(d) => {
            dataDispatch = d
          }}
          onUIDispatch={(d) => {
            uiDispatch = d
          }}
        />
        <ParseProgressOverlay />
      </>,
    )

    act(() => {
      uiDispatch({ type: 'SET_SCREEN', payload: 'app' })
      dataDispatch({ type: 'SET_STATUS', payload: 'parsing' })
    })

    expect(screen.getByText(/processing your location history/i)).toBeInTheDocument()
  })
})
