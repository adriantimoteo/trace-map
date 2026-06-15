import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'

// 1. State type
interface UIState {
  screen: 'upload' | 'app'
  advancedOptionsOpen: boolean
  samplingNoticeDismissed: boolean
  fileFormat: 'auto' | 'records' | 'semantic'
}

// 2. Action union type
type UIAction =
  | { type: 'SET_SCREEN'; payload: 'upload' | 'app' }
  | { type: 'TOGGLE_ADVANCED_OPTIONS' }
  | { type: 'DISMISS_SAMPLING_NOTICE' }
  | { type: 'SET_FILE_FORMAT'; payload: 'auto' | 'records' | 'semantic' }
  | { type: 'RESET_FOR_NEW_FILE' }

// 3. Initial state
const initialState: UIState = {
  screen: 'upload',
  advancedOptionsOpen: false,
  samplingNoticeDismissed: false,
  fileFormat: 'auto',
}

// 4. Reducer
function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload }
    case 'TOGGLE_ADVANCED_OPTIONS':
      return { ...state, advancedOptionsOpen: !state.advancedOptionsOpen }
    case 'DISMISS_SAMPLING_NOTICE':
      return { ...state, samplingNoticeDismissed: true }
    case 'SET_FILE_FORMAT':
      return { ...state, fileFormat: action.payload }
    case 'RESET_FOR_NEW_FILE':
      return { ...state, samplingNoticeDismissed: false }
    default:
      return state
  }
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
