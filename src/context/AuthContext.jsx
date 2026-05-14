import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cbt_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('cbt_token')
    localStorage.removeItem('cbt_user')
    setUser(null)
  }, [])

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('cbt_token')
    if (!token) { setLoading(false); return }
    try {
      const { data } = await authService.me()
      // Backend: GET /auth/me → { success, message, data: { user } }
      const u = data.data?.user || data.user
      if (!u) throw new Error('No user in response')
      setUser(u)
      localStorage.setItem('cbt_user', JSON.stringify(u))
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }, [logout])

  useEffect(() => { fetchMe() }, [fetchMe])

  const login = async (credentials) => {
    const { data } = await authService.login(credentials)
    // Backend: POST /auth/login → { success, message, data: { token, user } }
    const token = data.data?.token
    const u = data.data?.user
    if (!token || !u) throw new Error('Invalid login response')
    localStorage.setItem('cbt_token', token)
    localStorage.setItem('cbt_user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const refreshUser = fetchMe

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
