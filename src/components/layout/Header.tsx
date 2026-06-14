export function Header() {
  return (
    <header className="flex h-14 items-center justify-between bg-gray-900 px-4 shrink-0">
      <h1 className="text-lg font-bold text-emerald-400">TraceMap</h1>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600 transition-colors"
        >
          Load new file
        </button>
        <button
          type="button"
          className="rounded bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600 transition-colors"
        >
          Export PNG
        </button>
      </div>
    </header>
  )
}
