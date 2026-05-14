// Format a date string nicely
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', ...options
  })
}

// Format datetime
export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// Format seconds to MM:SS or HH:MM:SS
export function formatSeconds(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// Get score color class based on percentage
export function scoreColor(percent) {
  if (percent >= 70) return 'text-accent-green'
  if (percent >= 50) return 'text-accent-amber'
  return 'text-accent-red'
}

// Truncate text
export function truncate(str, max = 60) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

// Extract error message from axios error
export function getErrorMessage(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong'
}

// Build query string from object (filtering out empty values)
export function buildQuery(params) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.set(k, v)
  })
  return query.toString()
}

// Calculate percentage
export function pct(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}
