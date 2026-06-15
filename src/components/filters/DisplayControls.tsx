import { useDataState } from '../../contexts/DataContext'
import { useDisplayState, useDisplayDispatch } from '../../contexts/DisplayContext'

export function DisplayControls() {
  const { status } = useDataState()
  const { radius, intensity } = useDisplayState()
  const dispatch = useDisplayDispatch()

  if (status !== 'ready') return null

  function handleRadiusChange(e: React.ChangeEvent<HTMLInputElement>) {
    dispatch({ type: 'SET_RADIUS', payload: Number(e.target.value) })
  }

  function handleIntensityChange(e: React.ChangeEvent<HTMLInputElement>) {
    dispatch({ type: 'SET_INTENSITY', payload: Number(e.target.value) })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Radius slider */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Radius</h3>
          <span className="text-xs text-gray-500">{radius}px</span>
        </div>
        <input
          type="range"
          min={5}
          max={60}
          step={1}
          value={radius}
          onChange={handleRadiusChange}
          aria-label="Radius"
          className="w-full accent-blue-600"
        />
      </div>

      {/* Intensity slider */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-gray-700">Intensity</h3>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={intensity}
          onChange={handleIntensityChange}
          aria-label="Intensity"
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
        <p className="text-xs text-gray-400">Scale adjusts to current filter.</p>
      </div>
    </div>
  )
}
