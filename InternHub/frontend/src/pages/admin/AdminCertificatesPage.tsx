import { useState, useEffect } from 'react'
import { getCertificates, getEnrollments, uploadCertificate, updateCertificate, getDownloadUrl } from '../../services'
import type { Certificate, Enrollment } from '../../types'
import { LoadingSpinner, EmptyState, FileUpload, ConfirmDialog } from '../../components/ui/Common'
import { ArrowUpTrayIcon, CheckIcon, PlusIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function AdminCertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState(0)
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [releaseId, setReleaseId] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([getCertificates(), getEnrollments()])
      .then(([c, e]) => {
        setCerts(c)
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
      const result = await uploadCertificate(formData)
      setCerts((prev) => [result, ...prev])
      setFile(null)
      setShowUpload(false)
      toast.success('Certificate uploaded!')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRelease = async () => {
    if (!releaseId) return
    try {
      const updated = await updateCertificate(releaseId, { is_issued: true })
      setCerts((prev) => prev.map((c) => (c.id === releaseId ? updated : c)))
      toast.success('Certificate released to student')
    } catch {
      toast.error('Failed to release certificate')
    } finally {
      setReleaseId(null)
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

  if (loading) return <LoadingSpinner text="Loading certificates..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Certificates</h1>
          <p className="section-subtitle">Upload and manage internship completion certificates</p>
        </div>
        <button onClick={() => setShowUpload(!showUpload)} className="btn-primary text-sm">
          <PlusIcon className="w-4 h-4" />
          Upload Certificate
        </button>
      </div>

      {showUpload && (
        <div className="premium-card p-5 animate-slide-down">
          <h2 className="font-semibold text-surface-900 dark:text-white mb-4">Upload Certificate</h2>
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
                <FileUpload file={file} onChange={setFile} accept=".pdf,.jpg,.png" label="Upload certificate" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Certificate'}
              </button>
            </div>
          </form>
        </div>
      )}

      {certs.length === 0 ? (
        <EmptyState
          icon={CheckBadgeIcon}
          title="No certificates"
          message="Upload certificates for approved enrollments"
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800/30">
                {certs.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium text-surface-900 dark:text-white">{getStudentName(c.enrollment_id)}</td>
                    <td>{getCourseTitle(c.enrollment_id)}</td>
                    <td className="text-surface-500">
                      {c.issue_date ? new Date(c.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                    </td>
                    <td>
                      <span className={`badge ${c.is_issued ? 'badge-approved' : 'badge-pending'}`}>
                        {c.is_issued ? 'Released' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {c.file_path && (
                          <a href={getDownloadUrl(c.file_path)} download className="btn-ghost text-xs py-1 px-2">
                            Download
                          </a>
                        )}
                        {!c.is_issued && c.file_path && (
                          <button
                            onClick={() => setReleaseId(c.id)}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            <CheckIcon className="w-3.5 h-3.5" />
                            Release
                          </button>
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

      <ConfirmDialog
        open={releaseId !== null}
        title="Release Certificate"
        message="Once released, the certificate will be visible to the student. Continue?"
        confirmText="Release"
        onConfirm={handleRelease}
        onCancel={() => setReleaseId(null)}
      />
    </div>
  )
}
