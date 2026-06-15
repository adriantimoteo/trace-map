import { useDataState } from '../../contexts/DataContext'
import { formatFileSize } from '../../utils/formatters'

export function FileMetaBadge() {
  const { status, fileName, fileSize, totalCount } = useDataState()

  if (status !== 'ready') return null

  const formattedSize = fileSize !== null ? formatFileSize(fileSize) : null
  const formattedCount = totalCount.toLocaleString()

  return (
    <p className="text-sm text-gray-500 break-all">
      {fileName}
      {formattedSize !== null && ` · ${formattedSize}`}
      {` · ${formattedCount} points`}
    </p>
  )
}
