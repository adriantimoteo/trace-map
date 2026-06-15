import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { render, screen } from '../../test/utils'
import { useDataDispatch } from '../../contexts/DataContext'
import { SamplingNotice } from './SamplingNotice'

// Helper to capture DataContext dispatch within the AllProviders tree
function DispatchCapture({
  onDispatch,
}: {
  onDispatch: (d: ReturnType<typeof useDataDispatch>) => void
}) {
  const dispatch = useDataDispatch()
  onDispatch(dispatch)
  return null
}

function renderWithDataDispatch() {
  let dispatch!: ReturnType<typeof useDataDispatch>
  render(
    <>
      <DispatchCapture
        onDispatch={(d) => {
          dispatch = d
        }}
      />
      <SamplingNotice />
    </>,
  )
  return { getDispatch: () => dispatch }
}

const NOTICE_TEXT = /Large dataset sampled to 1\.5M points for performance/

describe('SamplingNotice', () => {
  it('is hidden when stage2Applied is false (default)', () => {
    render(<SamplingNotice />)
    expect(screen.queryByText(NOTICE_TEXT)).not.toBeInTheDocument()
  })

  it('is visible when stage2Applied is true and notice not dismissed', () => {
    const { getDispatch } = renderWithDataDispatch()
    act(() => {
      getDispatch()({ type: 'STAGE2_APPLIED' })
    })
    expect(screen.getByText(NOTICE_TEXT)).toBeInTheDocument()
  })

  it('is hidden when samplingNoticeDismissed is true even if stage2Applied is true', async () => {
    const { useUIDispatch } = await import('../../contexts/UIContext')

    let uiDispatch!: ReturnType<typeof useUIDispatch>
    function UIDispatchCapture() {
      uiDispatch = useUIDispatch()
      return null
    }

    let dataDispatch!: ReturnType<typeof useDataDispatch>

    render(
      <>
        <DispatchCapture
          onDispatch={(d) => {
            dataDispatch = d
          }}
        />
        <UIDispatchCapture />
        <SamplingNotice />
      </>,
    )

    act(() => {
      dataDispatch({ type: 'STAGE2_APPLIED' })
    })
    act(() => {
      uiDispatch({ type: 'DISMISS_SAMPLING_NOTICE' })
    })

    expect(screen.queryByText(NOTICE_TEXT)).not.toBeInTheDocument()
  })

  it('dismiss button dispatches DISMISS_SAMPLING_NOTICE and notice disappears', async () => {
    // Uses real UIProvider (via AllProviders in custom render) to verify
    // that clicking dismiss actually removes the notice from the DOM.
    const userEvent = (await import('@testing-library/user-event')).default
    const user = userEvent.setup()

    const { getDispatch } = renderWithDataDispatch()
    act(() => {
      getDispatch()({ type: 'STAGE2_APPLIED' })
    })

    // Notice is visible
    expect(screen.getByText(NOTICE_TEXT)).toBeInTheDocument()

    // Click the dismiss button
    const dismissBtn = screen.getByRole('button', { name: /dismiss sampling notice/i })
    await user.click(dismissBtn)

    // Notice is gone — real UIProvider processed the action
    expect(screen.queryByText(NOTICE_TEXT)).not.toBeInTheDocument()
  })

  it('does not reappear after dismissal within the same session', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const user = userEvent.setup()

    const { getDispatch } = renderWithDataDispatch()
    act(() => {
      getDispatch()({ type: 'STAGE2_APPLIED' })
    })

    await user.click(screen.getByRole('button', { name: /dismiss sampling notice/i }))
    expect(screen.queryByText(NOTICE_TEXT)).not.toBeInTheDocument()

    // Dispatching STAGE2_APPLIED again should not re-show the notice because
    // samplingNoticeDismissed remains true
    act(() => {
      getDispatch()({ type: 'STAGE2_APPLIED' })
    })
    expect(screen.queryByText(NOTICE_TEXT)).not.toBeInTheDocument()
  })

  it('remains dismissed after RESET because RESET does not clear samplingNoticeDismissed', async () => {
    // Per spec: samplingNoticeDismissed is a UI preference, not data state.
    // A data RESET (new file load) must not un-dismiss the notice.
    const userEvent = (await import('@testing-library/user-event')).default
    const user = userEvent.setup()

    const { getDispatch } = renderWithDataDispatch()

    // First file load: stage2 applied, user dismisses the notice
    act(() => {
      getDispatch()({ type: 'STAGE2_APPLIED' })
    })
    await user.click(screen.getByRole('button', { name: /dismiss sampling notice/i }))
    expect(screen.queryByText(NOTICE_TEXT)).not.toBeInTheDocument()

    // New file load: RESET data, then stage2 applied again
    act(() => {
      getDispatch()({ type: 'RESET' })
    })
    act(() => {
      getDispatch()({ type: 'STAGE2_APPLIED' })
    })

    // samplingNoticeDismissed is still true → notice stays hidden
    expect(screen.queryByText(NOTICE_TEXT)).not.toBeInTheDocument()
  })
})
