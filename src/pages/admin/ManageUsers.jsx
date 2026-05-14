import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/common/Layout'
import { PageLoader, Modal, ConfirmDialog, FormField, Alert } from '../../components/common/UI'
import { userService, classService } from '../../services'
import toast from 'react-hot-toast'
import { Plus, Search, UserCheck, UserX, Trash2, Eye, EyeOff } from 'lucide-react'

function CreateTeacherModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.fullName || !form.email || !form.password) { setError('All fields required'); return }
    setSaving(true); setError('')
    try {
      await userService.createTeacher(form)
      toast.success('Teacher account created!')
      setForm({ fullName: '', email: '', password: '' })
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create teacher')
    } finally { setSaving(false) }
  }

  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title="Create Teacher Account">
      {error && <Alert type="error" className="mb-4">{error}</Alert>}
      <div className="space-y-4">
        <FormField label="Full Name">
          <input className="input" placeholder="Teacher Name" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </FormField>
        <FormField label="Email">
          <input className="input" type="email" placeholder="teacher@school.com" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </FormField>
        <FormField label="Password">
          <input className="input" type="password" placeholder="Min 6 characters" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </FormField>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Creating...' : 'Create Teacher'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [approvedFilter, setApprovedFilter] = useState('')
  const [createTeacher, setCreateTeacher] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [page, setPage] = useState(1)

  const load = useCallback(() => {
    const params = { page, limit: 20 }
    if (search) params.search = search
    if (roleFilter) params.role = roleFilter
    if (approvedFilter !== '') params.isApproved = approvedFilter

    Promise.all([
      userService.getAll(params),
      classService.getAll(),
    ]).then(([uRes, cRes]) => {
      // GET /users        → { data: { users, pagination } }
      // GET /classes      → { data: { classes } }
      setUsers(uRes.data?.data?.users || [])
      setClasses(cRes.data?.data?.classes || [])
    }).finally(() => setLoading(false))
  }, [search, roleFilter, approvedFilter, page])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id, approve) => {
    try {
      // PATCH /users/:id/approve → body: { approve: bool }
      await userService.approve(id, approve)
      toast.success(approve ? 'Student approved!' : 'Student rejected')
      load()
    } catch { toast.error('Failed') }
  }

  const handleToggleStatus = async (id) => {
    try { await userService.toggleStatus(id); toast.success('Status updated'); load() }
    catch { toast.error('Failed') }
  }

  const handleDelete = async (id) => {
    try { await userService.delete(id); toast.success('User deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  const handleAssignClass = async (userId, classId) => {
    try { await userService.assignClass(userId, classId); toast.success('Class assigned'); load() }
    catch { toast.error('Failed to assign class') }
  }

  if (loading) return <Layout><PageLoader /></Layout>

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">Approve students, manage teachers</p>
        </div>
        <button onClick={() => setCreateTeacher(true)} className="btn-primary">
          <Plus size={15} /> Add Teacher
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input className="input pl-9" placeholder="Search name or email..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="input w-36" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}>
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
        <select className="input w-44" value={approvedFilter} onChange={(e) => { setApprovedFilter(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="true">Approved</option>
          <option value="false">Pending</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Name', 'Email', 'Role', 'Class', 'Approval', 'Active', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-display font-semibold text-white/30 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-white/30 text-sm">No users found</td></tr>
              ) : users.map((user) => (
                <tr key={user._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center text-brand-400 font-display font-bold text-sm flex-shrink-0">
                        {user.fullName?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-display font-semibold text-white text-sm">{user.fullName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-white/40 text-sm">{user.email}</td>
                  <td className="px-5 py-4">
                    <span className={`badge capitalize ${user.role === 'admin' ? 'badge-amber' : user.role === 'teacher' ? 'badge-purple' : 'badge-blue'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {user.role === 'student' ? (
                      <select
                        className="bg-surface-2 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 outline-none"
                        value={user.class?._id || user.class || ''}
                        onChange={(e) => handleAssignClass(user._id, e.target.value)}
                      >
                        <option value="">— Assign —</option>
                        {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    ) : <span className="text-white/20 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    {user.role === 'student' ? (
                      <span className={`badge ${user.isApproved ? 'badge-green' : 'badge-amber'}`}>
                        {user.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    ) : <span className="text-white/20 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>
                      {user.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {user.role === 'student' && !user.isApproved && (
                        <button onClick={() => handleApprove(user._id, true)} title="Approve"
                          className="p-1.5 rounded-lg hover:bg-accent-green/10 text-white/30 hover:text-accent-green transition-colors">
                          <UserCheck size={14} />
                        </button>
                      )}
                      {user.role === 'student' && user.isApproved && (
                        <button onClick={() => handleApprove(user._id, false)} title="Revoke"
                          className="p-1.5 rounded-lg hover:bg-accent-red/10 text-white/30 hover:text-accent-red transition-colors">
                          <UserX size={14} />
                        </button>
                      )}
                      <button onClick={() => handleToggleStatus(user._id)} title={user.isActive ? 'Suspend' : 'Activate'}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                        {user.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => setConfirmDelete(user._id)} title="Delete"
                        className="p-1.5 rounded-lg hover:bg-accent-red/10 text-white/30 hover:text-accent-red transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-4">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary disabled:opacity-30">Prev</button>
        <span className="flex items-center px-3 text-white/40 text-sm font-mono">Page {page}</span>
        <button disabled={users.length < 20} onClick={() => setPage(p => p + 1)} className="btn-secondary disabled:opacity-30">Next</button>
      </div>

      <CreateTeacherModal open={createTeacher} onClose={() => setCreateTeacher(false)} onDone={() => { setCreateTeacher(false); load() }} />
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Delete User"
        message="This will permanently delete the user account."
        danger
      />
    </Layout>
  )
}
