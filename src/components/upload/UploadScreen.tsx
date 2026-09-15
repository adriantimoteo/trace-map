import { useDataState } from '../../contexts/DataContext'
import { useLocationWorker } from '../../hooks/useLocationWorker'
import screenshot from '../../assets/screenshot.jpg'
import { DropZone } from './DropZone'
import { ErrorMessage } from './ErrorMessage'
import { PrivacyNotice } from './PrivacyNotice'

export function UploadScreen() {
  const { errorMessage } = useDataState()
  const { loadFile } = useLocationWorker()

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-950 px-4">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url(${screenshot})` }}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-5xl font-bold text-emerald-400">TraceMap</h1>
          <p className="text-gray-400">
            Turn your Google Location History into a heatmap you can actually explore.
          </p>
          <p className="text-sm text-gray-500">
            Don't have your data on hand?{' '}
            <a
              href="https://github.com/adriantimoteo/trace-map#exporting-your-google-timeline-data"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 underline hover:text-emerald-300"
            >
              Here's how to grab it
            </a>
            .
          </p>
        </div>

        <DropZone onFile={loadFile} />

        <PrivacyNotice />

        <ErrorMessage message={errorMessage} />
      </div>
    </div>
  )
}
