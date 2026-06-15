import { useDataState } from '../../contexts/DataContext'
import { useFilterState, useFilterDispatch } from '../../contexts/FilterContext'
import { isPresetAvailable } from '../../utils/dateRangeUtils'

/** Format a Date to "YYYY-MM-DD" for ISO date strings used by FilterContext */
function toISODate(date: Date): string {
  const y = String(date.getFullYear())
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Subtract `months` calendar months from `date` */
function subtractMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() - months)
  return result
}

export function DateRangeFilter() {
  const { minDate, maxDate } = useDataState()
  const { dateRange } = useFilterState()
  const dispatch = useFilterDispatch()

  const today = new Date()

  function setDateRange(start: string | null, end: string | null) {
    dispatch({ type: 'SET_DATE_RANGE', payload: { start, end } })
  }

  function handleStartChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newStart = e.target.value || null
    // If new start is after current end, clear end
    if (newStart && dateRange.end && newStart > dateRange.end) {
      setDateRange(newStart, null)
    } else {
      setDateRange(newStart, dateRange.end)
    }
  }

  function handleEndChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newEnd = e.target.value || null
    // If new end is before current start, clear start
    if (newEnd && dateRange.start && newEnd < dateRange.start) {
      setDateRange(null, newEnd)
    } else {
      setDateRange(dateRange.start, newEnd)
    }
  }

  function handlePreset(months: number) {
    const start = toISODate(subtractMonths(today, months))
    const end = toISODate(today)
    setDateRange(start, end)
  }

  function handleAllTime() {
    setDateRange(null, null)
  }

  const showLast12 = minDate !== null && maxDate !== null && isPresetAvailable(12, minDate, maxDate)
  const showLast2yr =
    minDate !== null && maxDate !== null && isPresetAvailable(24, minDate, maxDate)
  const showLast5yr =
    minDate !== null && maxDate !== null && isPresetAvailable(60, minDate, maxDate)

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-gray-700">Date Range</h3>

      {/* Date inputs */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="date-start" className="text-xs text-gray-500">
            Start
          </label>
          <input
            id="date-start"
            type="date"
            value={dateRange.start ?? ''}
            onChange={handleStartChange}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="date-end" className="text-xs text-gray-500">
            End
          </label>
          <input
            id="date-end"
            type="date"
            value={dateRange.end ?? ''}
            onChange={handleEndChange}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1">
        {showLast12 && (
          <button
            type="button"
            onClick={() => {
              handlePreset(12)
            }}
            className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
          >
            Last 12 months
          </button>
        )}
        {showLast2yr && (
          <button
            type="button"
            onClick={() => {
              handlePreset(24)
            }}
            className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
          >
            Last 2 years
          </button>
        )}
        {showLast5yr && (
          <button
            type="button"
            onClick={() => {
              handlePreset(60)
            }}
            className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
          >
            Last 5 years
          </button>
        )}
        <button
          type="button"
          onClick={handleAllTime}
          className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
        >
          All time
        </button>
      </div>
    </div>
  )
}
