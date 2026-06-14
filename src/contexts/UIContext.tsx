import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'

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

// 5. Contexts — separate state and dispatch for better performance
const UIStateContext = createContext<UIState | undefined>(undefined)
const UIDispatchContext = createContext<Dispatch<UIAction> | undefined>(undefined)

// 6. Provider component
export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState)
  return (
    <UIStateContext.Provider value={state}>
      <UIDispatchContext.Provider value={dispatch}>{children}</UIDispatchContext.Provider>
    </UIStateContext.Provider>
  )
}

// 7. Custom hooks that throw if used outside provider
export function useUIState(): UIState {
  const ctx = useContext(UIStateContext)
  if (ctx === undefined) {
    throw new Error('useUIState must be used within a UIProvider')
  }
  return ctx
}

export function useUIDispatch(): Dispatch<UIAction> {
  const ctx = useContext(UIDispatchContext)
  if (ctx === undefined) {
    throw new Error('useUIDispatch must be used within a UIProvider')
  }
  return ctx
}
