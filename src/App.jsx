import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Student pages
import StudentDashboard from './pages/student/Dashboard'
import ExamPage from './pages/student/ExamPage'
import StudentResults from './pages/student/Results'
import ResultDetail from './pages/student/ResultDetail'

// Teacher pages
import TeacherDashboard from './pages/teacher/Dashboard'
import CreateExam from './pages/teacher/CreateExam'
import ManageExam from './pages/teacher/ManageExam'
import ExamQuestions from './pages/teacher/ExamQuestions'
import ClassResults from './pages/teacher/ClassResults'
import GradeOpenEnded from './pages/teacher/GradeOpenEnded'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import ManageUsers from './pages/admin/ManageUsers'
import ManageClasses from './pages/admin/ManageClasses'
import ManageSubjects from './pages/admin/ManageSubjects'
import AdminAnalytics from './pages/admin/Analytics'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />
  return children
}

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        <p className="text-white/40 text-sm font-display">Loading...</p>
      </div>
    </div>
  )
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={`/${user.role}`} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1c2029',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#1c2029' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1c2029' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student */}
          <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/exam/:examId" element={<ProtectedRoute roles={['student']}><ExamPage /></ProtectedRoute>} />
          <Route path="/student/results" element={<ProtectedRoute roles={['student']}><StudentResults /></ProtectedRoute>} />
          <Route path="/student/results/:attemptId" element={<ProtectedRoute roles={['student']}><ResultDetail /></ProtectedRoute>} />

          {/* Teacher */}
          <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/exams/create" element={<ProtectedRoute roles={['teacher']}><CreateExam /></ProtectedRoute>} />
          <Route path="/teacher/exams/:examId/edit" element={<ProtectedRoute roles={['teacher']}><ManageExam /></ProtectedRoute>} />
          <Route path="/teacher/exams/:examId/questions" element={<ProtectedRoute roles={['teacher']}><ExamQuestions /></ProtectedRoute>} />
          <Route path="/teacher/results" element={<ProtectedRoute roles={['teacher']}><ClassResults /></ProtectedRoute>} />
          <Route path="/teacher/grade" element={<ProtectedRoute roles={['teacher']}><GradeOpenEnded /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><ManageUsers /></ProtectedRoute>} />
          <Route path="/admin/classes" element={<ProtectedRoute roles={['admin']}><ManageClasses /></ProtectedRoute>} />
          <Route path="/admin/subjects" element={<ProtectedRoute roles={['admin']}><ManageSubjects /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}