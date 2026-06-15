import { useFilterState } from '../../contexts/FilterContext'

/**
 * Renders a persistent label at the top-centre of the map when the viewport
 * filter is active. This makes the data-viewport coupling explicit so the user
 * does not mistake filter changes for a map bug.
 *
 * Note: a literal bounding box is intentionally NOT drawn because it would
 * always match the viewport edges and be redundant.
 */
export function ViewportFilterOverlay() {
  const { viewportEnabled } = useFilterState()

  if (!viewportEnabled) return null

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center"
      aria-live="polite"
    >
      <span className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white shadow">
        Filtered to visible area
      </span>
    </div>
  )
}
