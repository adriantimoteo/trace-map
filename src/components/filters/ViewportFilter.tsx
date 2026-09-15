import { useFilterState, useFilterDispatch } from '../../contexts/FilterContext'
import { useMapContext } from '../../contexts/MapContext'
import { InfoTooltip } from '../common/InfoTooltip'

/**
 * Checkbox that toggles the viewport (map-bounds) filter.
 *
 * On enable:  dispatches SET_VIEWPORT_ENABLED: true, then immediately dispatches
 *             SET_VIEWPORT_BOUNDS with the current map bounds so the filter
 *             activates without requiring a pan/zoom first.
 *
 * On disable: dispatches SET_VIEWPORT_ENABLED: false. FilterContext clears
 *             viewportBounds automatically in the reducer.
 */
export function ViewportFilter() {
  const { viewportEnabled } = useFilterState()
  const dispatch = useFilterDispatch()
  const { map } = useMapContext()

  function handleChange(enabled: boolean) {
    dispatch({ type: 'SET_VIEWPORT_ENABLED', payload: enabled })

    if (enabled && map !== null) {
      const bounds = map.getBounds()
      dispatch({
        type: 'SET_VIEWPORT_BOUNDS',
        payload: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
      })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <h3 className="text-sm font-medium text-gray-200">Viewport</h3>
        <InfoTooltip text="Only shows points within the map's current visible area. Updates automatically as you pan and zoom." />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-100">
        <input
          type="checkbox"
          checked={viewportEnabled}
          onChange={(e) => {
            handleChange(e.target.checked)
          }}
          className="accent-blue-600"
        />
        Filter to visible area
      </label>
    </div>
  )
}
