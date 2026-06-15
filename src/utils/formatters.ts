const KB = 1_024
const MB = 1_048_576
const GB = 1_073_741_824

/**
 * Formats a byte count as a human-readable file size string.
 *
 * - < 1 MB  → "X KB"      (rounded to nearest whole KB)
 * - 1 MB–1 GB → "X.X MB"  (one decimal place)
 * - > 1 GB  → "X.XX GB"   (two decimal places)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < MB) {
    const kb = String(Math.round(bytes / KB))
    return `${kb} KB`
  }
  if (bytes < GB) {
    const mb = (bytes / MB).toFixed(1)
    return `${mb} MB`
  }
  const gb = (bytes / GB).toFixed(2)
  return `${gb} GB`
}
