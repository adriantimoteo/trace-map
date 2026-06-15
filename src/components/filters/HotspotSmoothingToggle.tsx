import { useDisplayState, useDisplayDispatch } from '../../contexts/DisplayContext'

export function HotspotSmoothingToggle() {
  const { hotspotSmoothing } = useDisplayState()
  const dispatch = useDisplayDispatch()

  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={hotspotSmoothing}
          onChange={() => {
            dispatch({ type: 'TOGGLE_HOTSPOT_SMOOTHING' })
          }}
          className="accent-blue-600"
        />
        Smooth hotspots
      </label>
      <p className="text-xs text-gray-500 pl-5">
        Caps color scale at 95th percentile density so frequently-visited spots don't drown out
        everything else.
      </p>
    </div>
  )
}
