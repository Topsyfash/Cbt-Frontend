import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, FileText, Users, BookOpen, BarChart2,
  LogOut, Menu, GraduationCap, ChevronRight, Award,
  ClipboardList, AlignLeft
} from 'lucide-react'

const navConfig = {
  student: [
    { to: '/student',         label: 'Dashboard',  icon: LayoutDashboard, end: true },
    { to: '/student/results', label: 'My Results', icon: Award },
  ],
  teacher: [
    { to: '/teacher',                  label: 'Dashboard',    icon: LayoutDashboard, end: true },
    { to: '/teacher/exams/create',     label: 'Create Exam',  icon: FileText },
    { to: '/teacher/results',          label: 'Class Results',icon: BarChart2 },
    { to: '/teacher/grade',            label: 'Grade Answers',icon: AlignLeft },
  ],
  admin: [
    { to: '/admin',           label: 'Dashboard',  icon: LayoutDashboard, end: true },
    { to: '/admin/users',     label: 'Manage Users', icon: Users },
    { to: '/admin/classes',   label: 'Classes',    icon: BookOpen },
    { to: '/admin/subjects',  label: 'Subjects',   icon: ClipboardList },
    { to: '/admin/analytics', label: 'Analytics',  icon: BarChart2 },
  ],
}

const roleColors = {
  student: 'text-accent-green',
  teacher: 'text-accent-purple',
  admin:   'text-accent-amber',
}
const roleBadgeColors = {
  student: 'badge-green',
  teacher: 'badge-purple',
  admin:   'badge-amber',
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = navConfig[user?.role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = ({ mobile = false }) => (
    <aside className={`
      flex flex-col h-full bg-surface-1 border-r border-white/5
      ${mobile ? 'w-72' : 'w-64 hidden lg:flex'}
    `}>
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-none">CBT System</p>
            <p className="text-white/30 text-xs mt-0.5">Exam Platform</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-surface-2">
          <div className="w-9 h-9 rounded-full bg-brand-600/20 flex items-center justify-center flex-shrink-0">
            <span className={`font-display font-bold text-sm ${roleColors[user?.role]}`}>
              {user?.fullName?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-display font-semibold text-white text-sm truncate">{user?.fullName}</p>
            <span className={`badge ${roleBadgeColors[user?.role]} text-xs mt-0.5 capitalize`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => mobile && setMobileOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display font-medium
              transition-all duration-150 group
              ${isActive
                ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20'
                : 'text-white/50 hover:text-white hover:bg-white/5'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-brand-400' : 'text-white/30 group-hover:text-white/60'} />
                {label}
                {isActive && <ChevronRight size={14} className="ml-auto text-brand-400/60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-display font-medium text-white/40 hover:text-accent-red hover:bg-accent-red/5 transition-all duration-150"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <SidebarContent />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10">
            <SidebarContent mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-surface-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <GraduationCap size={15} className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-sm">CBT System</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/5 text-white/60">
            <Menu size={20} />
          </button>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 lg:p-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}