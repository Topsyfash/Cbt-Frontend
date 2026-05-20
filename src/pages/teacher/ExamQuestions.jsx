import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import { PageLoader, Modal, ConfirmDialog, Alert, EmptyState, FormField } from '../../components/common/UI'
import { questionService, examService } from '../../services'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, Edit2, ArrowLeft, Upload, CheckCircle,
  HelpCircle, Image, FileSpreadsheet, X, Save, Eye
} from 'lucide-react'

const BACKEND_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')

const emptyQ = {
  questionType: 'mcq',
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
  wordLimit: '',
  sampleAnswer: '',
}

function QuestionForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(() => initial ? {
    ...initial,
    questionType: initial.questionType || 'mcq',
    options: initial.options || emptyQ.options,
    wordLimit: initial.wordLimit || '',
    sampleAnswer: initial.sampleAnswer || '',
  } : { ...emptyQ })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(initial?.image || null)
  const fileRef = useRef()

  useEffect(() => {
    setImagePreview(initial?.image || null)
    setImageFile(null)
  }, [initial?._id])

  const isOpen = form.questionType === 'open_ended'

  const setOpt = (idx, val) => {
    const opts = [...form.options]
    opts[idx] = { ...opts[idx], text: val }
    setForm({ ...form, options: opts })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const validate = () => {
    if (!form.questionText.trim()) { toast.error('Question text required'); return false }
    if (!isOpen && form.options.some(o => !o.text.trim())) { toast.error('All options are required'); return false }
    return true
  }

  return (
    <div className="space-y-4">
      {/* Question type toggle */}
      <div>
        <label className="label">Question Type</label>
        <div className="flex gap-2">
          {[
            { value: 'mcq', label: '📋 Multiple Choice' },
            { value: 'open_ended', label: '✏️ Open Ended' },
          ].map(({ value, label }) => (
            <button key={value} type="button"
              onClick={() => setForm({ ...form, questionType: value })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-display font-semibold border transition-all
                ${form.questionType === value
                  ? 'bg-brand-600/20 border-brand-500/40 text-brand-300'
                  : 'bg-surface-2 border-white/10 text-white/40 hover:text-white/60'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <FormField label="Question Text *">
        <textarea className="input resize-none" rows={3} placeholder="Enter the question..."
          value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} />
      </FormField>

      {/* MCQ options */}
      {!isOpen && (
        <FormField label="Options *" hint="Click the radio button to mark the correct answer">
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
                  className="accent-brand-500 w-4 h-4 cursor-pointer flex-shrink-0" title="Correct answer" />
              </div>
            ))}
          </div>
        </FormField>
      )}

      {/* Open-ended fields */}
      {isOpen && (
        <>
          <FormField label="Word Limit (optional)" hint="Maximum words the student can write">
            <input type="number" className="input" min={10} placeholder="e.g. 200"
              value={form.wordLimit || ''} onChange={(e) => setForm({ ...form, wordLimit: e.target.value })} />
          </FormField>
          <FormField label="Sample / Model Answer (optional)" hint="Only visible to you during grading">
            <textarea className="input resize-none" rows={3} placeholder="Write the expected answer..."
              value={form.sampleAnswer || ''} onChange={(e) => setForm({ ...form, sampleAnswer: e.target.value })} />
          </FormField>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Marks">
          <input type="number" className="input" min={0.5} max={20} step={0.5}
            value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} />
        </FormField>
        {!isOpen && (
          <FormField label="Correct Answer">
            <select className="input" value={form.correctAnswer}
              onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}>
              {form.options.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
            </select>
          </FormField>
        )}
      </div>

      {!isOpen && (
        <FormField label="Explanation (optional)">
          <input className="input" placeholder="Shown to students after submission..."
            value={form.explanation || ''} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
        </FormField>
      )}

      {/* Image upload */}
      <div>
        <label className="label">Question Image (optional)</label>
        {imagePreview ? (
          <div className="relative rounded-xl overflow-hidden bg-surface-2 border border-white/10">
            <img src={imagePreview.startsWith('http') || imagePreview.startsWith('blob')
              ? imagePreview : `${BACKEND_BASE}${imagePreview}`}
              alt="Preview" className="w-full max-h-48 object-contain p-2" />
            <button onClick={removeImage}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface/80 hover:bg-accent-red/20 text-white/60 hover:text-accent-red transition-colors">
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-white/10 hover:border-brand-500/40 cursor-pointer transition-colors group">
            <Image size={18} className="text-white/30 group-hover:text-brand-400" />
            <div>
              <p className="text-white/50 text-sm font-display group-hover:text-white/70">Click to upload image</p>
              <p className="text-white/20 text-xs">JPEG, PNG, WebP — max 5MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button disabled={saving} onClick={() => validate() && onSave(form, imageFile)} className="btn-primary flex-1">
          {saving ? 'Saving...' : 'Save Question'}
        </button>
      </div>
    </div>
  )
}

// ─── Bulk Review Modal — edit questions parsed from Excel before saving ───────
function BulkReviewModal({ questions: initial, onConfirm, onCancel, saving }) {
  const [questions, setQuestions] = useState(initial)
  const [editIdx, setEditIdx] = useState(null)

  const updateQ = (idx, updated) => {
    const next = [...questions]
    next[idx] = updated
    setQuestions(next)
    setEditIdx(null)
  }

  const removeQ = (idx) => setQuestions(q => q.filter((_, i) => i !== idx))

  if (editIdx !== null) return (
    <div>
      <button onClick={() => setEditIdx(null)} className="btn-secondary mb-4">← Back to list</button>
      <QuestionForm
        initial={questions[editIdx]}
        onSave={(form) => updateQ(editIdx, { ...questions[editIdx], ...form })}
        onCancel={() => setEditIdx(null)}
        saving={false}
      />
    </div>
  )

  return (
    <div className="space-y-4">
      <Alert type="info">
        Review {questions.length} questions parsed from your file. Edit or remove any before saving.
      </Alert>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {questions.map((q, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-2 border border-white/5">
            <span className="w-6 h-6 rounded-md bg-brand-600/20 text-brand-400 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-display line-clamp-2">{q.questionText}</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                {q.options?.map(o => (
                  <span key={o.label} className={`text-xs px-1.5 py-0.5 rounded font-mono
                    ${o.label === q.correctAnswer ? 'bg-accent-green/20 text-accent-green' : 'bg-white/5 text-white/30'}`}>
                    {o.label}: {o.text?.slice(0, 20)}{o.text?.length > 20 ? '…' : ''}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => setEditIdx(i)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                <Edit2 size={13} />
              </button>
              <button onClick={() => removeQ(i)}
                className="p-1.5 rounded-lg hover:bg-accent-red/10 text-white/30 hover:text-accent-red transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button onClick={() => onConfirm(questions)} disabled={saving || questions.length === 0} className="btn-primary flex-1">
          {saving ? 'Saving...' : <><Save size={14} /> Save {questions.length} Questions</>}
        </button>
      </div>
    </div>
  )
}

// ─── Excel / CSV Upload Modal ────────────────────────────────────────────────
function ExcelUploadModal({ onParsed, onClose }) {
  const [error, setError] = useState('')
  const [parsing, setParsing] = useState(false)
  const fileRef = useRef()

  const TEMPLATE_HEADERS = ['questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer', 'marks', 'explanation']

  const downloadTemplate = () => {
    const rows = [
      TEMPLATE_HEADERS,
      ['What is 2 + 2?', 'Three', 'Four', 'Five', 'Six', 'B', '1', 'Basic addition'],
      ['What is the capital of Nigeria?', 'Lagos', 'Abuja', 'Kano', 'Ibadan', 'B', '1', ''],
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'questions_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const parseCSV = (text) => {
    const lines = text.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) throw new Error('File must have a header row and at least one question')

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
    const requiredCols = ['questiontext', 'optiona', 'optionb', 'correctanswer']
    const missing = requiredCols.filter(c => !headers.includes(c))
    if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}`)

    const get = (row, name) => {
      const idx = headers.indexOf(name)
      if (idx === -1) return ''
      const val = row[idx] || ''
      return val.replace(/^"|"$/g, '').trim()
    }

    return lines.slice(1).map((line, i) => {
      // Handle quoted commas
      const row = []
      let cur = '', inQ = false
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ }
        else if (ch === ',' && !inQ) { row.push(cur); cur = '' }
        else cur += ch
      }
      row.push(cur)

      const options = []
      for (const lbl of ['A', 'B', 'C', 'D', 'E', 'F']) {
        const val = get(row, `option${lbl.toLowerCase()}`)
        if (val) options.push({ label: lbl, text: val })
      }
      if (options.length < 2) throw new Error(`Row ${i + 2}: need at least optionA and optionB`)

      const correct = get(row, 'correctanswer').toUpperCase()
      if (!options.find(o => o.label === correct)) throw new Error(`Row ${i + 2}: correctAnswer "${correct}" doesn't match any option label`)

      return {
        questionText: get(row, 'questiontext') || `Question ${i + 1}`,
        options,
        correctAnswer: correct,
        marks: parseFloat(get(row, 'marks')) || 1,
        explanation: get(row, 'explanation') || '',
      }
    })
  }

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setError(''); setParsing(true)

    try {
      // Handle .xlsx via SheetJS if available, otherwise treat as CSV
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Dynamically import SheetJS
        const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm').catch(() => null)
        if (!XLSX) throw new Error('Excel support unavailable in this browser. Please save as CSV (.csv) and re-upload.')

        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const csv = XLSX.utils.sheet_to_csv(ws)
        const parsed = parseCSV(csv)
        onParsed(parsed)
      } else {
        const text = await file.text()
        const parsed = parseCSV(text)
        onParsed(parsed)
      }
    } catch (err) {
      setError(err.message || 'Failed to parse file')
    } finally { setParsing(false) }
  }

  return (
    <div className="space-y-4">
      <Alert type="info">
        Upload a <strong>.csv</strong> or <strong>.xlsx</strong> file. Columns needed:
        <code className="block mt-1 text-xs font-mono bg-white/5 rounded px-2 py-1">
          questionText, optionA, optionB, optionC, optionD, correctAnswer, marks, explanation
        </code>
      </Alert>

      {error && <Alert type="error">{error}</Alert>}

      <label className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-white/10 hover:border-brand-500/40 cursor-pointer transition-colors group">
        <FileSpreadsheet size={32} className="text-white/20 group-hover:text-brand-400" />
        <div className="text-center">
          <p className="text-white/60 font-display font-semibold group-hover:text-white/80">
            {parsing ? 'Parsing file...' : 'Click to select file'}
          </p>
          <p className="text-white/30 text-xs mt-1">.csv or .xlsx — max 5MB</p>
        </div>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} disabled={parsing} />
      </label>

      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={downloadTemplate} className="btn-secondary flex-1">
          ↓ Download Template
        </button>
      </div>
    </div>
  )
}

// ─── Main ExamQuestions page ─────────────────────────────────────────────────
export default function ExamQuestions() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editQ, setEditQ] = useState(null)
  const [excelOpen, setExcelOpen] = useState(false)
  const [bulkReview, setBulkReview] = useState(null)   // array of parsed questions for review
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)

  const load = () => {
    Promise.all([
      examService.getOne(examId),
      questionService.getByExam(examId),
    ]).then(([eRes, qRes]) => {
      setExam(eRes.data?.data?.exam || eRes.data?.data || null)
      setQuestions(qRes.data?.data?.questions || [])
    }).finally(() => setLoading(false))
  }
  useEffect(load, [examId])

  // Add single question (with optional image file)
  const handleAdd = async (form, imageFile) => {
    setSaving(true)
    try {
      if (imageFile) {
        // Backend accepts multipart/form-data for image upload
        const fd = new FormData()
        fd.append('questionText', form.questionText)
        fd.append('questionType', form.questionType || "mcq")
        fd.append('options', JSON.stringify(form.options))
        fd.append('correctAnswer', form.correctAnswer)
        fd.append('marks', form.marks)
        fd.append('explanation', form.explanation || '')
        fd.append('wordLimit', form.wordLimit || '')
        fd.append('sampleAnswer', form.sampleAnswer || '')
        fd.append('image', imageFile)
        await api.post(`/questions/exam/${examId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await questionService.addSingle(examId, form)
      }
      toast.success('Question added!')
      setAddOpen(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add question')
    } finally { setSaving(false) }
  }

  // Edit existing question (with optional new image)
  const handleEdit = async (form, imageFile) => {
    setSaving(true)
    try {
      if (imageFile) {
        const fd = new FormData()
         fd.append('questionText', form.questionText)
        fd.append('questionType', form.questionType || "mcq")
        fd.append('options', JSON.stringify(form.options))
        fd.append('correctAnswer', form.correctAnswer)
        fd.append('marks', form.marks)
        fd.append('explanation', form.explanation || '')
        fd.append('wordLimit', form.wordLimit || '')
        fd.append('sampleAnswer', form.sampleAnswer || '')
        fd.append('image', imageFile)
        await api.put(`/questions/${editQ._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await questionService.update(editQ._id, form)
      }
      toast.success('Question updated!')
      setEditQ(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update question')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await questionService.delete(id); toast.success('Question deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  // Save bulk questions from review modal (no images in bulk — add individually after)
  const handleBulkConfirm = async (reviewed) => {
    setSaving(true)
    try {
      await questionService.addBulk(examId, reviewed)
      toast.success(`${reviewed.length} questions saved!`)
      setBulkReview(null)
      setExcelOpen(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk save failed')
    } finally { setSaving(false) }
  }

  const totalMarks = questions.reduce((s, q) => s + (q.marks || 1), 0)

  if (loading) return <Layout><PageLoader /></Layout>

  return (
    <Layout>
      <button onClick={() => navigate('/teacher')} className="btn-secondary mb-6">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="page-title">{exam?.title}</h1>
          <p className="page-subtitle">
            {questions.length} question{questions.length !== 1 ? 's' : ''} · {totalMarks} total marks
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setExcelOpen(true)} className="btn-secondary">
            <FileSpreadsheet size={14} /> Excel / CSV Upload
          </button>
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            <Plus size={14} /> Add Question
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <EmptyState icon={HelpCircle} title="No questions yet"
          description="Add questions manually or upload from an Excel/CSV file."
          action={
            <div className="flex gap-2">
              <button onClick={() => setExcelOpen(true)} className="btn-secondary"><FileSpreadsheet size={14} />Excel / CSV</button>
              <button onClick={() => setAddOpen(true)} className="btn-primary"><Plus size={14} />Add Question</button>
            </div>
          }
        />
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q._id} className="card-hover p-5">
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-xl bg-brand-600/10 text-brand-400 flex items-center justify-center text-sm font-mono font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-white text-sm leading-relaxed">{q.questionText}</p>

                  {/* Thumbnail if question has image */}
                  {q.image && (
                    <button onClick={() => setPreviewImage(
                      q.image.startsWith('http') ? q.image : `${BACKEND_BASE}${q.image}`
                    )} className="mt-2 flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300">
                      <Image size={12} /> View image
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 mt-3">
                    {q.options?.map((opt) => (
                      <div key={opt.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs
                        ${opt.label === q.correctAnswer
                          ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                          : 'text-white/40 bg-white/3'}`}>
                        <span className="font-mono font-bold">{opt.label}.</span>
                        <span className="truncate">{opt.text}</span>
                        {opt.label === q.correctAnswer && <CheckCircle size={11} className="ml-auto flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-xs text-white/25 mt-2 italic">💡 {q.explanation}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className={`badge mr-1 ${q.questionType === 'open_ended' ? 'badge-purple' : 'badge-blue'}`}>
                    {q.questionType === 'open_ended' ? '✏️ Open' : '📋 MCQ'}
                  </span>
                  <span className="badge badge-blue mr-1">{q.marks}mk</span>
                  <button onClick={() => setEditQ(q)}
                    className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete(q._id)}
                    className="p-2 rounded-lg hover:bg-accent-red/10 text-white/30 hover:text-accent-red transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add single question modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Question" size="lg">
        <QuestionForm onSave={handleAdd} onCancel={() => setAddOpen(false)} saving={saving} />
      </Modal>

      {/* Edit question modal */}
      <Modal open={!!editQ} onClose={() => setEditQ(null)} title="Edit Question" size="lg">
        {editQ && <QuestionForm initial={editQ} onSave={handleEdit} onCancel={() => setEditQ(null)} saving={saving} />}
      </Modal>

      {/* Excel upload modal */}
      <Modal open={excelOpen && !bulkReview} onClose={() => setExcelOpen(false)} title="Upload Questions from Excel / CSV" size="lg">
        <ExcelUploadModal
          onParsed={(parsed) => setBulkReview(parsed)}
          onClose={() => setExcelOpen(false)}
        />
      </Modal>

      {/* Bulk review modal — shown after parsing */}
      <Modal open={!!bulkReview} onClose={() => { setBulkReview(null); setExcelOpen(false) }} title="Review Parsed Questions" size="xl">
        {bulkReview && (
          <BulkReviewModal
            questions={bulkReview}
            onConfirm={handleBulkConfirm}
            onCancel={() => { setBulkReview(null); setExcelOpen(false) }}
            saving={saving}
          />
        )}
      </Modal>

      {/* Image preview lightbox */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)}
              className="absolute -top-4 -right-4 p-2 rounded-full bg-surface-1 border border-white/10 text-white/60 hover:text-white transition-colors z-10">
              <X size={18} />
            </button>
            <img src={previewImage} alt="Question" className="w-full rounded-2xl border border-white/10" />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Delete Question"
        message="Are you sure you want to delete this question? This cannot be undone."
        danger
      />
    </Layout>
  )
}