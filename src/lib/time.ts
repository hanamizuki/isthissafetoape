/**
 * Format a date string as a human-readable relative time.
 *
 * @param dateStr  - ISO 8601 date string to format
 * @param compact  - When true, returns short labels ("5M") without "AGO"
 *                   suffix. Used in space-constrained contexts like the
 *                   homepage scan list.
 * @returns Relative time string, e.g. "JUST NOW", "5M AGO", or "5M" (compact)
 */
export function getTimeAgo(dateStr: string, compact = false): string {
  const diff = Date.now() - new Date(dateStr).getTime()

  // Guard against invalid date strings producing NaN
  if (Number.isNaN(diff)) return compact ? "?" : "UNKNOWN"

  const mins = Math.floor(diff / 60000)
  if (mins < 1) return compact ? "NOW" : "JUST NOW"
  if (mins < 60) return compact ? `${mins}M` : `${mins}M AGO`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return compact ? `${hours}H` : `${hours}H AGO`
  const days = Math.floor(hours / 24)
  if (days < 30) return compact ? `${days}D` : `${days}D AGO`
  return new Date(dateStr).toLocaleDateString()
}
