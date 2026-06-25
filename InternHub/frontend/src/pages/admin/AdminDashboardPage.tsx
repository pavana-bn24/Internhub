import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAdminDashboard } from '../../services'
import type { AdminDashboard } from '../../types'
import { StatCard, StatusBadge, Skeleton } from '../../components/ui/Common'
import {
  UserGroupIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  AcademicCapIcon,
  PresentationChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-[120px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Enterprise Header */}
      <div className="premium-card p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary-500/10 to-transparent rounded-full transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full transform -translate-x-1/4 translate-y-1/4" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">Platform Management</span>
            </div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-surface-400 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-surface-300">System Live</span>
          </div>
        </div>
      </div>

      {/* Primary Metrics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <PresentationChartBarIcon className="w-5 h-5 text-primary-500" />
          <div>
            <h2 className="section-title">Primary Metrics</h2>
            <p className="section-subtitle">Core platform statistics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={UserGroupIcon} label="Total Students" value={data?.total_students || 0} color="primary" />
          <StatCard icon={CheckCircleIcon} label="Approved Students" value={data?.approved_students || 0} color="green" />
          <StatCard icon={ExclamationTriangleIcon} label="Pending Enrollments" value={data?.pending_approvals || 0} color="yellow" />
          <StatCard icon={CurrencyDollarIcon} label="Pending Payments" value={data?.pending_payments || 0} color="orange" />
        </div>
      </div>

      {/* Secondary Metrics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ClipboardDocumentListIcon className="w-5 h-5 text-purple-500" />
          <div>
            <h2 className="section-title">Platform Status</h2>
            <p className="section-subtitle">Courses, documents and activity</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={BookOpenIcon} label="Active Courses" value={data?.active_internships || 0} color="blue" />
          <StatCard icon={DocumentTextIcon} label="Offer Letters" value={data?.total_offer_letters || 0} color="purple" />
          <StatCard icon={CheckBadgeIcon} label="Certificates Issued" value={data?.total_certificates || 0} color="indigo" />
          <StatCard icon={CheckBadgeIcon} label="Pending Certificates" value={data?.pending_certificate_releases || 0} color="yellow" />
          <StatCard icon={ClipboardDocumentCheckIcon} label="Pending Reviews" value={data?.pending_project_reviews || 0} color="orange" />
          <StatCard icon={CheckCircleIcon} label="Approved Projects" value={data?.approved_projects || 0} color="green" />
          <StatCard icon={XCircleIcon} label="Rejected Projects" value={data?.rejected_projects || 0} color="red" />
          <StatCard icon={AcademicCapIcon} label="Attendance Records" value={data?.attendance_stats?.total_records || 0} color="green" />
        </div>
      </div>

      {/* Internship Status & Alerts */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <PresentationChartBarIcon className="w-5 h-5 text-emerald-500" />
          <div>
            <h2 className="section-title">Internship Overview</h2>
            <p className="section-subtitle">Progress tracking and alerts</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={RocketLaunchIcon} label="Ongoing Internships" value={data?.ongoing_internships || 0} color="primary" />
          <StatCard icon={CheckBadgeIcon} label="Completed Internships" value={data?.completed_internships || 0} color="green" />
          <StatCard icon={ExclamationTriangleIcon} label="Below Attendance" value={data?.students_below_attendance || 0} color="red" />
          <StatCard icon={ClipboardDocumentCheckIcon} label="Pending Evaluations" value={data?.pending_project_evaluations || 0} color="orange" />
          <StatCard icon={XCircleIcon} label="Rejected Projects" value={data?.rejected_projects || 0} color="red" />
          <StatCard icon={UserGroupIcon} label="Approved Students" value={data?.approved_students || 0} color="green" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="premium-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <PresentationChartBarIcon className="w-5 h-5 text-primary-500" />
          <h2 className="section-title">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { to: '/admin/payments', label: 'Verify Payments', icon: BanknotesIcon, gradient: 'from-orange-500 to-orange-600' },
            { to: '/admin/enrollments', label: 'Approve Enrollments', icon: ClipboardDocumentListIcon, gradient: 'from-primary-500 to-primary-600' },
            { to: '/admin/materials', label: 'Upload Materials', icon: AcademicCapIcon, gradient: 'from-violet-500 to-violet-600' },
            { to: '/admin/attendance', label: 'Mark Attendance', icon: ClockIcon, gradient: 'from-blue-500 to-blue-600' },
            { to: '/admin/offer-letters', label: 'Upload Offer Letters', icon: DocumentTextIcon, gradient: 'from-emerald-500 to-emerald-600' },
            { to: '/admin/certificates', label: 'Upload Certificates', icon: CheckBadgeIcon, gradient: 'from-amber-500 to-amber-600' },
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

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Enrollments */}
        <div className="lg:col-span-1 premium-card">
          <div className="section-header p-5 pb-0">
            <BookOpenIcon className="w-5 h-5 text-primary-500" />
            <div className="ml-2">
              <h2 className="section-title">Recent Enrollments</h2>
            </div>
            <Link to="/admin/enrollments" className="btn-ghost text-sm gap-1 ml-auto">
              All <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto mt-2">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_enrollments?.slice(0, 5).map((enr) => (
                  <tr key={enr.id} className="cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/20" onClick={() => navigate('/admin/enrollments')}>
                    <td className="font-medium text-surface-900 dark:text-white">{enr.student_name}</td>
                    <td className="text-surface-600 dark:text-surface-400">{enr.course_title}</td>
                    <td><StatusBadge status={enr.status} /></td>
                  </tr>
                ))}
                {(!data?.recent_enrollments || data.recent_enrollments.length === 0) && (
                  <tr><td colSpan={3} className="text-center text-surface-400 py-8">No enrollments yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="lg:col-span-1 premium-card">
          <div className="section-header p-5 pb-0">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
            <div className="ml-2">
              <h2 className="section-title">Pending Requests</h2>
              {data && data.pending_approvals > 0 && (
                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {data.pending_approvals} need review
                </span>
              )}
            </div>
            <Link to="/admin/enrollments" className="btn-ghost text-sm gap-1 ml-auto">
              Review <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-800/50 mt-3">
            {data?.pending_requests?.slice(0, 5).map((req) => (
              <div key={req.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-800/20 transition-colors cursor-pointer" onClick={() => navigate('/admin/enrollments')}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">{req.student_name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{req.student_name}</p>
                    <p className="text-xs text-surface-500 truncate">{req.course_title}</p>
                  </div>
                </div>
                <span className="text-[10px] text-surface-400 flex-shrink-0">
                  {req.applied_at ? new Date(req.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                </span>
              </div>
            ))}
            {(!data?.pending_requests || data.pending_requests.length === 0) && (
              <div className="px-5 py-8 text-center text-surface-400 text-sm">All clear -- no pending requests</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1 premium-card">
          <div className="section-header p-5 pb-0">
            <ClockIcon className="w-5 h-5 text-surface-500" />
            <div className="ml-2">
              <h2 className="section-title">Recent Activity</h2>
            </div>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-800/50 mt-3 max-h-[400px] overflow-y-auto">
            {data?.recent_activity?.slice(0, 10).map((act) => (
              <div key={act.id} className="px-5 py-3.5 flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  act.action.toLowerCase().includes('approved') ? 'bg-emerald-400' :
                  act.action.toLowerCase().includes('rejected') ? 'bg-red-400' :
                  act.action.toLowerCase().includes('pending') || act.action.toLowerCase().includes('submitted') ? 'bg-amber-400' :
                  act.action.toLowerCase().includes('registration') ? 'bg-blue-400' : 'bg-surface-400'
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-surface-700 dark:text-surface-300">
                    <span className="font-medium text-surface-900 dark:text-white">{act.student_name}</span>
                    {' '}{act.action.toLowerCase()}
                    {act.course_title ? <span className="text-surface-500"> for <span className="font-medium">{act.course_title}</span></span> : ''}
                  </p>
                  <p className="text-[10px] text-surface-400 mt-0.5">
                    {act.timestamp ? new Date(act.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            ))}
            {(!data?.recent_activity || data.recent_activity.length === 0) && (
              <div className="px-5 py-8 text-center text-surface-400 text-sm">No recent activity</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
