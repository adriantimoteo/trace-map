import { render, screen, fireEvent } from '../../test/utils'
import { vi } from 'vitest'
import { DropZone } from './DropZone'

function makeFile(name: string, type: string, content = '{}') {
  return new File([content], name, { type })
}

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
