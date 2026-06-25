import API, { getDownloadUrl } from './api'

export { getDownloadUrl }
import type {
  AuthResponse,
  LoginData,
  RegisterData,
  User,
  Course,
  Enrollment,
  Attendance,
  AttendanceSummary,
  OfferLetter,
  Certificate,
  StudyMaterial,
  Notification,
  ProjectSubmission,
  StudentDashboard,
  AdminDashboard,
  PaymentRequest,
} from '../types'

// Auth
export const login = (data: LoginData) =>
  API.post<AuthResponse>('/auth/login', data).then((r) => r.data)

export const register = (data: RegisterData) =>
  API.post<AuthResponse>('/auth/register', data).then((r) => r.data)

export const getMe = () =>
  API.get<User>('/auth/me').then((r) => r.data)

// Users
export const getUsers = () =>
  API.get<User[]>('/users').then((r) => r.data)

export const getStudents = () =>
  API.get<User[]>('/users/students').then((r) => r.data)

export const getUser = (id: number) =>
  API.get<User>(`/users/${id}`).then((r) => r.data)

export const updateUser = (id: number, data: Partial<User>) =>
  API.patch<User>(`/users/${id}`, data).then((r) => r.data)

export const updateMyProfile = (id: number, data: Partial<User>) =>
  API.patch<User>(`/users/${id}/profile`, data).then((r) => r.data)

export const changePassword = (id: number, data: { current_password: string; new_password: string }) =>
  API.post<{ message: string }>(`/users/${id}/change-password`, data).then((r) => r.data)

export const uploadProfilePhoto = (id: number, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return API.patch<User>(`/users/${id}/profile/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

// Courses
export const getCourses = (search = '') =>
  API.get<Course[]>(`/courses${search ? `?search=${encodeURIComponent(search)}` : ''}`).then((r) => r.data)

export const getCourse = (id: number) =>
  API.get<Course>(`/courses/${id}`).then((r) => r.data)

export const createCourse = (data: Partial<Course>) =>
  API.post<Course>('/courses', data).then((r) => r.data)

export const updateCourse = (id: number, data: Partial<Course>) =>
  API.patch<Course>(`/courses/${id}`, data).then((r) => r.data)

export const deleteCourse = (id: number) =>
  API.delete(`/courses/${id}`)

// Enrollments
export const getEnrollments = (status = '') => {
  const params = status ? `?status_filter=${status}` : ''
  return API.get<Enrollment[]>(`/enrollments${params}`).then((r) => r.data)
}

export const myEnrollments = () =>
  API.get<Enrollment[]>('/enrollments/my').then((r) => r.data)

export const applyEnrollment = (courseId: number, file: File, transactionId?: string) => {
  const formData = new FormData()
  formData.append('course_id', String(courseId))
  formData.append('file', file)
  if (transactionId) formData.append('transaction_id', transactionId)
  return API.post<Enrollment>('/enrollments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

export const updateEnrollment = (id: number, data: Partial<Enrollment>) =>
  API.patch<Enrollment>(`/enrollments/${id}`, data).then((r) => r.data)

export const verifyEnrollmentPayment = (id: number, data: { status: string; comment?: string }) =>
  API.patch<Enrollment>(`/enrollments/${id}/payment`, data).then((r) => r.data)

// Attendance
export const getAttendance = (courseId = 0, month = 0, year = 0) => {
  const params = new URLSearchParams()
  if (courseId) params.set('course_id', String(courseId))
  if (month) params.set('month', String(month))
  if (year) params.set('year', String(year))
  return API.get<Attendance[]>(`/attendance?${params}`).then((r) => r.data)
}

export const getAttendanceSummary = (courseId = 0) =>
  API.get<AttendanceSummary>(`/attendance/summary${courseId ? `?course_id=${courseId}` : ''}`).then((r) => r.data)

export const markAttendance = (data: Partial<Attendance>) =>
  API.post<Attendance>('/attendance', data).then((r) => r.data)

export const bulkAttendance = (records: Partial<Attendance>[]) =>
  API.post<Attendance[]>('/attendance/bulk', { records }).then((r) => r.data)

// Offer Letters
export const getOfferLetters = () =>
  API.get<OfferLetter[]>('/offer-letters').then((r) => r.data)

export const myOfferLetter = () =>
  API.get<OfferLetter>('/offer-letters/my').then((r) => r.data)

export const uploadOfferLetter = (formData: FormData) =>
  API.post<OfferLetter>('/offer-letters/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)

// Certificates
export const getCertificates = () =>
  API.get<Certificate[]>('/certificates').then((r) => r.data)

export const myCertificate = () =>
  API.get<Certificate>('/certificates/my').then((r) => r.data)

export const uploadCertificate = (formData: FormData) =>
  API.post<Certificate>('/certificates/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)

export const updateCertificate = (id: number, data: Partial<Certificate>) =>
  API.patch<Certificate>(`/certificates/${id}`, data).then((r) => r.data)

// Study Materials
export const getStudyMaterials = (courseId = 0, search = '', fileType = '') => {
  const params = new URLSearchParams()
  if (courseId) params.set('course_id', String(courseId))
  if (search) params.set('search', search)
  if (fileType) params.set('file_type', fileType)
  return API.get<StudyMaterial[]>(`/study-materials?${params}`).then((r) => r.data)
}

export const uploadStudyMaterial = (formData: FormData) =>
  API.post<StudyMaterial>('/study-materials/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)

export const deleteStudyMaterial = (id: number) =>
  API.delete(`/study-materials/${id}`)

// Notifications
export const getNotifications = () =>
  API.get<Notification[]>('/notifications').then((r) => r.data)

export const getUnreadCount = () =>
  API.get<{ count: number }>('/notifications/unread-count').then((r) => r.data)

export const markNotificationRead = (id: number) =>
  API.patch<Notification>(`/notifications/${id}/read`).then((r) => r.data)

export const markAllNotificationsRead = () =>
  API.patch('/notifications/read-all').then((r) => r.data)

// Search
export const globalSearch = (q: string) => {
  if (!q) return Promise.resolve([])
  return API.get<Array<{ type: string; id: number; title: string; subtitle?: string; link: string }>>(`/search?q=${encodeURIComponent(q)}`).then((r) => r.data)
}

// Project Submissions
export const getProjectSubmissions = (params?: { project_type?: string; status?: string; search?: string }) => {
  const query = new URLSearchParams()
  if (params?.project_type) query.set('project_type', params.project_type)
  if (params?.status) query.set('status_filter', params.status)
  if (params?.search) query.set('search', params.search)
  return API.get<ProjectSubmission[]>(`/project-submissions?${query}`).then((r) => r.data)
}

export const uploadProjectSubmission = (formData: FormData) =>
  API.post<ProjectSubmission>('/project-submissions/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)

export const reviewProjectSubmission = (id: number, data: { status: string; admin_comments?: string }) =>
  API.patch<ProjectSubmission>(`/project-submissions/${id}`, data).then((r) => r.data)

export const evaluateProjectSubmission = (id: number, data: {
  innovation_score: number
  implementation_score: number
  documentation_score: number
  presentation_score: number
  evaluation_remarks?: string
}) => API.patch<ProjectSubmission>(`/project-submissions/${id}/evaluate`, data).then((r) => r.data)

export const updateEnrollmentRemarks = (id: number, data: { admin_remarks: string }) =>
  API.patch(`/enrollments/${id}/remarks`, data).then((r) => r.data)

export const deleteProjectSubmission = (id: number) =>
  API.delete(`/project-submissions/${id}`)

// Dashboard
export const getStudentDashboard = () =>
  API.get<StudentDashboard>('/dashboard/student').then((r) => r.data)

export const getAdminDashboard = () =>
  API.get<AdminDashboard>('/dashboard/admin').then((r) => r.data)

// Payments
export const getPayments = (status = '') => {
  const params = status ? `?status_filter=${status}` : ''
  return API.get<PaymentRequest[]>(`/payments${params}`).then((r) => r.data)
}

export const myPayments = () =>
  API.get<PaymentRequest[]>('/payments/my').then((r) => r.data)

export const submitPayment = (enrollmentId: number, file: File) => {
  const formData = new FormData()
  formData.append('enrollment_id', String(enrollmentId))
  formData.append('file', file)
  return API.post('/payments/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}
