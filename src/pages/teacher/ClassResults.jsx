import { useState, useEffect } from 'react'
import Layout from '../../components/common/Layout'
import { PageLoader, EmptyState } from '../../components/common/UI'
import { examService, resultService } from '../../services'
import { BarChart2, Trophy, ChevronDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function ClassResults() {
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState('')
  const [results, setResults] = useState([])
  const [rankings, setRankings] = useState([])
  const [examStats, setExamStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resultsLoading, setResultsLoading] = useState(false)

  useEffect(() => {
    // GET /exams → { data: { exams } }
    examService.getAll()
      .then((res) => {
        const list = res.data?.data?.exams || []
        setExams(list)
        if (list[0]) setSelectedExam(list[0]._id)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedExam) return
    setResultsLoading(true)
    Promise.all([
      resultService.byExam(selectedExam),
      resultService.rankings(selectedExam),
    ]).then(([rRes, rankRes]) => {
      // GET /results/exam/:examId → { data: { exam, stats, attempts, pagination } }
      // GET /results/exam/:examId/rankings → { data: { rankings } }
      setResults(rRes.data?.data?.attempts || [])
      setExamStats(rRes.data?.data?.stats || null)
      setRankings(rankRes.data?.data?.rankings || [])
    }).finally(() => setResultsLoading(false))
  }, [selectedExam])

  const scoreDistribution = () => {
    const buckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 }
    results.forEach(r => {
      const p = r.percentage || 0
      if (p <= 20) buckets['0-20']++
      else if (p <= 40) buckets['21-40']++
      else if (p <= 60) buckets['41-60']++
      else if (p <= 80) buckets['61-80']++
      else buckets['81-100']++
    })
    return Object.entries(buckets).map(([range, count]) => ({ range, count }))
  }

  if (loading) return <Layout><PageLoader /></Layout>

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Class Results</h1>
        <p className="page-subtitle">View student performance across your exams</p>
      </div>

      <div className="mb-6">
        <label className="label">Select Exam</label>
        <div className="relative max-w-sm">
          <select className="input appearance-none pr-10" value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}>
            {exams.length === 0 && <option value="">No exams yet</option>}
            {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>
      </div>

      {resultsLoading ? <PageLoader /> : results.length === 0 ? (
        <EmptyState icon={BarChart2} title="No results yet" description="Students haven't submitted this exam yet." />
      ) : (
        <>
          {/* Stats from backend */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card p-5 text-center">
              <p className="text-3xl font-display font-bold text-white">{examStats?.total ?? results.length}</p>
              <p className="text-white/40 text-sm mt-1">Submissions</p>
            </div>
            <div className="card p-5 text-center">
              <p className="text-3xl font-display font-bold text-white">{examStats?.avg ?? '—'}%</p>
              <p className="text-white/40 text-sm mt-1">Avg Score</p>
            </div>
            <div className="card p-5 text-center">
              <p className="text-3xl font-display font-bold text-accent-green">{examStats?.passed ?? results.filter(r => r.isPassed).length}</p>
              <p className="text-white/40 text-sm mt-1">Passed</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Score distribution */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-white mb-4">Score Distribution</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={scoreDistribution()} barSize={32}>
                  <XAxis dataKey="range" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#1c2029', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'white' }} />
                  <Bar dataKey="count" radius={[6,6,0,0]}>
                    {scoreDistribution().map((_, i) => <Cell key={i} fill={i >= 2 ? '#3474f5' : '#ef4444'} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Leaderboard */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                <Trophy size={16} className="text-accent-amber" /> Leaderboard
              </h3>
              <div className="space-y-2">
                {rankings.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0
                      ${i === 0 ? 'bg-accent-amber/20 text-accent-amber' : i === 1 ? 'bg-white/10 text-white/60' : 'bg-white/5 text-white/30'}`}>
                      {r.rank}
                    </span>
                    <span className="flex-1 text-sm text-white font-display truncate">{r.student?.fullName}</span>
                    <span className="font-mono text-sm font-bold text-brand-400">{Math.round(r.percentage)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* All results */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="font-display font-bold text-white">All Submissions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Student', 'Score', 'Percentage', 'Status', 'Submitted'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-display font-semibold text-white/30 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r._id} className="border-b border-white/5 hover:bg-white/2">
                      <td className="px-5 py-3 font-display font-semibold text-white text-sm">{r.student?.fullName}</td>
                      <td className="px-5 py-3 text-white/70 text-sm font-mono">{r.score}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full max-w-24">
                            <div className="h-full rounded-full bg-brand-500" style={{ width: `${r.percentage || 0}%` }} />
                          </div>
                          <span className="text-xs font-mono text-white/60">{Math.round(r.percentage || 0)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {/* Backend uses isPassed */}
                        <span className={`badge ${r.isPassed ? 'badge-green' : 'badge-red'}`}>
                          {r.isPassed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-white/30 text-xs">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
