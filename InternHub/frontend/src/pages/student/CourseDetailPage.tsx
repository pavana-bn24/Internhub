import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCourse, myEnrollments } from '../../services'
import type { Course, Enrollment } from '../../types'
import { LoadingSpinner, StatusBadge } from '../../components/ui/Common'
import {
  ClockIcon, MapPinIcon, CurrencyDollarIcon, AcademicCapIcon,
  BriefcaseIcon, CheckBadgeIcon, DocumentTextIcon, ArrowLeftIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function CourseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      getCourse(Number(id)),
      myEnrollments(),
    ])
      .then(([c, e]) => {
        setCourse(c)
        setEnrollment(e.find((enr) => enr.course_id === c.id))
      })
      .catch(() => toast.error('Failed to load course'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner text="Loading course details..." />
  if (!course) return <div className="text-center py-12 text-surface-400">Course not found</div>

  const skills = course.skills_required?.split(',').map(s => s.trim()) || []

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <button
        onClick={() => navigate('/student/enrollments/browse')}
        className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to internships
      </button>

      <div className="premium-card p-6 lg:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
            <BriefcaseIcon className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">{course.title}</h1>
            {course.company && (
              <p className="text-surface-500 dark:text-surface-400 mt-1">{course.company}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400">
                <ClockIcon className="w-4 h-4" />
                <span>{course.duration || '4 Months'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400">
                <MapPinIcon className="w-4 h-4" />
                <span className="capitalize">{course.mode || 'Online'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-surface-900 dark:text-white">
                <CurrencyDollarIcon className="w-4 h-4" />
                <span>₹{course.fee?.toLocaleString() || '4,000'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">Description</h2>
              <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                {course.description || 'No description available.'}
              </p>
            </div>

            {skills.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">Technologies Covered</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 rounded-lg text-sm font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-surface-900 dark:text-white">Benefits</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                    <DocumentTextIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">Offer Letter</p>
                    <p className="text-xs text-surface-500">Official offer letter upon enrollment</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                    <CheckBadgeIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">Certificate</p>
                    <p className="text-xs text-surface-500">Completion certificate upon finishing</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <AcademicCapIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">Study Materials</p>
                    <p className="text-xs text-surface-500">Access to learning resources</p>
                  </div>
                </div>
              </div>
            </div>

            {enrollment ? (
              <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-5 text-center space-y-3">
                <StatusBadge status={enrollment.status} />
                <p className="text-sm text-surface-500">
                  {enrollment.status === 'pending' && 'Your application is being reviewed'}
                  {enrollment.status === 'approved' && 'You are enrolled in this course'}
                  {enrollment.status === 'rejected' && 'Your application was not approved'}
                </p>
                {enrollment.status === 'rejected' && enrollment.admin_comment && (
                  <p className="text-xs text-surface-500 italic">{enrollment.admin_comment}</p>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate(`/student/enroll/${course.id}`)}
                className="btn-primary w-full justify-center py-3 text-base"
              >
                Enroll Now — ₹{course.fee?.toLocaleString() || '4,000'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
