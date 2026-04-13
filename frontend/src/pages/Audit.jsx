import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, CheckCircle, AlertTriangle, Play, Loader2 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = 'http://localhost:8000'

export default function Audit() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [samples, setSamples] = useState([])
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  const [sessionInfo, setSessionInfo] = useState(null)
  const [targetCol, setTargetCol] = useState('')
  const [protectedAttrs, setProtectedAttrs] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get(`${API}/sample-datasets`)
      .then(r => setSamples(r.data))
      .catch(() => {})
  }, [])

  async function handleFile(file) {
    if (!file || !file.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file')
      return
    }
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await axios.post(`${API}/upload`, fd)
      toast.success('Dataset successfully loaded')
      applySession(data)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Upload failed')
    }
  }

  function applySession(data) {
    setSessionInfo(data)
    setTargetCol(data.columns[data.columns.length - 1] || '')
    setProtectedAttrs([])
    setStep(2)
  }

  function toggleAttr(col) {
    setProtectedAttrs(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    )
  }

  async function runAnalysis() {
    if (!targetCol) { toast.error('Select a target column'); return }
    if (protectedAttrs.length === 0) { toast.error('Select at least one attribute to audit'); return }
    
    setLoading(true)
    setStep(3)
    toast('Initializing Neural Audit...', { icon: '🤖' })

    try {
      const { data } = await axios.post(`${API}/analyze`, {
        session_id: sessionInfo.session_id,
        target_column: targetCol,
        protected_attributes: protectedAttrs,
      })
      
      sessionStorage.setItem('fairsight_report', JSON.stringify(data))
      toast.success('Audit successfully complete!')
      navigate('/report')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Analysis failed')
      setLoading(false)
      setStep(2)
    }
  }

  return (
    <div className="audit-page fade-up" style={{ display: 'flex', gap: '60px', alignItems: 'flex-start', maxWidth: '1200px' }}>
      
      {/* ── Visual Left Side ── */}
      <div style={{ flex: '0 0 400px', position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
         <img src="/hologram.jpg" alt="AI Agent HUD" style={{ width: '100%', borderRadius: 'var(--r-l)', border: '1px solid var(--cyan)', boxShadow: '0 0 60px rgba(6,182,212,0.15)', mixBlendMode: 'screen' }} />
         <div style={{ padding: '20px', background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 'var(--r)', color: 'var(--cyan)', fontSize: '13px', fontWeight: 500 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 800 }}>⚡ SYSTEM ONLINE</span>
            FairSight agent awaits your dataset. All uploads are processed locally before secure neural transmission.
         </div>
      </div>

      {/* ── Form Right Side ── */}
      <div style={{ flex: 1 }}>
        <div className="audit-header" style={{ textAlign: 'left', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '12px' }}>Configure <span className="gradient-text">Audit</span></h1>
          <p className="page-sub">Upload your dataset and define the fairness parameters.</p>
        </div>

      <div className="audit-steps">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <div className="step-circle">1</div> Data Source
        </div>
        <div className="step-line" />
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <div className="step-circle">2</div> Parameters
        </div>
        <div className="step-line" />
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <div className="step-circle">3</div> Analyze
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="step-content fade-up">
          <div 
            className={`dropzone ${dragging ? 'drag-over' : ''}`}
            onClick={() => fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault()
              setDragging(false)
              handleFile(e.dataTransfer.files[0])
            }}
          >
            <input 
              ref={fileRef} 
              type="file" 
              accept=".csv" 
              onChange={e => handleFile(e.target.files[0])} 
              style={{ display: 'none' }} 
            />
            <UploadCloud size={48} className="drop-icon" strokeWidth={1} />
            <h3>Drop your CSV file here</h3>
            <p>or click to browse your computer</p>
          </div>

          {samples.length > 0 && (
            <div className="samples-box">
              <p>Or load a sample dataset:</p>
              <div className="samples-list">
                {samples.map(s => (
                  <button 
                    key={s.filename}
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      axios.post(`${API}/load-sample/${s.filename}`)
                        .then(r => applySession(r.data))
                    }}
                  >
                    {s.filename}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 2 && sessionInfo && (
        <div className="step-content fade-up glass">
          <div className="session-info">
            <CheckCircle size={20} className="green" />
            <div>
              <strong>{sessionInfo.filename}</strong> loaded successfully.
              <span className="info-sub">{sessionInfo.rows} rows, {sessionInfo.columns.length} columns</span>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '32px' }}>
            <label>Target Column (Outcome)</label>
            <p className="help-text">Which column represents the prediction or decision? (e.g., "approved", "hired")</p>
            <select className="select-input" value={targetCol} onChange={e => setTargetCol(e.target.value)}>
              <option value="">-- Select Target --</option>
              {sessionInfo.columns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: '24px' }}>
            <label>Protected Attributes</label>
            <p className="help-text">Select one or more columns to check for bias (e.g., "gender", "race")</p>
            <div className="attr-list">
              {sessionInfo.columns.filter(c => c !== targetCol).map(c => (
                <div 
                  key={c}
                  className={`attr-chip ${protectedAttrs.includes(c) ? 'selected' : ''}`}
                  onClick={() => toggleAttr(c)}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" style={{ marginTop: '32px', width: '100%' }} onClick={runAnalysis}>
            <Play size={16} /> Run Full Bias Audit
          </button>
        </div>
      )}

      {/* Step 3: Loading (Skeleton) */}
      {step === 3 && (
        <div className="step-content fade-up" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <Loader2 size={32} className="spin indigo" strokeWidth={1.5} />
            <div>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '4px' }}>Auditing your model...</h2>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>Calculating metrics & generating AI insights.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
            <div className="skeleton-box" style={{ flex: 1, height: '100px' }} />
            <div className="skeleton-box" style={{ flex: 1, height: '100px' }} />
            <div className="skeleton-box" style={{ flex: 1, height: '100px' }} />
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            <div className="skeleton-box" style={{ flex: '0 0 200px', height: '240px' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="skeleton-box" style={{ height: '32px', width: '60%' }} />
              <div className="skeleton-box" style={{ height: '20px', width: '100%' }} />
              <div className="skeleton-box" style={{ height: '20px', width: '90%' }} />
              <div className="skeleton-box" style={{ height: '20px', width: '95%' }} />
              <div className="skeleton-box" style={{ height: '60px', width: '100%', marginTop: 'auto' }} />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
