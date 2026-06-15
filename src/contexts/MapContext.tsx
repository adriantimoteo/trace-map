import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type L from 'leaflet'

interface MapContextValue {
  map: L.Map | null
  setMap: Dispatch<SetStateAction<L.Map | null>>
}

const MapContext = createContext<MapContextValue | undefined>(undefined)

export function MapProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<L.Map | null>(null)
  return <MapContext.Provider value={{ map, setMap }}>{children}</MapContext.Provider>
}

export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext)
  if (ctx === undefined) {
    throw new Error('useMapContext must be used within a MapProvider')
  }
  return ctx
}
