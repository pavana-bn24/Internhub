import { useState, useEffect } from 'react'
import { getEnrollments, getOfferLetters, uploadOfferLetter, getDownloadUrl } from '../../services'
import type { OfferLetter, Enrollment } from '../../types'
import { LoadingSpinner, EmptyState, FileUpload } from '../../components/ui/Common'
import { ArrowUpTrayIcon, DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function AdminOfferLettersPage() {
  const [letters, setLetters] = useState<OfferLetter[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState(0)
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    Promise.all([getOfferLetters(), getEnrollments()])
      .then(([l, e]) => {
        setLetters(l)
        const approved = e.filter((en) => en.status === 'approved')
        setEnrollments(approved)
        if (approved.length > 0) setSelectedEnrollment(approved[0].id)
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !selectedEnrollment) {
      toast.error('Select enrollment and file')
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('enrollment_id', String(selectedEnrollment))
    formData.append('issue_date', issueDate)
    formData.append('file', file)
    try {
      const result = await uploadOfferLetter(formData)
      setLetters((prev) => [result, ...prev])
      setFile(null)
      setShowUpload(false)
      toast.success('Offer letter uploaded!')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const getStudentName = (enrollmentId: number) => {
    const enr = enrollments.find((e) => e.id === enrollmentId)
    return enr?.student?.full_name || `Enrollment #${enrollmentId}`
  }

  const getCourseTitle = (enrollmentId: number) => {
    const enr = enrollments.find((e) => e.id === enrollmentId)
    return enr?.course?.title || ''
  }

  if (loading) return <LoadingSpinner text="Loading offer letters..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Offer Letters</h1>
          <p className="section-subtitle">Upload and manage internship offer letters</p>
        </div>
        <button onClick={() => setShowUpload(!showUpload)} className="btn-primary text-sm">
          <PlusIcon className="w-4 h-4" />
          Upload Letter
        </button>
      </div>

      {showUpload && (
        <div className="premium-card p-5 animate-slide-down">
          <h2 className="font-semibold text-surface-900 dark:text-white mb-4">Upload Offer Letter</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Enrollment</label>
                <select className="input-field" value={selectedEnrollment} onChange={(e) => setSelectedEnrollment(Number(e.target.value))}>
                  {enrollments.map((en) => (
                    <option key={en.id} value={en.id}>
                      {en.student?.full_name} - {en.course?.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Issue Date</label>
                <input type="date" className="input-field" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">PDF File</label>
                <FileUpload file={file} onChange={setFile} accept=".pdf" label="Upload PDF" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Offer Letter'}
              </button>
            </div>
          </form>
        </div>
      )}

      {letters.length === 0 ? (
        <EmptyState
          icon={DocumentTextIcon}
          title="No offer letters"
          message="Upload offer letters for approved enrollments"
        />
      ) : (
        <div className="premium-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Issue Date</th>
                  <th>Status</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800/30">
                {letters.map((l) => (
                  <tr key={l.id}>
                    <td className="font-medium text-surface-900 dark:text-white">{getStudentName(l.enrollment_id)}</td>
                    <td>{getCourseTitle(l.enrollment_id)}</td>
                    <td className="text-surface-500">
                      {l.issue_date ? new Date(l.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                    </td>
                    <td>
                      <span className={`badge ${l.is_generated ? 'badge-approved' : 'badge-pending'}`}>
                        {l.is_generated ? 'Issued' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      {l.file_path ? (
                        <a href={getDownloadUrl(l.file_path || '')} download className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                          Download PDF
                        </a>
                      ) : (
                        <span className="text-surface-400 text-xs">N/A</span>
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
