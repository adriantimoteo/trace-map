import { useDataState } from '../../contexts/DataContext'
import { useUIState } from '../../contexts/UIContext'

export function ParseProgressOverlay() {
  const { status, parseProgress, pointsProcessed } = useDataState()
  const { screen } = useUIState()

  if (status !== 'parsing' || screen !== 'app') {
    return null
  }

  const formattedPoints = new Intl.NumberFormat().format(pointsProcessed)

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-emerald-400"
          role="status"
          aria-label="Loading spinner"
        />
        <p className="text-base text-gray-300">Processing your location history…</p>
        <p className="text-2xl font-semibold text-emerald-400" aria-live="polite">
          {parseProgress}%
        </p>
        <p className="text-sm text-gray-400" aria-live="polite">
          {formattedPoints} points processed
        </p>
      </div>
    </div>
  )
}
