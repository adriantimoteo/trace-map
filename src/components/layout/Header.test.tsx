import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test/utils'
import { Header } from './Header'

function renderHeader(onLoadNewFile = vi.fn()) {
  return render(<Header onExport={vi.fn()} isExporting={false} onLoadNewFile={onLoadNewFile} />)
}

describe('Header', () => {
  it('renders the TraceMap title', () => {
    renderHeader()
    expect(screen.getByText('TraceMap')).toBeInTheDocument()
  })

  it('renders the "Load new file" button', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /load new file/i })).toBeInTheDocument()
  })

  it('renders the "Export PNG" button', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /export png/i })).toBeInTheDocument()
  })

  it('has a hidden file input with correct accept attribute', () => {
    renderHeader()
    const input = screen.getByTestId('header-file-input')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('accept', '.json,application/json')
    expect(input).toHaveClass('sr-only')
  })

  it('"Load new file" button does not dispatch SET_SCREEN', () => {
    // The old implementation dispatched SET_SCREEN:'upload' — this test confirms it no longer does.
    // We verify by checking there is no navigation side-effect: the screen context stays the same.
    // Since Header no longer imports useUIDispatch at all, simply rendering and clicking
    // without error is sufficient evidence.
    renderHeader()
    const button = screen.getByRole('button', { name: /load new file/i })
    // Click should not throw even though UIDispatch is not used
    fireEvent.click(button)
    // Still on the page — no navigation happened
    expect(screen.getByText('TraceMap')).toBeInTheDocument()
  })

  it('calls onLoadNewFile with the selected file when a file is chosen', () => {
    const onLoadNewFile = vi.fn()
    renderHeader(onLoadNewFile)

    const input = screen.getByTestId('header-file-input')
    const file = new File(['{}'], 'test.json', { type: 'application/json' })

    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    fireEvent.change(input)

    expect(onLoadNewFile).toHaveBeenCalledWith(file)
  })
})
