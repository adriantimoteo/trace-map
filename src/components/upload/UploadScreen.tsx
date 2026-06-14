import { useUIDispatch } from '../../contexts/UIContext'
import { DropZone } from './DropZone'
import { ErrorMessage } from './ErrorMessage'
import { PrivacyNotice } from './PrivacyNotice'

export function UploadScreen() {
  const dispatch = useUIDispatch()

  const errorMessage: string | null = null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-center text-5xl font-bold text-emerald-400">TraceMap</h1>

        <PrivacyNotice />

        <DropZone accept="application/json" />

        <ErrorMessage message={errorMessage} />

        {/* Temporary P0-only navigation button — will be removed in Phase 1 */}
        <div className="flex justify-center">
          <button
            type="button"
            className="text-sm text-gray-500 underline hover:text-gray-300 transition-colors"
            onClick={() => {
              dispatch({ type: 'SET_SCREEN', payload: 'app' })
            }}
          >
            Skip to app →
          </button>
        </div>
      </div>
    </div>
  )
}
