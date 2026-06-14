import { DataProvider } from './contexts/DataContext'
import { DisplayProvider } from './contexts/DisplayContext'
import { FilterProvider } from './contexts/FilterContext'
import { UIProvider } from './contexts/UIContext'
import { useUIState } from './contexts/UIContext'
import { UploadScreen } from './components/upload/UploadScreen'
import { AppLayout } from './components/layout/AppLayout'

function AppContent() {
  const { screen } = useUIState()

  if (screen === 'upload') {
    return <UploadScreen />
  }

  return <AppLayout />
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
