import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || '/api'
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('sp_token')}` })

const STAGES = ['lead', 'onboarded', 'active', 'completed', 'cancelled']
const STAGE_COLORS = {
  lead: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  onboarded: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  active: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20',
  completed: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  cancelled: 'bg-red-400/10 text-red-400 border-red-400/20',
}

function ClientModal({ client, onClose, onSave }) {
  const [form, setForm] = useState({ ...client })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await axios.patch(`${API}/leads/${client.id}`, form, { headers: auth() })
      toast.success('Client updated!')
      onSave()
      onClose()
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const field = (label, key, type = 'text') => (
    <div>
      <label className="text-slate-400 text-xs mb-1 block">{label}</label>
      <input
        type={type}
        value={form[key] ?? ''}
        onChange={e => setForm({ ...form, [key]: type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })}
        className="w-full bg-[#0a1628] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#22c55e]"
      />
    </div>
  )

  const scoreChange = (before, current) => {
    if (!before || !current) return null
    const diff = current - before
    return diff > 0 ? `+${diff}` : `${diff}`
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-[#0d1f3c] rounded-2xl border border-slate-700 w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="font-syne text-xl font-bold">{form.first_name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-6 space-y-6">

          {/* Basic Info */}
          <div>
            <h3 className="font-syne font-bold text-sm text-[#22c55e] mb-3 uppercase tracking-wider">Contact Info</h3>
            <div className="grid grid-cols-2 gap-3">
              {field('First Name', 'first_name')}
              {field('Phone', 'phone')}
              {field('Email', 'email')}
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="font-syne font-bold text-sm text-[#22c55e] mb-3 uppercase tracking-wider">Status</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Stage</label>
                <select value={form.stage || 'lead'} onChange={e => setForm({ ...form, stage: e.target.value })} className="w-full bg-[#0a1628] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#22c55e]">
                  {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Assigned To</label>
                <select value={form.assigned_to || 'unassigned'} onChange={e => setForm({ ...form, assigned_to: e.target.value })} className="w-full bg-[#0a1628] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#22c55e]">
                  <option value="unassigned">Unassigned</option>
                  <option value="nasir">Nasir</option>
                  <option value="partner">Partner</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Payment Status</label>
                <select value={form.payment_status || 'unpaid'} onChange={e => setForm({ ...form, payment_status: e.target.value })} className="w-full bg-[#0a1628] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#22c55e]">
                  <option value="unpaid">Unpaid</option>
                  <option value="onboarding_paid">Onboarding Paid</option>
                  <option value="monthly_active">Monthly Active</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-3">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.onboarding_fee_paid || false} onChange={e => setForm({ ...form, onboarding_fee_paid: e.target.checked })} className="w-4 h-4 accent-[#22c55e]" />
                Onboarding Fee Paid
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.monthly_fee_active || false} onChange={e => setForm({ ...form, monthly_fee_active: e.target.checked })} className="w-4 h-4 accent-[#22c55e]" />
                Monthly Active
              </label>
            </div>
          </div>

          {/* Credit Scores */}
          <div>
            <h3 className="font-syne font-bold text-sm text-[#22c55e] mb-3 uppercase tracking-wider">Credit Scores</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0a1628] rounded-xl p-3 border border-slate-700">
                <p className="text-slate-500 text-xs mb-2">Equifax</p>
                {field('Before', 'score_eq_before', 'number')}
                {field('Current', 'score_eq_current', 'number')}
                {form.score_eq_before && form.score_eq_current && (
                  <p className={`text-center font-bold mt-1 ${form.score_eq_current > form.score_eq_before ? 'text-[#22c55e]' : 'text-red-400'}`}>
                    {scoreChange(form.score_eq_before, form.score_eq_current)}
                  </p>
                )}
              </div>
              <div className="bg-[#0a1628] rounded-xl p-3 border border-slate-700">
                <p className="text-slate-500 text-xs mb-2">Experian</p>
                {field('Before', 'score_ex_before', 'number')}
                {field('Current', 'score_ex_current', 'number')}
                {form.score_ex_before && form.score_ex_current && (
                  <p className={`text-center font-bold mt-1 ${form.score_ex_current > form.score_ex_before ? 'text-[#22c55e]' : 'text-red-400'}`}>
                    {scoreChange(form.score_ex_before, form.score_ex_current)}
                  </p>
                )}
              </div>
              <div className="bg-[#0a1628] rounded-xl p-3 border border-slate-700">
                <p className="text-slate-500 text-xs mb-2">TransUnion</p>
                {field('Before', 'score_tu_before', 'number')}
                {field('Current', 'score_tu_current', 'number')}
                {form.score_tu_before && form.score_tu_current && (
                  <p className={`text-center font-bold mt-1 ${form.score_tu_current > form.score_tu_before ? 'text-[#22c55e]' : 'text-red-400'}`}>
                    {scoreChange(form.score_tu_before, form.score_tu_current)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div>
            <h3 className="font-syne font-bold text-sm text-[#22c55e] mb-3 uppercase tracking-wider">Progress</h3>
            <div className="grid grid-cols-2 gap-3">
              {field('Disputes Sent', 'disputes_sent', 'number')}
              {field('Items Removed', 'items_removed', 'number')}
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="font-syne font-bold text-sm text-[#22c55e] mb-3 uppercase tracking-wider">Notes</h3>
            <textarea
              value={form.notes || ''}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Add notes about this client..."
              className="w-full bg-[#0a1628] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#22c55e] resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-400 text-sm hover:text-white transition-colors">Cancel</button>
          <button onClick={save} disabled={saving} className="px-6 py-2 rounded-lg bg-[#22c55e] text-[#0a1628] font-bold text-sm hover:bg-[#16a34a] transition-colors disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Client'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState({ total: 0, contacted: 0, active: 0, new_today: 0, onboarding_paid: 0, monthly_active: 0 })
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  const fetchData = async () => {
    try {
      const [leadsRes, statsRes] = await Promise.all([
        axios.get(`${API}/leads`, { headers: auth() }),
        axios.get(`${API}/stats`, { headers: auth() }),
      ])
      setLeads(leadsRes.data)
      setStats(statsRes.data)
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem('sp_token'); navigate('/admin/login') }
    } finally { setLoading(false) }
  }

  useEffect(() => {
    if (!localStorage.getItem('sp_token')) { navigate('/admin/login'); return }
    fetchData()
  }, [])

  const deleteLead = async (id) => {
    if (!confirm('Delete this client?')) return
    try {
      await axios.delete(`${API}/leads/${id}`, { headers: auth() })
      setLeads(leads.filter(l => l.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed') }
  }

  const filtered = filter === 'all' ? leads : leads.filter(l => l.stage === filter)

  if (loading) return <div className="min-h-screen bg-[#0a1628] flex items-center justify-center"><div className="text-[#22c55e] font-syne text-xl">Loading...</div></div>

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Header */}
      <header className="bg-[#0d1f3c] border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="font-syne font-bold text-xl"><span className="text-white">Score</span><span className="text-[#22c55e]">Plug</span><span className="text-slate-500 text-sm font-normal ml-3">CRM</span></div>
        <div className="flex gap-4 items-center">
          <a href="/" target="_blank" className="text-slate-400 text-sm hover:text-[#22c55e]">View Site →</a>
          <button onClick={() => { localStorage.removeItem('sp_token'); navigate('/admin/login') }} className="text-slate-400 text-sm hover:text-red-400">Logout</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total Leads', value: stats.total, color: 'text-white' },
            { label: 'New Today', value: stats.new_today, color: 'text-yellow-400' },
            { label: 'Active Clients', value: stats.active, color: 'text-[#22c55e]' },
            { label: 'Contacted', value: stats.contacted, color: 'text-[#0ea5e9]' },
            { label: 'Onboarding Paid', value: stats.onboarding_paid, color: 'text-purple-400' },
            { label: 'Monthly Active', value: stats.monthly_active, color: 'text-[#22c55e]' },
          ].map(s => (
            <div key={s.label} className="bg-[#0d1f3c] rounded-xl p-4 border border-slate-700">
              <p className="text-slate-500 text-xs mb-1">{s.label}</p>
              <p className={`font-syne text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', ...STAGES].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === s ? 'bg-[#22c55e] text-[#0a1628]' : 'bg-[#0d1f3c] text-slate-400 border border-slate-700 hover:text-white'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Clients Table */}
        <div className="bg-[#0d1f3c] rounded-2xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="font-syne font-bold text-lg">Clients ({filtered.length})</h2>
            <button onClick={fetchData} className="text-slate-400 text-sm hover:text-[#22c55e]">↻ Refresh</button>
          </div>
          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-500">
              <div className="text-4xl mb-3">📭</div>
              <p>No clients yet. Share your website!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-700">
                    <th className="text-left px-6 py-3">Client</th>
                    <th className="text-left px-6 py-3">Phone</th>
                    <th className="text-left px-6 py-3">Stage</th>
                    <th className="text-left px-6 py-3">Assigned</th>
                    <th className="text-left px-6 py-3">Payment</th>
                    <th className="text-left px-6 py-3">Scores (EQ/EX/TU)</th>
                    <th className="text-left px-6 py-3">Date</th>
                    <th className="text-left px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => (
                    <tr key={lead.id} className="border-b border-slate-800 hover:bg-[#0a1628]/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{lead.first_name}</p>
                        <p className="text-[#0ea5e9] text-xs">{lead.email}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{lead.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full border ${STAGE_COLORS[lead.stage] || STAGE_COLORS.lead}`}>
                          {lead.stage || 'lead'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm capitalize">{lead.assigned_to || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {lead.onboarding_fee_paid && <span className="text-xs bg-purple-400/10 text-purple-400 px-2 py-0.5 rounded-full">Onboarded</span>}
                          {lead.monthly_fee_active && <span className="text-xs bg-[#22c55e]/10 text-[#22c55e] px-2 py-0.5 rounded-full">Monthly</span>}
                          {!lead.onboarding_fee_paid && !lead.monthly_fee_active && <span className="text-slate-600 text-xs">Unpaid</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {lead.score_eq_current ? (
                          <div className="text-[#22c55e] font-mono text-xs">
                            {lead.score_eq_current}/{lead.score_ex_current}/{lead.score_tu_current}
                          </div>
                        ) : <span className="text-slate-600">Not set</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{new Date(lead.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <button onClick={() => setSelected(lead)} className="text-xs text-[#22c55e] hover:underline">Edit</button>
                          <button onClick={() => deleteLead(lead.id)} className="text-xs text-red-400 hover:underline">Delete</button>
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

      {selected && <ClientModal client={selected} onClose={() => setSelected(null)} onSave={fetchData} />}
    </div>
  )
}
