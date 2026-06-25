import { useState, useEffect } from 'react'
import { myEnrollments } from '../../services'
import type { Enrollment } from '../../types'
import { LoadingSpinner, StatusBadge, EmptyState } from '../../components/ui/Common'
import { MagnifyingGlassIcon, BookOpenIcon, CheckCircleIcon, ClockIcon, XCircleIcon, CurrencyDollarIcon, BanknotesIcon, EyeIcon } from '@heroicons/react/24/outline'

export default function StudentEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    myEnrollments()
      .then(setEnrollments)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = enrollments.filter(
    (e) =>
      e.course?.title?.toLowerCase().includes(search.toLowerCase())
  )

  const getPaymentBadge = (status?: string) => {
    switch (status) {
      case 'pending_verification': return { label: 'Pending Verification', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }
      case 'verified': return { label: 'Payment Verified', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' }
      case 'rejected': return { label: 'Payment Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
      default: return null
    }
  }

  if (loading) return <LoadingSpinner text="Loading enrollments..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">My Enrollments</h1>
          <p className="section-subtitle">Track your internship applications</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: enrollments.filter(e => e.status === 'pending').length, color: 'bg-amber-500', icon: ClockIcon },
          { label: 'Approved', value: enrollments.filter(e => e.status === 'approved').length, color: 'bg-emerald-500', icon: CheckCircleIcon },
          { label: 'Rejected', value: enrollments.filter(e => e.status === 'rejected').length, color: 'bg-red-500', icon: XCircleIcon },
        ].map((s) => (
          <div key={s.label} className="premium-card p-4 text-center">
            <div className={`w-10 h-10 rounded-xl ${s.color} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center mx-auto mb-2`}>
              <s.icon className={`w-5 h-5 ${s.color.replace('bg-', 'text-')}`} />
            </div>
            <p className={`text-2xl font-bold tabular-nums ${s.color.replace('bg-', 'text-')}`}>{s.value}</p>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          className="input-field pl-10"
          placeholder="Search enrollments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title="No enrollments found"
          message={search ? 'Try a different search term' : 'Browse internships to get started'}
        />
      ) : (
        <div className="premium-card divide-y divide-surface-100 dark:divide-surface-800/50 overflow-hidden">
          {filtered.map((enr) => {
            const payBadge = getPaymentBadge(enr.payment_status)
            return (
              <div key={enr.id} className="flex items-center justify-between p-5 hover:bg-surface-50 dark:hover:bg-surface-800/20 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    enr.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                    enr.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                    'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                  }`}>
                    <BookOpenIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-surface-900 dark:text-white truncate">
                      {enr.course?.title || `Course #${enr.course_id}`}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-surface-500 dark:text-surface-400">
                      {enr.course?.fee && (
                        <span className="flex items-center gap-1">
                          <CurrencyDollarIcon className="w-3 h-3" />
                          ₹{enr.course.fee.toLocaleString()}
                        </span>
                      )}
                      {enr.payment_amount && (
                        <span className="flex items-center gap-1">
                          <BanknotesIcon className="w-3 h-3" />
                          Paid: ₹{enr.payment_amount.toLocaleString()}
                        </span>
                      )}
                      {enr.transaction_id && (
                        <span className="font-mono text-[10px]">Txn: {enr.transaction_id}</span>
                      )}
                      {enr.applied_at && (
                        <span>{new Date(enr.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      )}
                    </div>
                    {payBadge && (
                      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium ${payBadge.color}`}>
                        {payBadge.label}
                      </span>
                    )}
                    {enr.admin_comment && enr.status === 'rejected' && (
                      <p className="text-xs text-red-500 mt-1 italic">{enr.admin_comment}</p>
                    )}
                    {enr.payment_comment && enr.payment_status === 'rejected' && (
                      <p className="text-xs text-red-400 mt-0.5 italic">Payment: {enr.payment_comment}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  {enr.payment_proof && (
                    <a
                      href={`http://localhost:8000/${enr.payment_proof.replace(/\\/g, '/')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      title="View payment proof"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </a>
                  )}
                  <StatusBadge status={enr.status} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
