import { useState, useEffect } from 'react'
import Layout from '../../components/common/Layout'
import { PageLoader, StatCard } from '../../components/common/UI'
import { analyticsService, examService } from '../../services'
import { Users, FileText, TrendingUp, Award, UserCheck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#3474f5', '#22c55e', '#f59e0b', '#a78bfa', '#ef4444']

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-white/50 text-xs mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-display font-bold text-white text-sm">
          {p.name}: <span style={{ color: p.color }}>{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null)
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsService.admin(),
      examService.getAll({ limit: 20 }).catch(() => ({ data: { data: { exams: [] } } })),
    ]).then(([aRes, eRes]) => {
      // Backend: GET /analytics/admin → { data: { users, exams, attempts, performance, recentAttempts } }
      const d = aRes.data?.data || {}
      setStats({
        totalStudents:    d.users?.totalStudents    ?? 0,
        pendingStudents:  d.users?.pendingStudents  ?? 0,
        approvedStudents: (d.users?.totalStudents ?? 0) - (d.users?.pendingStudents ?? 0),
        totalTeachers:    d.users?.totalTeachers    ?? 0,
        totalAdmins:      d.users?.totalAdmins      ?? 0,
        totalExams:       d.exams?.totalExams        ?? 0,
        publishedExams:   d.exams?.publishedExams    ?? 0,
        totalAttempts:    d.attempts?.totalAttempts  ?? 0,
        completedAttempts: d.attempts?.completedAttempts ?? 0,
        avgPercentage:    d.performance?.avgPercentage ?? 0,
        passCount:        d.performance?.passCount    ?? 0,
        failCount:        d.performance?.failCount    ?? 0,
      })
      // Backend: GET /exams → { data: { exams } }
      setExams(eRes.data?.data?.exams || [])
    }).catch(() => {
      setStats({})
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><PageLoader /></Layout>

  const s = stats || {}

  // Exams by subject
  const subjectMap = {}
  exams.forEach(e => {
    const name = e.subject?.name || 'Unknown'
    subjectMap[name] = (subjectMap[name] || 0) + 1
  })
  const subjectData = Object.entries(subjectMap).map(([name, count]) => ({ name, count }))

  // User distribution
  const roleData = [
    { name: 'Students', value: s.totalStudents || 0 },
    { name: 'Teachers', value: s.totalTeachers || 0 },
    { name: 'Admins',   value: s.totalAdmins   || 0 },
  ]

  const passRate = s.completedAttempts
    ? Math.round((s.passCount / s.completedAttempts) * 100)
    : 0

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Platform Analytics</h1>
        <p className="page-subtitle">Global overview of the CBT system</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users"    value={(s.totalStudents || 0) + (s.totalTeachers || 0)} icon={Users}     color="brand"  />
        <StatCard label="Total Exams"    value={s.totalExams}    icon={FileText}  color="purple" />
        <StatCard label="Total Attempts" value={s.totalAttempts} icon={TrendingUp} color="green" />
        <StatCard label="Avg Score"      value={s.avgPercentage ? `${s.avgPercentage}%` : '—'} icon={Award} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Exams by Subject */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-white mb-5">Exams by Subject</h3>
          {subjectData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-white/20 text-sm">No exams yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={subjectData} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Exams" radius={[6, 6, 0, 0]}>
                  {subjectData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* User distribution */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-white mb-5">User Distribution</h3>
          <div className="flex items-center justify-center">
            <PieChart width={240} height={180}>
              <Pie data={roleData} cx={120} cy={90} outerRadius={70} paddingAngle={4} dataKey="value">
                {roleData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{v}</span>} />
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Approved Students', value: s.approvedStudents ?? 0,     sub: `of ${s.totalStudents ?? 0} total`,        color: 'text-accent-green'  },
          { label: 'Published Exams',   value: s.publishedExams  ?? 0,     sub: `of ${s.totalExams ?? 0} total`,            color: 'text-brand-400'     },
          { label: 'Pass Rate',         value: passRate ? `${passRate}%` : '—', sub: 'across all exams',                    color: 'text-accent-green'  },
          { label: 'Pending Approval',  value: s.pendingStudents ?? 0,     sub: 'students awaiting approval',               color: 'text-accent-amber'  },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="card p-5">
            <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
            <p className="text-white/60 text-sm font-display mt-1">{label}</p>
            <p className="text-white/20 text-xs mt-0.5">{sub}</p>
          </div>
        ))}
      </div>
    </Layout>
  )
}
