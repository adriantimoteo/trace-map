import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'
import type { MapBounds, DateBucket } from '../types'

// 1. State type
interface FilterState {
  dateRange: { start: string | null; end: string | null }
  velocityEnabled: boolean
  velocityThreshold: number
  viewportEnabled: boolean
  viewportBounds: MapBounds | null
  dateBucketOverride: DateBucket | null
}

// 2. Action union type
type FilterAction =
  | { type: 'SET_DATE_RANGE'; payload: { start: string | null; end: string | null } }
  | { type: 'SET_VELOCITY_ENABLED'; payload: boolean }
  | { type: 'SET_VELOCITY_THRESHOLD'; payload: number }
  | { type: 'SET_VIEWPORT_ENABLED'; payload: boolean }
  | { type: 'SET_VIEWPORT_BOUNDS'; payload: MapBounds | null }
  | { type: 'SET_DATE_BUCKET_OVERRIDE'; payload: DateBucket | null }
  | { type: 'RESET' }

// 3. Initial state
const initialState: FilterState = {
  dateRange: { start: null, end: null },
  velocityEnabled: false,
  velocityThreshold: 15,
  viewportEnabled: false,
  viewportBounds: null,
  dateBucketOverride: null,
}

// 4. Reducer (stubs — returns unchanged state for all actions)
function filterReducer(state: FilterState, _action: FilterAction): FilterState {
  return state
}

// 5. Contexts — separate state and dispatch for better performance
const FilterStateContext = createContext<FilterState | undefined>(undefined)
const FilterDispatchContext = createContext<Dispatch<FilterAction> | undefined>(undefined)

// 6. Provider component
export function FilterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(filterReducer, initialState)
  return (
    <FilterStateContext.Provider value={state}>
      <FilterDispatchContext.Provider value={dispatch}>{children}</FilterDispatchContext.Provider>
    </FilterStateContext.Provider>
  )
}

// 7. Custom hooks that throw if used outside provider
export function useFilterState(): FilterState {
  const ctx = useContext(FilterStateContext)
  if (ctx === undefined) {
    throw new Error('useFilterState must be used within a FilterProvider')
  }
  return ctx
}

export function useFilterDispatch(): Dispatch<FilterAction> {
  const ctx = useContext(FilterDispatchContext)
  if (ctx === undefined) {
    throw new Error('useFilterDispatch must be used within a FilterProvider')
  }
  return ctx
}
