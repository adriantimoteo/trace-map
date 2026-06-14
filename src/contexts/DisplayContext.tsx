import { createContext, useContext, useReducer, type ReactNode } from 'react'

// 1. State type
interface DisplayState {
  radius: number
  intensity: number
}

// 2. Action union type
type DisplayAction =
  | { type: 'SET_RADIUS'; payload: number }
  | { type: 'SET_INTENSITY'; payload: number }

// 3. Initial state
const initialState: DisplayState = {
  radius: 20,
  intensity: 0.5,
}

// 4. Reducer (stubs — returns unchanged state for all actions)
function displayReducer(state: DisplayState, _action: DisplayAction): DisplayState {
  return state
}

// 5. Context
const DisplayStateContext = createContext<DisplayState | undefined>(undefined)

// 6. Provider component
export function DisplayProvider({ children }: { children: ReactNode }) {
  const [state] = useReducer(displayReducer, initialState)
  return <DisplayStateContext.Provider value={state}>{children}</DisplayStateContext.Provider>
}

// 7. Custom hook that throws if used outside provider
export function useDisplayState(): DisplayState {
  const ctx = useContext(DisplayStateContext)
  if (ctx === undefined) {
    throw new Error('useDisplayState must be used within a DisplayProvider')
  }
  return ctx
}
