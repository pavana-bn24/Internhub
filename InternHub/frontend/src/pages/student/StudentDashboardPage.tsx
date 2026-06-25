import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getStudentDashboard } from '../../services'
import type { StudentDashboard } from '../../types'
import { StatCard, StatusBadge, Skeleton, ProgressRing } from '../../components/ui/Common'
import {
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  BellIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  SparklesIcon,
  UserIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  ClipboardDocumentCheckIcon,
  RocketLaunchIcon,
  BriefcaseIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<StudentDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStudentDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-[140px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Card */}
      <div className="premium-card p-6 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white border-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl from-white/10 to-transparent rounded-full transform translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-primary-400/20 to-transparent rounded-full transform -translate-x-1/5 translate-y-1/5" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-xl">
                <UserIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-yellow-300" />
                  <p className="text-primary-100 text-xs font-semibold uppercase tracking-widest">Personal Internship Journey</p>
                </div>
                <h1 className="text-2xl font-bold mt-0.5">Welcome back, {user?.full_name?.split(' ')[0]}!</h1>
                <p className="text-primary-200 text-sm mt-0.5">{data?.department && `${data.department}`}{data?.department && data?.college ? ' \u2022 ' : ''}{data?.college}</p>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-center gap-1">
              <ProgressRing percentage={data?.attendance_percentage || 0} size={72} strokeWidth={5} />
              <span className="text-[10px] text-primary-200 font-medium">Attendance</span>
            </div>
          </div>
          {!data?.is_approved && (
            <div className="mt-4 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
              <InformationCircleIcon className="w-4 h-4 text-yellow-300 flex-shrink-0" />
              <p className="text-sm text-white/90">Your account is pending approval. Some features will be limited until approved.</p>
            </div>
          )}
        </div>
      </div>

      {/* Internship Journey Progress */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <RocketLaunchIcon className="w-5 h-5 text-primary-500" />
          <div>
            <h2 className="section-title">Internship Journey</h2>
            <p className="section-subtitle">Track your progress through the internship lifecycle</p>
          </div>
          {data?.internship_id && (
            <span className="ml-auto px-3 py-1 text-xs font-bold rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
              ID: {data.internship_id}
            </span>
          )}
        </div>
        <div className="premium-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">Progress</span>
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{data?.progress_percentage || 0}%</span>
            </div>
            {data?.internship_status && (
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                data.internship_status === 'completed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' :
                data.internship_status === 'ongoing' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800' :
                'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
              }`}>
                {data.internship_status === 'completed' ? '\uD83D\uDFE2 Completed' : data.internship_status === 'ongoing' ? '\uD83D\uDFE1 Ongoing' : '\uD83D\uDD34 Incomplete'}
              </span>
            )}
          </div>
          <div className="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-3 mb-4">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-700"
              style={{ width: `${Math.min(data?.progress_percentage || 0, 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { key: 'enrollment_submitted', label: 'Enrolled', icon: BookOpenIcon },
              { key: 'payment_verified', label: 'Payment Verified', icon: CurrencyDollarIcon },
              { key: 'enrollment_approved', label: 'Approved', icon: CheckCircleIcon },
              { key: 'offer_letter_issued', label: 'Offer Letter', icon: DocumentTextIcon },
              { key: 'project_submitted', label: 'Project Submitted', icon: ClipboardDocumentCheckIcon },
              { key: 'attendance_met', label: 'Attendance Met', icon: CalendarDaysIcon },
              { key: 'certificate_released', label: 'Certificate', icon: CheckBadgeIcon },
            ].map((m) => {
              const done = data?.milestones?.[m.key]
              return (
                <div key={m.key} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-center ${
                  done
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
                    : 'bg-surface-50 border-surface-200 dark:bg-surface-800/30 dark:border-surface-700'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    done ? 'bg-green-500 text-white' : 'bg-surface-200 dark:bg-surface-600 text-surface-400'
                  }`}>
                    <m.icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-medium leading-tight ${
                    done ? 'text-green-700 dark:text-green-300' : 'text-surface-500'
                  }`}>{m.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Enrollment Status */}
      <div>
        <div className="section-header mb-3">
          <BriefcaseIcon className="w-5 h-5 text-primary-500" />
          <div className="ml-2">
            <h2 className="section-title">My Enrollment Status</h2>
            <p className="section-subtitle">Track your internship applications</p>
          </div>
          <Link to="/student/enrollments" className="btn-ghost text-sm gap-1 ml-auto">
            View all <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={BookOpenIcon} label="Total Applied" value={data?.total_enrollments || 0} color="primary" />
          <StatCard icon={ClockIcon} label="Pending" value={data?.pending_enrollments || 0} color="yellow" />
          <StatCard icon={CheckCircleIcon} label="Approved" value={data?.approved_enrollments || 0} color="green" />
          <StatCard icon={XCircleIcon} label="Rejected" value={data?.rejected_enrollments || 0} color="red" />
        </div>
      </div>

      {/* My Courses */}
      {data?.my_courses && data.my_courses.length > 0 && (
        <div>
          <div className="section-header mb-3">
            <AcademicCapIcon className="w-5 h-5 text-purple-500" />
            <div className="ml-2">
              <h2 className="section-title">My Courses</h2>
              <p className="section-subtitle">Courses you are enrolled in</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.my_courses.map((course) => (
              <div key={course.id} className="premium-card p-5 flex items-center justify-between group hover:shadow-premium-lg transition-all cursor-pointer" onClick={() => navigate('/student/enrollments')}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-sm">
                    <AcademicCapIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-surface-900 dark:text-white">{course.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={course.status} />
                      <span className="text-xs text-surface-500">{course.attendance_percentage}% attendance</span>
                      {course.fee && (
                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">\u20B9{course.fee.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-surface-300 group-hover:text-surface-500 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents & Progress row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarDaysIcon} label="My Attendance" value={`${data?.attendance_percentage || 0}%`} color="blue" />
        <StatCard icon={AcademicCapIcon} label="Study Materials" value={data?.materials_count || 0} color="purple" />
        <StatCard icon={DocumentTextIcon} label="Offer Letter" value={data?.has_offer_letter ? 'Available' : 'N/A'} color={data?.has_offer_letter ? 'green' : 'indigo'} />
        <StatCard icon={CheckBadgeIcon} label="Certificates" value={data?.certificates_count || 0} color="green" />
        <StatCard icon={ClipboardDocumentCheckIcon} label="Project Submissions" value={data?.total_submissions || 0} color="primary" />
        <StatCard icon={ClockIcon} label="Pending Review" value={data?.pending_submissions || 0} color="yellow" />
        <StatCard icon={CheckCircleIcon} label="Approved Projects" value={data?.approved_submissions || 0} color="green" />
      </div>

      {/* Profile Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="premium-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary-500" />
              <h2 className="section-title">Profile Completion</h2>
            </div>
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">{data?.profile_completion || 0}%</span>
          </div>
          <div className="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-2 mb-4">
            <div className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all" style={{ width: `${data?.profile_completion || 0}%` }} />
          </div>
          <div className="space-y-2">
            {['Profile Photo', 'Phone Number', 'College', 'Department', 'Email'].map((field) => {
              const missing = data?.missing_profile_fields?.includes(field)
              return (
                <div key={field} className="flex items-center justify-between text-sm">
                  <span className={`${missing ? 'text-surface-400' : 'text-surface-700 dark:text-surface-300'}`}>{field}</span>
                  {missing ? (
                    <span className="text-xs text-red-500 font-medium">Missing</span>
                  ) : (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  )}
                </div>
              )
            })}
          </div>
          <Link to="/student/profile" className="btn-primary text-sm mt-4 w-full flex items-center justify-center gap-2">
            Complete Profile
          </Link>
        </div>

        {/* Admin Remarks */}
        {data?.enrollment_remarks && (
          <div className="premium-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <DocumentTextIcon className="w-5 h-5 text-amber-500" />
              <h2 className="section-title">Admin Remarks</h2>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">{data.enrollment_remarks}</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="premium-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <RocketLaunchIcon className="w-5 h-5 text-primary-500" />
          <h2 className="section-title">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/student/enrollments/browse', label: 'Browse Internships', icon: BookOpenIcon, gradient: 'from-primary-500 to-primary-600' },
            { to: '/student/materials', label: 'View Materials', icon: AcademicCapIcon, gradient: 'from-violet-500 to-violet-600' },
            { to: '/student/attendance', label: 'View Attendance', icon: CalendarDaysIcon, gradient: 'from-blue-500 to-blue-600' },
            { to: '/student/projects', label: 'Upload Projects', icon: ClipboardDocumentCheckIcon, gradient: 'from-emerald-500 to-emerald-600' },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all group border border-transparent hover:border-surface-200 dark:hover:border-surface-700"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-sm shadow-black/10 group-hover:shadow-md group-hover:scale-105 transition-all`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-surface-600 dark:text-surface-400 text-center group-hover:text-surface-900 dark:group-hover:text-white transition-colors">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity & Notifications row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Activity Feed */}
        <div className="lg:col-span-1 premium-card">
          <div className="section-header p-5 pb-0">
            <ChartBarIcon className="w-5 h-5 text-primary-500" />
            <div className="ml-2">
              <h2 className="section-title">My Activity</h2>
            </div>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-800/50 mt-3 max-h-[300px] overflow-y-auto">
            {data?.recent_activity?.length ? (
              data.recent_activity.slice(0, 6).map((act) => (
                <div key={act.id} className="px-5 py-3.5 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    act.type?.includes('approved') || act.type?.includes('verified') || act.type?.includes('released') ? 'bg-emerald-400' :
                    act.type?.includes('rejected') || act.type?.includes('failed') ? 'bg-red-400' :
                    act.type?.includes('submitted') || act.type?.includes('pending') ? 'bg-amber-400' : 'bg-primary-400'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-surface-700 dark:text-surface-300">
                      <span className="font-medium text-surface-900 dark:text-white">{act.title}</span>
                    </p>
                    {act.message && <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">{act.message}</p>}
                    <p className="text-[10px] text-surface-400 mt-0.5">
                      {act.timestamp ? new Date(act.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-surface-400 text-sm">No activity yet. Apply for an internship to get started!</div>
            )}
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="lg:col-span-1 premium-card">
          <div className="section-header p-5 pb-0">
            <BookOpenIcon className="w-5 h-5 text-primary-500" />
            <div className="ml-2">
              <h2 className="section-title">My Recent Enrollments</h2>
            </div>
            <Link to="/student/enrollments" className="btn-ghost text-sm gap-1 ml-auto">
              All <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-800/50 mt-3">
            {data?.recent_enrollments?.length ? (
              data.recent_enrollments.map((enr) => (
                <div key={enr.id} className="flex items-center justify-between px-5 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/20 transition-colors cursor-pointer" onClick={() => navigate('/student/enrollments')}>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                      <BookOpenIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900 dark:text-white">{enr.course_title}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                        {enr.applied_at ? new Date(enr.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={enr.status} />
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-surface-400">
                <p>No enrollments yet.</p>
                <Link to="/student/enrollments/browse" className="text-primary-600 hover:underline text-sm font-medium mt-1 inline-block">
                  Browse internships
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="lg:col-span-1 premium-card">
          <div className="section-header p-5 pb-0">
            <BellIcon className="w-5 h-5 text-primary-500" />
            <div className="ml-2">
              <h2 className="section-title">Recent Notifications</h2>
              {data && data.unread_notifications > 0 && (
                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  {data.unread_notifications} new
                </span>
              )}
            </div>
            <Link to="/student/notifications" className="btn-ghost text-sm gap-1 ml-auto">
              All <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-800/50 mt-3">
            {data?.recent_notifications?.length ? (
              data.recent_notifications.map((notif) => (
                <div key={notif.id} className="px-5 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-800/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-400 mt-1.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-white">{notif.title}</p>
                      {notif.message && <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{notif.message}</p>}
                      <p className="text-[10px] text-surface-400 mt-1">
                        {notif.created_at ? new Date(notif.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-surface-400 text-sm">No notifications yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
