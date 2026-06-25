import { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import axios from 'axios'
import ResultsGallery from './components/ResultsGallery'

const API = import.meta.env.VITE_API_URL || '/api'

// ── Animated Score Ring ───────────────────────────────
function ScoreRing() {
  const [score, setScore] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => {
      let s = 0
      const interval = setInterval(() => {
        s += 4
        if (s >= 742) { setScore(742); clearInterval(interval) }
        else setScore(s)
      }, 16)
      return () => clearInterval(interval)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const pct = score / 850
  const r = 80
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  const color = score < 580 ? '#ef4444' : score < 670 ? '#f97316' : score < 740 ? '#eab308' : '#22c55e'

  return (
    <div className="flex flex-col items-center">
      <svg width="220" height="220" viewBox="0 0 220 220">
        <circle cx="110" cy="110" r={r} fill="none" stroke="#1e3a5f" strokeWidth="16" />
        <circle cx="110" cy="110" r={r} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25}
          style={{ transition: 'stroke-dasharray 0.05s, stroke 0.3s' }} />
        <text x="110" y="100" textAnchor="middle" fill={color} fontSize="42" fontWeight="800" fontFamily="Syne">{score}</text>
        <text x="110" y="126" textAnchor="middle" fill="#94a3b8" fontSize="13" fontFamily="Inter">Credit Score</text>
        <text x="110" y="148" textAnchor="middle" fill="#22c55e" fontSize="12" fontFamily="Inter">EXCELLENT</text>
      </svg>
    </div>
  )
}

// ── Header ────────────────────────────────────────────
function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = ['How It Works', 'Services', 'Results', 'Testimonials', 'About']

  const scrollTo = (id) => {
    const el = document.getElementById(id.toLowerCase().replace(/ /g, '-'))
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a1628]/95 backdrop-blur-sm shadow-lg shadow-black/20' : ''}`}
      initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="font-syne font-bold text-2xl">
          <span className="text-white">Score</span><span className="text-[#22c55e]">Plug</span>
        </div>
        <nav className="hidden md:flex gap-8">
          {links.map(l => (
            <button key={l} onClick={() => scrollTo(l)} className="text-slate-300 hover:text-[#22c55e] transition-colors text-sm font-medium">{l}</button>
          ))}
        </nav>
        <button onClick={() => scrollTo('Get Started')} className="hidden md:block bg-[#22c55e] text-[#0a1628] px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#16a34a] transition-colors">
          Free Analysis
        </button>
        <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="space-y-1.5">
            <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </div>
        </button>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0d1f3c] border-t border-slate-700 px-6 py-4 flex flex-col gap-4">
            {links.map(l => (
              <button key={l} onClick={() => scrollTo(l)} className="text-slate-300 text-left text-sm font-medium py-1">{l}</button>
            ))}
            <button onClick={() => scrollTo('Get Started')} className="bg-[#22c55e] text-[#0a1628] py-2 rounded-full text-sm font-semibold">Free Analysis</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

function Section({ children, id, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section id={id} ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className={className}>
      {children}
    </motion.section>
  )
}

// ── Lead Form ─────────────────────────────────────────
function LeadForm() {
  const [form, setForm] = useState({ first_name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    if (!form.first_name || !form.email || !form.phone) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      await axios.post(`${API}/leads`, form)
      setSubmitted(true)
      toast.success('You\'re on the list! We\'ll be in touch soon.')
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('This email is already registered!')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="font-syne text-2xl font-bold text-[#22c55e] mb-2">You're In!</h3>
        <p className="text-slate-400">We'll reach out within 24 hours with your free credit analysis.</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <input type="text" placeholder="First Name" value={form.first_name}
        onChange={e => setForm({ ...form, first_name: e.target.value })}
        className="w-full bg-[#0d1f3c] border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e] transition-colors" />
      <input type="email" placeholder="Email Address" value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
        className="w-full bg-[#0d1f3c] border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e] transition-colors" />
      <input type="tel" placeholder="Phone Number" value={form.phone}
        onChange={e => setForm({ ...form, phone: e.target.value })}
        className="w-full bg-[#0d1f3c] border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e] transition-colors" />
      <button type="submit" disabled={loading}
        className="w-full bg-[#22c55e] text-[#0a1628] py-4 rounded-xl font-syne font-bold text-lg hover:bg-[#16a34a] transition-colors disabled:opacity-60">
        {loading ? 'Submitting...' : 'Get My Free Credit Analysis →'}
      </button>
      <p className="text-center text-slate-500 text-xs">No credit card required. 100% free analysis.</p>
    </form>
  )
}

// ── Pricing ───────────────────────────────────────────
const plans = [
  {
    name: 'Basic',
    label: null,
    labelColor: null,
    price: '$129.99',
    period: '/mo',
    sub: 'Monthly — Cancel Anytime',
    description: 'Perfect for getting started. Clean up your credit one month at a time.',
    features: ['3-bureau dispute letters', 'Negative item removal', 'Monthly progress report', 'Email support'],
    popular: false,
    cta: 'Get Started',
  },
  {
    name: 'Best Value',
    label: 'BEST VALUE',
    labelColor: 'bg-[#22c55e] text-[#0a1628]',
    price: '$399.99',
    period: '',
    sub: '6-Month Service — Save $380',
    description: 'Our most popular plan. Commit to 6 months and save big while getting real results.',
    features: ['Everything in Basic', '6 months of disputes', 'Priority processing', 'Credit building roadmap', 'Funding strategy session'],
    popular: true,
    cta: 'Get Best Value',
  },
  {
    name: 'Fastest',
    label: 'FASTEST',
    labelColor: 'bg-[#0ea5e9] text-white',
    price: '$499.99',
    period: '',
    sub: '90-Day Expedited',
    description: 'Need results fast? Our 90-day sprint gets you maximum score improvement in minimum time.',
    features: ['Everything in Best Value', '90-day rapid disputes', 'Weekly progress updates', 'Expedited processing', 'Direct line to your advisor'],
    popular: false,
    cta: 'Fast Track Me',
  },
  {
    name: 'Power Couple',
    label: 'COUPLES',
    labelColor: 'bg-yellow-400 text-[#0a1628]',
    price: '$897.99',
    period: '',
    sub: 'Dual Credit Repair — Save $300',
    description: 'Fix both your credit scores together. Perfect for couples ready to buy a home or get funded.',
    features: ['2 complete credit sweeps', 'His & hers roadmaps', 'Joint funding strategy', 'Couples priority support', 'Home buying prep'],
    popular: false,
    cta: 'Get Couple Plan',
  },
]

function Pricing() {
  return (
    <Section id="services" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-syne text-4xl font-bold mb-4">Simple, <span className="gradient-text">Transparent Pricing</span></h2>
          <p className="text-slate-400 max-w-xl mx-auto">No hidden fees. No contracts on monthly. Choose the plan that fits your situation.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 border flex flex-col transition-all hover:scale-105 ${plan.popular ? 'bg-[#0d2a1a] border-[#22c55e] shadow-lg shadow-[#22c55e]/10' : 'bg-[#0d1f3c] border-slate-700'}`}>
              {plan.label && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full ${plan.labelColor}`}>
                  {plan.label}
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-syne text-lg font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-slate-500 text-xs">{plan.sub}</p>
              </div>
              <div className="mb-4">
                <span className="font-syne text-3xl font-extrabold text-white">{plan.price}</span>
                <span className="text-slate-400 text-sm">{plan.period}</span>
              </div>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">{plan.description}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-slate-300 text-sm">
                    <span className="text-[#22c55e] mt-0.5 flex-shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' })}
                className={`w-full py-3 rounded-xl font-syne font-bold text-sm transition-colors ${plan.popular ? 'bg-[#22c55e] text-[#0a1628] hover:bg-[#16a34a]' : 'border border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10'}`}>
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-slate-600 text-xs mt-8">All plans include a free credit analysis before you pay. Results may vary.</p>
      </div>
    </Section>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a1628]">
      <Header />

      {/* Hero */}
      <section className="min-h-screen flex items-center pt-20 px-6">
        <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-block bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
              Credit Repair & Building
            </div>
            <h1 className="font-syne text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Your Credit Score<br /><span className="gradient-text">Doesn't Define You.</span>
            </h1>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              We help real people with damaged credit take back control. Custom repair plans, expert guidance, and results you can see in 90 days.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              {['🚀 Results in 90 Days', '🔒 100% Secure', '💳 No Upfront Fees'].map(s => (
                <span key={s} className="text-sm text-slate-300 bg-[#0d1f3c] px-4 py-2 rounded-full border border-slate-700">{s}</span>
              ))}
            </div>
            <button onClick={() => document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#22c55e] text-[#0a1628] px-8 py-4 rounded-full font-syne font-bold text-lg hover:bg-[#16a34a] transition-all hover:scale-105 shadow-lg shadow-[#22c55e]/20">
              Get Your Free Analysis →
            </button>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="flex flex-col items-center">
            <ScoreRing />
            <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-sm">
              {[['500+', 'Clients Helped'], ['90', 'Day Results'], ['4.9★', 'Rating']].map(([n, l]) => (
                <div key={l} className="text-center bg-[#0d1f3c] rounded-xl p-4 border border-slate-700">
                  <div className="font-syne font-bold text-xl text-[#22c55e]">{n}</div>
                  <div className="text-slate-500 text-xs mt-1">{l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <Section id="how-it-works" className="py-24 px-6 bg-[#0d1f3c]/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-syne text-4xl font-bold mb-4">How It <span className="gradient-text">Works</span></h2>
            <p className="text-slate-400 max-w-xl mx-auto">Three simple steps to start rebuilding your credit.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '01', title: 'Free Analysis', desc: 'We pull and review your full credit report across all 3 bureaus — no cost, no obligation.' },
              { n: '02', title: 'Custom Plan', desc: 'Get a personalized dispute and rebuild strategy tailored to your specific credit situation.' },
              { n: '03', title: 'See Results', desc: 'Watch your score climb as we dispute errors, negotiate with creditors, and build positive history.' },
            ].map((step, i) => (
              <motion.div key={step.n} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="bg-[#0a1628] rounded-2xl p-8 border border-slate-700 hover:border-[#22c55e]/50 transition-colors">
                <div className="font-syne text-5xl font-extrabold text-[#22c55e]/20 mb-4">{step.n}</div>
                <h3 className="font-syne text-xl font-bold mb-3 text-white">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Pricing />

      {/* Results Gallery */}
      <ResultsGallery />

      {/* Testimonials */}
      <Section id="testimonials" className="py-24 px-6 bg-[#0d1f3c]/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-syne text-4xl font-bold mb-4">Real <span className="gradient-text">Results</span></h2>
            <p className="text-slate-400">Don't take our word for it — hear from people we've actually helped.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Marcus T.', location: 'Chicago, IL', score: '+187 points', quote: 'I went from 512 to 699 in just 4 months. Score Plug got 6 collections removed from my report. I qualified for my first apartment without a cosigner!' },
              { name: 'Destiny R.', location: 'Atlanta, GA', score: '+210 points', quote: 'They took me from 480 to 690. I can finally apply for a car loan without getting laughed at. The team genuinely cares and keeps you updated the whole time.' },
              { name: 'James W.', location: 'Houston, TX', score: '+156 points', quote: 'Went from 540 to 696. Got approved for a mortgage pre-approval after working with Score Plug for 6 months. Life changing results, real people.' },
            ].map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="bg-[#0a1628] rounded-2xl p-8 border border-slate-700">
                <div className="text-[#22c55e] font-syne font-bold text-2xl mb-4">{t.score}</div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-slate-500 text-sm">{t.location}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* About */}
      <Section id="about" className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-syne text-4xl font-bold mb-6">We've Been <span className="gradient-text">Where You Are</span></h2>
            <p className="text-slate-400 leading-relaxed mb-6">Score Plug was built by people who know what it feels like to be denied — for apartments, cars, loans — because of a number. We turned that frustration into a mission.</p>
            <p className="text-slate-400 leading-relaxed mb-8">Today we've helped over 500 clients across the country repair their credit, build financial confidence, and open doors that were once closed to them.</p>
            <div className="grid grid-cols-2 gap-4">
              {[['Licensed & Compliant', 'CROA compliant credit repair organization'], ['No Hidden Fees', 'Transparent pricing, no surprises']].map(([t, d]) => (
                <div key={t} className="bg-[#0d1f3c] rounded-xl p-5 border border-slate-700">
                  <div className="text-[#22c55e] text-xl mb-2">✓</div>
                  <h4 className="font-syne font-bold text-sm mb-1">{t}</h4>
                  <p className="text-slate-500 text-xs">{d}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-72 h-72 rounded-full bg-gradient-to-br from-[#22c55e]/20 to-[#0ea5e9]/20 flex items-center justify-center border border-[#22c55e]/20">
              <div className="text-center">
                <div className="font-syne text-6xl font-extrabold gradient-text">500+</div>
                <div className="text-slate-400 mt-2">Lives Changed</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Lead Capture */}
      <Section id="get-started" className="py-24 px-6 bg-[#0d1f3c]/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-syne text-4xl font-bold mb-4">Start Your <span className="gradient-text">Free Analysis</span></h2>
          <p className="text-slate-400 mb-10">Fill out the form below and we'll reach out within 24 hours with your personalized credit repair roadmap.</p>
          <div className="bg-[#0a1628] rounded-2xl p-8 border border-slate-700">
            <LeadForm />
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="font-syne font-bold text-2xl"><span className="text-white">Score</span><span className="text-[#22c55e]">Plug</span></div>
            <div className="flex gap-6">
              {['How It Works', 'Services', 'Testimonials', 'About'].map(l => (
                <button key={l} onClick={() => document.getElementById(l.toLowerCase().replace(/ /g, '-'))?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-slate-500 hover:text-[#22c55e] text-sm transition-colors">{l}</button>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8">
            <p className="text-slate-600 text-xs leading-relaxed max-w-4xl">
              <strong className="text-slate-500">CROA Disclosure:</strong> Score Plug is a credit repair organization as defined under federal and state law. You have the right to dispute inaccurate information in your credit report without the use of a credit repair organization. Results may vary. No specific outcome is guaranteed.
            </p>
            <p className="text-slate-700 text-xs mt-4">© {new Date().getFullYear()} Score Plug LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
