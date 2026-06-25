export interface User {
  id: number
  email: string
  username: string
  full_name: string
  role: 'student' | 'admin'
  is_active: boolean
  is_approved: boolean
  phone?: string
  department?: string
  college?: string
  profile_pic?: string
  created_at?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface LoginData {
  username: string
  password: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
  full_name: string
  phone?: string
  department?: string
  college?: string
}

export interface Course {
  id: number
  title: string
  description?: string
  company?: string
  duration?: string
  mode?: string
  fee?: number
  stipend?: string
  skills_required?: string
  is_active: boolean
  created_at?: string
}

export interface Enrollment {
  id: number
  student_id: number
  course_id: number
  status: 'pending' | 'approved' | 'rejected'
  payment_status?: string
  payment_amount?: number
  payment_proof?: string
  transaction_id?: string
  payment_date?: string
  payment_comment?: string
  admin_comment?: string
  admin_remarks?: string
  internship_id?: string
  applied_at?: string
  updated_at?: string
  course?: {
    id: number
    title: string
    company?: string
    duration?: string
    mode?: string
    fee?: number
  }
  student?: {
    id: number
    full_name: string
    email: string
    department?: string
    college?: string
  }
}

export interface Attendance {
  id: number
  student_id: number
  course_id: number
  date: string
  status: 'present' | 'absent' | 'leave' | 'holiday'
  remarks?: string
}

export interface AttendanceSummary {
  total: number
  present: number
  absent: number
  leave: number
  percentage: number
}

export interface OfferLetter {
  id: number
  enrollment_id: number
  file_path?: string
  issue_date?: string
  is_generated: boolean
  created_at?: string
}

export interface Certificate {
  id: number
  enrollment_id: number
  file_path?: string
  issue_date?: string
  is_approved: boolean
  is_issued: boolean
  created_at?: string
}

export interface ProjectSubmission {
  id: number
  student_id: number
  project_type: string
  title: string
  description?: string
  file_path?: string
  status: string
  admin_comments?: string
  student_name?: string
  innovation_score?: number
  implementation_score?: number
  documentation_score?: number
  presentation_score?: number
  total_score?: number
  evaluation_remarks?: string
  submitted_at?: string
  reviewed_at?: string
  evaluated_at?: string
  created_at?: string
}

export interface StudyMaterial {
  id: number
  course_id: number
  title: string
  description?: string
  file_path?: string
  file_type: string
  file_size?: number
  course_title?: string
  created_at?: string
}

export interface Notification {
  id: number
  student_id: number
  title: string
  message?: string
  is_read: boolean
  notification_type?: string
  created_at?: string
}

export interface StudentCourseInfo {
  id: number
  title: string
  status: string
  attendance_percentage: number
  fee?: number
}

export interface StudentNotifInfo {
  id: number
  title: string
  message?: string
  created_at?: string
}

export interface StudentActivityItem {
  id: number
  title: string
  message?: string
  type: string
  timestamp?: string
}

export interface StudentDashboard {
  full_name: string
  email: string
  department?: string
  college?: string
  is_approved: boolean
  total_enrollments: number
  pending_enrollments: number
  approved_enrollments: number
  rejected_enrollments: number
  attendance_percentage: number
  total_attendance: number
  present_attendance: number
  absent_attendance: number
  has_offer_letter: boolean
  has_certificate: boolean
  unread_notifications: number
  materials_count: number
  certificates_count: number
  total_submissions: number
  pending_submissions: number
  approved_submissions: number
  rejected_submissions: number
  progress_percentage: number
  internship_status: string
  internship_id?: string
  milestones: Record<string, boolean>
  profile_completion: number
  missing_profile_fields: string[]
  enrollment_remarks?: string
  recent_enrollments: Array<{
    id: number
    course_title: string
    status: string
    applied_at?: string
  }>
  my_courses: StudentCourseInfo[]
  recent_notifications: StudentNotifInfo[]
  recent_activity: StudentActivityItem[]
}

export interface AttendanceStats {
  total_records: number
  present: number
  absent: number
}

export interface PendingRequestItem {
  id: number
  student_name: string
  email: string
  course_title: string
  applied_at?: string
}

export interface RecentActivityItem {
  id: number
  student_name: string
  course_title: string
  action: string
  timestamp?: string
}

export interface AdminDashboard {
  total_students: number
  approved_students: number
  total_courses: number
  total_enrollments: number
  pending_approvals: number
  pending_payments: number
  active_internships: number
  ongoing_internships: number
  completed_internships: number
  students_below_attendance: number
  total_offer_letters: number
  total_certificates: number
  pending_project_reviews: number
  pending_project_evaluations: number
  approved_projects: number
  rejected_projects: number
  pending_certificate_releases: number
  attendance_stats: AttendanceStats
  recent_enrollments: Array<{
    id: number
    student_name: string
    course_title: string
    status: string
    applied_at?: string
  }>
  pending_requests: PendingRequestItem[]
  payment_requests: PendingRequestItem[]
  recent_activity: RecentActivityItem[]
}

export interface PaymentRequest {
  id: number
  enrollment_id: number
  student_id: number
  student_name: string
  course_title: string
  payment_status: string
  payment_amount?: number
  payment_proof?: string
  transaction_id?: string
  payment_comment?: string
  course_fee?: number
  submitted_at?: string
}
