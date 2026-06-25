import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, PublicRoute } from './components/common/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import StudentDashboardPage from './pages/student/StudentDashboardPage'
import StudentBrowseCoursesPage from './pages/student/StudentBrowseCoursesPage'
import CourseDetailPage from './pages/student/CourseDetailPage'
import EnrollmentPaymentPage from './pages/student/EnrollmentPaymentPage'
import StudentEnrollmentsPage from './pages/student/StudentEnrollmentsPage'
import StudentMaterialsPage from './pages/student/StudentMaterialsPage'
import StudentAttendancePage from './pages/student/StudentAttendancePage'
import StudentOfferLetterPage from './pages/student/StudentOfferLetterPage'
import StudentCertificatePage from './pages/student/StudentCertificatePage'
import StudentNotificationsPage from './pages/student/StudentNotificationsPage'
import StudentProjectSubmissionsPage from './pages/student/StudentProjectSubmissionsPage'
import StudentProfilePage from './pages/student/StudentProfilePage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminProjectReviewsPage from './pages/admin/AdminProjectReviewsPage'
import AdminEnrollmentsPage from './pages/admin/AdminEnrollmentsPage'
import AdminMaterialsPage from './pages/admin/AdminMaterialsPage'
import AdminAttendancePage from './pages/admin/AdminAttendancePage'
import AdminOfferLettersPage from './pages/admin/AdminOfferLettersPage'
import AdminCertificatesPage from './pages/admin/AdminCertificatesPage'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          <Route
            path="/student/*"
            element={
              <ProtectedRoute role="student">
                <AppLayout>
                  <Routes>
                    <Route path="dashboard" element={<StudentDashboardPage />} />
                    <Route path="enrollments" element={<StudentEnrollmentsPage />} />
                    <Route path="enrollments/browse" element={<StudentBrowseCoursesPage />} />
                    <Route path="course/:id" element={<CourseDetailPage />} />
                    <Route path="enroll/:id" element={<EnrollmentPaymentPage />} />
                    <Route path="materials" element={<StudentMaterialsPage />} />
                    <Route path="attendance" element={<StudentAttendancePage />} />
                    <Route path="offer-letter" element={<StudentOfferLetterPage />} />
                    <Route path="certificate" element={<StudentCertificatePage />} />
                    <Route path="notifications" element={<StudentNotificationsPage />} />
                    <Route path="projects" element={<StudentProjectSubmissionsPage />} />
                    <Route path="profile" element={<StudentProfilePage />} />
                    <Route path="*" element={<StudentDashboardPage />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute role="admin">
                <AppLayout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="enrollments" element={<AdminEnrollmentsPage />} />
                    <Route path="payments" element={<AdminPaymentsPage />} />
                    <Route path="materials" element={<AdminMaterialsPage />} />
                    <Route path="attendance" element={<AdminAttendancePage />} />
                    <Route path="offer-letters" element={<AdminOfferLettersPage />} />
                    <Route path="certificates" element={<AdminCertificatesPage />} />
                    <Route path="project-reviews" element={<AdminProjectReviewsPage />} />
                    <Route path="*" element={<AdminDashboardPage />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
