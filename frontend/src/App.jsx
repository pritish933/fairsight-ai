import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Audit from './pages/Audit'
import Report from './pages/Report'
import History from './pages/History'
import Developer from './pages/Developer'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-center" toastOptions={{ 
        style: { background: '#13131c', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' },
        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
      }} />
      <Navbar />
      <Routes>
        <Route path="/"        element={<Landing />} />
        <Route path="/audit"   element={<Audit />} />
        <Route path="/report"  element={<Report />} />
        <Route path="/history" element={<History />} />
        <Route path="/developer" element={<Developer />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
