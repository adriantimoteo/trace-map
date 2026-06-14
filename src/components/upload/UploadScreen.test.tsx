import { render, screen } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { useUIDispatch } from '../../contexts/UIContext'
import { UploadScreen } from './UploadScreen'

vi.mock('../../contexts/UIContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../contexts/UIContext')>()
  return { ...actual, useUIDispatch: vi.fn() }
})

describe('UploadScreen', () => {
  beforeEach(() => {
    const mockDispatch = vi.fn()
    vi.mocked(useUIDispatch).mockReturnValue(mockDispatch)
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

  it('clicking "Skip to app →" dispatches SET_SCREEN action', async () => {
    const mockDispatch = vi.fn()
    vi.mocked(useUIDispatch).mockReturnValue(mockDispatch)

    render(<UploadScreen />)

    const skipButton = screen.getByRole('button', { name: /skip to app/i })
    await userEvent.click(skipButton)

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_SCREEN', payload: 'app' })
  })
})
