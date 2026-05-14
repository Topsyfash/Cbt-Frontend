import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import { PageLoader, EmptyState, ScoreRing } from '../../components/common/UI'
import { attemptService } from '../../services'
import { Award, ChevronRight, Clock } from 'lucide-react'

export default function StudentResults() {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // GET /attempts/my → { data: { attempts } }
    attemptService.myAttempts()
      .then((res) => setAttempts(res.data?.data?.attempts || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><PageLoader /></Layout>

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">My Results</h1>
        <p className="page-subtitle">History of all your exam attempts</p>
      </div>

      {attempts.length === 0 ? (
        <EmptyState icon={Award} title="No results yet" description="Take an exam to see your results here." />
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt) => (
            <Link key={attempt._id} to={`/student/results/${attempt._id}`}
              className="card-hover flex items-center gap-6 p-5 group">
              {/* Backend uses isPassed, not passed */}
              <ScoreRing percent={attempt.percentage || 0} size={70} passed={attempt.isPassed} />
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-white">{attempt.exam?.title}</p>
                <p className="text-white/40 text-sm">{attempt.exam?.subject?.name}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`badge ${attempt.isPassed ? 'badge-green' : 'badge-red'}`}>
                    {attempt.isPassed ? 'Passed' : 'Failed'}
                  </span>
                  <span className="text-white/30 text-xs flex items-center gap-1">
                    <Clock size={11} />
                    {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-display font-bold text-white text-lg">{attempt.score}/{attempt.exam?.totalMarks ?? '—'}</p>
                <p className="text-white/30 text-xs">Score</p>
              </div>
              <ChevronRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </Layout>
  )
}
