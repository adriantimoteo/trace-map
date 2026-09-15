import { useRef, useState, type DragEvent } from 'react'
import { Header } from './Header'
import { FilterPanel } from '../filters/FilterPanel'
import { MapContainer } from '../map/MapContainer'
import { useExport } from '../../hooks/useExport'
import { useLocationWorker } from '../../hooks/useLocationWorker'
import { useFilterDispatch } from '../../contexts/FilterContext'
import { useUIDispatch, useUIState } from '../../contexts/UIContext'

export function AppLayout() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const { exportMap, isExporting } = useExport(mapContainerRef)
  const { loadFile } = useLocationWorker()
  const filterDispatch = useFilterDispatch()
  const uiDispatch = useUIDispatch()
  const { sidebarCollapsed } = useUIState()
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  function handleNewFile(file: File) {
    filterDispatch({ type: 'RESET' })
    uiDispatch({ type: 'RESET_FOR_NEW_FILE' })
    loadFile(file)
  }

  function handleDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    // Only clear if leaving the outermost element (not a child)
    if (e.currentTarget === e.target) {
      setIsDraggingOver(false)
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDraggingOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleNewFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div
      className={[
        'flex h-screen flex-col',
        isDraggingOver ? 'ring-4 ring-inset ring-emerald-400' : '',
      ]
        .join(' ')
        .trim()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDraggingOver && (
        <div className="pointer-events-none absolute inset-0 z-[2000] flex items-center justify-center bg-gray-950/80">
          <p className="text-2xl font-semibold text-emerald-400">Drop new file to load</p>
        </div>
      )}
      <Header
        onExport={() => void exportMap()}
        isExporting={isExporting}
        onLoadNewFile={handleNewFile}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => {
          uiDispatch({ type: 'TOGGLE_SIDEBAR' })
        }}
      />
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={[
            'shrink-0 overflow-y-auto overflow-x-hidden bg-gray-800 transition-[width] duration-200',
            sidebarCollapsed ? 'w-0' : 'w-64',
          ].join(' ')}
        >
          {!sidebarCollapsed && <FilterPanel />}
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
