import { useDataState } from '../../contexts/DataContext'
import { useLocationWorker } from '../../hooks/useLocationWorker'
import { DropZone } from './DropZone'
import { ErrorMessage } from './ErrorMessage'
import { PrivacyNotice } from './PrivacyNotice'

export function UploadScreen() {
  const { errorMessage } = useDataState()
  const { loadFile } = useLocationWorker()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-center text-5xl font-bold text-emerald-400">TraceMap</h1>

        <PrivacyNotice />

        <DropZone onFile={loadFile} />

        <ErrorMessage message={errorMessage} />
      </div>
    </div>
  )
}
