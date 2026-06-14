import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'
import type { LocationPoint } from '../types'

// 1. State type
interface DataState {
  status: 'idle' | 'parsing' | 'complete' | 'error'
  parseProgress: number
  points: LocationPoint[]
  totalCount: number
  minDate: string | null
  maxDate: string | null
  stage2Applied: boolean
  errorMessage: string | null
  fileName: string | null
  fileSize: number | null
}

// 2. Action union type
type DataAction =
  | { type: 'SET_STATUS'; payload: DataState['status'] }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'APPEND_BATCH'; payload: LocationPoint[] }
  | { type: 'SET_COMPLETE'; payload: { totalCount: number; minDate: string; maxDate: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' }

// 3. Initial state
const initialState: DataState = {
  status: 'idle',
  parseProgress: 0,
  points: [],
  totalCount: 0,
  minDate: null,
  maxDate: null,
  stage2Applied: false,
  errorMessage: null,
  fileName: null,
  fileSize: null,
}

// 4. Reducer (stubs — returns unchanged state for all actions)
function dataReducer(state: DataState, _action: DataAction): DataState {
  return state
}

// 5. Contexts — separate state and dispatch for better performance
const DataStateContext = createContext<DataState | undefined>(undefined)
const DataDispatchContext = createContext<Dispatch<DataAction> | undefined>(undefined)

// 6. Provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState)
  return (
    <DataStateContext.Provider value={state}>
      <DataDispatchContext.Provider value={dispatch}>{children}</DataDispatchContext.Provider>
    </DataStateContext.Provider>
  )
}

// 7. Custom hooks that throw if used outside provider
export function useDataState(): DataState {
  const ctx = useContext(DataStateContext)
  if (ctx === undefined) {
    throw new Error('useDataState must be used within a DataProvider')
  }
  return ctx
}

export function useDataDispatch(): Dispatch<DataAction> {
  const ctx = useContext(DataDispatchContext)
  if (ctx === undefined) {
    throw new Error('useDataDispatch must be used within a DataProvider')
  }
  return ctx
}
