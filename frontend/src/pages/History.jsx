import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, ExternalLink, Clock } from 'lucide-react'

const SEV_COLORS = {
  LOW:      '#10b981',
  MEDIUM:   '#f59e0b',
  HIGH:     '#f97316',
  CRITICAL: '#ef4444',
}

const RISK_COLORS = {
  LOW:      '#10b981',
  MEDIUM:   '#f59e0b',
  HIGH:     '#f97316',
  CRITICAL: '#ef4444',
}

export default function History() {
  const [history, setHistory] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem('fairsight_history') || '[]')
      setHistory(h)
    } catch (_) {}
  }, [])

  function deleteEntry(id) {
    const updated = history.filter(h => h.id !== id)
    setHistory(updated)
    localStorage.setItem('fairsight_history', JSON.stringify(updated))
  }

  function clearAll() {
    localStorage.removeItem('fairsight_history')
    setHistory([])
  }

  function loadReport(entry) {
    sessionStorage.setItem('fairsight_report', JSON.stringify(entry.report))
    navigate('/report')
  }

  function formatDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="audit-page fade-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <Link to="/" className="btn btn-outline btn-sm"><ArrowLeft size={14} /> Home</Link>
        <h1 className="gradient-text" style={{ flex: 1 }}>Audit History</h1>
        {history.length > 0 && (
          <button className="btn btn-outline btn-sm" onClick={clearAll} style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,.3)' }}>
            <Trash2 size={13} /> Clear All
          </button>
        )}
      </div>
      <p className="page-sub">Your recent bias audit reports, stored locally in your browser.</p>

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-sub)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
          <h3 style={{ marginBottom: '8px', fontWeight: 700 }}>No audits yet</h3>
          <p style={{ fontSize: '.9rem', marginBottom: '24px' }}>Run your first bias audit to see results here.</p>
          <Link to="/audit" className="btn btn-primary">Start an Audit</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {history.map((entry, i) => {
            const scoreColor = entry.score >= 80 ? '#10b981' : entry.score >= 60 ? '#f59e0b' : entry.score >= 40 ? '#f97316' : '#ef4444'
            const riskColor = RISK_COLORS[entry.risk] || '#f59e0b'

            return (
              <div key={entry.id} className="glass" style={{ padding: '20px 24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', cursor: 'pointer' }}
                onClick={() => loadReport(entry)}>

                {/* Score circle */}
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0,
                  background: `conic-gradient(${scoreColor} ${entry.score * 3.6}deg, rgba(255,255,255,.05) 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 20px ${scoreColor}44`
                }}>
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '50%',
                    background: 'var(--bg-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '.95rem', color: scoreColor
                  }}>{entry.score}</div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '100px', background: `${riskColor}22`, border: `1px solid ${riskColor}55`, fontSize: '.73rem', fontWeight: 700, color: riskColor }}>
                      {entry.risk} RISK
                    </span>
                    <span style={{ fontSize: '.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {formatDate(entry.timestamp)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(entry.attrs || []).map(attr => (
                      <span key={attr} style={{ fontSize: '.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99,102,241,.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,.2)' }}>
                        🛡️ {attr}
                      </span>
                    ))}
                    {entry.rows && (
                      <span style={{ fontSize: '.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,.04)', color: 'var(--text-sub)' }}>
                        📊 {entry.rows?.toLocaleString()} rows
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={e => { e.stopPropagation(); loadReport(entry) }}
                  >
                     <ExternalLink size={13} /> View
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,.25)' }}
                    onClick={e => { e.stopPropagation(); deleteEntry(entry.id) }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
