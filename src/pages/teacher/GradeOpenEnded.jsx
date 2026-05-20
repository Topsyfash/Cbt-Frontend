import { useState, useEffect } from 'react'
import Layout from '../../components/common/Layout'
import { PageLoader, EmptyState, Alert } from '../../components/common/UI'
import { gradingService } from '../../services'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  CheckCircle, ClipboardList, ChevronRight,
  MessageSquare, BookOpen, ArrowLeft, Save
} from 'lucide-react'

// ─── Grading screen — full page, not a modal ──────────────────────────────────
function GradingScreen({ attempt, onBack, onSaved }) {
  // Filter open-ended answers — question must be populated (object with _id)
  const openAnswers = (attempt.answers || []).filter(a => {
    const q = a.question
    // populated question object with questionType field
    if (q && typeof q === 'object' && q.questionType === 'open_ended') return true
    // fallback: no MCQ selected value and no options array means open-ended
    if (!a.selected && q && typeof q === 'object' && !q.options?.length) return true
    return false
  })

  const [scores, setScores] = useState(() => {
    const init = {}
    openAnswers.forEach(a => {
      const qId = a.question?._id || a.question
      init[qId] = {
        teacherScore:    a.teacherScore ?? '',
        teacherFeedback: a.teacherFeedback ?? '',
      }
    })
    return init
  })
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  // Save one question's grade immediately when teacher enters score
  const saveOne = async (qId, marks) => {
    const s = scores[qId]
    const score = Number(s.teacherScore)
    if (s.teacherScore === '' || isNaN(score)) return
    if (score > marks) { toast.error(`Score cannot exceed ${marks}`); return }

    try {
      await api.patch(`/attempts/${attempt._id}/grade/${qId}`, {
        teacherScore:    score,
        teacherFeedback: s.teacherFeedback || null,
      })
      setSavedCount(n => n + 1)
      toast.success('Score saved')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save score')
    }
  }

  // Save all at once
  const handleSaveAll = async () => {
    for (const a of openAnswers) {
      const qId = a.question?._id || a.question
      const s   = scores[qId]
      if (s.teacherScore === '' || s.teacherScore === null || s.teacherScore === undefined) {
        toast.error('Please enter a score for every question'); return
      }
      if (Number(s.teacherScore) > a.question.marks) {
        toast.error(`Score cannot exceed ${a.question.marks} marks`); return
      }
    }

    setSaving(true)
    let allOk = true
    for (const a of openAnswers) {
      const qId = a.question?._id || a.question
      const s   = scores[qId]
      try {
        await api.patch(`/attempts/${attempt._id}/grade/${qId}`, {
          teacherScore:    Number(s.teacherScore),
          teacherFeedback: s.teacherFeedback || null,
        })
      } catch (err) {
        toast.error(`Failed: ${err.response?.data?.message || 'error'}`)
        allOk = false
        break
      }
    }
    setSaving(false)
    if (allOk) {
      toast.success('All answers graded and scores saved!')
      onSaved()
    }
  }

  const setScore    = (qId, val)      => setScores(p => ({ ...p, [qId]: { ...p[qId], teacherScore: val } }))
  const setFeedback = (qId, val)      => setScores(p => ({ ...p, [qId]: { ...p[qId], teacherFeedback: val } }))

  if (openAnswers.length === 0) return (
    <div className="space-y-4">
      <Alert type="warning">
        No open-ended answers found in this submission. The attempt may not have been populated correctly.
        Try refreshing the page.
      </Alert>
      <button onClick={onBack} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
    </div>
  )

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="btn-secondary">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex-1">
          <h2 className="font-display font-bold text-white text-xl">
            Grading: {attempt.student?.fullName}
          </h2>
          <p className="text-white/40 text-sm">{attempt.exam?.title}</p>
        </div>
        <div className="text-right">
          <p className="text-white/30 text-xs">MCQ Score</p>
          <p className="font-mono font-bold text-white text-lg">{attempt.mcqScore ?? 0} pts</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card p-4 mb-6 flex items-center gap-4">
        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${openAnswers.length > 0 ? (savedCount / openAnswers.length) * 100 : 0}%` }} />
        </div>
        <span className="text-white/40 text-sm font-mono flex-shrink-0">
          {savedCount}/{openAnswers.length} saved
        </span>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {openAnswers.map((ans, i) => {
          const q   = ans.question
          const qId = q?._id || q
          const s   = scores[qId] || {}
          const isAlreadyGraded = ans.isGraded

          return (
            <div key={qId} className="card p-6 space-y-4">
              {/* Question header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="w-7 h-7 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center text-sm font-mono font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="font-display font-semibold text-white text-sm leading-relaxed">
                    {q?.questionText}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isAlreadyGraded && (
                    <span className="badge badge-green text-xs">
                      <CheckCircle size={10} /> Graded
                    </span>
                  )}
                  <span className="badge badge-blue">{q?.marks} mk</span>
                </div>
              </div>

              {/* Sample answer — teacher only */}
              {q?.sampleAnswer && (
                <div className="px-4 py-3 rounded-xl bg-accent-purple/5 border border-accent-purple/15">
                  <p className="text-xs font-display font-semibold text-accent-purple/70 mb-1.5 uppercase tracking-wider">
                    Sample / Model Answer
                  </p>
                  <p className="text-white/60 text-sm leading-relaxed">{q.sampleAnswer}</p>
                </div>
              )}

              {/* Student's answer */}
              <div className="px-4 py-3 rounded-xl bg-surface-2 border border-white/5">
                <p className="text-xs font-display font-semibold text-white/30 mb-2 uppercase tracking-wider">
                  Student's Answer
                </p>
                {ans.openAnswer?.trim() ? (
                  <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                    {ans.openAnswer.trim()}
                  </p>
                ) : (
                  <p className="text-white/20 text-sm italic">No answer provided</p>
                )}
              </div>

              {/* Score + feedback inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label">Score (0 – {q?.marks})</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      max={q?.marks}
                      step={0.5}
                      className="input text-center font-mono font-bold text-lg"
                      placeholder="—"
                      value={s.teacherScore ?? ''}
                      onChange={(e) => setScore(qId, e.target.value)}
                    />
                    <button
                      onClick={() => saveOne(qId, q?.marks)}
                      disabled={s.teacherScore === '' || s.teacherScore === null}
                      className="btn-success px-3 disabled:opacity-30"
                      title="Save this score"
                    >
                      <Save size={15} />
                    </button>
                  </div>
                  {/* Quick score buttons */}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {[0, q?.marks * 0.25, q?.marks * 0.5, q?.marks * 0.75, q?.marks]
                      .filter(v => v !== undefined)
                      .map(v => {
                        const rounded = Math.round(v * 2) / 2
                        return (
                          <button key={rounded}
                            onClick={() => setScore(qId, String(rounded))}
                            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors
                              ${Number(s.teacherScore) === rounded
                                ? 'bg-brand-600 text-white'
                                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}>
                            {rounded}
                          </button>
                        )
                      })}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Feedback to student (optional)</label>
                  <textarea
                    className="input resize-none text-sm"
                    rows={3}
                    placeholder="Write feedback that the student will see on their result page..."
                    value={s.teacherFeedback || ''}
                    onChange={(e) => setFeedback(qId, e.target.value)}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Save all button */}
      <div className="mt-8 flex gap-3">
        <button onClick={onBack} className="btn-secondary">Cancel</button>
        <button onClick={handleSaveAll} disabled={saving} className="btn-primary flex-1 py-3">
          {saving
            ? <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            : <><CheckCircle size={16} /> Save All Grades</>
          }
        </button>
      </div>
    </div>
  )
}

// ─── Main page — list of pending attempts ─────────────────────────────────────
export default function GradeOpenEnded() {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null) // attempt currently being graded

  const load = () => {
    setLoading(true)
    gradingService.getPending()
      .then((res) => setAttempts(res.data?.data?.attempts || []))
      .catch(() => toast.error('Failed to load pending attempts'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  if (loading) return <Layout><PageLoader /></Layout>

  // If teacher clicked an attempt, show the full grading screen
  if (active) return (
    <Layout>
      <GradingScreen
        attempt={active}
        onBack={() => setActive(null)}
        onSaved={() => { setActive(null); load() }}
      />
    </Layout>
  )

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Grade Open-Ended Answers</h1>
        <p className="page-subtitle">
          {attempts.length} submission{attempts.length !== 1 ? 's' : ''} awaiting your review
        </p>
      </div>

      {attempts.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="All caught up!"
          description="No open-ended answers are waiting to be graded."
        />
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt) => {
            const openAnswers = (attempt.answers || []).filter(a =>
              a.question && typeof a.question === 'object' &&
              a.question.questionType === 'open_ended'
            )
            const ungradedCount = openAnswers.filter(a => !a.isGraded).length
            const totalOpen     = openAnswers.length

            return (
              <button
                key={attempt._id}
                onClick={() => setActive(attempt)}
                className="card-hover w-full flex items-center gap-5 p-5 text-left group"
              >
                {/* Student avatar */}
                <div className="w-11 h-11 rounded-full bg-brand-600/20 flex items-center justify-center text-brand-400 font-display font-bold text-lg flex-shrink-0">
                  {attempt.student?.fullName?.[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-white">
                    {attempt.student?.fullName}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-white/40 text-xs flex items-center gap-1">
                      <BookOpen size={11} />{attempt.exam?.title}
                    </span>
                    <span className="text-white/40 text-xs flex items-center gap-1">
                      <ClipboardList size={11} />{attempt.exam?.subject?.name}
                    </span>
                    <span className="text-white/30 text-xs">
                      Submitted {attempt.submittedAt
                        ? new Date(attempt.submittedAt).toLocaleString() : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-white/30 text-xs">MCQ score</p>
                    <p className="font-mono font-bold text-white">{attempt.mcqScore ?? 0} pts</p>
                  </div>
                  <span className={`badge ${ungradedCount > 0 ? 'badge-amber' : 'badge-green'}`}>
                    <MessageSquare size={11} />
                    {ungradedCount > 0
                      ? `${ungradedCount} of ${totalOpen} to grade`
                      : 'All graded'}
                  </span>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </Layout>
  )
}