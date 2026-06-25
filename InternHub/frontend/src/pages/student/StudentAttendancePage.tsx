import { useState, useEffect } from 'react'
import { getAttendance, getAttendanceSummary, getEnrollments } from '../../services'
import type { Attendance, AttendanceSummary } from '../../types'
import { LoadingSpinner, EmptyState, ProgressRing } from '../../components/ui/Common'
import { CalendarDaysIcon, AcademicCapIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function StudentAttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    getEnrollments()
      .then((enrs) => {
        const approved = enrs.filter((e) => e.status === 'approved')
        if (approved.length === 0) {
          setError('Your enrollment is pending admin approval.')
          setLoading(false)
          return
        }
        Promise.all([
          getAttendanceSummary(),
          getAttendance(0, month, year),
        ])
          .then(([s, r]) => {
            setSummary(s)
            setRecords(r)
          })
          .catch(() => {})
          .finally(() => setLoading(false))
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!error) {
      getAttendance(0, month, year).then(setRecords).catch(() => {})
    }
  }, [month, year])

  if (loading) return <LoadingSpinner text="Loading attendance..." />

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="section-header">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Attendance</h1>
            <p className="section-subtitle">Track your attendance records</p>
          </div>
        </div>
        <EmptyState icon={AcademicCapIcon} title="Access Restricted" message={error} />
      </div>
    )
  }

  const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
    present: { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-500' },
    absent: { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', dot: 'bg-red-500' },
    leave: { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-500' },
    holiday: { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', dot: 'bg-blue-500' },
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Attendance</h1>
          <p className="section-subtitle">Track your attendance records</p>
        </div>
      </div>

      {summary && (
        <div className="premium-card p-5">
          <div className="flex items-center gap-6">
            <ProgressRing percentage={summary.percentage} size={100} strokeWidth={8} />
            <div className="flex-1 grid grid-cols-3 gap-4">
              {[
                { label: 'Present', value: summary.present, color: 'text-emerald-500', icon: CheckCircleIcon },
                { label: 'Absent', value: summary.absent, color: 'text-red-500', icon: XCircleIcon },
                { label: 'Leave', value: summary.leave, color: 'text-amber-500', icon: ClockIcon },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <s.icon className={`w-5 h-5 ${s.color} mx-auto`} />
                  <p className={`text-xl font-bold tabular-nums ${s.color} mt-1`}>{s.value}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800/50">
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${summary.percentage}%` }} />
            </div>
            <p className="text-xs text-surface-500 mt-1.5">{summary.percentage}% attendance • {summary.total} total sessions</p>
          </div>
        </div>
      )}

      <div className="premium-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-800/50">
          <h2 className="font-semibold text-surface-900 dark:text-white">Attendance History</h2>
          <div className="flex gap-2">
            <select className="input-field w-auto py-1.5 text-xs" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {monthNames.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
            <select className="input-field w-auto py-1.5 text-xs" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        {records.length === 0 ? (
          <EmptyState icon={CalendarDaysIcon} title="No records" message="No attendance records for this month" />
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-800/30">
            {records.map((r) => {
              const cfg = statusConfig[r.status] || { color: 'text-surface-600', bg: 'bg-surface-100 dark:bg-surface-800', dot: 'bg-surface-500' }
              const date = new Date(r.date)
              return (
                <div key={r.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-800/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-center w-10">
                      <p className="text-lg font-bold text-surface-900 dark:text-white tabular-nums">{date.getDate()}</p>
                      <p className="text-[10px] font-medium text-surface-500 uppercase">{date.toLocaleDateString('en-US', { month: 'short' })}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">
                        {date.toLocaleDateString('en-US', { weekday: 'long' })}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
