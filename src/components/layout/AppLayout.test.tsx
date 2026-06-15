import { render, screen, fireEvent } from '../../test/utils'
import { vi } from 'vitest'
import { AppLayout } from './AppLayout'

// Stable mock map instance — must not be recreated on every render or MapContext
// will enter an infinite update loop (setMap triggers re-render → new mock → setMap…)
const mockMap = {
  fitBounds: vi.fn(),
  removeLayer: vi.fn(),
  addLayer: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  getBounds: vi.fn(() => ({
    getNorth: () => 52,
    getSouth: () => 51,
    getEast: () => 0.5,
    getWest: () => -1,
  })),
}

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="leaflet-map">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  useMap: () => mockMap,
}))

vi.mock('leaflet/dist/leaflet.css', () => ({}))

vi.mock('leaflet.heat', () => ({}))

vi.mock('leaflet', () => ({
  default: {
    heatLayer: vi.fn(() => ({ addTo: vi.fn() })),
    latLngBounds: vi.fn(() => ({})),
  },
}))

// Mock useLocationWorker so we don't spin up a real Worker in tests
const mockLoadFile = vi.fn()
vi.mock('../../hooks/useLocationWorker', () => ({
  useLocationWorker: () => ({ loadFile: mockLoadFile }),
}))

describe('AppLayout', () => {
  it('renders the Header with app title', () => {
    render(<AppLayout />)
    expect(screen.getByText('TraceMap')).toBeInTheDocument()
  })

  it('renders the FilterPanel region', () => {
    render(<AppLayout />)
    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  it('renders the MapContainer region', () => {
    render(<AppLayout />)
    expect(screen.getByTestId('leaflet-map')).toBeInTheDocument()
  })
})

describe('AppLayout — drag-and-drop re-upload', () => {
  beforeEach(() => {
    mockLoadFile.mockReset()
  })

  function getOuterDiv(container: HTMLElement) {
    // The outermost div is the first child of the container
    return container.firstChild as HTMLElement
  }

  it('shows drop indicator when a file is dragged over', () => {
    const { container } = render(<AppLayout />)
    const outer = getOuterDiv(container)

    fireEvent.dragEnter(outer, {
      dataTransfer: { files: [] },
    })

    expect(screen.getByText(/drop new file to load/i)).toBeInTheDocument()
  })

  it('hides drop indicator when drag leaves the outer element', () => {
    const { container } = render(<AppLayout />)
    const outer = getOuterDiv(container)

    fireEvent.dragEnter(outer, { dataTransfer: { files: [] } })
    expect(screen.getByText(/drop new file to load/i)).toBeInTheDocument()

    // Simulate leaving the outermost element (target === currentTarget)
    fireEvent.dragLeave(outer, { target: outer })
    expect(screen.queryByText(/drop new file to load/i)).toBeNull()
  })

  it('calls loadFile with the dropped file on drop', () => {
    const { container } = render(<AppLayout />)
    const outer = getOuterDiv(container)

    const file = new File(['{}'], 'records.json', { type: 'application/json' })

    fireEvent.dragEnter(outer, { dataTransfer: { files: [file] } })
    fireEvent.drop(outer, {
      dataTransfer: { files: [file] },
    })

    expect(mockLoadFile).toHaveBeenCalledWith(file)
  })

  it('hides drop indicator after drop', () => {
    const { container } = render(<AppLayout />)
    const outer = getOuterDiv(container)

    const file = new File(['{}'], 'records.json', { type: 'application/json' })

    fireEvent.dragEnter(outer, { dataTransfer: { files: [file] } })
    fireEvent.drop(outer, { dataTransfer: { files: [file] } })

    expect(screen.queryByText(/drop new file to load/i)).toBeNull()
  })

  it('does not call loadFile when drop has no files', () => {
    const { container } = render(<AppLayout />)
    const outer = getOuterDiv(container)

    fireEvent.drop(outer, { dataTransfer: { files: [] } })

    expect(mockLoadFile).not.toHaveBeenCalled()
  })
})

describe('AppLayout — non-JSON drop shows error', () => {
  beforeEach(() => {
    mockLoadFile.mockReset()
  })

  it('calls loadFile even for non-JSON files (validation is inside loadFile)', () => {
    // Per the architecture: file validation (JSON check) is done inside useLocationWorker.loadFile.
    // AppLayout's handleNewFile dispatches resets then calls loadFile regardless of file type.
    // The error is set by loadFile internals. We just verify loadFile is always called.
    const { container } = render(<AppLayout />)
    const outer = container.firstChild as HTMLElement

    const txtFile = new File(['hello'], 'notes.txt', { type: 'text/plain' })

    fireEvent.drop(outer, { dataTransfer: { files: [txtFile] } })

    expect(mockLoadFile).toHaveBeenCalledWith(txtFile)
  })
})
