export function PrivacyNotice() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-emerald-800 bg-emerald-950/50 p-4">
      <span className="mt-0.5 text-lg leading-none" role="img" aria-label="lock">
        🔒
      </span>
      <p className="text-sm text-emerald-200">
        Your location data is processed entirely in your browser. Nothing is uploaded or stored
        anywhere.
      </p>
    </div>
  )
}
