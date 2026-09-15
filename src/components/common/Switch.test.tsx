import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/utils'
import { Switch } from './Switch'

describe('Switch', () => {
  it('renders as a switch with the given accessible name', () => {
    render(<Switch checked={false} onChange={() => {}} ariaLabel="Show thing" />)
    expect(screen.getByRole('switch', { name: 'Show thing' })).toBeInTheDocument()
  })

  it('reflects checked=false via aria-checked', () => {
    render(<Switch checked={false} onChange={() => {}} ariaLabel="Show thing" />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('reflects checked=true via aria-checked', () => {
    render(<Switch checked={true} onChange={() => {}} ariaLabel="Show thing" />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onChange with the inverted value when clicked', () => {
    const onChange = vi.fn()
    render(<Switch checked={false} onChange={onChange} ariaLabel="Show thing" />)
    screen.getByRole('switch').click()
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('calls onChange with false when clicked while checked', () => {
    const onChange = vi.fn()
    render(<Switch checked={true} onChange={onChange} ariaLabel="Show thing" />)
    screen.getByRole('switch').click()
    expect(onChange).toHaveBeenCalledWith(false)
  })
})
