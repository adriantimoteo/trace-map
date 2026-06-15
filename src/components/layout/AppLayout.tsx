import { useRef } from 'react'
import { Header } from './Header'
import { FilterPanel } from '../filters/FilterPanel'
import { MapContainer } from '../map/MapContainer'
import { useExport } from '../../hooks/useExport'

export function AppLayout() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const { exportMap, isExporting } = useExport(mapContainerRef)

  return (
    <div className="flex h-screen flex-col">
      <Header onExport={() => void exportMap()} isExporting={isExporting} />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 shrink-0 overflow-y-auto bg-gray-800">
          <FilterPanel />
        </aside>
        <main className="flex-1">
          <div ref={mapContainerRef} className="h-full w-full">
            <MapContainer />
          </div>
        </main>
      </div>
    </div>
  )
}
