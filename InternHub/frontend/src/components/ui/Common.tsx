export function StatCard({
  icon: Icon,
  label,
  value,
  color = 'primary',
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  color?: string
  trend?: { value: string; positive: boolean }
}) {
  const gradients: Record<string, string> = {
    primary: 'from-primary-500 to-primary-600',
    green: 'from-emerald-500 to-emerald-600',
    yellow: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-violet-500 to-violet-600',
    indigo: 'from-indigo-500 to-indigo-600',
  }

  const bgColors: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
    yellow: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300',
    purple: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300',
  }

  return (
    <div className="stat-card group cursor-default">
      <div className="relative z-10 flex items-start gap-4 w-full">
        <div className={`p-3 rounded-xl ${bgColors[color] || bgColors.primary} ring-1 ring-white/20 dark:ring-white/5`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-white mt-0.5 tabular-nums">{value}</p>
          {trend && (
            <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              <span>{trend.positive ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </p>
          )}
        </div>
      </div>
      <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] dark:opacity-[0.05] bg-gradient-to-br ${gradients[color] || gradients.primary} rounded-full transform translate-x-1/4 -translate-y-1/4 group-hover:scale-150 transition-transform duration-700`} />
    </div>
  )
}

export function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-4 border-primary-200 dark:border-primary-900/40 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-primary-600 rounded-full animate-spin" />
      </div>
      {text && <p className="text-sm text-surface-500 dark:text-surface-400">{text}</p>}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-surface-200 dark:bg-surface-700 rounded-xl ${className}`} />
  )
}

export function EmptyState({ icon: Icon, title, message, action }: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  message?: string
  action?: React.ReactNode
}) {
  const IconComponent = Icon

  return (
    <div className="empty-state animate-in">
      {IconComponent && <IconComponent className="empty-state-icon" />}
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-text">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: 'badge badge-pending',
    approved: 'badge badge-approved',
    rejected: 'badge badge-rejected',
  }

  const icons: Record<string, string> = {
    pending: '○',
    approved: '●',
    rejected: '●',
  }

  return (
    <span className={variants[status] || 'badge bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 border border-surface-200 dark:border-surface-700'}>
      <span className="mr-1.5 text-[10px]">{icons[status] || '○'}</span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export function GradientBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 shadow-sm">
      {label}
    </span>
  )
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText = 'Confirm', variant = 'primary' }: {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  variant?: 'primary' | 'danger'
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{title}</h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">{message}</p>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button
            onClick={onConfirm}
            className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export function FileUpload({ file, onChange, accept, label }: {
  file: File | null
  onChange: (f: File | null) => void
  accept?: string
  label?: string
}) {
  return (
    <div className={`file-upload ${file ? 'has-file' : ''}`}>
      {file ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{file.name}</p>
              <p className="text-xs text-surface-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-surface-400 hover:text-red-500 transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <label className="cursor-pointer flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center">
            <svg className="w-6 h-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{label || 'Click to upload'}</p>
            <p className="text-xs text-surface-500 mt-0.5">Max file size: 10 MB</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={(e) => onChange(e.target.files?.[0] || null)}
          />
        </label>
      )}
    </div>
  )
}

export function ProgressRing({ percentage, size = 80, strokeWidth = 6 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface-200 dark:text-surface-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary-500 transition-all duration-700"
        />
      </svg>
      <span className="absolute text-sm font-bold text-surface-900 dark:text-white tabular-nums">
        {Math.round(percentage)}%
      </span>
    </div>
  )
}
