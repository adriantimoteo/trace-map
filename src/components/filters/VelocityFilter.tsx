import { useFilterState, useFilterDispatch } from '../../contexts/FilterContext'
import { InfoTooltip } from '../common/InfoTooltip'
import { Switch } from '../common/Switch'

const LABEL = 'Show In-Transit Points'

export function VelocityFilter() {
  const { velocityEnabled } = useFilterState()
  const dispatch = useFilterDispatch()

  // velocityEnabled means the filter is ACTIVE (fast points are excluded),
  // so the switch — which reads as "show them" — is the inverse of that.
  const showInTransit = !velocityEnabled

  function handleChange(checked: boolean) {
    dispatch({ type: 'SET_VELOCITY_ENABLED', payload: !checked })
  }

  return (
    <div className="flex items-center gap-2">
      <Switch checked={showInTransit} onChange={handleChange} ariaLabel={LABEL} />
      <span className="text-sm text-gray-100">{LABEL}</span>
      <InfoTooltip text="In-transit points are GPS pings recorded while moving fast, e.g. driving or transit. Off by default to keep the heatmap focused on places you spent time, not routes you passed through." />
    </div>
  )
}
