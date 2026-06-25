import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCourses } from '../../services'
import type { Course } from '../../types'
import { LoadingSpinner, EmptyState } from '../../components/ui/Common'
import { MagnifyingGlassIcon, BriefcaseIcon, ClockIcon, MapPinIcon, CurrencyDollarIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function StudentBrowseCoursesPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getCourses()
      .then(setCourses)
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner text="Loading internships..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Available Internships</h1>
          <p className="section-subtitle">Explore and apply for internships</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          className="input-field pl-10"
          placeholder="Search by title or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredCourses.length === 0 ? (
        <EmptyState
          icon={BriefcaseIcon}
          title="No internships found"
          message={search ? 'Try adjusting your search' : 'No internships available right now'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCourses.map((course) => (
            <div key={course.id} className="premium-card p-5 flex flex-col group animate-slide-up">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20">
                  <BriefcaseIcon className="w-6 h-6 text-white" />
                </div>
              </div>

              <h3 className="font-semibold text-surface-900 dark:text-white text-lg">{course.title}</h3>
              {course.company && (
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">{course.company}</p>
              )}

              <p className="text-sm text-surface-600 dark:text-surface-300 mb-4 line-clamp-2 leading-relaxed">
                {course.description}
              </p>

              <div className="space-y-2 mb-4 flex-1">
                {course.duration && (
                  <div className="flex items-center gap-2.5 text-sm text-surface-500 dark:text-surface-400">
                    <ClockIcon className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                )}
                {course.mode && (
                  <div className="flex items-center gap-2.5 text-sm text-surface-500 dark:text-surface-400">
                    <MapPinIcon className="w-4 h-4" />
                    <span className="capitalize">{course.mode}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm text-surface-500 dark:text-surface-400">
                  <CurrencyDollarIcon className="w-4 h-4" />
                  <span className="font-semibold text-surface-900 dark:text-white">₹{course.fee?.toLocaleString() || '4000'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-surface-500 dark:text-surface-400">
                  <AcademicCapIcon className="w-4 h-4" />
                  <span>Certificate & Offer Letter Included</span>
                </div>
              </div>

              {course.skills_required && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">Technologies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {course.skills_required.split(',').map((s) => (
                      <span
                        key={s.trim()}
                        className="px-2.5 py-1 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 rounded-lg text-xs font-medium"
                      >
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate(`/student/course/${course.id}`)}
                className="btn-primary w-full justify-center mt-auto"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
