import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { render, screen } from '../../test/utils'
import { ViewportFilterOverlay } from './ViewportFilterOverlay'
import { useFilterDispatch } from '../../contexts/FilterContext'

// ---------------------------------------------------------------------------
// Helper to toggle viewport filter on from within the provider tree
// ---------------------------------------------------------------------------

function EnableViewport() {
  const dispatch = useFilterDispatch()
  return (
    <button
      onClick={() => {
        dispatch({ type: 'SET_VIEWPORT_ENABLED', payload: true })
      }}
    >
      enable
    </button>
  )
}

function DisableViewport() {
  const dispatch = useFilterDispatch()
  return (
    <button
      onClick={() => {
        dispatch({ type: 'SET_VIEWPORT_ENABLED', payload: false })
      }}
    >
      disable
    </button>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ViewportFilterOverlay', () => {
  it('does not render the label when viewportEnabled is false (default)', () => {
    render(<ViewportFilterOverlay />)
    expect(screen.queryByText('Filtered to visible area')).not.toBeInTheDocument()
  })

  it('renders "Filtered to visible area" when viewportEnabled is true', () => {
    render(
      <>
        <EnableViewport />
        <ViewportFilterOverlay />
      </>,
    )

    act(() => {
      screen.getByRole('button', { name: 'enable' }).click()
    })

    expect(screen.getByText('Filtered to visible area')).toBeInTheDocument()
  })

  it('hides the label when viewportEnabled is toggled back to false', () => {
    render(
      <>
        <EnableViewport />
        <DisableViewport />
        <ViewportFilterOverlay />
      </>,
    )

    act(() => {
      screen.getByRole('button', { name: 'enable' }).click()
    })
    expect(screen.getByText('Filtered to visible area')).toBeInTheDocument()

    act(() => {
      screen.getByRole('button', { name: 'disable' }).click()
    })
    expect(screen.queryByText('Filtered to visible area')).not.toBeInTheDocument()
  })

  it('label is positioned at the top-centre of the map (has inset-x-0 and justify-center)', () => {
    render(
      <>
        <EnableViewport />
        <ViewportFilterOverlay />
      </>,
    )

    act(() => {
      screen.getByRole('button', { name: 'enable' }).click()
    })

    const label = screen.getByText('Filtered to visible area')
    // The wrapper div should carry the positioning classes
    const wrapper = label.closest('div')
    expect(wrapper).not.toBeNull()
    expect(wrapper?.className).toContain('inset-x-0')
    expect(wrapper?.className).toContain('justify-center')
  })
})
