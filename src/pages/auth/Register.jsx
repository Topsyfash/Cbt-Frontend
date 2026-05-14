import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services'
import toast from 'react-hot-toast'
import { GraduationCap, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', admissionNumber: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await authService.register(form)
      setDone(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-accent-green/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-accent-green" />
        </div>
        <h2 className="font-display font-bold text-2xl text-white mb-3">Registration Submitted!</h2>
        <p className="text-white/50 text-sm mb-8">
          Your account is pending admin approval. You'll be able to log in and take exams once approved.
        </p>
        <Link to="/login" className="btn-primary">
          Go to Login <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="font-display font-bold text-white text-lg">CBT System</span>
        </div>

        <div className="card p-8">
          <div className="mb-7">
            <h1 className="font-display font-bold text-2xl text-white mb-1">Student Registration</h1>
            <p className="text-white/40 text-sm">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" required className="input" placeholder="John Doe"
                value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>

            <div>
              <label className="label">Email Address</label>
              <input type="email" required className="input" placeholder="john@school.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            <div>
              <label className="label">Admission Number</label>
              <input type="text" required className="input" placeholder="STU001"
                value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required className="input pr-12"
                  placeholder="Min 6 characters"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Registering...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
