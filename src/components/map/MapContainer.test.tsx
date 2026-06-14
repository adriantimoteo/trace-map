import { render, screen } from '../../test/utils'
import { vi } from 'vitest'
import { MapContainer } from './MapContainer'

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="leaflet-map">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
}))

vi.mock('leaflet/dist/leaflet.css', () => ({}))

describe('MapContainer', () => {
  it('renders without error', () => {
    render(<MapContainer />)
    expect(screen.getByTestId('leaflet-map')).toBeInTheDocument()
  })

  it('renders the tile layer', () => {
    render(<MapContainer />)
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument()
  })
})
