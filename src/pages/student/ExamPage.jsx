import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { attemptService } from '../../services'
import toast from 'react-hot-toast'
import { Clock, ChevronLeft, ChevronRight, Send, Shield, FileText, AlignLeft } from 'lucide-react'
import { Spinner } from '../../components/common/UI'

const BACKEND_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')

function useTimer(totalSeconds, onExpire) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const ref = useRef(null)
  useEffect(() => {
    if (!totalSeconds) return
    setRemaining(totalSeconds)
    ref.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(ref.current); onExpire(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(ref.current)
  }, [totalSeconds])
  const fmt = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }
  return { remaining, formatted: fmt(remaining) }
}

// ─── Section transition screen ────────────────────────────────────────────────
function SectionTransition({ mcqCount, openCount, onContinue }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center animate-slide-up">
        <div className="w-16 h-16 rounded-2xl bg-accent-green/10 flex items-center justify-center mx-auto mb-6">
          <FileText size={28} className="text-accent-green" />
        </div>
        <h2 className="font-display font-bold text-white text-2xl mb-2">Section 1 Complete</h2>
        <p className="text-white/50 text-sm mb-6">
          You have finished the {mcqCount} multiple-choice question{mcqCount !== 1 ? 's' : ''}.
          Next is Section 2 — {openCount} open-ended question{openCount !== 1 ? 's' : ''} that require written answers.
        </p>
        <div className="card p-4 mb-6 text-left space-y-2">
          <p className="text-white/40 text-xs font-display font-semibold uppercase tracking-widest">Section 2 Tips</p>
          <p className="text-white/60 text-sm">• Write clearly and in full sentences</p>
          <p className="text-white/60 text-sm">• Your answers will be reviewed and scored by your teacher</p>
          <p className="text-white/60 text-sm">• The timer is still running</p>
        </div>
        <button onClick={onContinue} className="btn-primary w-full py-3">
          Continue to Section 2 →
        </button>
      </div>
    </div>
  )
}

export default function ExamPage() {
  const { examId } = useParams()
  const navigate = useNavigate()

  const [pageState, setPageState] = useState('loading') // loading | active | section_transition | submitting
  const [examInfo, setExamInfo] = useState(null)
  const [mcqQuestions, setMcqQuestions] = useState([])
  const [openQuestions, setOpenQuestions] = useState([])
  const [section, setSection] = useState(1) // 1 = MCQ, 2 = open-ended
  const [currentMcq, setCurrentMcq] = useState(0)
  const [currentOpen, setCurrentOpen] = useState(0)
  const [mcqAnswers, setMcqAnswers] = useState({})       // { questionId: 'A' }
  const [openAnswers, setOpenAnswers] = useState({})      // { questionId: 'text...' }
  const [violations, setViolations] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(0)

  const attemptIdRef   = useRef(null)
  const violationsRef  = useRef(0)
  const submittingRef  = useRef(false)
  const startCalledRef = useRef(false)
  const saveTimeouts   = useRef({}) // debounce open-ended saves

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (startCalledRef.current) return
    startCalledRef.current = true

    const load = async () => {
      try {
        const res = await attemptService.start(examId)
        const d = res.data?.data
        if (!d?.attempt) throw new Error('Invalid response')

        attemptIdRef.current = d.attempt._id

        // Separate questions by type
        const allQ = d.questions || []
        const mcq  = allQ.filter(q => q.questionType !== 'open_ended')
        const open = allQ.filter(q => q.questionType === 'open_ended')
        setMcqQuestions(mcq)
        setOpenQuestions(open)

        // Restore saved answers
        const savedMcq = {}, savedOpen = {}
        d.attempt.answers?.forEach(({ question, selected, openAnswer }) => {
          const id = question?._id || question
          if (selected)    savedMcq[id]  = selected
          if (openAnswer)  savedOpen[id] = openAnswer
        })
        setMcqAnswers(savedMcq)
        setOpenAnswers(savedOpen)
        setTimerSeconds(d.remaining || (d.exam?.duration ?? 60) * 60)
        setExamInfo(d.exam)
        setPageState('active')
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load exam')
        navigate('/student')
      }
    }
    load()
  }, [examId])

  // ── Anti-cheat ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (pageState !== 'active') return
    document.documentElement.requestFullscreen?.().catch(() => {})
    const handler = () => { if (!document.fullscreenElement) logViolation('fullscreen_exit', 'Exited fullscreen') }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [pageState])

  useEffect(() => {
    if (pageState !== 'active') return
    const onVis  = () => { if (document.hidden) logViolation('tab_switch', 'Tab switched') }
    const onBlur = () => logViolation('window_blur', 'Window lost focus')
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', onBlur)
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('blur', onBlur) }
  }, [pageState])

  useEffect(() => {
    if (pageState !== 'active') return
    const noCtx  = (e) => { e.preventDefault(); logViolation('right_click', 'Right-click attempted') }
    const noCopy = (e) => { e.preventDefault(); logViolation('copy_attempt', 'Copy attempted') }
    document.addEventListener('contextmenu', noCtx)
    document.addEventListener('copy', noCopy)
    return () => { document.removeEventListener('contextmenu', noCtx); document.removeEventListener('copy', noCopy) }
  }, [pageState])

  const logViolation = useCallback(async (type, details) => {
    if (submittingRef.current) return
    violationsRef.current += 1
    setViolations(violationsRef.current)
    const id = attemptIdRef.current
    if (id) { try { await attemptService.logViolation(id, type, details) } catch {} }
    if (violationsRef.current >= 3) {
      toast.error('3 violations — auto-submitting!')
      submitExam(true)
    } else {
      toast.error(`⚠️ Violation ${violationsRef.current}/3: ${type.replace(/_/g, ' ')}`, { duration: 4000 })
    }
  }, [])

  // ── MCQ answer save ───────────────────────────────────────────────────────
  const saveMcqAnswer = useCallback(async (questionId, selected) => {
    setMcqAnswers(prev => ({ ...prev, [questionId]: selected }))
    const id = attemptIdRef.current
    if (!id) return
    try { await attemptService.saveAnswer(id, questionId, selected) } catch {}
  }, [])

  // ── Open-ended answer save (debounced 800ms) ──────────────────────────────
  const saveOpenAnswer = useCallback((questionId, text) => {
    setOpenAnswers(prev => ({ ...prev, [questionId]: text }))
    if (saveTimeouts.current[questionId]) clearTimeout(saveTimeouts.current[questionId])
    saveTimeouts.current[questionId] = setTimeout(async () => {
      const id = attemptIdRef.current
      if (!id) return
      try { await attemptService.saveOpenAnswer(id, questionId, text) } catch {}
    }, 800)
  }, [])

  // ── Section navigation ────────────────────────────────────────────────────
  const finishMcqSection = () => {
    if (openQuestions.length === 0) {
      // No open-ended — go straight to submit confirm
      if (window.confirm(`Submit exam? ${Object.keys(mcqAnswers).length}/${mcqQuestions.length} MCQs answered.`)) {
        submitExam(false)
      }
    } else {
      setPageState('section_transition')
    }
  }

  const startSection2 = () => {
    setSection(2)
    setPageState('active')
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const submitExam = useCallback(async (auto = false) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setPageState('submitting')
    document.exitFullscreen?.().catch(() => {})
    // Flush any pending open-answer saves
    Object.values(saveTimeouts.current).forEach(t => clearTimeout(t))
    try {
      const id = attemptIdRef.current
      const res = await attemptService.submit(id, auto)
      const result = res.data?.data
      toast.success('Exam submitted!')
      navigate(`/student/results/${id}`, { state: { result } })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
      submittingRef.current = false
      setPageState('active')
    }
  }, [navigate])

  const handleTimerExpire = useCallback(() => {
    toast('Time is up! Auto-submitting...', { icon: '⏰' })
    submitExam(true)
  }, [submitExam])

  const { formatted: timerDisplay, remaining } = useTimer(
    pageState === 'active' ? timerSeconds : 0,
    handleTimerExpire
  )
  const timerWarning = remaining > 0 && remaining <= 300

  // ── Screens ───────────────────────────────────────────────────────────────
  if (pageState === 'loading') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-white/40 font-display text-sm">Loading examination...</p>
      </div>
    </div>
  )

  if (pageState === 'section_transition') return (
    <SectionTransition
      mcqCount={mcqQuestions.length}
      openCount={openQuestions.length}
      onContinue={startSection2}
    />
  )

  if (pageState === 'submitting') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-white font-display font-bold text-xl">Submitting your answers...</p>
        <p className="text-white/40 text-sm">Do not close this page.</p>
      </div>
    </div>
  )

  // ── Active exam ───────────────────────────────────────────────────────────
  const isMcqSection  = section === 1
  const questions     = isMcqSection ? mcqQuestions : openQuestions
  const current       = isMcqSection ? currentMcq : currentOpen
  const setCurrent    = isMcqSection ? setCurrentMcq : setCurrentOpen
  const q             = questions[current]
  const answers       = isMcqSection ? mcqAnswers : openAnswers
  const mcqAnswered   = Object.keys(mcqAnswers).length
  const openAnswered  = Object.keys(openAnswers).filter(id => openAnswers[id]?.trim()).length
  const totalAnswered = mcqAnswered + openAnswered
  const totalQ        = mcqQuestions.length + openQuestions.length

  return (
    <div className="min-h-screen bg-surface flex flex-col select-none" style={{ userSelect: section === 1 ? 'none' : 'text' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-surface-1 border-b border-white/5 shadow-xl">
        <div>
          <p className="font-display font-bold text-white text-sm">{examInfo?.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-display font-semibold
              ${isMcqSection ? 'bg-brand-500/20 text-brand-400' : 'bg-accent-purple/20 text-accent-purple'}`}>
              {isMcqSection ? 'Section 1 · MCQ' : 'Section 2 · Open-Ended'}
            </span>
            <span className="text-white/30 text-xs">{totalAnswered}/{totalQ} answered</span>
          </div>
        </div>

        <div className="hidden md:flex flex-1 mx-8 items-center gap-3">
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all duration-300"
              style={{ width: `${totalQ > 0 ? (totalAnswered / totalQ) * 100 : 0}%` }} />
          </div>
          <span className="text-white/30 text-xs font-mono">{Math.round(totalQ > 0 ? (totalAnswered / totalQ) * 100 : 0)}%</span>
        </div>

        <div className="flex items-center gap-3">
          {violations > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-red/10 border border-accent-red/20">
              <Shield size={13} className="text-accent-red" />
              <span className="text-accent-red text-xs font-mono font-bold">{violations}/3</span>
            </div>
          )}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-lg
            ${timerWarning ? 'bg-accent-red/10 border-accent-red/30 text-accent-red animate-pulse' : 'bg-surface-2 border-white/10 text-white'}`}>
            <Clock size={15} />{timerDisplay}
          </div>
          <button onClick={() => {
            const msg = openQuestions.length > 0 && section < 2
              ? `Submit early? You haven't started Section 2 (open-ended) yet.`
              : `Submit exam? ${totalAnswered}/${totalQ} answered.`
            if (window.confirm(msg)) submitExam(false)
          }} className="btn-primary">
            <Send size={14} /> Submit
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Navigator sidebar */}
        <aside className="hidden lg:block w-56 bg-surface-1 border-r border-white/5 p-4 overflow-y-auto">
          {mcqQuestions.length > 0 && (
            <div className="mb-4">
              <p className="label mb-2 flex items-center gap-1.5">
                <FileText size={11} /> Section 1 · MCQ
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {mcqQuestions.map((q, i) => (
                  <button key={q._id} onClick={() => { setSection(1); setCurrentMcq(i); setPageState('active') }}
                    className={`w-full aspect-square rounded-lg text-xs font-mono font-bold transition-all
                      ${section === 1 && i === currentMcq ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                        : mcqAnswers[q._id] ? 'bg-accent-green/15 text-accent-green border border-accent-green/20'
                        : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
          {openQuestions.length > 0 && (
            <div>
              <p className="label mb-2 flex items-center gap-1.5">
                <AlignLeft size={11} /> Section 2 · Open
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {openQuestions.map((q, i) => (
                  <button key={q._id} onClick={() => { setSection(2); setCurrentOpen(i); setPageState('active') }}
                    className={`w-full aspect-square rounded-lg text-xs font-mono font-bold transition-all
                      ${section === 2 && i === currentOpen ? 'bg-accent-purple text-white'
                        : openAnswers[q._id]?.trim() ? 'bg-accent-green/15 text-accent-green border border-accent-green/20'
                        : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>
                    {mcqQuestions.length + i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Question body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {q && (
            <div className="max-w-2xl mx-auto animate-fade-in" key={q._id}>
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mono text-white/20 text-sm">
                  Q{(isMcqSection ? 0 : mcqQuestions.length) + current + 1}/{totalQ}
                </span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs font-display font-semibold text-white/30">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
              </div>

              <p className="font-display text-white text-lg leading-relaxed mb-6">{q.questionText}</p>

              {/* Question image */}
              {q.image && (
                <div className="mb-6 rounded-xl overflow-hidden bg-surface-2 border border-white/5">
                  <img
                    src={q.image.startsWith('http') ? q.image : `${BACKEND_BASE}${q.image}`}
                    alt="Question diagram"
                    className="w-full max-h-72 object-contain p-2"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
              )}

              {/* ── MCQ options ─────────────────────────────────────────────── */}
              {q.questionType !== 'open_ended' && (
                <div className="space-y-3">
                  {q.options?.map((opt) => {
                    const selected = mcqAnswers[q._id] === opt.label
                    return (
                      <button key={opt.label} onClick={() => saveMcqAnswer(q._id, opt.label)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150
                          ${selected
                            ? 'bg-brand-600/15 border-brand-500/40 text-white'
                            : 'bg-surface-2 border-white/5 text-white/70 hover:border-white/15 hover:text-white'}`}>
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono font-bold flex-shrink-0
                          ${selected ? 'bg-brand-600 text-white' : 'bg-white/5 text-white/40'}`}>
                          {opt.label}
                        </span>
                        <span className="font-body text-sm">{opt.text}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* ── Open-ended text area ────────────────────────────────────── */}
              {q.questionType === 'open_ended' && (
                <div>
                  {q.wordLimit && (
                    <p className="text-white/30 text-xs mb-2">
                      Word limit: {q.wordLimit} words
                      {openAnswers[q._id] && (
                        <span className="ml-2 text-white/50">
                          ({openAnswers[q._id].trim().split(/\s+/).filter(Boolean).length} used)
                        </span>
                      )}
                    </p>
                  )}
                  <textarea
                    className="input resize-none text-sm leading-relaxed"
                    rows={8}
                    placeholder="Type your answer here..."
                    value={openAnswers[q._id] || ''}
                    onChange={(e) => saveOpenAnswer(q._id, e.target.value)}
                    style={{ userSelect: 'text' }}
                  />
                  <p className="text-white/20 text-xs mt-1.5">Your answer is saved automatically as you type</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
                <button
                  onClick={() => {
                    if (isMcqSection) {
                      if (current === 0 && section === 2) { setSection(1); setCurrentMcq(mcqQuestions.length - 1) }
                      else setCurrent(p => Math.max(0, p - 1))
                    } else {
                      if (currentOpen === 0) { setSection(1); setCurrentMcq(mcqQuestions.length - 1); setPageState('active') }
                      else setCurrentOpen(p => p - 1)
                    }
                  }}
                  disabled={isMcqSection && current === 0 && section === 1}
                  className="btn-secondary disabled:opacity-30">
                  <ChevronLeft size={16} /> Previous
                </button>

                {/* Next / advance section / submit */}
                {isMcqSection && current < mcqQuestions.length - 1 && (
                  <button onClick={() => setCurrentMcq(p => p + 1)} className="btn-primary">
                    Next <ChevronRight size={16} />
                  </button>
                )}
                {isMcqSection && current === mcqQuestions.length - 1 && (
                  <button onClick={finishMcqSection}
                    className={openQuestions.length > 0 ? 'btn-primary' : 'btn-success'}>
                    {openQuestions.length > 0
                      ? <>Next Section <ChevronRight size={16} /></>
                      : <><Send size={14} /> Submit Exam</>}
                  </button>
                )}
                {!isMcqSection && current < openQuestions.length - 1 && (
                  <button onClick={() => setCurrentOpen(p => p + 1)} className="btn-primary">
                    Next <ChevronRight size={16} />
                  </button>
                )}
                {!isMcqSection && current === openQuestions.length - 1 && (
                  <button onClick={() => { if (window.confirm(`Submit exam? ${totalAnswered}/${totalQ} answered.`)) submitExam(false) }}
                    className="btn-success">
                    <Send size={14} /> Submit Exam
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}