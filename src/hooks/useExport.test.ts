import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { useExport } from './useExport'
import { FilterProvider } from '../contexts/FilterContext'
import { UIProvider } from '../contexts/UIContext'
import { DataProvider } from '../contexts/DataContext'
import { DisplayProvider } from '../contexts/DisplayContext'

// ---------------------------------------------------------------------------
// Hoist mock objects so they are available inside vi.mock factory
// ---------------------------------------------------------------------------

const { mockCanvas, mockHtml2canvas, mockTriggerDownload } = vi.hoisted(() => {
  const mockCanvas = {
    getContext: vi.fn(),
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,abc'),
    width: 800,
    height: 600,
  }
  const mockHtml2canvas = vi.fn().mockResolvedValue(mockCanvas)
  const mockTriggerDownload = vi.fn()
  return { mockCanvas, mockHtml2canvas, mockTriggerDownload }
})

// ---------------------------------------------------------------------------
// Mock html2canvas
// ---------------------------------------------------------------------------

vi.mock('html2canvas', () => ({
  default: mockHtml2canvas,
}))

// ---------------------------------------------------------------------------
// Mock exportUtils (triggerDownload only — keep the rest real)
// ---------------------------------------------------------------------------

vi.mock('../utils/exportUtils', async (importOriginal) => {
  const original = await importOriginal<typeof import('../utils/exportUtils')>()
  return {
    ...original,
    triggerDownload: mockTriggerDownload,
  }
})

// ---------------------------------------------------------------------------
// Provider wrapper
// ---------------------------------------------------------------------------

function AllProviders({ children }: { children: React.ReactNode }) {
  return React.createElement(
    UIProvider,
    null,
    React.createElement(
      DataProvider,
      null,
      React.createElement(
        FilterProvider,
        null,
        React.createElement(DisplayProvider, null, children),
      ),
    ),
  )
}

const renderOptions = { wrapper: AllProviders }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useExport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset html2canvas default to resolve with mockCanvas
    mockHtml2canvas.mockResolvedValue(mockCanvas)
    // Default: getContext returns a minimal ctx so drawDateLabel/drawAttribution don't throw
    mockCanvas.getContext.mockReturnValue({
      save: vi.fn(),
      restore: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 100 }),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      font: '',
      textBaseline: '',
      fillStyle: '',
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with isExporting = false', () => {
    const ref = { current: document.createElement('div') }
    const { result } = renderHook(() => useExport(ref), renderOptions)
    expect(result.current.isExporting).toBe(false)
  })

  it('calls html2canvas with the map container element', async () => {
    const div = document.createElement('div')
    const ref = { current: div }

    const { result } = renderHook(() => useExport(ref), renderOptions)

    await act(async () => {
      await result.current.exportMap()
    })

    expect(mockHtml2canvas).toHaveBeenCalledWith(div, expect.objectContaining({ useCORS: true }))
  })

  it('sets isExporting = true during export and false afterwards', async () => {
    const div = document.createElement('div')
    const ref = { current: div }

    // Make html2canvas hang until we resolve it manually
    let resolveCapture: (canvas: typeof mockCanvas) => void = () => undefined
    const capturePromise = new Promise<typeof mockCanvas>((res) => {
      resolveCapture = res
    })
    mockHtml2canvas.mockReturnValueOnce(capturePromise)

    const { result } = renderHook(() => useExport(ref), renderOptions)

    let exportDone = false
    act(() => {
      void result.current.exportMap().then(() => {
        exportDone = true
      })
    })

    // While capture is pending, isExporting should be true
    expect(result.current.isExporting).toBe(true)

    // Resolve the capture
    await act(async () => {
      resolveCapture(mockCanvas)
      await capturePromise
    })

    expect(exportDone).toBe(true)
    expect(result.current.isExporting).toBe(false)
  })

  it('calls triggerDownload with the expected filename for no date range', async () => {
    vi.setSystemTime(new Date('2024-06-14T00:00:00.000Z'))

    const div = document.createElement('div')
    const ref = { current: div }

    const { result } = renderHook(() => useExport(ref), renderOptions)

    await act(async () => {
      await result.current.exportMap()
    })

    expect(mockTriggerDownload).toHaveBeenCalledWith(mockCanvas, 'heatmap-all-time-2024-06-14.png')
  })

  it('does nothing when mapContainerRef.current is null', async () => {
    const ref = { current: null }

    const { result } = renderHook(() => useExport(ref), renderOptions)

    await act(async () => {
      await result.current.exportMap()
    })

    expect(mockHtml2canvas).not.toHaveBeenCalled()
    expect(mockTriggerDownload).not.toHaveBeenCalled()
  })

  it('resets isExporting to false even if html2canvas throws', async () => {
    mockHtml2canvas.mockRejectedValueOnce(new Error('capture failed'))

    const div = document.createElement('div')
    const ref = { current: div }

    const { result } = renderHook(() => useExport(ref), renderOptions)

    await act(async () => {
      await result.current.exportMap().catch(() => undefined)
    })

    expect(result.current.isExporting).toBe(false)
  })
})
