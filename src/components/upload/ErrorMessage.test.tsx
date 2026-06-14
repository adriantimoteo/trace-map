import { render, screen } from '../../test/utils'
import { ErrorMessage } from './ErrorMessage'

describe('ErrorMessage', () => {
  it('renders nothing when message is null', () => {
    const { container } = render(<ErrorMessage message={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the message text when provided', () => {
    render(<ErrorMessage message="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
