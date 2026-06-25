import { useState, useEffect } from 'react'
import { myCertificate, getEnrollments, getDownloadUrl } from '../../services'
import type { Certificate } from '../../types'
import { LoadingSpinner, EmptyState } from '../../components/ui/Common'
import { CheckBadgeIcon, ArrowDownTrayIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function StudentCertificatePage() {
  const [cert, setCert] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getEnrollments()
      .then((enrs) => {
        const approved = enrs.filter((e) => e.status === 'approved')
        if (approved.length === 0) {
          setError('Your enrollment is pending admin approval.')
          setLoading(false)
          return
        }
        myCertificate()
          .then(setCert)
          .catch((err) => {
            if (err.response?.status === 404) {
              setError('No certificate has been issued yet.')
            } else {
              setError('Failed to load certificate.')
            }
          })
          .finally(() => setLoading(false))
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading certificate..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Certificate</h1>
          <p className="section-subtitle">View and download your internship certificate</p>
        </div>
      </div>

      {error ? (
        <EmptyState
          icon={CheckBadgeIcon}
          title="No Certificate"
          message={error}
        />
      ) : cert ? (
        <div className="premium-card overflow-hidden">
          <div className={`px-6 py-8 text-white ${cert.is_issued ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {cert.is_issued ? (
                  <CheckBadgeIcon className="w-7 h-7" />
                ) : (
                  <ClockIcon className="w-7 h-7" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {cert.is_issued ? 'Certificate Issued' : 'Certificate Pending'}
                </h2>
                {cert.issue_date && (
                  <p className="text-white/80 text-sm mt-0.5">
                    Issued: {new Date(cert.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Status</p>
                <p className={`font-semibold mt-1 flex items-center gap-2 ${cert.is_issued ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${cert.is_issued ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {cert.is_issued ? 'Released' : 'Not yet released'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Download</p>
                <p className="font-semibold text-surface-900 dark:text-white mt-1">
                  {cert.file_path ? 'Ready for download' : 'Not uploaded'}
                </p>
              </div>
            </div>

            {cert.file_path && (
              <a
                href={getDownloadUrl(cert.file_path)}
                download
                className="btn-primary inline-flex"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download Certificate
              </a>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
