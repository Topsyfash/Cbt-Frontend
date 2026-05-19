import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import { PageLoader, EmptyState, Modal } from '../../components/common/UI'
import { gradingService } from '../../services'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { CheckCircle, ClipboardList, ChevronRight, Star, MessageSquare, User, BookOpen } from 'lucide-react'

function GradeModal({ attempt, onClose, onSaved }) {
  const openAnswers = attempt.answers?.filter(a => a.question?.questionType === 'open_ended') || []
  const [scores, setScores] = useState(() => {
    const init = {}
    openAnswers.forEach(a => {
      init[a.question._id] = {
        teacherScore:    a.teacherScore ?? '',
        teacherFeedback: a.teacherFeedback ?? '',
      }
    })
    return init
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    // Validate all scores filled in
    for (const a of openAnswers) {
      const s = scores[a.question._id]
      if (s.teacherScore === '' || s.teacherScore === null || s.teacherScore === undefined) {
        toast.error(`Please enter a score for every question`); return
      }
      if (Number(s.teacherScore) > a.question.marks) {
        toast.error(`Score for Q cannot exceed ${a.question.marks} marks`); return
      }
    }
    setSaving(true)
    try {
      for (const a of openAnswers) {
        const s = scores[a.question._id]
        await api.patch(`/attempts/${attempt._id}/grade/${a.question._id}`, {
          teacherScore:    Number(s.teacherScore),
          teacherFeedback: s.teacherFeedback || null,
        })
      }
      toast.success('All answers graded!')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save grades')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      {/* Student info */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/5">
        <div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center text-brand-400 font-display font-bold">
          {attempt.student?.fullName?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-display font-bold text-white">{attempt.student?.fullName}</p>
          <p className="text-white/40 text-xs">{attempt.exam?.title}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-white/40 text-xs">MCQ Score</p>
          <p className="font-mono font-bold text-white">{attempt.mcqScore ?? attempt.score ?? 0} pts</p>
        </div>
      </div>

      {/* Each open-ended answer */}
      <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-1">
        {openAnswers.map((ans, i) => {
          const q = ans.question
          const s = scores[q._id] || {}
          return (
            <div key={q._id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display font-semibold text-white text-sm leading-relaxed">
                  <span className="text-white/30 mr-1">Q{i+1}.</span>{q.questionText}
                </p>
                <span className="badge badge-blue flex-shrink-0">{q.marks} mk</span>
              </div>

              {/* Sample answer for teacher reference */}
              {q.sampleAnswer && (
                <div className="px-3 py-2 rounded-lg bg-accent-purple/5 border border-accent-purple/15">
                  <p className="text-xs font-display font-semibold text-accent-purple/70 mb-1">Sample Answer (visible only to you)</p>
                  <p className="text-white/50 text-xs leading-relaxed">{q.sampleAnswer}</p>
                </div>
              )}

              {/* Student's answer */}
              <div className="px-3 py-3 rounded-lg bg-surface-2 border border-white/5">
                <p className="text-xs font-display font-semibold text-white/30 mb-1.5">Student's Answer</p>
                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                  {ans.openAnswer?.trim() || <span className="italic text-white/20">No answer provided</span>}
                </p>
              </div>

              {/* Grading controls */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="label">Score (max {q.marks})</label>
                  <input
                    type="number" min={0} max={q.marks} step={0.5}
                    className="input text-center font-mono font-bold"
                    placeholder="0"
                    value={s.teacherScore ?? ''}
                    onChange={(e) => setScores(prev => ({
                      ...prev,
                      [q._id]: { ...prev[q._id], teacherScore: e.target.value }
                    }))}
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">Feedback (optional)</label>
                  <input
                    className="input text-sm"
                    placeholder="Brief feedback to student..."
                    value={s.teacherFeedback || ''}
                    onChange={(e) => setScores(prev => ({
                      ...prev,
                      [q._id]: { ...prev[q._id], teacherFeedback: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 pt-2 border-t border-white/5">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
          {saving ? 'Saving...' : <><CheckCircle size={14} /> Save All Grades</>}
        </button>
      </div>
    </div>
  )
}

export default function GradeOpenEnded() {
  const navigate = useNavigate()
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(null) // attempt being graded

  const load = () => {
    gradingService.getPending()
      .then((res) => setAttempts(res.data?.data?.attempts || []))
      .catch(() => toast.error('Failed to load pending attempts'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  if (loading) return <Layout><PageLoader /></Layout>

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
            const openCount = attempt.answers?.filter(a =>
              a.question?.questionType === 'open_ended'
            ).length || '?'
            return (
              <button
                key={attempt._id}
                onClick={() => setGrading(attempt)}
                className="card-hover w-full flex items-center gap-5 p-5 text-left group"
              >
                {/* Student avatar */}
                <div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center text-brand-400 font-display font-bold flex-shrink-0">
                  {attempt.student?.fullName?.[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-white">{attempt.student?.fullName}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-white/40 text-xs flex items-center gap-1">
                      <BookOpen size={11} />{attempt.exam?.title}
                    </span>
                    <span className="text-white/40 text-xs flex items-center gap-1">
                      <ClipboardList size={11} />{attempt.exam?.subject?.name}
                    </span>
                    <span className="text-white/40 text-xs">
                      Submitted {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="badge badge-amber">
                    <MessageSquare size={11} /> {openCount} to grade
                  </span>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Grading modal */}
      <Modal
        open={!!grading}
        onClose={() => setGrading(null)}
        title="Grade Open-Ended Answers"
        size="xl"
      >
        {grading && (
          <GradeModal
            attempt={grading}
            onClose={() => setGrading(null)}
            onSaved={() => { setGrading(null); load() }}
          />
        )}
      </Modal>
    </Layout>
  )
}
