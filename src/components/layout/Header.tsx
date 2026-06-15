import { useRef } from 'react'

interface HeaderProps {
  onExport: () => void
  isExporting: boolean
  onLoadNewFile: (file: File) => void
}

export function Header({ onExport, isExporting, onLoadNewFile }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleLoadNewFileClick() {
    fileInputRef.current?.click()
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onLoadNewFile(file)
    }
    // Reset so selecting the same file again triggers onChange
    e.target.value = ''
  }

  return (
    <header className="flex h-14 items-center justify-between bg-gray-900 px-4 shrink-0">
      <h1 className="text-lg font-bold text-emerald-400">TraceMap</h1>
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={handleFileInputChange}
          data-testid="header-file-input"
        />
        <button
          type="button"
          className="rounded bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600 transition-colors"
          onClick={handleLoadNewFileClick}
        >
          Load new file
        </button>
        <button
          type="button"
          className="rounded bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onExport}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting…' : 'Export PNG'}
        </button>
      </div>
    </header>
  )
}
