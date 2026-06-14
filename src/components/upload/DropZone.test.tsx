import { render, screen } from '../../test/utils'
import { DropZone } from './DropZone'

describe('DropZone', () => {
  it('renders the drop zone prompt text', () => {
    render(<DropZone />)
    expect(screen.getByText('Drop Records.json here, or click to browse')).toBeInTheDocument()
  })
})
