import { createContext, useContext, useReducer, type ReactNode } from 'react'

// 1. State type
interface UIState {
  screen: 'upload' | 'app'
  advancedOptionsOpen: boolean
  samplingNoticeDismissed: boolean
}

// 2. Action union type
type UIAction =
  | { type: 'SET_SCREEN'; payload: 'upload' | 'app' }
  | { type: 'TOGGLE_ADVANCED_OPTIONS' }
  | { type: 'DISMISS_SAMPLING_NOTICE' }

// 3. Initial state
const initialState: UIState = {
  screen: 'upload',
  advancedOptionsOpen: false,
  samplingNoticeDismissed: false,
}

// 4. Reducer (stubs — returns unchanged state for all actions)
function uiReducer(state: UIState, _action: UIAction): UIState {
  return state
}

// 5. Context
const UIStateContext = createContext<UIState | undefined>(undefined)

// 6. Provider component
export function UIProvider({ children }: { children: ReactNode }) {
  const [state] = useReducer(uiReducer, initialState)
  return <UIStateContext.Provider value={state}>{children}</UIStateContext.Provider>
}

// 7. Custom hook that throws if used outside provider
export function useUIState(): UIState {
  const ctx = useContext(UIStateContext)
  if (ctx === undefined) {
    throw new Error('useUIState must be used within a UIProvider')
  }
  return ctx
}
