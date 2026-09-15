import { useDataState } from '../../contexts/DataContext'
import { formatFileSize, formatDateRange } from '../../utils/formatters'

export function FileMetaBadge() {
  const { status, fileName, fileSize, totalCount, minDate, maxDate } = useDataState()

  if (status !== 'ready') return null

  const formattedSize = fileSize !== null ? formatFileSize(fileSize) : null
  const formattedCount = totalCount.toLocaleString()
  const formattedDateRange = minDate !== null && maxDate !== null ? formatDateRange(minDate, maxDate) : null

  return (
    <p className="text-sm text-gray-400 break-all">
      {fileName}
      {formattedSize !== null && ` · ${formattedSize}`}
      {` · ${formattedCount} points`}
      {formattedDateRange !== null && ` · ${formattedDateRange}`}
    </p>
  )
}
