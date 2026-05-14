import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react'

// ─── Modal ────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full ${sizes[size]} card p-6 shadow-2xl animate-slide-up`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-white text-lg">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger }) {
  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-white/60 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          className={danger ? 'btn-danger' : 'btn-primary'}
        >
          Confirm
        </button>
      </div>
    </Modal>
  )
}

// ─── Spinner ──────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-10 h-10' }
  return (
    <div className={`${sizes[size]} rounded-full border-2 border-brand-500 border-t-transparent animate-spin ${className}`} />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-white/30 text-sm font-display">Loading...</p>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <Icon size={24} className="text-white/20" />
        </div>
      )}
      <p className="font-display font-semibold text-white/60 mb-1">{title}</p>
      {description && <p className="text-white/30 text-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ─── Alert ────────────────────────────────────────────────────
export function Alert({ type = 'info', children }) {
  const config = {
    info: { icon: Info, cls: 'bg-brand-500/10 border-brand-500/20 text-brand-300' },
    success: { icon: CheckCircle, cls: 'bg-accent-green/10 border-accent-green/20 text-accent-green' },
    warning: { icon: AlertTriangle, cls: 'bg-accent-amber/10 border-accent-amber/20 text-accent-amber' },
    error: { icon: AlertTriangle, cls: 'bg-accent-red/10 border-accent-red/20 text-accent-red' },
  }
  const { icon: Icon, cls } = config[type]
  return (
    <div className={`flex gap-3 p-4 rounded-xl border text-sm ${cls}`}>
      <Icon size={16} className="flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────
export function Table({ columns, data, keyField = '_id', loading, empty }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5 bg-white/2">
            {columns.map((col) => (
              <th key={col.key} className="text-left px-4 py-3 text-xs font-display font-semibold text-white/30 uppercase tracking-widest whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} className="px-4 py-12 text-center"><Spinner className="mx-auto" /></td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-white/30 text-sm font-display">{empty || 'No data found'}</td></tr>
          ) : data.map((row) => (
            <tr key={row[keyField]} className="table-row">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-white/80">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = 'brand', change, subtitle }) {
  const colors = {
    brand: 'bg-brand-500/10 text-brand-400',
    green: 'bg-accent-green/10 text-accent-green',
    amber: 'bg-accent-amber/10 text-accent-amber',
    red: 'bg-accent-red/10 text-accent-red',
    purple: 'bg-accent-purple/10 text-accent-purple',
  }
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={18} />
        </div>
        {change !== undefined && (
          <span className={`text-xs font-display font-semibold ${change >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-display font-bold text-white">{value ?? '—'}</p>
        <p className="text-sm text-white/40 font-display mt-0.5">{label}</p>
        {subtitle && <p className="text-xs text-white/25 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

// ─── Form Field ───────────────────────────────────────────────
export function FormField({ label, error, children, hint }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && !error && <p className="text-xs text-white/30 mt-1.5">{hint}</p>}
      {error && <p className="text-xs text-accent-red mt-1.5">{error}</p>}
    </div>
  )
}

// ─── Score Ring ───────────────────────────────────────────────
export function ScoreRing({ percent, size = 100, passed }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  const color = passed ? '#22c55e' : percent >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={size * 0.18} fontFamily="Sora, sans-serif" fontWeight="700">
        {Math.round(percent)}%
      </text>
    </svg>
  )
}
