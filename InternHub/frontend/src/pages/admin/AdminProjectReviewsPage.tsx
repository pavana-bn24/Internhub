import { useState, useEffect } from 'react'
import { getProjectSubmissions, reviewProjectSubmission, evaluateProjectSubmission, getDownloadUrl } from '../../services'
import type { ProjectSubmission } from '../../types'
import { LoadingSpinner, StatusBadge, EmptyState } from '../../components/ui/Common'
import { ClipboardDocumentCheckIcon, MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon, ChatBubbleLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const projectTypes = [
  { value: '', label: 'All Types' },
  { value: 'idea', label: 'Project Idea' },
  { value: 'synopsis', label: 'Synopsis' },
  { value: 'mini_project', label: 'Mini Project' },
  { value: 'major_project', label: 'Major Project' },
  { value: 'ppt', label: 'PPT' },
  { value: 'source_code', label: 'Source Code' },
  { value: 'documentation', label: 'Documentation' },
]

export default function AdminProjectReviewsPage() {
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [comment, setComment] = useState('')
  const [actionId, setActionId] = useState<number | null>(null)
  const [evalId, setEvalId] = useState<number | null>(null)
  const [evalForm, setEvalForm] = useState({ innovation_score: 0, implementation_score: 0, documentation_score: 0, presentation_score: 0, evaluation_remarks: '' })

  useEffect(() => { loadSubmissions() }, [filter, statusFilter])

  const loadSubmissions = () => {
    setLoading(true)
    getProjectSubmissions({ project_type: filter, status: statusFilter, search })
      .then(setSubmissions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleEvaluate = async (id: number) => {
    setActionId(id)
    try {
      await evaluateProjectSubmission(id, evalForm)
      toast.success('Project evaluated!')
      setEvalId(null)
      setEvalForm({ innovation_score: 0, implementation_score: 0, documentation_score: 0, presentation_score: 0, evaluation_remarks: '' })
      loadSubmissions()
    } catch {
      toast.error('Failed to evaluate')
    } finally {
      setActionId(null)
    }
  }

  const handleReview = async (id: number, status: string) => {
    setActionId(id)
    try {
      await reviewProjectSubmission(id, { status, admin_comments: comment })
      toast.success(`Submission ${status}!`)
      setComment('')
      loadSubmissions()
    } catch {
      toast.error('Failed to update')
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <LoadingSpinner text="Loading submissions..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Project Reviews</h1>
          <p className="section-subtitle">Review student project submissions</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" className="input-field pl-10" placeholder="Search by title or student name..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadSubmissions()} />
        </div>
        <select className="input-field w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          {projectTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select className="input-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={loadSubmissions} className="btn-primary text-sm px-4">Search</button>
      </div>

      {submissions.length === 0 ? (
        <EmptyState icon={ClipboardDocumentCheckIcon} title="No submissions found" message="No project submissions match your filters" />
      ) : (
        <div className="premium-card overflow-hidden">
          <div className="overflow-x-auto">
              <table className="premium-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th>Comments</th>
                  <th>File</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {sub.student_name?.charAt(0) || '?'}
                        </div>
                        <span className="font-medium text-surface-900 dark:text-white">{sub.student_name || `Student #${sub.student_id}`}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs capitalize px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 whitespace-nowrap">
                        {projectTypes.find(t => t.value === sub.project_type)?.label || sub.project_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="font-medium text-surface-900 dark:text-white max-w-[200px] truncate">{sub.title}</td>
                    <td><StatusBadge status={sub.status === 'under_review' ? 'pending' : sub.status} /></td>
                    <td>
                      {sub.total_score != null ? (
                        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                          {sub.total_score}/40
                        </span>
                      ) : (
                        <span className="text-xs text-surface-400">-</span>
                      )}
                    </td>
                    <td className="text-surface-500 text-sm whitespace-nowrap">{sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '-'}</td>
                    <td>
                      <input type="text" className="input-field text-xs py-1.5 min-w-[120px]" placeholder="Add comment..." value={actionId === sub.id ? comment : sub.admin_comments || ''} onChange={(e) => { setComment(e.target.value); setActionId(sub.id) }} />
                    </td>
                    <td>
                      {sub.file_path ? (
                        <a href={getDownloadUrl(sub.file_path)} download className="text-primary-600 hover:text-primary-700 text-xs flex items-center gap-1 whitespace-nowrap">
                          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                          Download
                        </a>
                      ) : '-'}
                    </td>
                    <td>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {sub.status !== 'approved' && (
                          <button onClick={() => handleReview(sub.id, 'approved')} disabled={actionId === sub.id} className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50" title="Approve">
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                        )}
                        {sub.status !== 'rejected' && (
                          <button onClick={() => handleReview(sub.id, 'rejected')} disabled={actionId === sub.id} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50" title="Reject">
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        )}
                        <button onClick={() => handleReview(sub.id, 'under_review')} disabled={actionId === sub.id} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50" title="Mark Under Review">
                          <ChatBubbleLeftIcon className="w-5 h-5" />
                        </button>
                        {sub.status === 'approved' && (
                          <button onClick={() => { setEvalId(evalId === sub.id ? null : sub.id); setEvalForm({ innovation_score: sub.innovation_score || 0, implementation_score: sub.implementation_score || 0, documentation_score: sub.documentation_score || 0, presentation_score: sub.presentation_score || 0, evaluation_remarks: sub.evaluation_remarks || '' }) }} className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title={sub.total_score != null ? 'Re-evaluate' : 'Evaluate'}>
                            <StarIcon className="w-5 h-5" />
                          </button>
                        )}
                        {evalId === sub.id && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEvalId(null)}>
                            <div className="premium-card p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                              <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4">Evaluate Project</h3>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-xs font-medium text-surface-700 dark:text-surface-300">Innovation (0-10)</label>
                                  <input type="number" min={0} max={10} className="input-field" value={evalForm.innovation_score} onChange={(e) => setEvalForm({ ...evalForm, innovation_score: Math.min(10, Math.max(0, Number(e.target.value))) })} />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-surface-700 dark:text-surface-300">Technical Implementation (0-10)</label>
                                  <input type="number" min={0} max={10} className="input-field" value={evalForm.implementation_score} onChange={(e) => setEvalForm({ ...evalForm, implementation_score: Math.min(10, Math.max(0, Number(e.target.value))) })} />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-surface-700 dark:text-surface-300">Documentation (0-10)</label>
                                  <input type="number" min={0} max={10} className="input-field" value={evalForm.documentation_score} onChange={(e) => setEvalForm({ ...evalForm, documentation_score: Math.min(10, Math.max(0, Number(e.target.value))) })} />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-surface-700 dark:text-surface-300">Presentation (0-10)</label>
                                  <input type="number" min={0} max={10} className="input-field" value={evalForm.presentation_score} onChange={(e) => setEvalForm({ ...evalForm, presentation_score: Math.min(10, Math.max(0, Number(e.target.value))) })} />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-surface-700 dark:text-surface-300">Total: {evalForm.innovation_score + evalForm.implementation_score + evalForm.documentation_score + evalForm.presentation_score}/40</label>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-surface-700 dark:text-surface-300">Remarks</label>
                                  <textarea className="input-field" rows={3} value={evalForm.evaluation_remarks} onChange={(e) => setEvalForm({ ...evalForm, evaluation_remarks: e.target.value })} />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setEvalId(null)} className="btn-ghost text-sm">Cancel</button>
                                <button onClick={() => handleEvaluate(sub.id)} disabled={actionId === sub.id} className="btn-primary text-sm">Submit Evaluation</button>
                              </div>
                            </div>
                          </div>
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
