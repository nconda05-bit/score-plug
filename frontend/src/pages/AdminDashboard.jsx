import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || '/api'

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('sp_token')}` }
}

export default function AdminDashboard() {
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState({ total: 0, contacted: 0, new_today: 0 })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchData = async () => {
    try {
      const [leadsRes, statsRes] = await Promise.all([
        axios.get(`${API}/leads`, { headers: authHeaders() }),
        axios.get(`${API}/stats`, { headers: authHeaders() }),
      ])
      setLeads(leadsRes.data)
      setStats(statsRes.data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('sp_token')
        navigate('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('sp_token')
    if (!token) { navigate('/admin/login'); return }
    fetchData()
  }, [])

  const markContacted = async (id) => {
    try {
      await axios.patch(`${API}/leads/${id}/contacted`, {}, { headers: authHeaders() })
      setLeads(leads.map(l => l.id === id ? { ...l, contacted: true } : l))
      toast.success('Marked as contacted')
    } catch {
      toast.error('Failed to update lead')
    }
  }

  const deleteLead = async (id) => {
    if (!confirm('Delete this lead?')) return
    try {
      await axios.delete(`${API}/leads/${id}`, { headers: authHeaders() })
      setLeads(leads.filter(l => l.id !== id))
      setStats(s => ({ ...s, total: s.total - 1 }))
      toast.success('Lead deleted')
    } catch {
      toast.error('Failed to delete lead')
    }
  }

  const logout = () => {
    localStorage.removeItem('sp_token')
    navigate('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-[#22c55e] font-syne text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Header */}
      <header className="bg-[#0d1f3c] border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="font-syne font-bold text-xl">
          <span className="text-white">Score</span><span className="text-[#22c55e]">Plug</span>
          <span className="text-slate-500 text-sm font-normal ml-3">Admin</span>
        </div>
        <div className="flex gap-4 items-center">
          <a href="/" target="_blank" className="text-slate-400 text-sm hover:text-[#22c55e] transition-colors">View Site →</a>
          <button onClick={logout} className="text-slate-400 text-sm hover:text-red-400 transition-colors">Logout</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Leads', value: stats.total, color: 'text-[#22c55e]' },
            { label: 'Contacted', value: stats.contacted, color: 'text-[#0ea5e9]' },
            { label: 'New Today', value: stats.new_today, color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#0d1f3c] rounded-2xl p-6 border border-slate-700">
              <p className="text-slate-400 text-sm mb-2">{s.label}</p>
              <p className={`font-syne text-4xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Leads Table */}
        <div className="bg-[#0d1f3c] rounded-2xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="font-syne font-bold text-lg">All Leads</h2>
            <button onClick={fetchData} className="text-slate-400 text-sm hover:text-[#22c55e] transition-colors">↻ Refresh</button>
          </div>
          {leads.length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-500">
              <div className="text-4xl mb-3">📭</div>
              <p>No leads yet. Share your website to start getting signups!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-700">
                    <th className="text-left px-6 py-3">Name</th>
                    <th className="text-left px-6 py-3">Email</th>
                    <th className="text-left px-6 py-3">Phone</th>
                    <th className="text-left px-6 py-3">Date</th>
                    <th className="text-left px-6 py-3">Status</th>
                    <th className="text-left px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr key={lead.id} className="border-b border-slate-800 hover:bg-[#0a1628]/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{lead.first_name}</td>
                      <td className="px-6 py-4 text-[#0ea5e9] text-sm">{lead.email}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{lead.phone}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${lead.contacted ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' : 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'}`}>
                          {lead.contacted ? '✓ Contacted' : '⏳ New'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          {!lead.contacted && (
                            <button
                              onClick={() => markContacted(lead.id)}
                              className="text-xs text-[#22c55e] hover:underline"
                            >
                              Mark Contacted
                            </button>
                          )}
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="text-xs text-red-400 hover:underline"
                          >
                            Delete
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
      </div>
    </div>
  )
}
