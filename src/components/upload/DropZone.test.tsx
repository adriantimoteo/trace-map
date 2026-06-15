import { render, screen, fireEvent } from '../../test/utils'
import { act } from 'react'
import { vi } from 'vitest'
import { useRef, useEffect } from 'react'
import { useDataDispatch } from '../../contexts/DataContext'
import { DropZone } from './DropZone'

// ---------------------------------------------------------------------------
// Dispatch capture helper (same pattern as DataContext.test.tsx)
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
// Helpers
// ---------------------------------------------------------------------------

function makeFile(name: string, type: string, content = '{}') {
  return new File([content], name, { type })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DropZone', () => {
  it('renders the drop zone prompt text', () => {
    render(<DropZone onFile={vi.fn()} />)
    expect(screen.getByText('Drop Records.json here, or click to browse')).toBeInTheDocument()
  })

  it('calls onFile when a file is dropped', () => {
    const onFile = vi.fn()
    render(<DropZone onFile={onFile} />)
    const zone = screen.getByRole('button', { name: /file drop zone/i })
    const file = makeFile('Records.json', 'application/json')

    fireEvent.drop(zone, {
      dataTransfer: { files: [file] },
    })

    expect(onFile).toHaveBeenCalledWith(file)
  })

  it('applies drag-over visual state on dragenter', () => {
    render(<DropZone onFile={vi.fn()} />)
    const zone = screen.getByRole('button', { name: /file drop zone/i })

    expect(zone.className).not.toContain('border-emerald-400')

    fireEvent.dragEnter(zone)
    expect(zone.className).toContain('border-emerald-400')
  })

  it('removes drag-over visual state on dragleave', () => {
    render(<DropZone onFile={vi.fn()} />)
    const zone = screen.getByRole('button', { name: /file drop zone/i })

    fireEvent.dragEnter(zone)
    expect(zone.className).toContain('border-emerald-400')

    fireEvent.dragLeave(zone)
    expect(zone.className).not.toContain('border-emerald-400')
  })

  it('calls onFile when file input changes', () => {
    const onFile = vi.fn()
    render(<DropZone onFile={onFile} />)
    const input = screen.getByTestId('file-input')
    const file = makeFile('Records.json', 'application/json')

    fireEvent.change(input, { target: { files: [file] } })

    expect(onFile).toHaveBeenCalledWith(file)
  })

  it('clicking the drop zone triggers the hidden file input', () => {
    const onFile = vi.fn()
    render(<DropZone onFile={onFile} />)
    const zone = screen.getByRole('button', { name: /file drop zone/i })
    const input = screen.getByTestId('file-input')

    const clickSpy = vi.spyOn(input, 'click')
    fireEvent.click(zone)

    expect(clickSpy).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Status-driven rendering
// ---------------------------------------------------------------------------

describe('DropZone — status: idle', () => {
  it('renders the drop target text when status is idle', () => {
    renderWithDispatch(<DropZone onFile={vi.fn()} />)
    // default status is idle
    expect(screen.getByText('Drop Records.json here, or click to browse')).toBeInTheDocument()
  })

  it('does not render a spinner when status is idle', () => {
    renderWithDispatch(<DropZone onFile={vi.fn()} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('DropZone — status: parsing', () => {
  it('renders the spinner when status is parsing', () => {
    renderWithDispatch(<DropZone onFile={vi.fn()} />)
    act(() => {
      getDispatch()({ type: 'SET_STATUS', payload: 'parsing' })
    })
    expect(screen.getByRole('status', { name: /loading spinner/i })).toBeInTheDocument()
  })

  it('renders the percentage when status is parsing', () => {
    renderWithDispatch(<DropZone onFile={vi.fn()} />)
    act(() => {
      getDispatch()({ type: 'SET_STATUS', payload: 'parsing' })
    })
    act(() => {
      getDispatch()({ type: 'SET_PROGRESS', payload: { progress: 63, pointsProcessed: 50000 } })
    })
    expect(screen.getByText('63%')).toBeInTheDocument()
  })

  it('renders the formatted point count when status is parsing', () => {
    renderWithDispatch(<DropZone onFile={vi.fn()} />)
    act(() => {
      getDispatch()({ type: 'SET_STATUS', payload: 'parsing' })
    })
    act(() => {
      getDispatch()({ type: 'SET_PROGRESS', payload: { progress: 50, pointsProcessed: 234100 } })
    })
    expect(screen.getByText(/234,100 points processed/)).toBeInTheDocument()
  })

  it('displays 47% when parseProgress is 47', () => {
    renderWithDispatch(<DropZone onFile={vi.fn()} />)
    act(() => {
      getDispatch()({ type: 'SET_STATUS', payload: 'parsing' })
    })
    act(() => {
      getDispatch()({ type: 'SET_PROGRESS', payload: { progress: 47, pointsProcessed: 0 } })
    })
    expect(screen.getByText('47%')).toBeInTheDocument()
  })

  it('does not render the drop target text when status is parsing', () => {
    renderWithDispatch(<DropZone onFile={vi.fn()} />)
    act(() => {
      getDispatch()({ type: 'SET_STATUS', payload: 'parsing' })
    })
    expect(screen.queryByText('Drop Records.json here, or click to browse')).not.toBeInTheDocument()
  })
})

describe('DropZone — status: error', () => {
  it('renders the drop target (idle state) when status is error', () => {
    renderWithDispatch(<DropZone onFile={vi.fn()} />)
    act(() => {
      getDispatch()({ type: 'SET_ERROR', payload: 'Something went wrong' })
    })
    expect(screen.getByText('Drop Records.json here, or click to browse')).toBeInTheDocument()
  })

  it('does not render a spinner when status is error', () => {
    renderWithDispatch(<DropZone onFile={vi.fn()} />)
    act(() => {
      getDispatch()({ type: 'SET_ERROR', payload: 'Something went wrong' })
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
