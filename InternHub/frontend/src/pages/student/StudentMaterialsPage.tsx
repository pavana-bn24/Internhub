import { useState, useEffect } from 'react'
import { getStudyMaterials, getEnrollments, getDownloadUrl } from '../../services'
import type { StudyMaterial } from '../../types'
import { LoadingSpinner, EmptyState } from '../../components/ui/Common'
import { MagnifyingGlassIcon, DocumentArrowDownIcon, AcademicCapIcon, BookOpenIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
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
        getStudyMaterials(0, search)
          .then(setMaterials)
          .catch(() => toast.error('Failed to load materials'))
          .finally(() => setLoading(false))
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (error) return
    const timer = setTimeout(() => {
      getStudyMaterials(0, search).then(setMaterials).catch(() => toast.error('Search failed'))
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const groupedByCourse = materials.reduce<Record<string, StudyMaterial[]>>((acc, m) => {
    const key = m.course_title || 'General'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  if (loading) return <LoadingSpinner text="Loading materials..." />

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="section-header">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Study Materials</h1>
            <p className="section-subtitle">Browse and download internship resources</p>
          </div>
        </div>
        <EmptyState icon={AcademicCapIcon} title="Access Restricted" message={error} />
      </div>
    )
  }

  const fileIcons: Record<string, string> = {
    pdf: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    ppt: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    zip: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
  }

  const fileColors: Record<string, string> = {
    pdf: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    ppt: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
    zip: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    doc: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Study Materials</h1>
          <p className="section-subtitle">Browse and download internship resources</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          className="input-field pl-10"
          placeholder="Search materials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {Object.entries(groupedByCourse).length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title="No materials available"
          message={search ? 'Try a different search' : 'Materials will appear here once uploaded'}
        />
      ) : (
        Object.entries(groupedByCourse).map(([course, items]) => (
          <div key={course} className="premium-card">
            <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-800/50">
              <h2 className="font-semibold text-surface-900 dark:text-white">{course}</h2>
              <p className="text-xs text-surface-500 mt-0.5">{items.length} material{items.length > 1 ? 's' : ''}</p>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-800/30">
              {items.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/20 transition-colors">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${fileColors[m.file_type] || 'bg-surface-100 dark:bg-surface-800 text-surface-500'}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={fileIcons[m.file_type] || fileIcons.pdf} />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-surface-900 dark:text-white truncate">{m.title}</p>
                      {m.description && (
                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-1">{m.description}</p>
                      )}
                      <p className="text-xs text-surface-400 mt-1">
                        {m.file_type?.toUpperCase()} {m.file_size ? `• ${(m.file_size / 1024).toFixed(1)} KB` : ''}
                      </p>
                    </div>
                  </div>
                  <a
                    href={getDownloadUrl(m.file_path || '')}
                    download
                    className="btn-ghost text-sm flex-shrink-0 ml-4"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
