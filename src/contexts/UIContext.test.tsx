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
