declare module 'leaflet-image' {
  import type * as L from 'leaflet'

  /**
   * Captures a Leaflet map as a canvas element.
   * This is a fallback for html2canvas when OSM tiles appear blank due to CORS.
   */
  function leafletImage(
    map: L.Map,
    callback: (error: Error | null, canvas: HTMLCanvasElement) => void,
  ): void

  export = leafletImage
}
