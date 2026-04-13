import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { ArrowLeft, Download, Check, Sparkles, Wrench, AlertTriangle, Info, TrendingUp } from 'lucide-react'

// ─── Color helpers ────────────────────────────────────────────────────────────
const RISK_COLORS = {
  LOW:      { bg: 'rgba(16,185,129,.15)',  border: 'rgba(16,185,129,.4)',  text: '#34d399', icon: '✅' },
  MEDIUM:   { bg: 'rgba(245,158,11,.12)',  border: 'rgba(245,158,11,.35)', text: '#fbbf24', icon: '⚠️' },
  HIGH:     { bg: 'rgba(239,68,68,.12)',   border: 'rgba(239,68,68,.35)',  text: '#f87171', icon: '🚨' },
  CRITICAL: { bg: 'rgba(239,68,68,.2)',    border: 'rgba(239,68,68,.5)',   text: '#ef4444', icon: '🔴' },
}

const SEV_COLORS = {
  LOW:      '#10b981',
  MEDIUM:   '#f59e0b',
  HIGH:     '#f97316',
  CRITICAL: '#ef4444',
}

const BAR_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f97316']

// ─── SVG Gauge ────────────────────────────────────────────────────────────────
function ScoreGauge({ score }) {
  const r = 54; const cx = 70; const cy = 70
  const circ = 2 * Math.PI * r
  const arc = circ * 0.75
  const offset = arc - (score / 100) * arc
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'

  return (
    <svg width="140" height="140" style={{ transform: 'rotate(135deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${arc - offset} ${circ - (arc - offset)}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1.2s ease', filter: `drop-shadow(0 0 8px ${color})` }}
      />
    </svg>
  )
}

// ─── Metric Badge ─────────────────────────────────────────────────────────────
function MetricItem({ label, value, passes, threshold, unit = '' }) {
  return (
    <div className="metric-item">
      <div className="m-label">{label}</div>
      <div className="m-value" style={{ color: passes ? '#10b981' : '#ef4444' }}>
        {typeof value === 'number' ? value.toFixed(3) : value}{unit}
      </div>
      <div className={`m-status ${passes ? 'pass' : 'fail'}`}>
        {passes ? '✓ Passes' : '✗ Fails'} · threshold {threshold}
      </div>
    </div>
  )
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function MarkdownBlock({ children, style }) {
  if (!children) return null
  return (
    <div className="md-block" style={style}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  )
}

// ─── Main Report ─────────────────────────────────────────────────────────────
export default function Report() {
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [activeTab, setActiveTab] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('fairsight_report')
    if (!raw) { navigate('/audit'); return }
    const parsed = JSON.parse(raw)
    setReport(parsed)

    // Auto-save to history
    try {
      const hist = JSON.parse(localStorage.getItem('fairsight_history') || '[]')
      const entry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        score: parsed.overall_score,
        risk: parsed.risk_level,
        attrs: Object.keys(parsed.attributes || {}),
        rows: parsed.dataset_stats?.total_rows,
        report: parsed,
      }
      hist.unshift(entry)
      // Keep only last 10
      localStorage.setItem('fairsight_history', JSON.stringify(hist.slice(0, 10)))
      setSaved(true)
    } catch (_) {}
  }, [navigate])

  const [downloading, setDownloading] = useState(false)

  async function handleDownloadDebiased() {
    if (!report?.session_id) {
       toast.error("Session ID is missing to run debias.")
       return
    }
    setDownloading(true)
    try {
      const res = await fetch('http://localhost:8000/debias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: report.session_id,
          target_column: report.target_column,
          protected_attributes: report.protected_attributes || Object.keys(report.attributes || {})
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      
      const blob = new Blob([data.csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `debiased_dataset.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Debiased dataset downloaded!')
    } catch (e) {
      toast.error('Debiasing failed: ' + e.message)
    } finally {
      setDownloading(false)
    }
  }

  if (!report) return null

  const risk = RISK_COLORS[report.risk_level] || RISK_COLORS.MEDIUM
  const attrs = Object.entries(report.attributes || {})
  const stats = report.dataset_stats || {}

  // Build radar data for overall metrics comparison
  const radarData = attrs.map(([attr, data]) => ({
    attr: attr,
    DI: Math.round((data.disparate_impact_ratio || 0) * 100),
    DP: Math.round(Math.max(0, 1 - (data.demographic_parity_gap || 0)) * 100),
  }))

  return (
    <div className="report-page fade-up">
      {/* ── Nav ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <Link to="/audit" className="btn btn-outline btn-sm"><ArrowLeft size={14} /> New Audit</Link>
        <h1 style={{ marginBottom: 0, flex: 1 }}>Bias Audit Report</h1>
        {saved && (
          <span style={{ fontSize: '.78rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Check size={13} /> Saved to history
          </span>
        )}
        <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
          <Download size={14} /> Export PDF
        </button>
      </div>

      <div className="report-layout">
        {/* ── TOC Sidebar ── */}
        <div className="toc-sidebar">
          <div style={{ fontSize: '.8rem', textTransform: 'uppercase', color: 'var(--text-sub)', fontWeight: 700, padding: '0 16px', marginBottom: '8px', letterSpacing: '1px' }}>Contents</div>
          <button className="toc-link" onClick={() => document.getElementById('overview').scrollIntoView({ behavior: 'smooth' })}>Score & Overview</button>
          {report.gemini_summary && <button className="toc-link" onClick={() => document.getElementById('insight').scrollIntoView({ behavior: 'smooth' })}>AI Executive Summary</button>}
          {report.gemini_compliance && <button className="toc-link" onClick={() => document.getElementById('compliance').scrollIntoView({ behavior: 'smooth' })}>Legal Compliance</button>}
          {radarData.length > 1 && <button className="toc-link" onClick={() => document.getElementById('comparison').scrollIntoView({ behavior: 'smooth' })}>Metrics Comparison</button>}
          <button className="toc-link" onClick={() => document.getElementById('attributes').scrollIntoView({ behavior: 'smooth' })}>Attribute Analysis</button>
          {report.gemini_fixes && <button className="toc-link" onClick={() => document.getElementById('fixes').scrollIntoView({ behavior: 'smooth' })}>AI Fix Suggestions</button>}
        </div>

        {/* ── Main Content ── */}
        <div className="report-content">
          <div id="overview" style={{ scrollMarginTop: '100px' }}>
            <div className="stats-row">
        {[
          { val: stats.total_rows?.toLocaleString(), lab: 'Total Rows', icon: '📊' },
          { val: stats.total_columns,                lab: 'Columns',    icon: '🗂️' },
          { val: attrs.length,                       lab: 'Attributes Audited', icon: '🛡️' },
          { val: `${report.overall_score}/100`,      lab: 'Fairness Score', icon: '🎯' },
        ].map((s, i) => (
          <div className="stat-card glass" key={i}>
            <div style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{s.icon}</div>
            <div className="s-val gradient-text">{s.val}</div>
            <div className="s-lab">{s.lab}</div>
          </div>
        ))}
      </div>

      {/* ── Score Hero ── */}
      <div className="score-hero">
        <div className="score-circle-wrap">
          <ScoreGauge score={report.overall_score} />
          <div className="score-label">
            <span className="score-num" style={{ color: risk.text }}>{report.overall_score}</span>
            <span className="score-of">/ 100</span>
          </div>
        </div>
        <div className="score-info">
          <div className="risk-badge" style={{ background: risk.bg, border: `1px solid ${risk.border}`, color: risk.text }}>
            {risk.icon} {report.risk_level} RISK
          </div>
          <h2>Overall Fairness Score: <span style={{ color: risk.text }}>{report.overall_score}</span></h2>
          <p style={{ color: 'var(--text-sub)', lineHeight: 1.7 }}>
            {report.overall_score >= 80 && 'Your dataset shows low bias across the analyzed attributes. Minor improvements may still be worth pursuing.'}
            {report.overall_score >= 60 && report.overall_score < 80 && 'Moderate bias detected. Some protected groups are being disadvantaged. Review the findings below and implement the suggested fixes.'}
            {report.overall_score >= 40 && report.overall_score < 60 && 'Significant bias found. Multiple protected groups are being systematically disadvantaged. Immediate action is recommended before deployment.'}
            {report.overall_score < 40 && 'Critical bias detected. This dataset or model exhibits severe discrimination that could cause real-world harm. Do not deploy without addressing these issues.'}
          </p>

          {/* Mini severity breakdown */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
            {attrs.map(([attr, data]) => {
              const c = SEV_COLORS[data.severity] || '#f59e0b'
              return (
                <span key={attr} style={{ padding: '4px 12px', borderRadius: '100px', background: `${c}22`, border: `1px solid ${c}55`, fontSize: '.76rem', fontWeight: 700, color: c }}>
                  {attr}: {data.severity}
                </span>
              )
            })}
          </div>
        </div>
      </div>
      </div> {/* Closing overview */}

      {/* ── Gemini Executive Summary ── */}
      {report.gemini_summary && (
        <div id="insight" className="gemini-card" style={{ scrollMarginTop: '100px' }}>
          <div className="gemini-card-header">
            <span className="gemini-logo">✨</span>
            <h3>Gemini AI Executive Summary</h3>
          </div>
          <MarkdownBlock>{report.gemini_summary}</MarkdownBlock>
        </div>
      )}

      {/* ── Legal & Compliance Section ── */}
      {report.gemini_compliance && (
        <div id="compliance" className="gemini-card" style={{ scrollMarginTop: '100px', background: 'var(--bg-card)', border: '1px solid rgba(6,182,212,0.3)' }}>
          <div className="gemini-card-header">
            <span className="gemini-logo">⚖️</span>
            <h3 style={{ color: 'var(--cyan)' }}>EU AI Act & Legal Compliance</h3>
          </div>
          <MarkdownBlock>{report.gemini_compliance}</MarkdownBlock>
        </div>
      )}

      <div className="divider" />

      {/* ── Multi-attribute Radar (if > 1 attr) ── */}
      {radarData.length > 1 && (
        <div id="comparison" className="attr-card glass" style={{ marginBottom: '24px', scrollMarginTop: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={16} color="var(--indigo)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Fairness Metrics Comparison</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,.08)" />
              <PolarAngleAxis dataKey="attr" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} />
              <Radar name="Disparate Impact (×100)" dataKey="DI" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              <Radar name="Demographic Parity (×100)" dataKey="DP" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} />
              <Tooltip contentStyle={{ background: '#0c0c1e', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', color: '#eef0ff' }} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '8px', fontSize: '.78rem', color: 'var(--text-sub)' }}>
            <span>🟣 Disparate Impact (scaled to 100)</span>
            <span>🔵 Demographic Parity compliance (scaled to 100)</span>
          </div>
        </div>
      )}

      {/* ── Per-attribute results ── */}
      <h2 id="attributes" style={{ marginBottom: '24px', fontSize: '1.4rem', scrollMarginTop: '100px' }}>Attribute Analysis</h2>

      {attrs.map(([attr, data], idx) => {
        const sevColor = SEV_COLORS[data.severity] || '#f59e0b'
        const rates = Object.entries(data.group_positive_rates || {})
        const barData = rates.map(([group, rate]) => ({ group, rate: parseFloat((rate * 100).toFixed(1)) }))
        const repData = Object.entries(data.representation || {}).map(([name, value]) => ({ name, value }))
        const tab = activeTab[attr] || 'overview'

        return (
          <div className="attr-card glass" key={attr} style={{ marginBottom: '20px' }}>
            <div className="attr-header">
              <div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-sub)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Protected Attribute</div>
                <div className="attr-name">{attr}</div>
              </div>
              <div className="severity-badge" style={{ background: `${sevColor}22`, border: `1px solid ${sevColor}66`, color: sevColor }}>
                {data.severity} BIAS
              </div>
            </div>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,.03)', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
              {['overview', 'charts', 'ai-insight'].map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(prev => ({ ...prev, [attr]: t }))}
                  style={{
                    padding: '7px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '.8rem', fontWeight: 600,
                    background: tab === t ? 'var(--indigo)' : 'transparent',
                    color: tab === t ? '#fff' : 'var(--text-sub)',
                    transition: 'all .2s'
                  }}
                >
                  {t === 'overview' ? '📊 Overview' : t === 'charts' ? '📈 Charts' : '✨ AI Insight'}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {tab === 'overview' && (
              <div className="metrics-row">
                <MetricItem
                  label="Demographic Parity Gap"
                  value={data.demographic_parity_gap}
                  passes={data.metrics?.demographic_parity?.passes}
                  threshold="≤ 0.10"
                />
                <MetricItem
                  label="Disparate Impact Ratio"
                  value={data.disparate_impact_ratio}
                  passes={data.metrics?.disparate_impact?.passes}
                  threshold="≥ 0.80"
                />
                <MetricItem
                  label="Equalized Odds (TPR Gap)"
                  value={data.equalized_odds_tpr_gap ?? data.demographic_parity_gap}
                  passes={data.metrics?.equalized_odds?.passes ?? data.metrics?.demographic_parity?.passes}
                  threshold="≤ 0.10"
                />
                <div className="metric-item">
                  <div className="m-label">Most Favoured Group</div>
                  <div className="m-value" style={{ fontSize: '1.1rem', color: '#10b981' }}>{data.most_favoured_group}</div>
                  <div className="m-status pass">{((data.group_positive_rates?.[data.most_favoured_group] || 0) * 100).toFixed(1)}% rate</div>
                </div>
                <div className="metric-item">
                  <div className="m-label">Least Favoured Group</div>
                  <div className="m-value" style={{ fontSize: '1.1rem', color: '#ef4444' }}>{data.least_favoured_group}</div>
                  <div className="m-status fail">{((data.group_positive_rates?.[data.least_favoured_group] || 0) * 100).toFixed(1)}% rate</div>
                </div>
                <div className="metric-item">
                  <div className="m-label">Representation Balance</div>
                  <div className="m-value" style={{ fontSize: '1rem', color: data.metrics?.representation?.balanced ? '#10b981' : '#f59e0b' }}>
                    {data.metrics?.representation?.balanced ? '✓ Balanced' : '⚠ Imbalanced'}
                  </div>
                  <div className="m-status" style={{ color: 'var(--text-sub)' }}>
                    Δ {data.metrics?.representation?.max_gap?.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}


            {/* Tab: Charts */}
            {tab === 'charts' && (
              <div>
                {barData.length > 0 && (
                  <div className="chart-wrap">
                    <h4>Outcome Rate by Group (%)</h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <XAxis dataKey="group" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ background: '#0c0c1e', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', color: '#eef0ff' }}
                          formatter={v => [`${v}%`, 'Outcome Rate']}
                        />
                        <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                          {barData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {repData.length > 0 && (
                  <div className="chart-wrap">
                    <h4>Group Representation in Dataset</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={repData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name"
                          label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                          {repData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#0c0c1e', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', color: '#eef0ff' }} formatter={v => [`${v}%`, 'Share']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Tab: AI Insight */}
            {tab === 'ai-insight' && (
              <div>
                {data.gemini_explanation ? (
                  <div style={{ padding: '20px', borderRadius: 'var(--r-s)', background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.18)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <span>✨</span>
                      <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#a5b4fc' }}>GEMINI AI EXPLANATION</span>
                    </div>
                    <MarkdownBlock style={{ color: 'var(--text-sub)', lineHeight: 1.8, fontSize: '.93rem' }}>
                      {data.gemini_explanation}
                    </MarkdownBlock>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '.9rem', padding: '20px', textAlign: 'center' }}>
                    No AI explanation available for this attribute.
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* ── Fix Suggestions ── */}
      {report.gemini_fixes && (
        <div id="fixes" className="fixes-card" style={{ scrollMarginTop: '100px' }}>
          <h3><Wrench size={18} color="#10b981" /> AI-Recommended Fixes</h3>
          <p className="sub">Gemini-generated, actionable recommendations to reduce the bias detected in your dataset.</p>
          <MarkdownBlock>{report.gemini_fixes}</MarkdownBlock>
        </div>
      )}

      {/* ── Footer actions ── */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '16px' }}>
        <Link to="/audit" className="btn btn-primary"><ArrowLeft size={16} /> Run Another Audit</Link>
        <Link to="/history" className="btn btn-outline">📜 View History</Link>
        <button className="btn btn-outline" onClick={() => window.print()}><Download size={16} /> Export PDF</button>
        <button className="btn btn-outline" onClick={handleDownloadDebiased} disabled={downloading}>
          <Download size={16} /> {downloading ? 'Processing...' : 'Download Debiased dataset'}
        </button>
      </div>

      <div style={{ marginTop: '48px', padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '.82rem', borderTop: '1px solid var(--border)' }}>
        FairSight AI · Built for Google Solution Challenge 2026 · Powered by <span style={{ color: 'var(--indigo)' }}>Gemini</span>
      </div>
      
        </div> {/* closing report-content */}
      </div> {/* closing report-layout */}

      <ChatWidget report={report} />
    </div>
  )
}

// ─── Floating Chat Widget ──────────────────────────────────────────────────
import { MessageCircle, X, Send } from 'lucide-react'

function ChatWidget({ report }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm FairSight Assistant. Ask me anything about your audit report!" }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const endRef = useRef(null)

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  async function handleSend() {
    if (!input.trim() || isTyping) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setIsTyping(true)

    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, bias_results: report })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ Error: ${e.message}` }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'var(--grad)', border: 'none', color: '#fff',
          boxShadow: '0 10px 25px rgba(99,102,241,0.4)', cursor: 'pointer',
          display: isOpen ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
          width: '360px', height: '520px', borderRadius: 'var(--r-l)',
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', animation: 'fadeUp 0.3s ease'
        }}>
          {/* Header */}
          <div style={{
            background: 'var(--grad)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              <span style={{ fontSize: '1.2rem' }}>✨</span>
              <span style={{ fontWeight: 700, fontSize: '.95rem' }}>FairSight Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%', padding: '10px 14px', borderRadius: '12px',
                background: m.role === 'user' ? 'var(--indigo)' : 'var(--bg-card)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                color: m.role === 'user' ? '#fff' : 'var(--text)',
                borderBottomRightRadius: m.role === 'user' ? '2px' : '12px',
                borderBottomLeftRadius: m.role === 'assistant' ? '2px' : '12px',
              }}>
                <MarkdownBlock style={{ fontSize: '.88rem', margin: 0, color: 'inherit' }}>{m.text}</MarkdownBlock>
              </div>
            ))}
            {isTyping && (
              <div style={{
                alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '12px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderBottomLeftRadius: '2px', color: 'var(--text-sub)', fontSize: '.88rem'
              }}>
                <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px', display: 'inline-block', marginRight: '6px' }} />
                Thinking...
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about this audit..."
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 'var(--r-s)',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                color: 'var(--text)', outline: 'none', fontSize: '.9rem'
              }}
            />
            <button
              onClick={handleSend}
              disabled={isTyping}
              style={{
                width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--indigo)', border: 'none', borderRadius: 'var(--r-s)',
                color: '#fff', cursor: 'pointer'
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
