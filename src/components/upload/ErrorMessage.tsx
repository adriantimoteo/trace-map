interface ErrorMessageProps {
  message: string | null
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null

  return (
    <div
      className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-300"
      role="alert"
    >
      {message}
    </div>
  )
}
