import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCourse, applyEnrollment, getPayments } from '../../services'
import type { Course, PaymentRequest } from '../../types'
import { LoadingSpinner } from '../../components/ui/Common'
import {
  CurrencyDollarIcon, ArrowLeftIcon, CreditCardIcon, ArrowUpTrayIcon,
  CheckCircleIcon, DocumentTextIcon, PhoneIcon, BanknotesIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function EnrollmentPaymentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [transactionId, setTransactionId] = useState('')
  const [paymentInfo, setPaymentInfo] = useState<{ upi_id: string; upi_holder: string } | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      getCourse(Number(id)),
      getPayments().catch(() => [] as any),
    ])
      .then(([c]) => {
        setCourse(c)
      })
      .catch(() => toast.error('Failed to load course'))
      .finally(() => setLoading(false))

    fetch('http://localhost:8000/api/v1/payments/info')
      .then(r => r.json())
      .then(setPaymentInfo)
      .catch(() => {})
  }, [id])

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please upload payment screenshot')
      return
    }
    if (!id) return
    setSubmitting(true)
    try {
      await applyEnrollment(Number(id), file, transactionId || undefined)
      toast.success('Enrollment submitted successfully!')
      navigate('/student/enrollments')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit enrollment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading..." />
  if (!course) return <div className="text-center py-12 text-surface-400">Course not found</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <button
        onClick={() => navigate(`/student/course/${id}`)}
        className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to course
      </button>

      <div className="premium-card p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Complete Your Enrollment</h1>
        <p className="text-surface-500 dark:text-surface-400 mb-6">
          Course: <span className="font-semibold text-surface-900 dark:text-white">{course.title}</span>
          {' — '}
          <span className="font-semibold text-primary-600 dark:text-primary-400">₹{course.fee?.toLocaleString() || '4,000'}</span>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Details */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BanknotesIcon className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Payment Details</h2>
              </div>
              <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-500 dark:text-surface-400">Amount</span>
                  <span className="font-bold text-lg text-surface-900 dark:text-white">₹{course.fee?.toLocaleString() || '4,000'}</span>
                </div>
                <div className="border-t border-surface-200 dark:border-surface-700 pt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <PhoneIcon className="w-4 h-4 text-surface-400" />
                    <span className="text-surface-600 dark:text-surface-300">
                      UPI ID: <span className="font-mono font-semibold text-surface-900 dark:text-white">
                        {paymentInfo?.upi_id || 'internhub@upi'}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCardIcon className="w-4 h-4 text-surface-400" />
                    <span className="text-surface-600 dark:text-surface-300">
                      Account: <span className="font-semibold text-surface-900 dark:text-white">
                        {paymentInfo?.upi_holder || 'InternHub Pvt Ltd'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                After making the payment, upload the payment screenshot below and submit your enrollment request.
              </p>
            </div>
          </div>

          {/* Upload Section */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpTrayIcon className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Upload Payment Proof</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    Payment Screenshot *
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      file
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10'
                        : 'border-surface-300 dark:border-surface-600 hover:border-primary-400 dark:hover:border-primary-500'
                    }`}
                    onClick={() => document.getElementById('payment-file')?.click()}
                  >
                    {file ? (
                      <div className="space-y-2">
                        <CheckCircleIcon className="w-10 h-10 text-emerald-500 mx-auto" />
                        <p className="text-sm font-medium text-surface-900 dark:text-white">{file.name}</p>
                        <p className="text-xs text-surface-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <ArrowUpTrayIcon className="w-10 h-10 text-surface-400 mx-auto" />
                        <p className="text-sm text-surface-500">
                          Click to upload payment screenshot
                        </p>
                        <p className="text-xs text-surface-400">JPG, PNG, PDF (max 10MB)</p>
                      </div>
                    )}
                    <input
                      id="payment-file"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    Transaction ID (optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter UPI transaction reference"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !file}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Submitting...
                </span>
              ) : (
                'Submit Enrollment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
