import { render, screen } from '../../test/utils'
import { PrivacyNotice } from './PrivacyNotice'

describe('PrivacyNotice', () => {
  it('renders the exact required privacy text', () => {
    render(<PrivacyNotice />)
    expect(
      screen.getByText(
        'Your location data is processed entirely in your browser. Nothing is uploaded or stored anywhere.',
      ),
    ).toBeInTheDocument()
  })
})
