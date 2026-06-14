import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { UIProvider } from '../contexts/UIContext'
import { DataProvider } from '../contexts/DataContext'
import { FilterProvider } from '../contexts/FilterContext'
import { DisplayProvider } from '../contexts/DisplayContext'

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <DataProvider>
        <FilterProvider>
          <DisplayProvider>{children}</DisplayProvider>
        </FilterProvider>
      </DataProvider>
    </UIProvider>
  )
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
