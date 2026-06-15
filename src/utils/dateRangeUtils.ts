/**
 * Returns true if the data span (maxDate - minDate) covers at least `months` calendar months.
 * Uses a calendar-month difference: (year diff × 12) + (month diff).
 */
export function isPresetAvailable(months: number, minDate: Date, maxDate: Date): boolean {
  const spanMonths =
    (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth())
  return spanMonths >= months
}
