import { useState, useEffect, useRef } from 'react'
import { useUIState, useUIDispatch } from '../../contexts/UIContext'
import { useFilterState, useFilterDispatch } from '../../contexts/FilterContext'
import { useSortedSpeeds } from '../../hooks/useSortedSpeeds'
import { countExcludedAtThreshold } from '../../utils/velocityCount'

const VELOCITY_MIN = 5
const VELOCITY_MAX = 120
const DEBOUNCE_MS = 300

export function AdvancedOptions() {
  const { advancedOptionsOpen } = useUIState()
  const uiDispatch = useUIDispatch()

  const { velocityThreshold } = useFilterState()
  const filterDispatch = useFilterDispatch()

  const sortedSpeeds = useSortedSpeeds()

  // Local slider state — tracks the in-drag value separately from committed context value.
  // This lets us update the display instantly without triggering a full filter pipeline re-run
  // on every animation frame of the drag.
  const [localThreshold, setLocalThreshold] = useState(velocityThreshold)

  // Keep local slider in sync if context value changes externally (e.g. on RESET).
  useEffect(() => {
    setLocalThreshold(velocityThreshold)
  }, [velocityThreshold])

  // Debounce ref: holds the pending timer ID for the context dispatch.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleToggle() {
    uiDispatch({ type: 'TOGGLE_ADVANCED_OPTIONS' })
  }

  function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value)
    setLocalThreshold(value)

    // Cancel any pending debounced dispatch.
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current)
    }

    // Schedule context update 300 ms after the user stops dragging.
    debounceRef.current = setTimeout(() => {
      filterDispatch({ type: 'SET_VELOCITY_THRESHOLD', payload: value })
      debounceRef.current = null
    }, DEBOUNCE_MS)
  }

  // Live exclusion count — computed instantly from the sorted speeds array (O(log n) binary search).
  const excludedCount = countExcludedAtThreshold(sortedSpeeds, localThreshold)
  const formattedCount = new Intl.NumberFormat().format(excludedCount)

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center justify-between gap-2 py-1 text-sm font-medium text-gray-700 hover:text-gray-900"
        aria-expanded={advancedOptionsOpen}
      >
        <span>Advanced Options</span>
        <svg
          className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${advancedOptionsOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {advancedOptionsOpen && (
        <div className="mt-2 flex flex-col gap-3 transition-all duration-200">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="velocity-threshold-slider"
                className="text-sm font-medium text-gray-700"
              >
                Velocity threshold
              </label>
              <span className="text-sm text-gray-600">{localThreshold} km/h</span>
            </div>
            <input
              id="velocity-threshold-slider"
              type="range"
              min={VELOCITY_MIN}
              max={VELOCITY_MAX}
              step={1}
              value={localThreshold}
              onChange={handleSliderChange}
              className="w-full accent-blue-600"
            />
            <p className="text-xs text-gray-500">
              {formattedCount} {excludedCount === 1 ? 'point' : 'points'} would be excluded
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
