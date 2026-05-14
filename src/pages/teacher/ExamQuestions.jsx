import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import { PageLoader, Modal, ConfirmDialog, Alert, EmptyState } from '../../components/common/UI'
import { questionService, examService } from '../../services'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2, ArrowLeft, Upload, CheckCircle, HelpCircle } from 'lucide-react'

const emptyQ = {
  questionText: '',
  options: [
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
    { label: 'D', text: '' },
  ],
  correctAnswer: 'A',
  marks: 1,
  explanation: '',
}

function QuestionForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || emptyQ)

  const setOpt = (idx, val) => {
    const opts = [...form.options]
    opts[idx] = { ...opts[idx], text: val }
    setForm({ ...form, options: opts })
  }

  const validate = () => {
    if (!form.questionText.trim()) { toast.error('Question text required'); return false }
    if (form.options.some(o => !o.text.trim())) { toast.error('All options required'); return false }
    return true
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Question Text *</label>
        <textarea className="input resize-none" rows={3} placeholder="Enter the question..."
          value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} />
      </div>

      <div>
        <label className="label">Options *</label>
        <div className="space-y-2">
          {form.options.map((opt, i) => (
            <div key={opt.label} className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center text-xs font-mono font-bold text-white/50 flex-shrink-0">
                {opt.label}
              </span>
              <input className="input flex-1" placeholder={`Option ${opt.label}`}
                value={opt.text} onChange={(e) => setOpt(i, e.target.value)} />
              <input type="radio" name="correct" checked={form.correctAnswer === opt.label}
                onChange={() => setForm({ ...form, correctAnswer: opt.label })}
                className="accent-brand-500 w-4 h-4 cursor-pointer" title="Mark as correct" />
            </div>
          ))}
        </div>
        <p className="text-xs text-white/30 mt-1.5">Click the circle to mark the correct answer</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Marks</label>
          <input type="number" className="input" min={1} max={10}
            value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">Correct Answer</label>
          <select className="input" value={form.correctAnswer}
            onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}>
            {form.options.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Explanation (optional)</label>
        <input className="input" placeholder="Shown to students in review..."
          value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button disabled={loading}
          onClick={() => validate() && onSave(form)}
          className="btn-primary flex-1">
          {loading ? 'Saving...' : 'Save Question'}
        </button>
      </div>
    </div>
  )
}

function BulkModal({ examId, onClose, onDone }) {
  const [json, setJson] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const template = JSON.stringify([{
    questionText: 'Sample question?',
    options: [{ label: 'A', text: 'Option A' }, { label: 'B', text: 'Option B' }, { label: 'C', text: 'Option C' }, { label: 'D', text: 'Option D' }],
    correctAnswer: 'A',
    marks: 1,
    explanation: 'Optional explanation'
  }], null, 2)

  const handleUpload = async () => {
    setError('')
    let questions
    try { questions = JSON.parse(json) } catch { setError('Invalid JSON format'); return }
    if (!Array.isArray(questions) || questions.length === 0) { setError('Must be an array of questions'); return }
    setSaving(true)
    try {
      await questionService.addBulk(examId, questions)
      toast.success(`${questions.length} questions added!`)
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <Alert type="info">
        Paste a JSON array of questions. <button onClick={() => setJson(template)} className="underline ml-1">Load template</button>
      </Alert>
      {error && <Alert type="error">{error}</Alert>}
      <textarea className="input font-mono text-xs resize-none" rows={12}
        placeholder="Paste JSON array here..." value={json} onChange={(e) => setJson(e.target.value)} />
      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={handleUpload} disabled={saving} className="btn-primary flex-1">
          {saving ? 'Uploading...' : <><Upload size={14} /> Upload Questions</>}
        </button>
      </div>
    </div>
  )
}

export default function ExamQuestions() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editQ, setEditQ] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    Promise.all([
      examService.getOne(examId),
      questionService.getByExam(examId),
    ]).then(([eRes, qRes]) => {
      // GET /exams/:id         → { data: { exam, questionCount } }
      // GET /questions/exam/:id → { data: { questions, totalMarks } }
      setExam(eRes.data?.data?.exam || eRes.data?.data || null)
      setQuestions(qRes.data?.data?.questions || [])
    }).finally(() => setLoading(false))
  }

  useEffect(load, [examId])

  const handleAdd = async (form) => {
    setSaving(true)
    try {
      await questionService.addSingle(examId, form)
      toast.success('Question added!')
      setAddOpen(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add question')
    } finally { setSaving(false) }
  }

  const handleEdit = async (form) => {
    setSaving(true)
    try {
      await questionService.update(editQ._id, form)
      toast.success('Question updated!')
      setEditQ(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update question')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await questionService.delete(id)
      toast.success('Question deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  const totalMarks = questions.reduce((s, q) => s + (q.marks || 1), 0)

  if (loading) return <Layout><PageLoader /></Layout>

  return (
    <Layout>
      <button onClick={() => navigate('/teacher')} className="btn-secondary mb-6">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">{exam?.title}</h1>
          <p className="page-subtitle">
            {questions.length} question{questions.length !== 1 ? 's' : ''} · {totalMarks} total marks
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setBulkOpen(true)} className="btn-secondary">
            <Upload size={14} /> Bulk Upload
          </button>
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            <Plus size={14} /> Add Question
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No questions yet"
          description="Add questions one by one or bulk upload via JSON."
          action={
            <div className="flex gap-2">
              <button onClick={() => setBulkOpen(true)} className="btn-secondary"><Upload size={14} />Bulk Upload</button>
              <button onClick={() => setAddOpen(true)} className="btn-primary"><Plus size={14} />Add Question</button>
            </div>
          }
        />
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q._id} className="card-hover p-5">
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-xl bg-brand-600/10 text-brand-400 flex items-center justify-center text-sm font-mono font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-white text-sm leading-relaxed">{q.questionText}</p>
                  <div className="grid grid-cols-2 gap-1.5 mt-3">
                    {q.options?.map((opt) => (
                      <div key={opt.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs
                        ${opt.label === q.correctAnswer
                          ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                          : 'text-white/40 bg-white/3'
                        }`}>
                        <span className="font-mono font-bold">{opt.label}.</span>
                        <span>{opt.text}</span>
                        {opt.label === q.correctAnswer && <CheckCircle size={11} className="ml-auto" />}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-xs text-white/25 mt-2 italic">💡 {q.explanation}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="badge badge-blue mr-1">{q.marks}mk</span>
                  <button onClick={() => setEditQ(q)} className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete(q._id)} className="p-2 rounded-lg hover:bg-accent-red/10 text-white/30 hover:text-accent-red transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Question" size="lg">
        <QuestionForm onSave={handleAdd} onCancel={() => setAddOpen(false)} loading={saving} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editQ} onClose={() => setEditQ(null)} title="Edit Question" size="lg">
        <QuestionForm initial={editQ} onSave={handleEdit} onCancel={() => setEditQ(null)} loading={saving} />
      </Modal>

      {/* Bulk modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Upload Questions" size="lg">
        <BulkModal examId={examId} onClose={() => setBulkOpen(false)} onDone={() => { setBulkOpen(false); load() }} />
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Delete Question"
        message="Are you sure you want to delete this question?"
        danger
      />
    </Layout>
  )
}
