import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { render, screen, fireEvent } from '../../test/utils'
import { useUIState, useUIDispatch } from '../../contexts/UIContext'
import { FormatSelector } from './FormatSelector'

// ---------------------------------------------------------------------------
// Helper — reads fileFormat from real UIContext and renders it
// ---------------------------------------------------------------------------

function FileFormatDisplay() {
  const { fileFormat } = useUIState()
  return <div data-testid="file-format">{fileFormat}</div>
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FormatSelector', () => {
  it('"Auto-detect" radio is selected by default', () => {
    render(<FormatSelector />)

    const autoRadio = screen.getByRole('radio', { name: /auto-detect/i })
    expect(autoRadio).toBeInTheDocument()
    expect(autoRadio).toBeChecked()
  })

  it('"Records.json" radio is unchecked by default', () => {
    render(<FormatSelector />)

    const recordsRadio = screen.getByRole('radio', { name: /records\.json/i })
    expect(recordsRadio).toBeInTheDocument()
    expect(recordsRadio).not.toBeChecked()
  })

  it('"Semantic Location History" radio has the disabled attribute', () => {
    render(<FormatSelector />)

    const semanticRadio = screen.getByRole('radio', { name: /semantic location history/i })
    expect(semanticRadio).toBeDisabled()
  })

  it('"coming soon" label is always visible alongside the disabled option', () => {
    render(<FormatSelector />)

    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
  })

  it('selecting "Records.json" dispatches SET_FILE_FORMAT: "records" — verified via real provider', () => {
    render(
      <>
        <FileFormatDisplay />
        <FormatSelector />
      </>,
    )

    // Initial state: auto
    expect(screen.getByTestId('file-format').textContent).toBe('auto')

    act(() => {
      fireEvent.click(screen.getByRole('radio', { name: /records\.json/i }))
    })

    // DOM reflects state change via real context
    expect(screen.getByTestId('file-format').textContent).toBe('records')
    expect(screen.getByRole('radio', { name: /records\.json/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /auto-detect/i })).not.toBeChecked()
  })

  it('selecting "Auto-detect" dispatches SET_FILE_FORMAT: "auto" — verified via real provider', () => {
    let uiDispatch!: ReturnType<typeof useUIDispatch>

    render(
      <>
        <UIDispatchCapture onDispatch={(d) => (uiDispatch = d)} />
        <FileFormatDisplay />
        <FormatSelector />
      </>,
    )

    // Pre-set to records so we can test switching back to auto
    act(() => {
      uiDispatch({ type: 'SET_FILE_FORMAT', payload: 'records' })
    })

    expect(screen.getByTestId('file-format').textContent).toBe('records')

    act(() => {
      fireEvent.click(screen.getByRole('radio', { name: /auto-detect/i }))
    })

    expect(screen.getByTestId('file-format').textContent).toBe('auto')
    expect(screen.getByRole('radio', { name: /auto-detect/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /records\.json/i })).not.toBeChecked()
  })

  it('"Semantic Location History" radio cannot be selected', () => {
    render(
      <>
        <FileFormatDisplay />
        <FormatSelector />
      </>,
    )

    const semanticRadio = screen.getByRole('radio', { name: /semantic location history/i })

    // Attempt to click — should have no effect since it's disabled
    act(() => {
      fireEvent.click(semanticRadio)
    })

    // fileFormat should remain 'auto'
    expect(screen.getByTestId('file-format').textContent).toBe('auto')
    expect(semanticRadio).not.toBeChecked()
  })
})
