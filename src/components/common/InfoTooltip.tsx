interface InfoTooltipProps {
  text: string
}

/** Small "i" icon that shows an explanatory tooltip on hover/focus via the native `title` attribute. */
export function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <span
      tabIndex={0}
      title={text}
      role="img"
      aria-label={text}
      className="inline-flex h-4 w-4 shrink-0 cursor-help items-center justify-center rounded-full border border-gray-500 text-[10px] font-semibold leading-none text-gray-400 hover:border-gray-300 hover:text-gray-200"
    >
      i
    </span>
  )
}
