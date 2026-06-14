import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Will be updated in P0-03 when Context providers are implemented
function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
