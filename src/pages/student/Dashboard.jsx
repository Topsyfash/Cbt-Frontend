import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/common/Layout'
import { StatCard, PageLoader, EmptyState } from '../../components/common/UI'
import { examService, analyticsService } from '../../services'
import { BookOpen, Clock, Award, TrendingUp, Play, Calendar, AlertCircle } from 'lucide-react'

function ExamCard({ exam, onStart }) {
  const now = new Date()
  const start = exam.startTime ? new Date(exam.startTime) : null
  const end = exam.endTime ? new Date(exam.endTime) : null
  const isExpired  = end && now > end
  const isUpcoming = start && now < start
  const isActive   = !isExpired && !isUpcoming

  const statusConfig = {
    active:   { label: 'Available', cls: 'badge-green' },
    upcoming: { label: 'Upcoming',  cls: 'badge-amber' },
    expired:  { label: 'Closed',    cls: 'badge-red'   },
  }
  const status = isExpired ? 'expired' : isUpcoming ? 'upcoming' : 'active'
  const { label, cls } = statusConfig[status]

  const alreadyAttempted = exam.attempt && exam.attempt.status !== 'in_progress'

  return (
    <div className="card-hover p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-white text-base leading-tight">{exam.title}</h3>
          <p className="text-white/40 text-sm mt-1">{exam.subject?.name}</p>
        </div>
        <span className={cls}>{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-white/40 text-xs">
          <Clock size={13} /><span>{exam.duration} min</span>
        </div>
        <div className="flex items-center gap-2 text-white/40 text-xs">
          <BookOpen size={13} /><span>{exam.class?.name || '—'}</span>
        </div>
        {exam.startTime && (
          <div className="flex items-center gap-2 text-white/40 text-xs col-span-2">
            <Calendar size={13} /><span>{new Date(exam.startTime).toLocaleString()}</span>
          </div>
        )}
      </div>
      {exam.instructions && (
        <p className="text-white/30 text-xs border-t border-white/5 pt-3 line-clamp-2">{exam.instructions}</p>
      )}
      {alreadyAttempted ? (
        <div className="btn-secondary w-full justify-center opacity-60 cursor-default">
          Already submitted — {Math.round(exam.attempt.percentage ?? 0)}%
        </div>
      ) : (
        <button onClick={() => onStart(exam)} disabled={!isActive}
          className="btn-primary w-full mt-auto disabled:opacity-40">
          {isExpired ? 'Closed' : isUpcoming ? 'Not Yet Open' : <><Play size={14} /> Start Exam</>}
        </button>
      )}
    </div>
  )
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      examService.getForStudent().catch(() => ({ data: { data: { exams: [] } } })),
      analyticsService.student().catch(() => ({ data: { data: {} } })),
    ]).then(([examRes, analyticsRes]) => {
      // GET /exams/student → { data: { exams: [...] } }
      setExams(examRes.data?.data?.exams || [])
      // GET /analytics/student → { data: { totalAttempts, passed, passRate, avgScore, highest, ... } }
      setAnalytics(analyticsRes.data?.data || {})
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><PageLoader /></Layout>

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.fullName?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here are your available examinations</p>
      </div>

      {!user?.isApproved && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-amber/10 border border-accent-amber/20 mb-6">
          <AlertCircle size={18} className="text-accent-amber flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-accent-amber font-display font-semibold text-sm">Account Pending Approval</p>
            <p className="text-accent-amber/70 text-xs mt-0.5">Your account is awaiting admin approval.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Available Exams" value={exams.length}                           icon={BookOpen}   color="brand"  />
        <StatCard label="Exams Taken"     value={analytics.totalAttempts ?? 0}            icon={Award}      color="green"  />
        <StatCard label="Avg Score"       value={analytics.avgScore ? `${analytics.avgScore}%` : '—'} icon={TrendingUp} color="purple" />
        <StatCard label="Pass Rate"       value={analytics.passRate ? `${analytics.passRate}%` : '—'} icon={Award}  color="amber"  />
      </div>

      <div>
        <h2 className="font-display font-bold text-white text-lg mb-4">Available Examinations</h2>
        {exams.length === 0 ? (
          <EmptyState icon={BookOpen} title="No exams available"
            description="Check back later — your teacher will publish exams here." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <ExamCard key={exam._id} exam={exam} onStart={(e) => navigate(`/student/exam/${e._id}`)} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
