import { useState, useEffect } from 'react'
import Layout from '../../components/common/Layout'
import { StatCard, PageLoader } from '../../components/common/UI'
import { analyticsService, examService } from '../../services'
import {
  Users, FileText, TrendingUp, Award, UserCheck,
  Clock, BookOpen, ChevronDown, ChevronUp, Search,
  Eye, EyeOff, Calendar
} from 'lucide-react'
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [examsLoading, setExamsLoading] = useState(true)
  const [examSearch, setExamSearch] = useState('')
  const [examFilter, setExamFilter] = useState('all')
  const [expandedExam, setExpandedExam] = useState(null)

  useEffect(() => {
    // Analytics
    analyticsService.admin()
      .then((res) => {
        const d = res.data?.data || {}
        setStats({
          totalStudents:     d.users?.totalStudents     ?? 0,
          pendingStudents:   d.users?.pendingStudents   ?? 0,
          approvedStudents:  (d.users?.totalStudents ?? 0) - (d.users?.pendingStudents ?? 0),
          totalTeachers:     d.users?.totalTeachers     ?? 0,
          totalExams:        d.exams?.totalExams         ?? 0,
          publishedExams:    d.exams?.publishedExams     ?? 0,
          totalAttempts:     d.attempts?.totalAttempts   ?? 0,
          completedAttempts: d.attempts?.completedAttempts ?? 0,
          avgPercentage:     d.performance?.avgPercentage ?? 0,
          passCount:         d.performance?.passCount     ?? 0,
          failCount:         d.performance?.failCount     ?? 0,
          recentAttempts:    d.recentAttempts             ?? [],
        })
      })
      .catch(() => setStats({}))
      .finally(() => setLoading(false))

    // All exams with teacher + subject + class populated
    examService.getAll({ limit: 200 })
      .then((res) => setExams(res.data?.data?.exams || []))
      .catch(() => setExams([]))
      .finally(() => setExamsLoading(false))
  }, [])

  if (loading) return <Layout><PageLoader /></Layout>

  const s = stats || {}

  const pieData = [
    { name: 'Approved', value: s.approvedStudents || 0 },
    { name: 'Pending',  value: s.pendingStudents  || 0 },
  ]
  const PIE_COLORS = ['#3474f5', '#f59e0b']

  // Filter exams
  const filteredExams = exams.filter((exam) => {
    const matchSearch = !examSearch ||
      exam.title?.toLowerCase().includes(examSearch.toLowerCase()) ||
      exam.subject?.name?.toLowerCase().includes(examSearch.toLowerCase()) ||
      exam.teacher?.fullName?.toLowerCase().includes(examSearch.toLowerCase()) ||
      exam.class?.name?.toLowerCase().includes(examSearch.toLowerCase())
    const matchFilter =
      examFilter === 'all' ||
      (examFilter === 'published' && exam.isPublished) ||
      (examFilter === 'draft' && !exam.isPublished)
    return matchSearch && matchFilter
  })

  const now = new Date()
  const getExamStatus = (exam) => {
    if (!exam.isPublished) return { label: 'Draft', cls: 'badge-amber' }
    const start = exam.startTime ? new Date(exam.startTime) : null
    const end   = exam.endTime   ? new Date(exam.endTime)   : null
    if (end && now > end)   return { label: 'Closed',    cls: 'badge-red'   }
    if (start && now < start) return { label: 'Upcoming', cls: 'badge-blue'  }
    return { label: 'Active', cls: 'badge-green' }
  }

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Students" value={s.totalStudents} icon={Users}     color="brand"  />
        <StatCard label="Total Teachers" value={s.totalTeachers} icon={UserCheck} color="green"  />
        <StatCard label="Total Exams"    value={s.totalExams}    icon={FileText}  color="purple" />
        <StatCard label="Exam Attempts"  value={s.totalAttempts} icon={TrendingUp} color="amber" />
      </div>

      {/* Mid row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Student approval pie */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-white mb-4">Student Approval Status</h3>
          <div className="flex items-center justify-center">
            <PieChart width={220} height={160}>
              <Pie data={pieData} cx={110} cy={80} innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{v}</span>} />
              <Tooltip contentStyle={{ background: '#1c2029', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'white' }} />
            </PieChart>
          </div>
        </div>

        {/* Quick stats */}
        <div className="card p-6 space-y-3">
          <h3 className="font-display font-bold text-white mb-2">Quick Stats</h3>
          {[
            { label: 'Published Exams',    value: s.publishedExams,   color: 'text-accent-green'  },
            { label: 'Pending Approvals',  value: s.pendingStudents,  color: 'text-accent-amber'  },
            { label: 'Completed Attempts', value: s.completedAttempts, color: 'text-brand-400'    },
            { label: 'Avg Score',          value: s.avgPercentage ? `${s.avgPercentage}%` : '—', color: 'text-accent-purple' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-white/50 text-sm">{label}</span>
              <span className={`font-display font-bold text-lg ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Performance */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-white mb-4">Performance</h3>
          <div className="space-y-3">
            {[
              { label: 'Passed', value: s.passCount, color: 'text-accent-green' },
              { label: 'Failed', value: s.failCount, color: 'text-accent-red'   },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-white/50 text-sm">{label}</span>
                <span className={`font-display font-bold text-lg ${color}`}>{value}</span>
              </div>
            ))}
            <div className="pt-2">
              <p className="text-white/30 text-xs mb-1">Pass rate</p>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-accent-green rounded-full"
                  style={{ width: `${s.completedAttempts ? Math.round((s.passCount / s.completedAttempts) * 100) : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Exam Details Table ─────────────────────────────────────────────── */}
      <div className="card overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h3 className="font-display font-bold text-white">All Examinations</h3>
            <p className="text-white/30 text-xs mt-0.5">{filteredExams.length} of {exams.length} exams</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                className="input pl-8 py-2 text-sm w-48"
                placeholder="Search exams..."
                value={examSearch}
                onChange={(e) => setExamSearch(e.target.value)}
              />
            </div>
            {/* Filter */}
            <select
              className="input py-2 text-sm w-32"
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {examsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="px-6 py-12 text-center text-white/30 text-sm font-display">
            {exams.length === 0 ? 'No exams created yet' : 'No exams match your search'}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredExams.map((exam) => {
              const { label, cls } = getExamStatus(exam)
              const isExpanded = expandedExam === exam._id

              return (
                <div key={exam._id}>
                  {/* Main row */}
                  <button
                    onClick={() => setExpandedExam(isExpanded ? null : exam._id)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/2 transition-colors text-left"
                  >
                    {/* Exam icon */}
                    <div className="w-9 h-9 rounded-xl bg-brand-600/10 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-brand-400" />
                    </div>

                    {/* Title + subject */}
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-white text-sm truncate">{exam.title}</p>
                      <p className="text-white/40 text-xs mt-0.5 truncate">{exam.subject?.name || '—'}</p>
                    </div>

                    {/* Teacher */}
                    <div className="hidden md:flex flex-col items-start w-36 flex-shrink-0">
                      <p className="text-white/60 text-xs font-display truncate">{exam.teacher?.fullName || '—'}</p>
                      <p className="text-white/25 text-xs">{exam.teacher?.email || ''}</p>
                    </div>

                    {/* Class */}
                    <div className="hidden lg:block w-24 flex-shrink-0">
                      <p className="text-white/50 text-xs font-display">{exam.class?.name || '—'}</p>
                    </div>

                    {/* Duration */}
                    <div className="hidden lg:flex items-center gap-1 text-white/40 text-xs w-20 flex-shrink-0">
                      <Clock size={11} />
                      <span>{exam.duration} min</span>
                    </div>

                    {/* Status badge */}
                    <span className={`badge ${cls} flex-shrink-0`}>{label}</span>

                    {/* Expand icon */}
                    <span className="text-white/20 flex-shrink-0 ml-1">
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </span>
                  </button>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="px-6 pb-5 bg-surface-2/50 border-t border-white/5 animate-fade-in">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">

                        {/* Teacher */}
                        <div className="space-y-1">
                          <p className="label">Teacher</p>
                          <p className="text-white text-sm font-display font-semibold">{exam.teacher?.fullName || '—'}</p>
                          <p className="text-white/30 text-xs">{exam.teacher?.email || ''}</p>
                        </div>

                        {/* Subject */}
                        <div className="space-y-1">
                          <p className="label">Subject</p>
                          <p className="text-white text-sm font-display font-semibold">{exam.subject?.name || '—'}</p>
                          {exam.subject?.code && <p className="text-white/30 text-xs font-mono">{exam.subject.code}</p>}
                        </div>

                        {/* Class */}
                        <div className="space-y-1">
                          <p className="label">Class</p>
                          <p className="text-white text-sm font-display font-semibold">{exam.class?.name || '—'}</p>
                          {exam.class?.level && <p className="text-white/30 text-xs">{exam.class.level}</p>}
                        </div>

                        {/* Duration */}
                        <div className="space-y-1">
                          <p className="label">Duration</p>
                          <p className="text-white text-sm font-display font-semibold">{exam.duration} minutes</p>
                        </div>

                        {/* Total marks */}
                        <div className="space-y-1">
                          <p className="label">Total Marks</p>
                          <p className="text-white text-sm font-display font-semibold">{exam.totalMarks ?? '—'}</p>
                        </div>

                        {/* Pass mark */}
                        <div className="space-y-1">
                          <p className="label">Pass Mark</p>
                          <p className="text-white text-sm font-display font-semibold">
                            {exam.passMark ? `${exam.passMark}%` : '—'}
                          </p>
                        </div>

                        {/* Start time */}
                        <div className="space-y-1">
                          <p className="label">Start Time</p>
                          <p className="text-white text-sm font-display">
                            {exam.startTime ? new Date(exam.startTime).toLocaleString() : 'No restriction'}
                          </p>
                        </div>

                        {/* End time */}
                        <div className="space-y-1">
                          <p className="label">End Time</p>
                          <p className="text-white text-sm font-display">
                            {exam.endTime ? new Date(exam.endTime).toLocaleString() : 'No restriction'}
                          </p>
                        </div>

                        {/* Options row */}
                        <div className="col-span-2 md:col-span-3 lg:col-span-4 flex flex-wrap gap-2 pt-1">
                          {[
                            { label: 'Randomize Questions', active: exam.randomizeQuestions },
                            { label: 'Show Results Immediately', active: exam.showResultsImmediately },
                            { label: 'Allow Retake', active: exam.allowRetake },
                          ].map(({ label, active }) => (
                            <span key={label} className={`badge ${active ? 'badge-green' : 'bg-white/5 text-white/30'}`}>
                              {active ? '✓' : '✗'} {label}
                            </span>
                          ))}
                        </div>

                        {/* Instructions */}
                        {exam.instructions && (
                          <div className="col-span-2 md:col-span-3 lg:col-span-4 space-y-1">
                            <p className="label">Instructions</p>
                            <p className="text-white/50 text-xs leading-relaxed bg-surface-2 rounded-lg px-3 py-2">
                              {exam.instructions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent attempts */}
      {s.recentAttempts?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="font-display font-bold text-white">Recent Submissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Student', 'Exam', 'Score', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-display font-semibold text-white/30 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.recentAttempts.map((a) => (
                  <tr key={a._id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-5 py-3 text-white text-sm font-display font-semibold">{a.student?.fullName}</td>
                    <td className="px-5 py-3 text-white/50 text-sm">{a.exam?.title}</td>
                    <td className="px-5 py-3 text-white/70 text-sm font-mono">{Math.round(a.percentage ?? 0)}%</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${a.isPassed ? 'badge-green' : 'badge-red'}`}>
                        {a.isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-white/30 text-xs">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  )
}