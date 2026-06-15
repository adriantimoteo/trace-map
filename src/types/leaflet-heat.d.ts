declare module 'leaflet.heat' {
  // Side-effect import only — the plugin attaches L.heatLayer to the Leaflet namespace
}

declare namespace L {
  interface HeatLayerOptions {
    minOpacity?: number
    maxZoom?: number
    max?: number
    radius?: number
    blur?: number
    gradient?: Record<number, string>
  }

  function heatLayer(points: [number, number, number][], options?: HeatLayerOptions): L.Layer
}
