import { useState, useCallback } from 'react'
import type { RefObject } from 'react'
import html2canvas from 'html2canvas'
import { useFilterState } from '../contexts/FilterContext'
import {
  formatDateRangeLabel,
  formatExportFilename,
  drawDateLabel,
  drawAttribution,
  triggerDownload,
} from '../utils/exportUtils'

// NOTE: If OSM tiles appear blank in production (due to CORS), the fallback is
// to switch to `leaflet-image` (already installed as a dev dependency).
// leaflet-image bypasses CORS by re-drawing map tiles via the Leaflet API.
// Replace the html2canvas call below with:
//   import leafletImage from 'leaflet-image'
//   leafletImage(mapInstance, (err, canvas) => { ... })
// where `mapInstance` is obtained from MapContext.

interface UseExportReturn {
  exportMap: () => Promise<void>
  isExporting: boolean
}

/**
 * Hook that captures the map container as a PNG and triggers a download.
 *
 * @param mapContainerRef - ref to the <div> wrapping the Leaflet map
 */
export function useExport(mapContainerRef: RefObject<HTMLDivElement | null>): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false)
  const { dateRange } = useFilterState()

  const exportMap = useCallback(async () => {
    const container = mapContainerRef.current
    if (container === null) return

    setIsExporting(true)

    try {
      const canvas = await html2canvas(container, {
        useCORS: true,
        allowTaint: false,
        logging: false,
      })

      const ctx = canvas.getContext('2d')
      if (ctx !== null) {
        const label = formatDateRangeLabel(dateRange)
        drawDateLabel(ctx, label, canvas.width, canvas.height)
        drawAttribution(ctx, canvas.width, canvas.height)
      }

      const filename = formatExportFilename(dateRange)
      triggerDownload(canvas, filename)
    } finally {
      setIsExporting(false)
    }
  }, [mapContainerRef, dateRange])

  return { exportMap, isExporting }
}
