import type { FilterState } from '../contexts/FilterContext'

// ---------------------------------------------------------------------------
// Label + filename helpers
// ---------------------------------------------------------------------------

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/**
 * Formats the date range as a human-readable label for the overlay.
 *
 * - Both ends set → "Jan 2020 – Dec 2022"
 * - Either end null → "All time"
 */
export function formatDateRangeLabel(dateRange: FilterState['dateRange']): string {
  const { start, end } = dateRange
  if (start === null || end === null) return 'All time'

  const startDate = new Date(start)
  const endDate = new Date(end)

  const startMonth = MONTH_ABBR[startDate.getUTCMonth()] ?? ''
  const endMonth = MONTH_ABBR[endDate.getUTCMonth()] ?? ''
  const startLabel = `${startMonth} ${String(startDate.getUTCFullYear())}`
  const endLabel = `${endMonth} ${String(endDate.getUTCFullYear())}`

  return `${startLabel} – ${endLabel}`
}

/**
 * Returns the filename for the exported PNG.
 *
 * - Date range active → "heatmap-2020-01-01-2022-12-31.png"
 * - All time → "heatmap-all-time-YYYY-MM-DD.png" (today's date)
 */
export function formatExportFilename(dateRange: FilterState['dateRange']): string {
  const { start, end } = dateRange
  if (start !== null && end !== null) {
    const startDate = start.slice(0, 10) // "YYYY-MM-DD"
    const endDate = end.slice(0, 10)
    return `heatmap-${startDate}-${endDate}.png`
  }

  const today = new Date().toISOString().slice(0, 10)
  return `heatmap-all-time-${today}.png`
}

// ---------------------------------------------------------------------------
// Canvas drawing helpers
// ---------------------------------------------------------------------------

const OVERLAY_PADDING_X = 8
const OVERLAY_PADDING_Y = 5
const OVERLAY_MARGIN = 10
const OVERLAY_BG = 'rgba(0, 0, 0, 0.55)'

/**
 * Draws the date range label in the bottom-left corner of the canvas.
 */
export function drawDateLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  canvasWidth: number,
  canvasHeight: number,
): void {
  ctx.save()
  ctx.font = 'bold 13px sans-serif'
  ctx.textBaseline = 'alphabetic'

  const metrics = ctx.measureText(text)
  const textWidth = metrics.width
  const textHeight = 13 // approximate cap height for 13px font

  const boxWidth = textWidth + OVERLAY_PADDING_X * 2
  const boxHeight = textHeight + OVERLAY_PADDING_Y * 2

  const x = OVERLAY_MARGIN
  const y = canvasHeight - OVERLAY_MARGIN - boxHeight

  ctx.fillStyle = OVERLAY_BG
  ctx.fillRect(x, y, boxWidth, boxHeight)

  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, x + OVERLAY_PADDING_X, y + OVERLAY_PADDING_Y + textHeight)

  ctx.restore()
}

/**
 * Draws the OSM attribution label in the bottom-right corner of the canvas.
 *
 * This is drawn programmatically (not captured from the DOM) because
 * html2canvas reliably misses overlapping elements. This always satisfies
 * the OSM licence requirement.
 */
export function drawAttribution(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const text = '© OpenStreetMap contributors'

  ctx.save()
  ctx.font = '11px sans-serif'
  ctx.textBaseline = 'alphabetic'

  const metrics = ctx.measureText(text)
  const textWidth = metrics.width
  const textHeight = 11

  const boxWidth = textWidth + OVERLAY_PADDING_X * 2
  const boxHeight = textHeight + OVERLAY_PADDING_Y * 2

  const x = canvasWidth - OVERLAY_MARGIN - boxWidth
  const y = canvasHeight - OVERLAY_MARGIN - boxHeight

  ctx.fillStyle = OVERLAY_BG
  ctx.fillRect(x, y, boxWidth, boxHeight)

  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, x + OVERLAY_PADDING_X, y + OVERLAY_PADDING_Y + textHeight)

  ctx.restore()
}

// ---------------------------------------------------------------------------
// Download trigger
// ---------------------------------------------------------------------------

/**
 * Triggers a browser PNG download from the given canvas element.
 */
export function triggerDownload(canvas: HTMLCanvasElement, filename: string): void {
  const dataUrl = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
