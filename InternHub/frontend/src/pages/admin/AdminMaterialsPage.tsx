import { useState, useEffect } from 'react'
import { getStudyMaterials, getCourses, uploadStudyMaterial, deleteStudyMaterial } from '../../services'
import type { StudyMaterial, Course } from '../../types'
import { LoadingSpinner, EmptyState, FileUpload, ConfirmDialog } from '../../components/ui/Common'
import { TrashIcon, PlusIcon, BookOpenIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [courseId, setCourseId] = useState(0)
  const [fileType, setFileType] = useState('pdf')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([getStudyMaterials(), getCourses()])
      .then(([m, c]) => {
        setMaterials(m)
        setCourses(c)
        if (c.length > 0) setCourseId(c[0].id)
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !courseId || !title) {
      toast.error('Fill all required fields')
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('course_id', String(courseId))
    formData.append('title', title)
    formData.append('description', description)
    formData.append('file_type', fileType)
    formData.append('file', file)
    try {
      const result = await uploadStudyMaterial(formData)
      setMaterials((prev) => [result, ...prev])
      setTitle('')
      setDescription('')
      setFile(null)
      setShowUpload(false)
      toast.success('Material uploaded!')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteStudyMaterial(deleteId)
      setMaterials((prev) => prev.filter((m) => m.id !== deleteId))
      toast.success('Material deleted')
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleteId(null)
    }
  }

  const fileColors: Record<string, string> = {
    pdf: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    ppt: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
    zip: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    doc: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  }

  if (loading) return <LoadingSpinner text="Loading materials..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Study Materials</h1>
          <p className="section-subtitle">Upload and manage internship resources</p>
        </div>
        <button onClick={() => setShowUpload(!showUpload)} className="btn-primary text-sm">
          <PlusIcon className="w-4 h-4" />
          Add Material
        </button>
      </div>

      {showUpload && (
        <div className="premium-card p-5 animate-slide-down">
          <h2 className="font-semibold text-surface-900 dark:text-white mb-4">Upload New Material</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Title *</label>
                <input type="text" className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Course *</label>
                <select className="input-field" value={courseId} onChange={(e) => setCourseId(Number(e.target.value))}>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Type *</label>
                <select className="input-field" value={fileType} onChange={(e) => setFileType(e.target.value)}>
                  <option value="pdf">PDF</option>
                  <option value="ppt">PPT</option>
                  <option value="zip">ZIP</option>
                  <option value="doc">DOC</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Description</label>
                <input type="text" className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
            <FileUpload file={file} onChange={setFile} label="Upload study material" />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Material'}
              </button>
            </div>
          </form>
        </div>
      )}

      {materials.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title="No materials yet"
          message="Upload your first study material to get started"
        />
      ) : (
        <div className="premium-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Course</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800/30">
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td className="font-medium text-surface-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${fileColors[m.file_type] || 'bg-surface-100 dark:bg-surface-800 text-surface-500'}`}>
                          {m.file_type?.toUpperCase()}
                        </div>
                        {m.title}
                      </div>
                    </td>
                    <td>{m.course_title || '-'}</td>
                    <td>
                      <span className="badge bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 uppercase">{m.file_type}</span>
                    </td>
                    <td className="text-surface-500 tabular-nums">{m.file_size ? `${(m.file_size / 1024).toFixed(1)} KB` : '-'}</td>
                    <td>
                      <button
                        onClick={() => setDeleteId(m.id)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Material"
        message="Are you sure you want to delete this material? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
