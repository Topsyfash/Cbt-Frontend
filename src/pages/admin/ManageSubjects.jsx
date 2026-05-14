import { useState, useEffect } from 'react'
import Layout from '../../components/common/Layout'
import { PageLoader, Modal, ConfirmDialog, EmptyState, FormField } from '../../components/common/UI'
import { subjectService } from '../../services'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, ClipboardList } from 'lucide-react'

const emptyForm = { name: '', code: '', department: '' }

function SubjectModal({ open, onClose, initial, onSave, loading }) {
  const [form, setForm] = useState(initial || emptyForm)
  useEffect(() => { setForm(initial || emptyForm) }, [initial])

  return (
    <Modal open={open} onClose={onClose} title={initial?._id ? 'Edit Subject' : 'Create Subject'}>
      <div className="space-y-4">
        <FormField label="Subject Name *">
          <input className="input" placeholder="e.g. Mathematics" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Subject Code">
            <input className="input" placeholder="e.g. MTH101" value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </FormField>
          <FormField label="Department">
            <input className="input" placeholder="e.g. Science" value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </FormField>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button disabled={loading || !form.name} onClick={() => onSave(form)} className="btn-primary flex-1">
            {loading ? 'Saving...' : 'Save Subject'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editSubject, setEditSubject] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    subjectService.getAll()
      // GET /subjects → { data: { subjects } }
      .then((res) => setSubjects(res.data?.data?.subjects || []))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (editSubject?._id) {
        await subjectService.update(editSubject._id, form)
        toast.success('Subject updated!')
      } else {
        await subjectService.create(form)
        toast.success('Subject created!')
      }
      setModalOpen(false); setEditSubject(null); load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await subjectService.delete(id); toast.success('Subject deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  if (loading) return <Layout><PageLoader /></Layout>

  const deptColors = ['bg-brand-500/10 text-brand-400', 'bg-accent-purple/10 text-accent-purple',
    'bg-accent-green/10 text-accent-green', 'bg-accent-amber/10 text-accent-amber']

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Manage Subjects</h1>
          <p className="page-subtitle">{subjects.length} subject{subjects.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button onClick={() => { setEditSubject(null); setModalOpen(true) }} className="btn-primary">
          <Plus size={15} /> Add Subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No subjects yet" description="Add subjects to assign to teachers and exams."
          action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={14} />Add Subject</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subjects.map((sub, i) => (
            <div key={sub._id} className="card-hover p-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${deptColors[i % deptColors.length]}`}>
                  <ClipboardList size={18} />
                </div>
                <div>
                  <p className="font-display font-bold text-white">{sub.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {sub.code && <span className="font-mono text-xs text-white/30">{sub.code}</span>}
                    {sub.department && <span className="text-xs text-white/20">· {sub.department}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => { setEditSubject(sub); setModalOpen(true) }}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => setConfirmDelete(sub._id)}
                  className="p-1.5 rounded-lg hover:bg-accent-red/10 text-white/30 hover:text-accent-red transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SubjectModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditSubject(null) }}
        initial={editSubject}
        onSave={handleSave}
        loading={saving}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Delete Subject"
        message="Are you sure you want to delete this subject? This may affect existing exams."
        danger
      />
    </Layout>
  )
}
