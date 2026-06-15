import { useDataState } from '../../contexts/DataContext'
import { useUIDispatch, useUIState } from '../../contexts/UIContext'

export function SamplingNotice() {
  const { stage2Applied } = useDataState()
  const { samplingNoticeDismissed } = useUIState()
  const dispatch = useUIDispatch()

  if (!stage2Applied || samplingNoticeDismissed) return null

  return (
    <div className="flex items-start gap-2 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
      <span className="flex-1">Large dataset sampled to 1.5M points for performance.</span>
      <button
        aria-label="Dismiss sampling notice"
        className="shrink-0 font-bold leading-none"
        onClick={() => { dispatch({ type: 'DISMISS_SAMPLING_NOTICE' }) }}
      >
        ×
      </button>
    </div>
  )
}
