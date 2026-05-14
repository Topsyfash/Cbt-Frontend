import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import { StatCard, PageLoader, EmptyState, ConfirmDialog } from '../../components/common/UI'
import { examService, analyticsService } from '../../services'
import toast from 'react-hot-toast'
import { FileText, Users, Plus, Edit2, Trash2, Eye, EyeOff, HelpCircle, TrendingUp } from 'lucide-react'

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = () => {
    Promise.all([
      examService.getAll(),
      analyticsService.teacher().catch(() => ({ data: { data: {} } })),
    ]).then(([examRes, analyticsRes]) => {
      // GET /exams         → { data: { exams } }
      // GET /analytics/teacher → { data: { totalExams, publishedExams, totalAttempts, completedAttempts, examStats } }
      setExams(examRes.data?.data?.exams || [])
      setAnalytics(analyticsRes.data?.data || {})
    }).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleTogglePublish = async (exam) => {
    try {
      await examService.togglePublish(exam._id)
      toast.success(exam.isPublished ? 'Exam unpublished' : 'Exam published!')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update exam') }
  }

  const handleDelete = async (id) => {
    try { await examService.delete(id); toast.success('Exam deleted'); load() }
    catch { toast.error('Failed to delete exam') }
  }

  if (loading) return <Layout><PageLoader /></Layout>

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Teacher Dashboard</h1>
          <p className="page-subtitle">Manage your examinations</p>
        </div>
        <Link to="/teacher/exams/create" className="btn-primary">
          <Plus size={16} /> Create Exam
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Exams"    value={analytics.totalExams    ?? exams.length}            icon={FileText}  color="brand"  />
        <StatCard label="Published"      value={analytics.publishedExams ?? exams.filter(e=>e.isPublished).length} icon={Eye} color="green" />
        <StatCard label="Total Attempts" value={analytics.totalAttempts ?? 0}                       icon={Users}     color="purple" />
        <StatCard label="Completed"      value={analytics.completedAttempts ?? 0}                   icon={TrendingUp} color="amber" />
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="font-display font-bold text-white">Your Exams</h2>
        </div>
        {exams.length === 0 ? (
          <EmptyState icon={FileText} title="No exams yet" description="Create your first exam to get started."
            action={<Link to="/teacher/exams/create" className="btn-primary"><Plus size={14} />Create Exam</Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Title', 'Subject', 'Class', 'Duration', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-display font-semibold text-white/30 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4"><p className="font-display font-semibold text-white text-sm">{exam.title}</p></td>
                    <td className="px-5 py-4 text-white/50 text-sm">{exam.subject?.name || '—'}</td>
                    <td className="px-5 py-4 text-white/50 text-sm">{exam.class?.name  || '—'}</td>
                    <td className="px-5 py-4 text-white/50 text-sm">{exam.duration} min</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${exam.isPublished ? 'badge-green' : 'badge-amber'}`}>
                        {exam.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/teacher/exams/${exam._id}/questions`)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors" title="Questions">
                          <HelpCircle size={15} />
                        </button>
                        <button onClick={() => navigate(`/teacher/exams/${exam._id}/edit`)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors" title="Edit">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleTogglePublish(exam)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                          title={exam.isPublished ? 'Unpublish' : 'Publish'}>
                          {exam.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button onClick={() => setConfirmDelete(exam._id)}
                          className="p-2 rounded-lg hover:bg-accent-red/10 text-white/40 hover:text-accent-red transition-colors" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Delete Exam"
        message="This will permanently delete the exam and all its questions."
        danger
      />
    </Layout>
  )
}
