import { render, screen } from './test/utils'
import App from './App'

test('App renders without crashing', () => {
  render(<App />)
  expect(screen.getByText('TraceMap')).toBeInTheDocument()
})
