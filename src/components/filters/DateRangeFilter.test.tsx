import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { render, screen, fireEvent } from '../../test/utils'
import { useDataDispatch } from '../../contexts/DataContext'
import { useFilterState, useFilterDispatch } from '../../contexts/FilterContext'
import { DateRangeFilter } from './DateRangeFilter'
import { isPresetAvailable } from '../../utils/dateRangeUtils'

// ---------------------------------------------------------------------------
// Helper components to inject dispatch / capture state inside AllProviders
// ---------------------------------------------------------------------------

function DataDispatchCapture({
  onDispatch,
}: {
  onDispatch: (d: ReturnType<typeof useDataDispatch>) => void
}) {
  const dispatch = useDataDispatch()
  onDispatch(dispatch)
  return null
}

function FilterStateCapture({
  onState,
}: {
  onState: (s: ReturnType<typeof useFilterState>) => void
}) {
  const state = useFilterState()
  onState(state)
  return null
}

function FilterDispatchCapture({
  onDispatch,
}: {
  onDispatch: (d: ReturnType<typeof useFilterDispatch>) => void
}) {
  const dispatch = useFilterDispatch()
  onDispatch(dispatch)
  return null
}

/** Render DateRangeFilter inside AllProviders, returning helpers to drive state. */
function renderDateRangeFilter() {
  let dataDispatch!: ReturnType<typeof useDataDispatch>
  let filterState!: ReturnType<typeof useFilterState>
  let filterDispatch!: ReturnType<typeof useFilterDispatch>

  const utils = render(
    <>
      <DataDispatchCapture onDispatch={(d) => (dataDispatch = d)} />
      <FilterStateCapture onState={(s) => (filterState = s)} />
      <FilterDispatchCapture onDispatch={(d) => (filterDispatch = d)} />
      <DateRangeFilter />
    </>,
  )

  return {
    ...utils,
    getDataDispatch: () => dataDispatch,
    getFilterState: () => filterState,
    getFilterDispatch: () => filterDispatch,
  }
}

/** Set DataContext to 'ready' with the given minDate / maxDate ISO strings */
function makeDataReady(
  dispatch: ReturnType<typeof useDataDispatch>,
  minDate: string,
  maxDate: string,
) {
  act(() => {
    dispatch({
      type: 'SET_COMPLETE',
      payload: { totalCount: 100, minDate, maxDate },
    })
  })
}

// ---------------------------------------------------------------------------
// isPresetAvailable unit tests
// ---------------------------------------------------------------------------

describe('isPresetAvailable', () => {
  it('returns false when span is less than requested months', () => {
    const min = new Date('2023-01-01')
    const max = new Date('2023-11-30') // ~11 months
    expect(isPresetAvailable(12, min, max)).toBe(false)
  })

  it('returns true when span equals exactly 12 months', () => {
    const min = new Date('2023-01-01')
    const max = new Date('2024-01-01') // exactly 12 months
    expect(isPresetAvailable(12, min, max)).toBe(true)
  })

  it('returns true when span exceeds 12 months', () => {
    const min = new Date('2022-01-01')
    const max = new Date('2024-06-01') // ~29 months
    expect(isPresetAvailable(12, min, max)).toBe(true)
  })

  it('11-month span: 12-month preset not available', () => {
    const min = new Date('2023-02-01')
    const max = new Date('2024-01-01') // 11 months
    expect(isPresetAvailable(12, min, max)).toBe(false)
  })

  it('12-month span: 12-month preset available (boundary)', () => {
    const min = new Date('2023-01-01')
    const max = new Date('2024-01-01')
    expect(isPresetAvailable(12, min, max)).toBe(true)
  })

  it('23-month span: 24-month (2-year) preset not available', () => {
    const min = new Date('2022-02-01')
    const max = new Date('2024-01-01') // 23 months
    expect(isPresetAvailable(24, min, max)).toBe(false)
  })

  it('24-month span: 24-month (2-year) preset available (boundary)', () => {
    const min = new Date('2022-01-01')
    const max = new Date('2024-01-01') // exactly 24 months
    expect(isPresetAvailable(24, min, max)).toBe(true)
  })

  it('59-month span: 60-month (5-year) preset not available', () => {
    const min = new Date('2019-02-01')
    const max = new Date('2024-01-01') // 59 months
    expect(isPresetAvailable(60, min, max)).toBe(false)
  })

  it('60-month span: 60-month (5-year) preset available (boundary)', () => {
    const min = new Date('2019-01-01')
    const max = new Date('2024-01-01') // exactly 60 months
    expect(isPresetAvailable(60, min, max)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// DateRangeFilter rendering tests
// ---------------------------------------------------------------------------

describe('DateRangeFilter', () => {
  it('renders start and end date inputs', () => {
    renderDateRangeFilter()
    expect(screen.getByLabelText('Start')).toBeInTheDocument()
    expect(screen.getByLabelText('End')).toBeInTheDocument()
  })

  it('"All time" preset is always visible even with null minDate/maxDate (idle state)', () => {
    renderDateRangeFilter()
    expect(screen.getByRole('button', { name: 'All time' })).toBeInTheDocument()
  })

  it('"Last 12 months" is hidden when data spans < 12 months', () => {
    const { getDataDispatch } = renderDateRangeFilter()
    // 11-month span
    makeDataReady(getDataDispatch(), '2023-02-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')
    expect(screen.queryByRole('button', { name: 'Last 12 months' })).not.toBeInTheDocument()
  })

  it('"Last 12 months" is visible when data spans ≥ 12 months', () => {
    const { getDataDispatch } = renderDateRangeFilter()
    makeDataReady(getDataDispatch(), '2023-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')
    expect(screen.getByRole('button', { name: 'Last 12 months' })).toBeInTheDocument()
  })

  it('"Last 2 years" is hidden when data spans < 24 months', () => {
    const { getDataDispatch } = renderDateRangeFilter()
    makeDataReady(getDataDispatch(), '2022-02-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')
    expect(screen.queryByRole('button', { name: 'Last 2 years' })).not.toBeInTheDocument()
  })

  it('"Last 2 years" is visible when data spans ≥ 24 months', () => {
    const { getDataDispatch } = renderDateRangeFilter()
    makeDataReady(getDataDispatch(), '2022-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')
    expect(screen.getByRole('button', { name: 'Last 2 years' })).toBeInTheDocument()
  })

  it('"Last 5 years" is hidden when data spans < 60 months', () => {
    const { getDataDispatch } = renderDateRangeFilter()
    makeDataReady(getDataDispatch(), '2019-02-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')
    expect(screen.queryByRole('button', { name: 'Last 5 years' })).not.toBeInTheDocument()
  })

  it('"Last 5 years" is visible when data spans ≥ 60 months', () => {
    const { getDataDispatch } = renderDateRangeFilter()
    makeDataReady(getDataDispatch(), '2019-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')
    expect(screen.getByRole('button', { name: 'Last 5 years' })).toBeInTheDocument()
  })

  it('clicking "All time" dispatches SET_DATE_RANGE with { start: null, end: null }', () => {
    const { getFilterState } = renderDateRangeFilter()

    // Pre-set a range so we can confirm it gets cleared
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'All time' }))
    })

    expect(getFilterState().dateRange).toEqual({ start: null, end: null })
  })

  it('clicking "Last 12 months" sets start to ~today-12m and end to ~today', () => {
    const { getDataDispatch, getFilterState } = renderDateRangeFilter()
    makeDataReady(getDataDispatch(), '2023-01-01T00:00:00.000Z', '2024-01-31T00:00:00.000Z')

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Last 12 months' }))
    })

    const state = getFilterState()
    expect(state.dateRange.start).not.toBeNull()
    expect(state.dateRange.end).not.toBeNull()

    // end should be today
    const today = new Date()
    const todayISO = `${String(today.getFullYear())}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    expect(state.dateRange.end).toBe(todayISO)

    // start should be 12 months ago
    const expectedStart = new Date(today)
    expectedStart.setMonth(expectedStart.getMonth() - 12)
    const expectedStartISO = `${String(expectedStart.getFullYear())}-${String(expectedStart.getMonth() + 1).padStart(2, '0')}-${String(expectedStart.getDate()).padStart(2, '0')}`
    expect(state.dateRange.start).toBe(expectedStartISO)
  })

  it('selecting a start date after current end clears the end', () => {
    const { getFilterState, getFilterDispatch } = renderDateRangeFilter()

    // First set an end date
    act(() => {
      getFilterDispatch()({
        type: 'SET_DATE_RANGE',
        payload: { start: '2023-01-01', end: '2023-06-01' },
      })
    })

    // Now type a start date after the end
    act(() => {
      fireEvent.change(screen.getByLabelText('Start'), {
        target: { value: '2023-09-01' },
      })
    })

    expect(getFilterState().dateRange.start).toBe('2023-09-01')
    expect(getFilterState().dateRange.end).toBeNull()
  })

  it('selecting an end date before current start clears the start', () => {
    const { getFilterState, getFilterDispatch } = renderDateRangeFilter()

    // First set a start date
    act(() => {
      getFilterDispatch()({
        type: 'SET_DATE_RANGE',
        payload: { start: '2023-06-01', end: '2023-12-01' },
      })
    })

    // Now type an end date before the start
    act(() => {
      fireEvent.change(screen.getByLabelText('End'), {
        target: { value: '2023-03-01' },
      })
    })

    expect(getFilterState().dateRange.end).toBe('2023-03-01')
    expect(getFilterState().dateRange.start).toBeNull()
  })
})
