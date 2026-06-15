import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  formatDateRangeLabel,
  formatExportFilename,
  drawDateLabel,
  drawAttribution,
  triggerDownload,
} from './exportUtils'

// ---------------------------------------------------------------------------
// formatDateRangeLabel
// ---------------------------------------------------------------------------

describe('formatDateRangeLabel', () => {
  it('returns formatted month+year range for a known date range', () => {
    const dateRange = { start: '2020-01-15T00:00:00.000Z', end: '2022-12-01T00:00:00.000Z' }
    expect(formatDateRangeLabel(dateRange)).toBe('Jan 2020 – Dec 2022')
  })

  it('returns "All time" when start is null', () => {
    const dateRange = { start: null, end: '2022-12-01T00:00:00.000Z' }
    expect(formatDateRangeLabel(dateRange)).toBe('All time')
  })

  it('returns "All time" when end is null', () => {
    const dateRange = { start: '2020-01-15T00:00:00.000Z', end: null }
    expect(formatDateRangeLabel(dateRange)).toBe('All time')
  })

  it('returns "All time" when both start and end are null', () => {
    const dateRange = { start: null, end: null }
    expect(formatDateRangeLabel(dateRange)).toBe('All time')
  })

  it('correctly formats Jun 2019 – Mar 2021', () => {
    const dateRange = { start: '2019-06-10T00:00:00.000Z', end: '2021-03-22T00:00:00.000Z' }
    expect(formatDateRangeLabel(dateRange)).toBe('Jun 2019 – Mar 2021')
  })
})

// ---------------------------------------------------------------------------
// formatExportFilename
// ---------------------------------------------------------------------------

describe('formatExportFilename', () => {
  it('returns a filename with the date range when both ends are set', () => {
    const dateRange = { start: '2020-01-01T00:00:00.000Z', end: '2022-12-31T00:00:00.000Z' }
    expect(formatExportFilename(dateRange)).toBe('heatmap-2020-01-01-2022-12-31.png')
  })

  it("returns heatmap-all-time-YYYY-MM-DD.png using today's date when start is null", () => {
    // Mock Date so "today" is predictable
    const fixedDate = new Date('2024-06-14T00:00:00.000Z')
    vi.setSystemTime(fixedDate)

    const dateRange = { start: null, end: '2022-12-31T00:00:00.000Z' }
    expect(formatExportFilename(dateRange)).toBe('heatmap-all-time-2024-06-14.png')

    vi.useRealTimers()
  })

  it("returns heatmap-all-time-YYYY-MM-DD.png using today's date when both null", () => {
    const fixedDate = new Date('2024-06-14T00:00:00.000Z')
    vi.setSystemTime(fixedDate)

    const dateRange = { start: null, end: null }
    expect(formatExportFilename(dateRange)).toBe('heatmap-all-time-2024-06-14.png')

    vi.useRealTimers()
  })

  it('extracts only the date portion (YYYY-MM-DD) from ISO strings', () => {
    const dateRange = {
      start: '2019-03-25T12:34:56.789Z',
      end: '2021-11-07T23:59:59.999Z',
    }
    expect(formatExportFilename(dateRange)).toBe('heatmap-2019-03-25-2021-11-07.png')
  })
})

// ---------------------------------------------------------------------------
// Canvas mock factory
// ---------------------------------------------------------------------------

function makeCanvasCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 100 }),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    font: '',
    textBaseline: '',
    fillStyle: '',
  }
}

// ---------------------------------------------------------------------------
// drawDateLabel
// ---------------------------------------------------------------------------

describe('drawDateLabel', () => {
  let ctx: ReturnType<typeof makeCanvasCtx>

  beforeEach(() => {
    ctx = makeCanvasCtx()
  })

  it('calls fillRect to draw the background box', () => {
    drawDateLabel(ctx as unknown as CanvasRenderingContext2D, 'Jan 2020 – Dec 2022', 800, 600)
    expect(ctx.fillRect).toHaveBeenCalledOnce()
  })

  it('calls fillText with the provided label text', () => {
    const text = 'Jan 2020 – Dec 2022'
    drawDateLabel(ctx as unknown as CanvasRenderingContext2D, text, 800, 600)
    expect(ctx.fillText).toHaveBeenCalledWith(text, expect.any(Number), expect.any(Number))
  })

  it('calls save and restore to isolate context state', () => {
    drawDateLabel(ctx as unknown as CanvasRenderingContext2D, 'All time', 800, 600)
    expect(ctx.save).toHaveBeenCalledOnce()
    expect(ctx.restore).toHaveBeenCalledOnce()
  })

  it('positions the box near the bottom-left', () => {
    drawDateLabel(ctx as unknown as CanvasRenderingContext2D, 'All time', 800, 600)
    const [x, y] = ctx.fillRect.mock.calls[0] as number[]
    // x should be a small positive margin from left edge
    expect(x).toBeGreaterThan(0)
    expect(x).toBeLessThan(50)
    // y should be close to the bottom
    expect(y).toBeGreaterThan(500)
  })
})

// ---------------------------------------------------------------------------
// drawAttribution
// ---------------------------------------------------------------------------

describe('drawAttribution', () => {
  let ctx: ReturnType<typeof makeCanvasCtx>

  beforeEach(() => {
    ctx = makeCanvasCtx()
  })

  it('calls fillRect to draw the attribution background box', () => {
    drawAttribution(ctx as unknown as CanvasRenderingContext2D, 800, 600)
    expect(ctx.fillRect).toHaveBeenCalledOnce()
  })

  it('calls fillText with the OSM attribution string', () => {
    drawAttribution(ctx as unknown as CanvasRenderingContext2D, 800, 600)
    expect(ctx.fillText).toHaveBeenCalledWith(
      '© OpenStreetMap contributors',
      expect.any(Number),
      expect.any(Number),
    )
  })

  it('calls save and restore to isolate context state', () => {
    drawAttribution(ctx as unknown as CanvasRenderingContext2D, 800, 600)
    expect(ctx.save).toHaveBeenCalledOnce()
    expect(ctx.restore).toHaveBeenCalledOnce()
  })

  it('positions the box near the bottom-right', () => {
    // measureText returns width=100, so box is ~116px wide (100 + 2*8 padding)
    drawAttribution(ctx as unknown as CanvasRenderingContext2D, 800, 600)
    const [x, y] = ctx.fillRect.mock.calls[0] as number[]
    // x should be to the right (> half canvas width)
    expect(x).toBeGreaterThan(400)
    // y should be near the bottom
    expect(y).toBeGreaterThan(560)
  })
})

// ---------------------------------------------------------------------------
// triggerDownload
// ---------------------------------------------------------------------------

describe('triggerDownload', () => {
  it('creates an anchor element and triggers a click to download', () => {
    const mockClick = vi.fn()
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
    }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(
      mockAnchor as unknown as HTMLAnchorElement,
    )

    const mockCanvas = {
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,abc'),
    }

    triggerDownload(mockCanvas as unknown as HTMLCanvasElement, 'heatmap-test.png')

    expect(mockAnchor.href).toBe('data:image/png;base64,abc')
    expect(mockAnchor.download).toBe('heatmap-test.png')
    expect(mockClick).toHaveBeenCalledOnce()
  })
})
