import { useState, useEffect } from 'react'
import { getProjectSubmissions, uploadProjectSubmission, getDownloadUrl } from '../../services'
import type { ProjectSubmission } from '../../types'
import { LoadingSpinner, StatusBadge, EmptyState } from '../../components/ui/Common'
import { DocumentTextIcon, ArrowUpTrayIcon, ClockIcon, CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const projectTypes = [
  { value: 'idea', label: 'Project Idea' },
  { value: 'synopsis', label: 'Synopsis' },
  { value: 'mini_project', label: 'Mini Project Report' },
  { value: 'major_project', label: 'Major Project Report' },
  { value: 'ppt', label: 'PPT Presentation' },
  { value: 'source_code', label: 'Source Code ZIP' },
  { value: 'documentation', label: 'Final Documentation' },
]

const timelineSteps = [
  { key: 'submitted', label: 'Submitted', icon: ClockIcon },
  { key: 'under_review', label: 'Under Review', icon: DocumentTextIcon },
  { key: 'approved', label: 'Approved', icon: CheckCircleIcon },
]

export default function StudentProjectSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ project_type: 'idea', title: '', description: '' })
  const [file, setFile] = useState<File | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => { loadSubmissions() }, [])

  const loadSubmissions = () => {
    getProjectSubmissions()
      .then(setSubmissions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { toast.error('Please select a file'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('project_type', form.project_type)
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('file', file)
      await uploadProjectSubmission(fd)
      toast.success('Project submitted!')
      setShowForm(false)
      setForm({ project_type: 'idea', title: '', description: '' })
      setFile(null)
      loadSubmissions()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const getStatusStep = (status: string) => {
    if (status === 'submitted') return 0
    if (status === 'under_review') return 1
    return 2
  }

  if (loading) return <LoadingSpinner text="Loading submissions..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Project Submissions</h1>
          <p className="section-subtitle">Upload your project documents for review</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary gap-2">
          <ArrowUpTrayIcon className="w-4 h-4" />
          {showForm ? 'Cancel' : 'New Submission'}
        </button>
      </div>

      {/* Stats */}
      {submissions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="premium-card p-4 text-center">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{submissions.length}</p>
            <p className="text-xs text-surface-500">Total Submitted</p>
          </div>
          <div className="premium-card p-4 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {submissions.filter(s => s.status === 'submitted' || s.status === 'under_review').length}
            </p>
            <p className="text-xs text-surface-500">Pending Review</p>
          </div>
          <div className="premium-card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {submissions.filter(s => s.status === 'approved').length}
            </p>
            <p className="text-xs text-surface-500">Approved</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="premium-card p-5 animate-slide-up">
          <h2 className="font-semibold text-surface-900 dark:text-white mb-4">Upload Project Document</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Project Type</label>
                <select className="input-field" value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })} required>
                  {projectTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Title</label>
                <input type="text" className="input-field" placeholder="e.g. E-Commerce Platform" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Description</label>
              <textarea className="input-field" rows={3} placeholder="Brief description of your project..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">File</label>
              <p className="text-xs text-surface-400 mb-2">Accepted: PDF, DOC, PPT, ZIP, Source Code files (max 50MB)</p>
              <input type="file" className="input-field" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
            </div>
            <button type="submit" className="btn-primary" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Submit Project'}
            </button>
          </form>
        </div>
      )}

      {submissions.length === 0 ? (
        <EmptyState icon={DocumentTextIcon} title="No submissions yet" message="Upload your first project document to get started" />
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const step = getStatusStep(sub.status)
            const isRejected = sub.status === 'rejected'
            return (
              <div key={sub.id} className="premium-card p-5">
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}>
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      sub.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                      sub.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' :
                      sub.status === 'under_review' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                      'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                    }`}>
                      <DocumentTextIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-surface-900 dark:text-white">{sub.title}</h3>
                        <StatusBadge status={sub.status === 'under_review' ? 'pending' : sub.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-surface-500">
                        <span className="px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 font-medium capitalize">
                          {projectTypes.find(t => t.value === sub.project_type)?.label || sub.project_type.replace('_', ' ')}
                        </span>
                        <span>Submitted {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : ''}</span>
                        {sub.reviewed_at && <span>Reviewed {new Date(sub.reviewed_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {expanded === sub.id && (
                  <div className="mt-5 pt-5 border-t border-surface-100 dark:border-surface-800 animate-slide-down">
                    {/* Timeline */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between">
                        {timelineSteps.map((ts, i) => {
                          const Icon = ts.icon
                          const isActive = i <= step
                          const isCurrent = i === step
                          return (
                            <div key={ts.key} className="flex flex-col items-center relative flex-1">
                              {i > 0 && (
                                <div className={`absolute left-0 right-1/2 top-4 h-0.5 -translate-y-1/2 ${
                                  isActive ? 'bg-primary-500' : 'bg-surface-200 dark:bg-surface-700'
                                }`} />
                              )}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                                isCurrent ? 'bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900/30' :
                                isActive ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' :
                                'bg-surface-100 dark:bg-surface-800 text-surface-400'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className={`text-[10px] mt-1.5 font-medium text-center ${
                                isCurrent ? 'text-primary-600 dark:text-primary-400' :
                                isActive ? 'text-surface-700 dark:text-surface-300' :
                                'text-surface-400'
                              }`}>
                                {ts.label}
                              </span>
                            </div>
                          )
                        })}
                        {isRejected && (
                          <div className="flex flex-col items-center relative flex-1">
                            <div className={`absolute left-0 right-1/2 top-4 h-0.5 -translate-y-1/2 bg-red-200 dark:bg-red-900/30`} />
                            <div className="w-8 h-8 rounded-full flex items-center justify-center z-10 bg-red-500 text-white ring-4 ring-red-100 dark:ring-red-900/30">
                              <XCircleIcon className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] mt-1.5 font-medium text-center text-red-600 dark:text-red-400">
                              Rejected
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {sub.description && (
                        <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                          <p className="text-xs font-medium text-surface-500 mb-1">Description</p>
                          <p className="text-sm text-surface-700 dark:text-surface-300">{sub.description}</p>
                        </div>
                      )}
                      {sub.admin_comments && (
                        <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                          <p className="text-xs font-medium text-surface-500 mb-1">Admin Feedback</p>
                          <p className="text-sm text-surface-700 dark:text-surface-300">{sub.admin_comments}</p>
                        </div>
                      )}
                      {sub.total_score != null && (
                        <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                          <p className="text-xs font-medium text-surface-500 mb-1">Evaluation Score</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{sub.total_score}/40</span>
                            <span className="text-xs text-surface-400">|</span>
                            <span className="text-xs text-surface-500">I:{sub.innovation_score} Im:{sub.implementation_score} D:{sub.documentation_score} P:{sub.presentation_score}</span>
                          </div>
                          {sub.evaluation_remarks && (
                            <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{sub.evaluation_remarks}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 mt-4">
                      {sub.file_path && (
                        <a
                          href={getDownloadUrl(sub.file_path)}
                          download
                          className="btn-primary text-sm inline-flex"
                        >
                          <ArrowUpTrayIcon className="w-4 h-4 rotate-180" />
                          Download File
                        </a>
                      )}
                      {sub.status === 'rejected' && (
                        <button onClick={() => { setShowForm(true); setForm({ project_type: sub.project_type, title: sub.title, description: sub.description || '' }) }} className="btn-secondary text-sm">
                          Re-upload
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
