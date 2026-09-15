/** Format a Date to "YYYY-MM-DD" for ISO date strings used by FilterContext */
export function toISODate(date: Date): string {
  const y = String(date.getFullYear())
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Returns true if the data span (maxDate - minDate) covers at least `months` calendar months.
 * Uses a calendar-month difference: (year diff × 12) + (month diff).
 */
export function isPresetAvailable(months: number, minDate: Date, maxDate: Date): boolean {
  const spanMonths =
    (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth())
  return spanMonths >= months
}
