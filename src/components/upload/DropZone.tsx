interface DropZoneProps {
  accept?: string
}

export function DropZone({ accept: _accept }: DropZoneProps) {
  return (
    <div
      className="flex min-h-40 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-600 bg-gray-900 p-8 text-center transition-colors hover:border-emerald-500 hover:bg-gray-800"
      role="button"
      tabIndex={0}
      aria-label="File drop zone"
    >
      <p className="text-gray-400 text-base">Drop Records.json here, or click to browse</p>
    </div>
  )
}
