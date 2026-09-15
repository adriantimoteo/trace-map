# TraceMap

[![CI](https://github.com/adriantimoteo/trace-map/actions/workflows/ci.yml/badge.svg)](https://github.com/adriantimoteo/trace-map/actions/workflows/ci.yml)

TraceMap turns a Google Takeout location history export into an interactive heatmap you can explore, filter, and export — entirely in your browser.

**Your data never leaves your machine.** There is no backend, no upload, and no network request involving your location data. Parsing, filtering, and rendering all happen client-side, in a Web Worker.

## Features

- **Drag-and-drop upload** of a Google Takeout `Records.json` or `Timeline.json` export, parsed off the main thread with live progress reporting
- **Format auto-detection** between the legacy Records format and the newer semantic Timeline format
- **Interactive heatmap** (Leaflet + leaflet.heat) with adjustable radius and intensity, log-scale density weighting, and percentile-based hotspot smoothing so a handful of outlier locations don't wash out the rest of the map
- **Filtering** by date range (with presets), velocity/speed threshold (to drop GPS noise from vehicle travel), and current map viewport
- **PNG export** of the current map view, including basemap attribution
- **Latin-script map labels** worldwide (Esri World Street Map basemap), so place names outside English-speaking regions stay legible
- **Live point counter** and sampling notice so you always know how much of your data is being rendered
- Re-upload a new file at any time without reloading the app

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL and drop in a `Records.json` (or `Timeline.json`) file from your [Google Takeout](https://takeout.google.com/) location history export.

### Don't have an export handy?

Generate a synthetic dataset for local testing:

```bash
npm run generate-data
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the test suite (Vitest) |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Lint the codebase |
| `npm run type-check` | Type-check without emitting |
| `npm run format` / `format:check` | Format / check formatting with Prettier |
| `npm run generate-data` | Generate a synthetic location history file for local testing |
| `npm run audit:deps` | Audit dependencies against the project's blocklist |

## Tech stack

React 18 + TypeScript, Vite, Tailwind CSS, Leaflet/react-leaflet with leaflet.heat, a Web Worker for streaming JSON parsing (`@streamparser/json`), and html2canvas for PNG export. Tested with Vitest and React Testing Library.

## Privacy

TraceMap is designed to run entirely client-side. Location data is read from the file you select, processed in your browser, and never transmitted anywhere. Closing the tab discards it.

## Status

TraceMap is under active development. The current focus is the v1 desktop experience (upload → filter → export); a publicly hosted v2 with the same privacy guarantees is planned as a follow-on.
