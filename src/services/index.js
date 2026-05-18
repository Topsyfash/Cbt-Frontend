import api from './api'

// ─── Auth ─────────────────────────────────────────────────────────────────────
// POST /auth/register  → { data: { token, user } }
// POST /auth/login     → { data: { token, user } }
// GET  /auth/me        → { data: { user } }
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
}

// ─── Users ────────────────────────────────────────────────────────────────────
// GET    /users               → { data: { users, pagination } }
// PATCH  /users/:id/approve   → body: { approve: bool }
export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  createTeacher: (data) => api.post('/users/teacher', data),
  approve: (id, approve) => api.patch(`/users/${id}/approve`, { approve }),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  assignClass: (id, classId) => api.patch(`/users/${id}/assign-class`, { classId }),
  assignSubjects: (id, subjectIds) => api.patch(`/users/${id}/assign-subjects`, { subjectIds }),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

// ─── Classes ──────────────────────────────────────────────────────────────────
// GET /classes → { data: { classes } }
// PATCH /classes/:id/assign-teacher → body: { teacherId }
export const classService = {
  getAll: () => api.get('/classes'),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
  assignTeacher: (id, teacherId) => api.patch(`/classes/${id}/assign-teacher`, { teacherId }),
}

// ─── Subjects ─────────────────────────────────────────────────────────────────
// GET /subjects → { data: { subjects } }
export const subjectService = {
  getAll: () => api.get('/subjects'),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
}

// ─── Exams ────────────────────────────────────────────────────────────────────
// GET /exams/student → { data: { exams } }
// GET /exams         → { data: { exams } }
// GET /exams/:id     → { data: { exam, questionCount } }
export const examService = {
  getForStudent: () => api.get('/exams/student'),
  getAll: (params) => api.get('/exams', { params }),
  getOne: (id) => api.get(`/exams/${id}`),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  togglePublish: (id) => api.patch(`/exams/${id}/publish`),
  delete: (id) => api.delete(`/exams/${id}`),
}

// ─── Questions ────────────────────────────────────────────────────────────────
// GET  /questions/exam/:examId      → { data: { questions, totalMarks } }
// POST /questions/exam/:examId/bulk → body: { questions: [] }
export const questionService = {
  getByExam: (examId) => api.get(`/questions/exam/${examId}`),
  addSingle: (examId, data) => api.post(`/questions/exam/${examId}`, data),
  addBulk: (examId, questions) => api.post(`/questions/exam/${examId}/bulk`, { questions }),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
}

// ─── Attempts ─────────────────────────────────────────────────────────────────
// POST /attempts/start/:examId      → { data: { attempt, questions, remaining, exam } }
// PATCH /attempts/:attemptId/answer → body: { questionId, selected }
// POST /attempts/:attemptId/submit  → body: { autoSubmit }
// POST /attempts/violation          → body: { attemptId, type, details }
// GET  /attempts/my                 → { data: { attempts } }
// GET  /attempts/:id                → { data: { attempt } }
export const attemptService = {
  start: (examId) => api.post(`/attempts/start/${examId}`),
  saveAnswer: (attemptId, questionId, selected) =>
    api.patch(`/attempts/${attemptId}/answer`, { questionId, selected }),
  submit: (attemptId, autoSubmit = false) =>
    api.post(`/attempts/${attemptId}/submit`, { autoSubmit }),
  logViolation: (attemptId, type, details) =>
    api.post('/attempts/violation', { attemptId, type, details }),
  myAttempts: () => api.get('/attempts/my'),
  getOne: (id) => api.get(`/attempts/${id}`),
}

// ─── Results ──────────────────────────────────────────────────────────────────
// GET /results/me                      → { data: { attempts } }
// GET /results/exam/:examId            → { data: { exam, stats, attempts, pagination } }
// GET /results/class/:classId          → { data: { attempts } }
// GET /results/exam/:examId/rankings   → { data: { rankings } }
export const resultService = {
  mine: () => api.get('/results/me'),
  byExam: (examId) => api.get(`/results/exam/${examId}`),
  byClass: (classId) => api.get(`/results/class/${classId}`),
  violations: (examId) => api.get(`/results/exam/${examId}/violations`),
  rankings: (examId) => api.get(`/results/exam/${examId}/rankings`),
}

// ─── Analytics ────────────────────────────────────────────────────────────────
// GET /analytics/admin   → { data: { users{totalStudents,pendingStudents,totalTeachers,totalAdmins}, exams{totalExams,publishedExams,activeExams}, attempts{totalAttempts,completedAttempts}, performance{avgPercentage,passCount,failCount}, recentAttempts } }
// GET /analytics/teacher → { data: { totalExams, publishedExams, totalAttempts, completedAttempts, examStats } }
// GET /analytics/student → { data: { totalAttempts, passed, failed, passRate, avgScore, highest, subjectPerformance, recentAttempts } }
export const analyticsService = {
  admin: () => api.get('/analytics/admin'),
  teacher: () => api.get('/analytics/teacher'),
  student: () => api.get('/analytics/student'),
}