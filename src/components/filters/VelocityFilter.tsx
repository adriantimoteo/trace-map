import { useFilterState, useFilterDispatch } from '../../contexts/FilterContext'

export function VelocityFilter() {
  const { velocityEnabled, velocityThreshold } = useFilterState()
  const dispatch = useFilterDispatch()

  function handleChange(enabled: boolean) {
    dispatch({ type: 'SET_VELOCITY_ENABLED', payload: enabled })
  }

  const onLabel = 'On — ' + String(velocityThreshold) + ' km/h'

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-gray-700">Velocity</h3>
      <div className="flex flex-col gap-1">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name="velocity-filter"
            value="off"
            checked={!velocityEnabled}
            onChange={() => {
              handleChange(false)
            }}
            className="accent-blue-600"
          />
          Off
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name="velocity-filter"
            value="on"
            checked={velocityEnabled}
            onChange={() => {
              handleChange(true)
            }}
            className="accent-blue-600"
          />
          {onLabel}
        </label>
      </div>
    </div>
  )
}
