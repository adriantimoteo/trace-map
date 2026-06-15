import { useDisplayState, useDisplayDispatch } from '../../contexts/DisplayContext'

export function HotspotSmoothingToggle() {
  const { hotspotSmoothing, logScaleDensity } = useDisplayState()
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
        Caps color scale at 95th percentile density so frequently-visited spots don&apos;t drown out
        everything else.
      </p>
      <div className="pl-5">
        <label
          className={`flex items-center gap-2 text-sm select-none ${hotspotSmoothing ? 'text-gray-700 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
        >
          <input
            type="checkbox"
            checked={logScaleDensity}
            disabled={!hotspotSmoothing}
            onChange={() => {
              dispatch({ type: 'TOGGLE_LOG_SCALE_DENSITY' })
            }}
            className="accent-blue-600"
          />
          Compress density curve
        </label>
        <p className="text-xs text-gray-400 pl-5 mt-0.5">
          Uses log scale so mid-density spots are more visible.
        </p>
      </div>
    </div>
  )
}
