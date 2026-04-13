import { Link, useLocation } from 'react-router-dom'
import { Shield, ExternalLink, History, Terminal } from 'lucide-react'

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo" style={{ gap: '6px' }}>
        <span className="gradient-text" style={{ fontSize: '26px', letterSpacing: '-0.5px' }}>FairSight</span>
        <span style={{ color: 'var(--text-sub)', fontWeight: 500, fontSize: '18px', paddingTop: '4px' }}>AI</span>
      </Link>

      <div className="navbar-actions">
        <Link to="/history" className={`btn btn-outline btn-sm ${pathname === '/history' ? 'nav-active' : ''}`}>
          <History size={14} />
          <span className="nav-label">History</span>
        </Link>
        <Link to="/developer" className={`btn btn-outline btn-sm ${pathname === '/developer' ? 'nav-active' : ''}`}>
          <Terminal size={14} />
          <span className="nav-label">API</span>
        </Link>
        {pathname !== '/audit' && (
          <Link to="/audit" className="btn btn-primary btn-sm">
            <Shield size={15} />
            Start Audit
          </Link>
        )}
        <a
          href="https://github.com/pritish933/fairsight-ai"
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline btn-sm"
        >
          <ExternalLink size={14} />
          <span className="nav-label">GitHub</span>
        </a>
      </div>
    </nav>
  )
}
