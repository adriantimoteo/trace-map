import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'

// 1. State type
interface DisplayState {
  radius: number
  intensity: number
  hotspotSmoothing: boolean
}

// 2. Action union type
type DisplayAction =
  | { type: 'SET_RADIUS'; payload: number }
  | { type: 'SET_INTENSITY'; payload: number }
  | { type: 'TOGGLE_HOTSPOT_SMOOTHING' }

// 3. Initial state
const initialState: DisplayState = {
  radius: 20,
  intensity: 0.5,
  hotspotSmoothing: false,
}

// 4. Reducer
function displayReducer(state: DisplayState, action: DisplayAction): DisplayState {
  switch (action.type) {
    case 'SET_RADIUS':
      return { ...state, radius: Math.min(60, Math.max(5, action.payload)) }
    case 'SET_INTENSITY':
      return { ...state, intensity: Math.min(1, Math.max(0, action.payload)) }
    case 'TOGGLE_HOTSPOT_SMOOTHING':
      return { ...state, hotspotSmoothing: !state.hotspotSmoothing }
    default:
      return state
  }
}

// 5. Contexts — separate state and dispatch for better performance
const DisplayStateContext = createContext<DisplayState | undefined>(undefined)
const DisplayDispatchContext = createContext<Dispatch<DisplayAction> | undefined>(undefined)

// 6. Provider component
export function DisplayProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(displayReducer, initialState)
  return (
    <DisplayStateContext.Provider value={state}>
      <DisplayDispatchContext.Provider value={dispatch}>{children}</DisplayDispatchContext.Provider>
    </DisplayStateContext.Provider>
  )
}

// 7. Custom hooks that throw if used outside provider
export function useDisplayState(): DisplayState {
  const ctx = useContext(DisplayStateContext)
  if (ctx === undefined) {
    throw new Error('useDisplayState must be used within a DisplayProvider')
  }
  return ctx
}

export function useDisplayDispatch(): Dispatch<DisplayAction> {
  const ctx = useContext(DisplayDispatchContext)
  if (ctx === undefined) {
    throw new Error('useDisplayDispatch must be used within a DisplayProvider')
  }
  return ctx
}
