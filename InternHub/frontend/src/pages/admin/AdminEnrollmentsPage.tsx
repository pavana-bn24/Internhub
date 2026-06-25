import { useState, useEffect } from 'react'
import { getEnrollments, updateEnrollment, verifyEnrollmentPayment } from '../../services'
import type { Enrollment } from '../../types'
import { LoadingSpinner, StatusBadge, EmptyState } from '../../components/ui/Common'
import { ClipboardDocumentListIcon, CurrencyDollarIcon, EyeIcon } from '@heroicons/react/24/outline'
import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [comment, setComment] = useState('')
  const [actionId, setActionId] = useState<number | null>(null)

  useEffect(() => {
    loadEnrollments()
  }, [filter])

  const loadEnrollments = () => {
    setLoading(true)
    getEnrollments(filter)
      .then(setEnrollments)
      .catch(() => toast.error('Failed to load enrollments'))
      .finally(() => setLoading(false))
  }

  const handlePaymentAction = async (id: number, status: string) => {
    setActionId(id)
    try {
      await verifyEnrollmentPayment(id, { status, comment: status === 'rejected' ? (comment || 'Payment proof rejected') : undefined })
      toast.success(`Payment ${status}!`)
      setComment('')
      loadEnrollments()
    } catch {
      toast.error('Failed to update payment')
    } finally {
      setActionId(null)
    }
  }

  const handleEnrollmentAction = async (id: number, status: 'approved' | 'rejected') => {
    setActionId(id)
    try {
      await updateEnrollment(id, { status, admin_comment: comment } as any)
      toast.success(`Enrollment ${status}!`)
      setComment('')
      loadEnrollments()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update enrollment')
    } finally {
      setActionId(null)
    }
  }

  const filtered = enrollments.filter(
    (e) =>
      e.student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.course?.title?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner text="Loading enrollments..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Enrollment Management</h1>
          <p className="section-subtitle">Review applications, verify payments, and approve enrollments</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Search by student or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '', label: 'All', color: '' },
            { value: 'pending', label: 'Pending', color: 'bg-amber-500' },
            { value: 'approved', label: 'Approved', color: 'bg-emerald-500' },
            { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                  : 'premium-card !p-0 !shadow-none border border-surface-200 dark:border-surface-700 px-4 py-2 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'
              }`}
            >
              {f.color && <span className={`inline-block w-1.5 h-1.5 rounded-full ${f.color} mr-1.5`} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardDocumentListIcon}
          title="No enrollments found"
          message={search ? 'Try a different search term' : 'No applications to review'}
        />
      ) : (
        <div className="premium-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Applied</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800/30">
                {filtered.map((enr) => (
                  <tr key={enr.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {enr.student?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-surface-900 dark:text-white">{enr.student?.full_name}</p>
                          <p className="text-xs text-surface-500">{enr.student?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="font-medium">{enr.course?.title}</p>
                      {enr.course?.fee && (
                        <p className="text-xs text-surface-500 mt-0.5 flex items-center gap-1">
                          <CurrencyDollarIcon className="w-3 h-3" />
                          ₹{enr.course.fee.toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td className="text-surface-500 text-sm">
                      {enr.applied_at ? new Date(enr.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                    </td>
                    <td>
                      <div className="space-y-1">
                        <StatusBadge status={enr.payment_status || 'pending_verification'} />
                        {enr.transaction_id && (
                          <p className="text-[10px] font-mono text-surface-500">Txn: {enr.transaction_id}</p>
                        )}
                        {enr.payment_amount && (
                          <p className="text-[10px] text-surface-500 flex items-center gap-1">
                            <BanknotesIcon className="w-3 h-3" />
                            ₹{enr.payment_amount.toLocaleString()}
                          </p>
                        )}
                        {enr.payment_proof && (
                          <a
                            href={`http://localhost:8000/${enr.payment_proof.replace(/\\/g, '/')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-primary-600 hover:text-primary-700"
                          >
                            <EyeIcon className="w-3 h-3" />
                            View Screenshot
                          </a>
                        )}
                      </div>
                    </td>
                    <td><StatusBadge status={enr.status} /></td>
                    <td>
                      <div className="space-y-2">
                        {/* Payment actions (only when pending verification) */}
                        {enr.payment_status === 'pending_verification' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handlePaymentAction(enr.id, 'verified')}
                              disabled={actionId === enr.id}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            >
                              <CheckCircleIcon className="w-3 h-3" />
                              Verify Pay
                            </button>
                            <button
                              onClick={() => handlePaymentAction(enr.id, 'rejected')}
                              disabled={actionId === enr.id}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              <XCircleIcon className="w-3 h-3" />
                              Reject Pay
                            </button>
                          </div>
                        )}
                        {/* Enrollment actions (only when payment verified) */}
                        {enr.payment_status === 'verified' && enr.status !== 'approved' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEnrollmentAction(enr.id, 'approved')}
                              disabled={actionId === enr.id}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            >
                              <CheckCircleIcon className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleEnrollmentAction(enr.id, 'rejected')}
                              disabled={actionId === enr.id}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              <XCircleIcon className="w-3 h-3" />
                              Reject
                            </button>
                          </div>
                        )}
                        {enr.payment_status !== 'pending_verification' && enr.payment_status !== 'verified' && (
                          <span className="text-[10px] text-surface-400 italic">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
