import { DataProvider } from './contexts/DataContext'
import { DisplayProvider } from './contexts/DisplayContext'
import { FilterProvider } from './contexts/FilterContext'
import { UIProvider } from './contexts/UIContext'
import { useUIState } from './contexts/UIContext'
import { UploadScreen } from './components/upload/UploadScreen'

function AppContent() {
  const { screen } = useUIState()

  if (screen === 'upload') {
    return <UploadScreen />
  }

  // P0-05 will replace this placeholder with the real app screen
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      <p className="text-gray-400">App screen — coming in P0-05</p>
    </div>
  )
}

function App() {
  return (
    <UIProvider>
      <DataProvider>
        <FilterProvider>
          <DisplayProvider>
            <AppContent />
          </DisplayProvider>
        </FilterProvider>
      </DataProvider>
    </UIProvider>
  )
}

export default App
