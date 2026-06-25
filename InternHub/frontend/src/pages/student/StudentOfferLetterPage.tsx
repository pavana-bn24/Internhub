import { useState, useEffect } from 'react'
import { myOfferLetter, getEnrollments, getDownloadUrl } from '../../services'
import type { OfferLetter } from '../../types'
import { LoadingSpinner, EmptyState } from '../../components/ui/Common'
import { DocumentTextIcon, ArrowDownTrayIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function StudentOfferLetterPage() {
  const [offer, setOffer] = useState<OfferLetter | null>(null)
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
        myOfferLetter()
          .then(setOffer)
          .catch((err) => {
            if (err.response?.status === 404) {
              setError('No offer letter has been issued yet.')
            } else {
              setError('Failed to load offer letter.')
            }
          })
          .finally(() => setLoading(false))
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading offer letter..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Offer Letter</h1>
          <p className="section-subtitle">View and download your internship offer letter</p>
        </div>
      </div>

      {error ? (
        <EmptyState
          icon={DocumentTextIcon}
          title="No Offer Letter"
          message={error}
        />
      ) : offer ? (
        <div className="premium-card overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <DocumentTextIcon className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Offer Letter Available</h2>
                {offer.issue_date && (
                  <p className="text-primary-100 text-sm mt-0.5">
                    Issued: {new Date(offer.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Status</p>
                <p className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  <CheckCircleIcon className="w-4 h-4" />
                  Generated
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Document</p>
                <p className="font-semibold text-surface-900 dark:text-white mt-1">
                  {offer.file_path ? 'Ready for download' : 'Not uploaded'}
                </p>
              </div>
            </div>

            {offer.file_path && (
              <a
                href={getDownloadUrl(offer.file_path)}
                download
                className="btn-primary inline-flex"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download Offer Letter
              </a>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
