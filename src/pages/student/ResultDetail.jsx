import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import { PageLoader, ScoreRing, Alert } from '../../components/common/UI'
import { attemptService } from '../../services'
import { CheckCircle, XCircle, ArrowLeft, Trophy } from 'lucide-react'

export default function ResultDetail() {
  const { attemptId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // location.state?.result comes from submit: { data: { attempt, detail? } }
  const [attempt, setAttempt] = useState(location.state?.result?.attempt || null)
  const [loading, setLoading] = useState(!attempt)

  useEffect(() => {
    if (!attempt) {
      // GET /attempts/:id → { data: { attempt } }
      attemptService.getOne(attemptId)
        .then((res) => {
          const a = res.data?.data?.attempt
          if (!a) throw new Error('Not found')
          setAttempt(a)
        })
        .catch(() => navigate('/student/results'))
        .finally(() => setLoading(false))
    }
  }, [attemptId])

  if (loading) return <Layout><PageLoader /></Layout>
  if (!attempt) return <Layout><Alert type="error">Result not found</Alert></Layout>

  // answers.question is populated with { questionText, options, correctAnswer, explanation, marks }
  const answeredQuestions = attempt.answers || []

  return (
    <Layout>
      <button onClick={() => navigate('/student/results')} className="btn-secondary mb-6">
        <ArrowLeft size={16} /> Back to Results
      </button>

      {/* Summary */}
      <div className="card p-8 mb-8 flex flex-col md:flex-row items-center gap-8">
        <ScoreRing percent={attempt.percentage || 0} size={130} passed={attempt.isPassed} />
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
            <Trophy size={18} className={attempt.isPassed ? 'text-accent-green' : 'text-accent-red'} />
            <span className={`badge ${attempt.isPassed ? 'badge-green' : 'badge-red'} text-sm`}>
              {attempt.isPassed ? 'Passed' : 'Failed'}
            </span>
          </div>
          <h1 className="font-display font-bold text-white text-2xl mb-1">{attempt.exam?.title}</h1>
          <p className="text-white/40 text-sm mb-4">{attempt.exam?.subject?.name}</p>
          <div className="grid grid-cols-3 gap-6">
            <div><p className="text-2xl font-display font-bold text-white">{attempt.score}</p><p className="text-white/30 text-xs">Score</p></div>
            <div><p className="text-2xl font-display font-bold text-white">{attempt.exam?.totalMarks ?? '—'}</p><p className="text-white/30 text-xs">Total</p></div>
            <div><p className="text-2xl font-display font-bold text-white">{Math.round(attempt.percentage ?? 0)}%</p><p className="text-white/30 text-xs">Percentage</p></div>
          </div>
        </div>
      </div>

      {/* Per-question review — only available when answers.question is populated */}
      {answeredQuestions.some(a => a.question?.questionText) && (
        <div>
          <h2 className="font-display font-bold text-white text-lg mb-4">Question Review</h2>
          <div className="space-y-4">
            {answeredQuestions.map((ans, i) => {
              const q = ans.question
              if (!q?.questionText) return null
              const correct = ans.isCorrect
              return (
                <div key={i} className={`card p-6 border ${correct ? 'border-accent-green/15' : 'border-accent-red/15'}`}>
                  <div className="flex items-start gap-3 mb-4">
                    {correct
                      ? <CheckCircle size={18} className="text-accent-green flex-shrink-0 mt-0.5" />
                      : <XCircle   size={18} className="text-accent-red   flex-shrink-0 mt-0.5" />
                    }
                    <p className="font-display text-white text-sm leading-relaxed">
                      <span className="text-white/30 mr-2">Q{i+1}.</span>{q.questionText}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-7">
                    {q.options?.map((opt) => {
                      let cls = 'bg-surface-2 border-white/5 text-white/50'
                      if (opt.label === q.correctAnswer)                     cls = 'bg-accent-green/10 border-accent-green/30 text-accent-green'
                      else if (opt.label === ans.selected && !correct)        cls = 'bg-accent-red/10 border-accent-red/30 text-accent-red'
                      return (
                        <div key={opt.label} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-xs ${cls}`}>
                          <span className="font-mono font-bold w-5">{opt.label}</span>
                          <span>{opt.text}</span>
                          {opt.label === q.correctAnswer && <CheckCircle size={12} className="ml-auto" />}
                        </div>
                      )
                    })}
                  </div>
                  {q.explanation && (
                    <p className="mt-3 pl-7 text-xs text-white/30 italic border-t border-white/5 pt-3">💡 {q.explanation}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Layout>
  )
}
