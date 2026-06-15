import { useDataState } from '../../contexts/DataContext'

interface PointCounterProps {
  visibleCount?: number
}

export function PointCounter({ visibleCount }: PointCounterProps) {
  const { status, totalCount } = useDataState()

  if (status !== 'ready') return null

  const shown = visibleCount ?? totalCount
  const formattedShown = shown.toLocaleString()
  const formattedTotal = totalCount.toLocaleString()

  return (
    <p className="text-sm text-gray-600">
      {formattedShown} of {formattedTotal} points shown
    </p>
  )
}
