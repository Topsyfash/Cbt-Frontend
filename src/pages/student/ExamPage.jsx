import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { attemptService } from '../../services'
import toast from 'react-hot-toast'
import { Clock, ChevronLeft, ChevronRight, Send, Shield } from 'lucide-react'
import { Spinner } from '../../components/common/UI'

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

export default function ExamPage() {
  const { examId } = useParams()
  const navigate = useNavigate()

  const [pageState, setPageState] = useState('loading')
  const [examInfo, setExamInfo] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const [violations, setViolations] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(0)

  const attemptIdRef   = useRef(null)
  const violationsRef  = useRef(0)
  const submittingRef  = useRef(false)
  const startCalledRef = useRef(false)  // prevents React StrictMode double-invoke

  useEffect(() => {
    if (startCalledRef.current) return
    startCalledRef.current = true

    const load = async () => {
      try {
        const res = await attemptService.start(examId)
        const d = res.data?.data
        if (!d?.attempt) throw new Error('Invalid response from server')

        attemptIdRef.current = d.attempt._id

        const savedAnswers = {}
        d.attempt.answers?.forEach(({ question, selected }) => {
          if (selected) savedAnswers[question?._id || question] = selected
        })

        setExamInfo(d.exam)
        setQuestions(d.questions || [])
        setAnswers(savedAnswers)
        setTimerSeconds(d.remaining || (d.exam?.duration ?? 60) * 60)
        setPageState('active')
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load exam')
        navigate('/student')
      }
    }
    load()
  }, [examId])

  // Anti-cheat: fullscreen
  useEffect(() => {
    if (pageState !== 'active') return
    document.documentElement.requestFullscreen?.().catch(() => {})
    const handler = () => {
      if (!document.fullscreenElement) logViolation('fullscreen_exit', 'Exited fullscreen')
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [pageState])

  // Anti-cheat: tab / window blur
  useEffect(() => {
    if (pageState !== 'active') return
    const onVisibility = () => { if (document.hidden) logViolation('tab_switch', 'Tab switched') }
    const onBlur = () => logViolation('window_blur', 'Window lost focus')
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
    }
  }, [pageState])

  // Anti-cheat: right-click / copy
  useEffect(() => {
    if (pageState !== 'active') return
    const noCtx  = (e) => { e.preventDefault(); logViolation('right_click', 'Right-click attempted') }
    const noCopy = (e) => { e.preventDefault(); logViolation('copy_attempt', 'Copy attempted') }
    document.addEventListener('contextmenu', noCtx)
    document.addEventListener('copy', noCopy)
    return () => {
      document.removeEventListener('contextmenu', noCtx)
      document.removeEventListener('copy', noCopy)
    }
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

  const saveAnswer = useCallback(async (questionId, selected) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selected }))
    const id = attemptIdRef.current
    if (!id) return
    try { await attemptService.saveAnswer(id, questionId, selected) } catch {}
  }, [])

  const submitExam = useCallback(async (auto = false) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setPageState('submitting')
    document.exitFullscreen?.().catch(() => {})
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

  const BACKEND_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')

  if (pageState === 'loading') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-white/40 font-display text-sm">Loading examination...</p>
      </div>
    </div>
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

  const q = questions[current]
  const answered = Object.keys(answers).length
  const total = questions.length

  return (
    <div className="min-h-screen bg-surface flex flex-col select-none" style={{ userSelect: 'none' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-surface-1 border-b border-white/5 shadow-xl">
        <div>
          <p className="font-display font-bold text-white text-sm">{examInfo?.title}</p>
          <p className="text-white/30 text-xs">{answered}/{total} answered</p>
        </div>
        <div className="hidden md:flex flex-1 mx-8 items-center gap-3">
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all duration-300"
              style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }} />
          </div>
          <span className="text-white/30 text-xs font-mono">{Math.round(total > 0 ? (answered / total) * 100 : 0)}%</span>
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
          <button onClick={() => { if (window.confirm(`Submit? ${answered}/${total} questions answered.`)) submitExam(false) }}
            className="btn-primary">
            <Send size={14} /> Submit
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Question navigator */}
        <aside className="hidden lg:block w-56 bg-surface-1 border-r border-white/5 p-4 overflow-y-auto">
          <p className="label mb-3">Questions</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, i) => (
              <button key={q._id} onClick={() => setCurrent(i)}
                className={`w-full aspect-square rounded-lg text-xs font-mono font-bold transition-all
                  ${i === current ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : answers[q._id] ? 'bg-accent-green/15 text-accent-green border border-accent-green/20'
                    : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        </aside>

        {/* Question body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {q && (
            <div className="max-w-2xl mx-auto animate-fade-in" key={q._id}>
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mono text-white/20 text-sm">Q{current + 1}/{total}</span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs font-display font-semibold text-white/30">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
              </div>

              <p className="font-display text-white text-lg leading-relaxed mb-6">{q.questionText}</p>

              {/* Question image from backend */}
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

              <div className="space-y-3">
                {q.options?.map((opt) => {
                  const selected = answers[q._id] === opt.label
                  return (
                    <button key={opt.label} onClick={() => saveAnswer(q._id, opt.label)}
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

              <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
                <button onClick={() => setCurrent(p => Math.max(0, p - 1))} disabled={current === 0}
                  className="btn-secondary disabled:opacity-30">
                  <ChevronLeft size={16} /> Previous
                </button>
                {current < total - 1 ? (
                  <button onClick={() => setCurrent(p => Math.min(total - 1, p + 1))} className="btn-primary">
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button onClick={() => { if (window.confirm(`Submit? Answered ${answered}/${total}.`)) submitExam(false) }}
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