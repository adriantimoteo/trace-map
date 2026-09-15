import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/utils'
import { InfoTooltip } from './InfoTooltip'

describe('InfoTooltip', () => {
  it('renders with the given text as both title and accessible name', () => {
    render(<InfoTooltip text="Explains the thing" />)
    const icon = screen.getByRole('img', { name: 'Explains the thing' })
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveAttribute('title', 'Explains the thing')
  })

  it('is focusable via keyboard (tabIndex 0)', () => {
    render(<InfoTooltip text="Some help text" />)
    const icon = screen.getByRole('img', { name: 'Some help text' })
    expect(icon).toHaveAttribute('tabindex', '0')
  })
})
