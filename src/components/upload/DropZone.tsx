import { useRef, useState, type DragEvent } from 'react'

interface DropZoneProps {
  onFile: (file: File) => void
}

export function DropZone({ onFile }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  function handleDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      onFile(e.dataTransfer.files[0])
    }
  }

  function handleClick() {
    inputRef.current?.click()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onFile(file)
    }
    // Reset so selecting the same file again triggers onChange
    e.target.value = ''
  }

  const dragActiveClasses = isDragOver
    ? 'border-emerald-400 bg-gray-800'
    : 'border-gray-600 bg-gray-900 hover:border-emerald-500 hover:bg-gray-800'

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleInputChange}
        data-testid="file-input"
      />
      <div
        className={`flex min-h-40 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragActiveClasses}`}
        role="button"
        tabIndex={0}
        aria-label="File drop zone"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-gray-400 text-base">Drop Records.json here, or click to browse</p>
      </div>
    </>
  )
}
