import { useUIState, useUIDispatch } from '../../contexts/UIContext'

export function AdvancedOptions() {
  const { advancedOptionsOpen } = useUIState()
  const dispatch = useUIDispatch()

  function handleToggle() {
    dispatch({ type: 'TOGGLE_ADVANCED_OPTIONS' })
  }

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
        <div className="mt-2 flex flex-col gap-2 transition-all duration-200">
          <p className="text-sm text-gray-500">Advanced options coming soon</p>
        </div>
      )}
    </div>
  )
}
