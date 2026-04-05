/**
 * Format a date string as a human-readable relative time.
 * Returns compact labels like "NOW", "5M AGO", "3H AGO", "2D AGO",
 * or falls back to locale date string for older entries.
 */
export function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "JUST NOW"
  if (mins < 60) return `${mins}M AGO`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}H AGO`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}D AGO`
  return new Date(dateStr).toLocaleDateString()
}
