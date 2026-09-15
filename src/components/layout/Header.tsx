import { useRef } from 'react'

interface HeaderProps {
  onExport: () => void
  isExporting: boolean
  onLoadNewFile: (file: File) => void
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export function Header({
  onExport,
  isExporting,
  onLoadNewFile,
  sidebarCollapsed,
  onToggleSidebar,
}: HeaderProps) {
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
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-emerald-400">TraceMap</h1>
      </div>
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
