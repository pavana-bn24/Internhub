import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getPayments, verifyEnrollmentPayment } from '../../services'
import type { PaymentRequest } from '../../types'
import { StatusBadge, Skeleton } from '../../components/ui/Common'
import {
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = () => {
    setLoading(true)
    getPayments(filter)
      .then(setPayments)
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const handleVerify = async (id: number, status: string) => {
    try {
      await verifyEnrollmentPayment(id, { status, comment: status === 'rejected' ? 'Payment proof rejected' : undefined })
      toast.success(`Payment ${status}`)
      load()
    } catch {
      toast.error('Failed to update payment')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BanknotesIcon className="w-6 h-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Payments</h1>
          </div>
          <p className="text-surface-500 text-sm mt-1">Verify student payment proofs</p>
        </div>
        <div className="flex gap-2">
          {['', 'pending_verification', 'verified', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === s
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
              }`}
            >
              {s === 'pending_verification' ? 'Pending' : s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <div className="premium-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Amount</th>
                  <th>Transaction ID</th>
                  <th>Status</th>
                  <th>Proof</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-surface-400 py-12">
                      <BanknotesIcon className="w-12 h-12 mx-auto mb-3 text-surface-300 dark:text-surface-600" />
                      <p>No payment requests found</p>
                    </td>
                  </tr>
                ) : payments.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-surface-900 dark:text-white">{p.student_name}</td>
                    <td className="text-surface-600 dark:text-surface-400">{p.course_title}</td>
                    <td className="text-surface-900 dark:text-white font-medium">
                      ₹{(p.payment_amount || p.course_fee || 0).toLocaleString()}
                    </td>
                    <td className="text-surface-600 dark:text-surface-400 font-mono text-xs">
                      {p.transaction_id || '-'}
                    </td>
                    <td><StatusBadge status={p.payment_status} /></td>
                    <td>
                      {p.payment_proof ? (
                        <a
                          href={`http://localhost:8000/${p.payment_proof.replace(/\\/g, '/')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View
                        </a>
                      ) : (
                        <span className="text-surface-400 text-sm">-</span>
                      )}
                    </td>
                    <td>
                      {p.payment_status === 'pending_verification' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerify(p.id, 'verified')}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            Verify
                          </button>
                          <button
                            onClick={() => handleVerify(p.id, 'rejected')}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <XCircleIcon className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-surface-400 capitalize">{p.payment_status === 'verified' ? 'Verified' : 'Rejected'}</span>
                      )}
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
