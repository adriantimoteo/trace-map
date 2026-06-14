import { Header } from './Header'
import { FilterPanel } from '../filters/FilterPanel'
import { MapContainer } from '../map/MapContainer'

export function AppLayout() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 shrink-0 overflow-y-auto bg-gray-800">
          <FilterPanel />
        </aside>
        <main className="flex-1">
          <MapContainer />
        </main>
      </div>
    </div>
  )
}
