import { useState, useEffect } from 'react'
import Layout from '../../components/common/Layout'
import { PageLoader, Modal, ConfirmDialog, EmptyState, FormField } from '../../components/common/UI'
import { classService, userService } from '../../services'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react'

const emptyForm = { name: '', level: '', arm: '' }

function ClassModal({ open, onClose, initial, teachers, onSave, loading }) {
  const [form, setForm] = useState(initial || emptyForm)
  useEffect(() => { setForm(initial || emptyForm) }, [initial, open])
  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title={initial?._id ? 'Edit Class' : 'Create Class'}>
      <div className="space-y-4">
        <FormField label="Class Name *">
          <input className="input" placeholder="e.g. JSS 1A" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Level">
            <input className="input" placeholder="e.g. Junior" value={form.level || ''}
              onChange={(e) => setForm({ ...form, level: e.target.value })} />
          </FormField>
          <FormField label="Arm">
            <input className="input" placeholder="e.g. A" value={form.arm || ''}
              onChange={(e) => setForm({ ...form, arm: e.target.value })} />
          </FormField>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button disabled={loading || !form.name} onClick={() => onSave(form)} className="btn-primary flex-1">
            {loading ? 'Saving...' : 'Save Class'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function ManageClasses() {
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editClass, setEditClass] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    Promise.all([
      classService.getAll(),
      userService.getAll({ role: 'teacher', limit: 100 }),
    ]).then(([cRes, tRes]) => {
      // GET /classes → { data: { classes } }
      // GET /users   → { data: { users, pagination } }
      setClasses(cRes.data?.data?.classes || [])
      setTeachers(tRes.data?.data?.users || [])
    }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (editClass?._id) {
        await classService.update(editClass._id, form)
        toast.success('Class updated!')
      } else {
        await classService.create(form)
        toast.success('Class created!')
      }
      setModalOpen(false); setEditClass(null); load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await classService.delete(id); toast.success('Class deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  const handleAssignTeacher = async (classId, teacherId) => {
    try { await classService.assignTeacher(classId, teacherId); toast.success('Teacher assigned'); load() }
    catch { toast.error('Failed to assign teacher') }
  }

  if (loading) return <Layout><PageLoader /></Layout>

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Manage Classes</h1>
          <p className="page-subtitle">{classes.length} class{classes.length !== 1 ? 'es' : ''}</p>
        </div>
        <button onClick={() => { setEditClass(null); setModalOpen(true) }} className="btn-primary">
          <Plus size={15} /> Add Class
        </button>
      </div>

      {classes.length === 0 ? (
        <EmptyState icon={BookOpen} title="No classes yet" description="Create your first class."
          action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={14} />Add Class</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls._id} className="card-hover p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-600/10 flex items-center justify-center">
                    <BookOpen size={18} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-white">{cls.name}</p>
                    <p className="text-white/30 text-xs">{[cls.level, cls.arm].filter(Boolean).join(' · ')}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditClass(cls); setModalOpen(true) }}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => setConfirmDelete(cls._id)}
                    className="p-1.5 rounded-lg hover:bg-accent-red/10 text-white/30 hover:text-accent-red transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div>
                <label className="label text-xs">Class Teacher</label>
                <select
                  className="input text-sm"
                  value={cls.classTeacher?._id || cls.classTeacher || ''}
                  onChange={(e) => handleAssignTeacher(cls._id, e.target.value)}
                >
                  <option value="">— Not assigned —</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.fullName}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClassModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditClass(null) }}
        initial={editClass}
        teachers={teachers}
        onSave={handleSave}
        loading={saving}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Delete Class"
        message="Are you sure you want to delete this class?"
        danger
      />
    </Layout>
  )
}
