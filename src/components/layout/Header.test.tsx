import { render, screen } from '../../test/utils'
import { Header } from './Header'

describe('Header', () => {
  it('renders the TraceMap title', () => {
    render(<Header />)
    expect(screen.getByText('TraceMap')).toBeInTheDocument()
  })

  it('renders the "Load new file" button', () => {
    render(<Header />)
    expect(screen.getByRole('button', { name: /load new file/i })).toBeInTheDocument()
  })

  it('renders the "Export PNG" button', () => {
    render(<Header />)
    expect(screen.getByRole('button', { name: /export png/i })).toBeInTheDocument()
  })
})
