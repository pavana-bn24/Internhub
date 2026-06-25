import { useState, useEffect } from 'react'
import { getStudents, getCourses, markAttendance, getAttendance } from '../../services'
import type { Attendance } from '../../types'
import { LoadingSpinner, EmptyState } from '../../components/ui/Common'
import { CalendarDaysIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function AdminAttendancePage() {
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [records, setRecords] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState(0)
  const [selectedCourse, setSelectedCourse] = useState(0)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState('present')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([getStudents(), getCourses()])
      .then(([s, c]) => {
        setStudents(s)
        setCourses(c)
        if (s.length > 0) setSelectedStudent(s[0].id)
        if (c.length > 0) setSelectedCourse(c[0].id)
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      getAttendance(selectedCourse).then(setRecords).catch(() => {})
    }
  }, [selectedCourse])

  const handleMark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !selectedCourse || !date) {
      toast.error('Fill all fields')
      return
    }
    setSubmitting(true)
    try {
      const result = await markAttendance({
        student_id: selectedStudent,
        course_id: selectedCourse,
        date,
        status,
      })
      setRecords((prev) => [result, ...prev])
      toast.success('Attendance marked!')
    } catch {
      toast.error('Failed to mark attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
    present: { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-500' },
    absent: { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', dot: 'bg-red-500' },
    leave: { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-500' },
    holiday: { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', dot: 'bg-blue-500' },
  }

  if (loading) return <LoadingSpinner text="Loading attendance data..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Attendance Management</h1>
          <p className="section-subtitle">Mark and manage student attendance</p>
        </div>
      </div>

      <div className="premium-card p-5">
        <h2 className="font-semibold text-surface-900 dark:text-white mb-4">Mark Attendance</h2>
        <form onSubmit={handleMark} className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Student</label>
            <select className="input-field" value={selectedStudent} onChange={(e) => setSelectedStudent(Number(e.target.value))}>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Course</label>
            <select className="input-field" value={selectedCourse} onChange={(e) => setSelectedCourse(Number(e.target.value))}>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Date</label>
            <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Status</label>
            <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full justify-center" disabled={submitting}>
              {submitting ? 'Saving...' : 'Mark Present'}
            </button>
          </div>
        </form>
      </div>

      <div className="premium-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-800/50">
          <h2 className="font-semibold text-surface-900 dark:text-white">Attendance Records</h2>
          <select className="input-field w-auto py-1.5 text-xs" value={selectedCourse} onChange={(e) => setSelectedCourse(Number(e.target.value))}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        {records.length === 0 ? (
          <EmptyState icon={CalendarDaysIcon} title="No records" message="Mark attendance to see records here" />
        ) : (
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800/30">
                {records.map((r) => {
                  const student = students.find((s) => s.id === r.student_id)
                  const course = courses.find((c) => c.id === r.course_id)
                  const cfg = statusConfig[r.status] || { color: 'text-surface-600', bg: 'bg-surface-100 dark:bg-surface-800', dot: 'bg-surface-500' }
                  return (
                    <tr key={r.id}>
                      <td className="font-medium text-surface-900 dark:text-white">
                        {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td>{student?.full_name || 'Unknown'}</td>
                      <td className="text-surface-500">{course?.title || 'Unknown'}</td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
