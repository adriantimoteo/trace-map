import { useDataState } from '../../contexts/DataContext'
import { useFilteredPoints } from '../../hooks/useFilteredPoints'

export function NoPointsOverlay() {
  const { status } = useDataState()
  const { filteredCount } = useFilteredPoints()

  if (status !== 'ready' || filteredCount > 0) {
    return null
  }

  return (
    <div className="absolute inset-0 z-[500] flex items-center justify-center bg-gray-950/70 pointer-events-none">
      <p className="text-lg font-semibold text-white">No points match the current filters.</p>
    </div>
  )
}
