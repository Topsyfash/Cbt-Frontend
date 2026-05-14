import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { GraduationCap, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form)
      toast.success(`Welcome back, ${user.fullName?.split(' ')[0]}!`)
      navigate(`/${user.role}`, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-surface-1 border-r border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="font-display font-bold text-white text-lg">CBT System</span>
        </div>
        <div>
          <div className="mb-8 space-y-4">
            {['Timed examinations with auto-submit', 'Real-time anti-cheat monitoring', 'Instant results & analytics'].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                <p className="text-white/60 text-sm font-body">{f}</p>
              </div>
            ))}
          </div>
          <blockquote className="border-l-2 border-brand-500/40 pl-4">
            <p className="text-white/40 text-sm italic">
              "A secure, modern examination platform built for schools."
            </p>
          </blockquote>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[['Multi-Role', 'Student, Teacher, Admin'], ['Auto-Grade', 'Instant scoring'], ['Analytics', 'Rich insights']].map(([t, d]) => (
            <div key={t} className="card p-4">
              <p className="font-display font-bold text-white text-sm">{t}</p>
              <p className="text-white/40 text-xs mt-1">{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-lg">CBT System</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl text-white mb-2">Sign In</h1>
            <p className="text-white/40 text-sm">Enter your credentials to access the platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email" required className="input"
                placeholder="you@school.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} required className="input pr-12"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            New student?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
