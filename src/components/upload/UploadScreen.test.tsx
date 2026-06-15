import { render, screen } from '../../test/utils'
import { vi } from 'vitest'
import { useLocationWorker } from '../../hooks/useLocationWorker'
import { UploadScreen } from './UploadScreen'

vi.mock('../../hooks/useLocationWorker', () => ({
  useLocationWorker: vi.fn(),
}))

describe('UploadScreen', () => {
  beforeEach(() => {
    vi.mocked(useLocationWorker).mockReturnValue({ loadFile: vi.fn() })
  })

  it('renders without error', () => {
    render(<UploadScreen />)
    expect(screen.getByText('TraceMap')).toBeInTheDocument()
  })

  it('contains the privacy notice text', () => {
    render(<UploadScreen />)
    expect(
      screen.getByText(
        'Your location data is processed entirely in your browser. Nothing is uploaded or stored anywhere.',
      ),
    ).toBeInTheDocument()
  })

  it('contains the drop zone text', () => {
    render(<UploadScreen />)
    expect(screen.getByText('Drop Records.json here, or click to browse')).toBeInTheDocument()
  })

  it('does not render a "Skip to app" button', () => {
    render(<UploadScreen />)
    expect(screen.queryByRole('button', { name: /skip to app/i })).not.toBeInTheDocument()
  })
})
