import { useState, useEffect } from 'react'
import Layout from '../../components/common/Layout'
import { StatCard, PageLoader } from '../../components/common/UI'
import { analyticsService } from '../../services'
import { Users, FileText, TrendingUp, Award, UserCheck } from 'lucide-react'
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsService.admin()
      .then((res) => {
        // Backend returns: { data: { users, exams, attempts, performance, recentAttempts } }
        const d = res.data?.data || {}
        setStats({
          totalStudents:    d.users?.totalStudents    ?? 0,
          pendingStudents:  d.users?.pendingStudents  ?? 0,
          approvedStudents: (d.users?.totalStudents ?? 0) - (d.users?.pendingStudents ?? 0),
          totalTeachers:    d.users?.totalTeachers    ?? 0,
          totalAdmins:      d.users?.totalAdmins      ?? 0,
          totalExams:       d.exams?.totalExams        ?? 0,
          publishedExams:   d.exams?.publishedExams    ?? 0,
          activeExams:      d.exams?.activeExams       ?? 0,
          totalAttempts:    d.attempts?.totalAttempts  ?? 0,
          completedAttempts: d.attempts?.completedAttempts ?? 0,
          avgPercentage:    d.performance?.avgPercentage ?? 0,
          passCount:        d.performance?.passCount    ?? 0,
          failCount:        d.performance?.failCount    ?? 0,
          recentAttempts:   d.recentAttempts            ?? [],
        })
      })
      .catch(() => setStats({}))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><PageLoader /></Layout>

  const s = stats || {}

  const pieData = [
    { name: 'Approved', value: s.approvedStudents || 0 },
    { name: 'Pending',  value: s.pendingStudents  || 0 },
  ]
  const PIE_COLORS = ['#3474f5', '#f59e0b']

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Students" value={s.totalStudents} icon={Users}     color="brand"  />
        <StatCard label="Total Teachers" value={s.totalTeachers} icon={UserCheck} color="green"  />
        <StatCard label="Total Exams"    value={s.totalExams}    icon={FileText}  color="purple" />
        <StatCard label="Exam Attempts"  value={s.totalAttempts} icon={TrendingUp} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Student approval */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-white mb-4">Student Approval Status</h3>
          <div className="flex items-center justify-center">
            <PieChart width={220} height={160}>
              <Pie data={pieData} cx={110} cy={80} innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{v}</span>} />
              <Tooltip contentStyle={{ background: '#1c2029', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'white' }} />
            </PieChart>
          </div>
        </div>

        {/* Quick stats */}
        <div className="card p-6 space-y-3">
          <h3 className="font-display font-bold text-white mb-2">Quick Stats</h3>
          {[
            { label: 'Published Exams',    value: s.publishedExams,   color: 'text-accent-green'  },
            { label: 'Pending Approvals',  value: s.pendingStudents,  color: 'text-accent-amber'  },
            { label: 'Completed Attempts', value: s.completedAttempts, color: 'text-brand-400'    },
            { label: 'Avg Score',          value: s.avgPercentage ? `${s.avgPercentage}%` : '—', color: 'text-accent-purple' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-white/50 text-sm">{label}</span>
              <span className={`font-display font-bold text-lg ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Performance */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-white mb-4">Performance</h3>
          <div className="space-y-3">
            {[
              { label: 'Passed',  value: s.passCount, color: 'text-accent-green' },
              { label: 'Failed',  value: s.failCount, color: 'text-accent-red'   },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-white/50 text-sm">{label}</span>
                <span className={`font-display font-bold text-lg ${color}`}>{value}</span>
              </div>
            ))}
            <div className="pt-2">
              <p className="text-white/30 text-xs mb-1">Pass rate</p>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-green rounded-full"
                  style={{ width: `${s.completedAttempts ? Math.round((s.passCount / s.completedAttempts) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent attempts */}
      {s.recentAttempts?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="font-display font-bold text-white">Recent Submissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Student', 'Exam', 'Score', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-display font-semibold text-white/30 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.recentAttempts.map((a) => (
                  <tr key={a._id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-5 py-3 text-white text-sm font-display font-semibold">{a.student?.fullName}</td>
                    <td className="px-5 py-3 text-white/50 text-sm">{a.exam?.title}</td>
                    <td className="px-5 py-3 text-white/70 text-sm font-mono">{Math.round(a.percentage ?? 0)}%</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${a.isPassed ? 'badge-green' : 'badge-red'}`}>
                        {a.isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-white/30 text-xs">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  )
}
