import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Eye, Zap, FileText } from 'lucide-react'

const features = [
  {
    icon: '📊',
    color: 'rgba(99,102,241,.15)',
    title: 'Multi-Metric Bias Detection',
    desc: 'Analyzes Demographic Parity, Disparate Impact Ratio, Equalized Odds, and Representation Bias simultaneously.',
  },
  {
    icon: '🤖',
    color: 'rgba(139,92,246,.15)',
    title: 'Gemini AI Explanations',
    desc: 'Every bias finding is explained in plain English by Google Gemini — no statistics degree required.',
  },
  {
    icon: '🔧',
    color: 'rgba(6,182,212,.15)',
    title: 'Actionable Fix Suggestions',
    desc: 'Get 5 concrete, technical recommendations to reduce bias in your dataset or model training pipeline.',
  },
  {
    icon: '📄',
    color: 'rgba(16,185,129,.15)',
    title: 'Shareable Audit Reports',
    desc: 'Export a complete bias audit report that you can share with your team, clients, or regulators.',
  },
]

const steps = [
  {
    title: 'Upload Your Dataset',
    desc: 'Drag & drop a CSV file or choose one of our pre-loaded demo datasets.',
  },
  {
    title: 'Configure the Audit',
    desc: 'Select your target column and the protected attributes you want to check for bias.',
  },
  {
    title: 'Get Your Report',
    desc: 'Receive a full fairness audit with AI-powered explanations and fix suggestions in seconds.',
  },
]

export default function Landing() {
  return (
    <div className="landing">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg">
          <video 
            className="hero-video"
            autoPlay 
            loop 
            muted 
            playsInline
          >
            <source src="/kling_20260413_VIDEO_Image1A_ci_3701_0.mp4" type="video/mp4" />
          </video>
          <div className="hero-overlay" />
        </div>

        <div className="hero-content">
          <div className="hero-badge fade-up">
            <span className="badge-dot" />
            Powered by Google Gemini 1.5 Flash
          </div>

          <h1 className="fade-up delay-1" style={{ opacity: 0.95, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
            <span style={{ fontSize: '0.85em' }}>Detect AI Bias.</span><br />
            <span className="gradient-text" style={{ 
               fontStyle: 'italic', 
               fontWeight: 900, 
               textTransform: 'none', 
               letterSpacing: '-0.02em',
               background: 'linear-gradient(135deg, #38bdf8 0%, #e0e7ff 100%)',
               WebkitBackgroundClip: 'text',
               WebkitTextFillColor: 'transparent' 
            }}>Before It Harms People.</span>
          </h1>

          <p className="hero-sub fade-up delay-2" style={{ opacity: 0.75, margin: '0 0 40px 0', maxWidth: '100%' }}>
            FairSight AI audits your datasets and ML models for hidden bias —
            discrimination by gender, race, age, and more — with AI-powered explanations
            and concrete fixes.
          </p>

          <div className="hero-actions fade-up delay-3" style={{ justifyContent: 'flex-start' }}>
            <Link to="/audit" className="btn btn-primary">
              Start Free Audit <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn btn-outline">See How It Works</a>
          </div>

          <div className="hero-stats fade-up delay-4" style={{ justifyContent: 'flex-start' }}>
            <div className="stat-item">
              <span className="stat-num">5+</span>
              <span className="stat-label">Bias Metrics</span>
            </div>
            <div className="stat-div" />
            <div className="stat-item">
              <span className="stat-num">AI</span>
              <span className="stat-label">Plain-Language Reports</span>
            </div>
            <div className="stat-div" />
            <div className="stat-item">
              <span className="stat-num">Free</span>
              <span className="stat-label">Open Source</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use Cases Banner ── */}
      <div style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,.06) 50%, transparent 100%)', padding: '24px 0', margin: '20px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '48px', justifyContent: 'center', flexWrap: 'wrap', padding: '0 24px' }}>
          {['🏢 Hiring & Recruitment', '🏦 Loan & Credit Decisions', '🏥 Medical Trials', '⚖️ Legal Risk Scoring', '🎓 University Admissions'].map(u => (
            <span key={u} style={{ color: 'var(--text-sub)', fontSize: '.9rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{u}</span>
          ))}
        </div>
      </div>

      {/* ── Parallax Wrapper for Features & Metrics ── */}
      <div style={{ 
          position: 'relative', 
          background: 'linear-gradient(to bottom, #000000 0%, rgba(0,0,0,0.7) 15%, rgba(0,0,0,0.7) 85%, #000000 100%), url("/corridor.jpg")', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundAttachment: 'fixed',
          maxWidth: '100%' 
      }}>
        
        {/* ── Features ── */}
        <section className="section" id="features">
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="section-tag" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>What We Detect</div>
            <h2 style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>Everything you need to audit AI fairness</h2>
            <p className="section-sub" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)', color: 'rgba(255,255,255,0.8)' }}>
              Go beyond basic stats. FairSight combines rigorous mathematical bias metrics
              with Gemini's language understanding to give you clear, actionable insights.
            </p>
            <div className="features-grid">
              {features.map((f, i) => (
                <div className="feature-card" key={i} style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="feature-icon" style={{ background: f.color }}>{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bias Types ── */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="section-tag" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Metrics Covered</div>
            <h2 style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>Industry-standard fairness metrics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '16px', marginTop: '32px' }}>
              {[
                { name: 'Demographic Parity', desc: 'Are positive outcomes equally likely across groups?', tag: 'Threshold: Δ ≤ 0.10' },
                { name: 'Disparate Impact Ratio', desc: 'Legal 4/5 rule — ratio of min/max outcome rates.', tag: 'Threshold: ≥ 0.80' },
                { name: 'Representation Bias', desc: 'Is the dataset itself skewed towards certain groups?', tag: 'Balance check' },
                { name: 'Group Outcome Rates', desc: 'Exact acceptance, approval or success rates per group.', tag: 'Per group' },
              ].map((m, i) => (
                <div key={i} style={{ padding: '20px 24px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--r)', background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(16px)' }}>
                  <div style={{ fontSize: '.75rem', color: 'var(--indigo)', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>{m.tag}</div>
                  <h4 style={{ fontWeight: 700, marginBottom: '6px' }}>{m.name}</h4>
                  <p style={{ color: 'var(--text-sub)', fontSize: '.88rem' }}>{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── How it works ── */}
      <section className="section" id="how-it-works" style={{ background: 'rgba(255,255,255,.02)', borderRadius: '32px', margin: '0 24px 0', maxWidth: 'none' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="section-tag">The Process</div>
          <h2>Get your bias audit in 3 steps</h2>
          <div className="steps-row" style={{ marginTop: '40px' }}>
            {steps.map((s, i) => (
              <>
                <div className="step-item" key={i}>
                  <div className="step-num">{i + 1}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
                {i < steps.length - 1 && <div className="step-arrow" key={`arrow-${i}`}>→</div>}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section" style={{ padding: '80px 5%' }}>
        <div className="cta-inner" style={{ 
          margin: '0 auto',
          textAlign: 'center', 
          maxWidth: '1100px',
          padding: '100px 40px',
          background: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url("/handshake.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 'var(--r-l)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 20px 60px rgba(99,102,241,0.3)'
        }}>
          <h2 style={{ fontSize: '3rem', lineHeight: 1.1, marginBottom: '20px', textShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>Ready to audit your AI system?</h2>
          <p style={{ fontSize: '1.2rem', lineHeight: 1.6, maxWidth: '700px', margin: '0 auto 40px auto', color: 'rgba(255,255,255,0.85)', textShadow: '0 2px 8px rgba(0,0,0,1)' }}>
            Upload any CSV and get a complete bias report with AI explanations in under 60 seconds. No sign-up required.
          </p>
          <Link to="/audit" className="btn btn-primary" style={{ padding: '16px 36px', fontSize: '1.2rem', fontWeight: 700, boxShadow: '0 10px 30px rgba(99,102,241,0.4)', border: '1px solid rgba(255,255,255,0.2)' }}>
            Start Free Audit <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        Built for <span>Google Solution Challenge 2026</span> · Powered by <span>Gemini AI</span>
      </footer>
    </div>
  )
}
