import { describe, it, expect, vi } from 'vitest'
import { act } from 'react'
import { render, screen } from '../test/utils'
import { useUIState, useUIDispatch } from './UIContext'

function Consumer() {
  const state = useUIState()
  return <div>{state.screen}</div>
}

function DispatchConsumer() {
  useUIDispatch()
  return <div>ok</div>
}

function SamplingNoticeDismissedConsumer() {
  const state = useUIState()
  return <div data-testid="dismissed">{String(state.samplingNoticeDismissed)}</div>
}

function FileFormatConsumer() {
  const state = useUIState()
  return <div data-testid="file-format">{state.fileFormat}</div>
}

function UIDispatchCapture({
  onDispatch,
}: {
  onDispatch: (d: ReturnType<typeof useUIDispatch>) => void
}) {
  const dispatch = useUIDispatch()
  onDispatch(dispatch)
  return null
}

describe('UIContext', () => {
  it('has default screen of upload', () => {
    render(<Consumer />)
    expect(screen.getByText('upload')).toBeTruthy()
  })

  it('throws a descriptive error when used outside UIProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Consumer />, { wrapper: undefined })).toThrow(
      'useUIState must be used within a UIProvider',
    )

    consoleSpy.mockRestore()
  })

  it('useUIDispatch throws a descriptive error when used outside UIProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<DispatchConsumer />, { wrapper: undefined })).toThrow(
      'useUIDispatch must be used within a UIProvider',
    )

    consoleSpy.mockRestore()
  })
})

describe('uiReducer — SET_FILE_FORMAT', () => {
  it('defaults fileFormat to "auto"', () => {
    render(
      <>
        <FileFormatConsumer />
      </>,
    )

    expect(screen.getByTestId('file-format').textContent).toBe('auto')
  })

  it('SET_FILE_FORMAT sets fileFormat to "records"', () => {
    let dispatch!: ReturnType<typeof useUIDispatch>

    render(
      <>
        <UIDispatchCapture
          onDispatch={(d) => {
            dispatch = d
          }}
        />
        <FileFormatConsumer />
      </>,
    )

    expect(screen.getByTestId('file-format').textContent).toBe('auto')

    act(() => {
      dispatch({ type: 'SET_FILE_FORMAT', payload: 'records' })
    })

    expect(screen.getByTestId('file-format').textContent).toBe('records')
  })

  it('SET_FILE_FORMAT sets fileFormat to "auto"', () => {
    let dispatch!: ReturnType<typeof useUIDispatch>

    render(
      <>
        <UIDispatchCapture
          onDispatch={(d) => {
            dispatch = d
          }}
        />
        <FileFormatConsumer />
      </>,
    )

    // First set to records, then back to auto
    act(() => {
      dispatch({ type: 'SET_FILE_FORMAT', payload: 'records' })
    })

    expect(screen.getByTestId('file-format').textContent).toBe('records')

    act(() => {
      dispatch({ type: 'SET_FILE_FORMAT', payload: 'auto' })
    })

    expect(screen.getByTestId('file-format').textContent).toBe('auto')
  })
})

describe('uiReducer — RESET_FOR_NEW_FILE', () => {
  function FullStateConsumer() {
    const state = useUIState()
    return (
      <div>
        <span data-testid="dismissed">{String(state.samplingNoticeDismissed)}</span>
        <span data-testid="advanced-open">{String(state.advancedOptionsOpen)}</span>
        <span data-testid="file-format">{state.fileFormat}</span>
        <span data-testid="screen">{state.screen}</span>
      </div>
    )
  }

  it('resets samplingNoticeDismissed to false', () => {
    let dispatch!: ReturnType<typeof useUIDispatch>

    render(
      <>
        <UIDispatchCapture
          onDispatch={(d) => {
            dispatch = d
          }}
        />
        <FullStateConsumer />
      </>,
    )

    // First dismiss the notice
    act(() => {
      dispatch({ type: 'DISMISS_SAMPLING_NOTICE' })
    })
    expect(screen.getByTestId('dismissed').textContent).toBe('true')

    // Then reset for new file
    act(() => {
      dispatch({ type: 'RESET_FOR_NEW_FILE' })
    })
    expect(screen.getByTestId('dismissed').textContent).toBe('false')
  })

  it('leaves advancedOptionsOpen unchanged', () => {
    let dispatch!: ReturnType<typeof useUIDispatch>

    render(
      <>
        <UIDispatchCapture
          onDispatch={(d) => {
            dispatch = d
          }}
        />
        <FullStateConsumer />
      </>,
    )

    // Open advanced options
    act(() => {
      dispatch({ type: 'TOGGLE_ADVANCED_OPTIONS' })
    })
    expect(screen.getByTestId('advanced-open').textContent).toBe('true')

    // Reset for new file — advanced options should remain open
    act(() => {
      dispatch({ type: 'RESET_FOR_NEW_FILE' })
    })
    expect(screen.getByTestId('advanced-open').textContent).toBe('true')
  })

  it('leaves fileFormat unchanged', () => {
    let dispatch!: ReturnType<typeof useUIDispatch>

    render(
      <>
        <UIDispatchCapture
          onDispatch={(d) => {
            dispatch = d
          }}
        />
        <FullStateConsumer />
      </>,
    )

    act(() => {
      dispatch({ type: 'SET_FILE_FORMAT', payload: 'records' })
    })
    expect(screen.getByTestId('file-format').textContent).toBe('records')

    act(() => {
      dispatch({ type: 'RESET_FOR_NEW_FILE' })
    })
    expect(screen.getByTestId('file-format').textContent).toBe('records')
  })

  it('leaves screen unchanged', () => {
    let dispatch!: ReturnType<typeof useUIDispatch>

    render(
      <>
        <UIDispatchCapture
          onDispatch={(d) => {
            dispatch = d
          }}
        />
        <FullStateConsumer />
      </>,
    )

    act(() => {
      dispatch({ type: 'SET_SCREEN', payload: 'app' })
    })
    expect(screen.getByTestId('screen').textContent).toBe('app')

    act(() => {
      dispatch({ type: 'RESET_FOR_NEW_FILE' })
    })
    expect(screen.getByTestId('screen').textContent).toBe('app')
  })
})

describe('uiReducer — DISMISS_SAMPLING_NOTICE', () => {
  it('sets samplingNoticeDismissed to true', () => {
    let dispatch!: ReturnType<typeof useUIDispatch>

    render(
      <>
        <UIDispatchCapture
          onDispatch={(d) => {
            dispatch = d
          }}
        />
        <SamplingNoticeDismissedConsumer />
      </>,
    )

    expect(screen.getByTestId('dismissed').textContent).toBe('false')

    act(() => {
      dispatch({ type: 'DISMISS_SAMPLING_NOTICE' })
    })

    expect(screen.getByTestId('dismissed').textContent).toBe('true')
  })

  it('remains true if dispatched again', () => {
    let dispatch!: ReturnType<typeof useUIDispatch>

    render(
      <>
        <UIDispatchCapture
          onDispatch={(d) => {
            dispatch = d
          }}
        />
        <SamplingNoticeDismissedConsumer />
      </>,
    )

    act(() => {
      dispatch({ type: 'DISMISS_SAMPLING_NOTICE' })
    })
    act(() => {
      dispatch({ type: 'DISMISS_SAMPLING_NOTICE' })
    })

    expect(screen.getByTestId('dismissed').textContent).toBe('true')
  })
})
