import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || '/api'

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post(`${API}/auth/login`, form)
      localStorage.setItem('sp_token', res.data.access_token)
      toast.success('Welcome back!')
      navigate('/admin')
    } catch {
      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-syne font-bold text-3xl mb-2">
            <span className="text-white">Score</span><span className="text-[#22c55e]">Plug</span>
          </div>
          <p className="text-slate-400 text-sm">Admin Dashboard</p>
        </div>
        <div className="bg-[#0d1f3c] rounded-2xl p-8 border border-slate-700">
          <h1 className="font-syne text-2xl font-bold mb-6 text-center">Sign In</h1>
          <form onSubmit={handle} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full bg-[#0a1628] border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e] transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full bg-[#0a1628] border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e] transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#22c55e] text-[#0a1628] py-3 rounded-xl font-syne font-bold hover:bg-[#16a34a] transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
        <p className="text-center mt-6">
          <a href="/" className="text-slate-500 text-sm hover:text-[#22c55e] transition-colors">← Back to website</a>
        </p>
      </div>
    </div>
  )
}
