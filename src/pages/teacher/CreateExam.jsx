import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import { FormField, Alert, PageLoader } from '../../components/common/UI'
import { examService, classService, subjectService } from '../../services'
import toast from 'react-hot-toast'
import { Save, ArrowLeft } from 'lucide-react'

const defaultForm = {
  title: '', subject: '', class: '', duration: 60,
  instructions: '', startTime: '', endTime: '',
  randomizeQuestions: true, showResultsImmediately: true,
  allowRetake: false, passMark: 50,
}

export default function CreateExam() {
  const navigate = useNavigate()
  const { examId } = useParams() // present when editing
  const isEdit = !!examId

  const [form, setForm] = useState(defaultForm)
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      classService.getAll(),
      subjectService.getAll(),
    ]).then(([cRes, sRes]) => {
      // GET /classes  → { data: { classes } }
      // GET /subjects → { data: { subjects } }
      setClasses(cRes.data?.data?.classes || [])
      setSubjects(sRes.data?.data?.subjects || [])
    })

    if (isEdit) {
      examService.getOne(examId).then((res) => {
        // GET /exams/:id → { data: { exam, questionCount } }
        const e = res.data?.data?.exam || res.data?.data || res.data
        setForm({
          title: e.title || '',
          subject: e.subject?._id || e.subject || '',
          class: e.class?._id || e.class || '',
          duration: e.duration || 60,
          instructions: e.instructions || '',
          startTime: e.startTime ? e.startTime.slice(0, 16) : '',
          endTime: e.endTime ? e.endTime.slice(0, 16) : '',
          randomizeQuestions: e.randomizeQuestions ?? true,
          showResultsImmediately: e.showResultsImmediately ?? true,
          allowRetake: e.allowRetake ?? false,
          passMark: e.passMark || 50,
        })
      }).finally(() => setLoading(false))
    }
  }, [examId])

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.subject || !form.class || !form.duration) {
      setError('Please fill in all required fields'); return
    }
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        duration: Number(form.duration),
        passMark: Number(form.passMark),
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
      }
      if (isEdit) {
        await examService.update(examId, payload)
        toast.success('Exam updated!')
        navigate(`/teacher/exams/${examId}/questions`)
      } else {
        const res = await examService.create(payload)
        // POST /exams → { data: { exam } }
        const created = res.data?.data?.exam || res.data?.data
        toast.success('Exam created! Now add questions.')
        navigate(`/teacher/exams/${created._id}/questions`)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save exam')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Layout><PageLoader /></Layout>

  return (
    <Layout>
      <div className="max-w-2xl">
        <button onClick={() => navigate('/teacher')} className="btn-secondary mb-6">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="page-header">
          <h1 className="page-title">{isEdit ? 'Edit Exam' : 'Create New Exam'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update exam details' : 'Set up your examination'}</p>
        </div>

        {error && <Alert type="error" className="mb-5">{error}</Alert>}

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <FormField label="Exam Title *">
            <input className="input" required placeholder="e.g. Mathematics Term 1 Exam"
              value={form.title} onChange={(e) => set('title', e.target.value)} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Subject *">
              <select className="input" required value={form.subject} onChange={(e) => set('subject', e.target.value)}>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </FormField>
            <FormField label="Class *">
              <select className="input" required value={form.class} onChange={(e) => set('class', e.target.value)}>
                <option value="">Select class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Duration (minutes) *">
              <input className="input" type="number" min="5" max="300" required
                value={form.duration} onChange={(e) => set('duration', e.target.value)} />
            </FormField>
            <FormField label="Pass Mark (%)">
              <input className="input" type="number" min="0" max="100"
                value={form.passMark} onChange={(e) => set('passMark', e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Time" hint="Leave blank for no restriction">
              <input className="input" type="datetime-local"
                value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
            </FormField>
            <FormField label="End Time">
              <input className="input" type="datetime-local"
                value={form.endTime} onChange={(e) => set('endTime', e.target.value)} />
            </FormField>
          </div>

          <FormField label="Instructions">
            <textarea className="input resize-none" rows={3} placeholder="Instructions shown to students before the exam..."
              value={form.instructions} onChange={(e) => set('instructions', e.target.value)} />
          </FormField>

          {/* Toggle options */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <p className="label">Options</p>
            {[
              { key: 'randomizeQuestions', label: 'Randomize question order', desc: 'Shuffle questions for each student' },
              { key: 'showResultsImmediately', label: 'Show results immediately', desc: 'Students see score after submission' },
              { key: 'allowRetake', label: 'Allow retakes', desc: 'Students can attempt the exam more than once' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-center justify-between gap-4 cursor-pointer group">
                <div>
                  <p className="text-sm font-display font-semibold text-white group-hover:text-brand-300 transition-colors">{label}</p>
                  <p className="text-xs text-white/30">{desc}</p>
                </div>
                <div
                  onClick={() => set(key, !form[key])}
                  className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center flex-shrink-0
                    ${form[key] ? 'bg-brand-600' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ml-1
                    ${form[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <><Save size={15} /> {isEdit ? 'Save Changes' : 'Create & Add Questions'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
