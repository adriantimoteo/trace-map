import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'
import type { LocationPoint } from '../types'

// 1. State type
interface DataState {
  status: 'idle' | 'parsing' | 'ready' | 'error'
  parseProgress: number
  pointsProcessed: number
  points: LocationPoint[]
  totalCount: number
  minDate: Date | null
  maxDate: Date | null
  stage2Applied: boolean
  errorMessage: string | null
  fileName: string | null
  fileSize: number | null
}

// 2. Action union type
type DataAction =
  | { type: 'SET_STATUS'; payload: DataState['status'] }
  | { type: 'SET_PROGRESS'; payload: { progress: number; pointsProcessed: number } }
  | { type: 'APPEND_BATCH'; payload: LocationPoint[] }
  | { type: 'SET_COMPLETE'; payload: { totalCount: number; minDate: string; maxDate: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' }
  | { type: 'STAGE2_APPLIED' }
  | { type: 'SET_FILE_META'; payload: { fileName: string; fileSize: number } }

// 3. Initial state
const initialState: DataState = {
  status: 'idle',
  parseProgress: 0,
  pointsProcessed: 0,
  points: [],
  totalCount: 0,
  minDate: null,
  maxDate: null,
  stage2Applied: false,
  errorMessage: null,
  fileName: null,
  fileSize: null,
}

// 4. Reducer
function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'RESET':
      return { ...initialState }

    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload,
        errorMessage: action.payload !== 'error' ? null : state.errorMessage,
      }

    case 'SET_PROGRESS':
      return {
        ...state,
        parseProgress: action.payload.progress,
        pointsProcessed: action.payload.pointsProcessed,
      }

    case 'APPEND_BATCH':
      return {
        ...state,
        points: [...state.points, ...action.payload],
      }

    case 'SET_COMPLETE':
      return {
        ...state,
        status: 'ready',
        totalCount: action.payload.totalCount,
        minDate: new Date(action.payload.minDate),
        maxDate: new Date(action.payload.maxDate),
      }

    case 'SET_ERROR':
      return {
        ...state,
        status: 'error',
        errorMessage: action.payload,
        points: [],
        totalCount: 0,
      }

    case 'STAGE2_APPLIED':
      return {
        ...state,
        stage2Applied: true,
      }

    case 'SET_FILE_META':
      return {
        ...state,
        fileName: action.payload.fileName,
        fileSize: action.payload.fileSize,
      }

    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
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
