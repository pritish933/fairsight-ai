import { useState } from 'react'
import { Check, Copy, Code, Shield, BrainCircuit, Terminal } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Developer() {
  const [activeTab, setActiveTab] = useState('python')

  const codeSnippets = {
    python: `import requests
import json

def fairsight_firewall(session_id, decision, user_attributes):
    \"\"\"
    FairSight Interceptor Guard
    Runs asynchronously alongside your existing prediction model.
    \"\"\"
    try:
        response = requests.post(
            "http://localhost:8000/firewall/evaluate",
            json={
                "session_id": session_id,
                "decision": decision,
                "protected_attributes": user_attributes
            }
        )
        result = response.json()
        
        if result.get("action") == "BLOCK":
            print(f"⚠️ BLOCKED BY FAIRSIGHT: {result.get('reason')}")
            return False # Prevent biased decision
            
        return True # Allow decision
        
    except Exception as e:
        print("Firewall unreachable, failing open sequence...")
        return True

# Example Usage in HR Recruiting System:
ai_decision = model.predict(resume_features) # 0 for Reject, 1 for Hire
user_attrs = {"gender": "Female"}

if fairsight_firewall("demo_session_id_123", ai_decision, user_attrs):
    execute_decision(ai_decision)
else:
    flag_for_human_review(resume_features)`,
    
    node: `const axios = require('axios');

/**
 * FairSight AI Interceptor Middleware
 */
async function fairSightFirewall(sessionId, decision, userAttributes) {
  try {
    const { data } = await axios.post('http://localhost:8000/firewall/evaluate', {
      session_id: sessionId,
      decision: decision,
      protected_attributes: userAttributes
    });

    if (data.action === 'BLOCK') {
      console.error(\`⚠️ BLOCKED BY FAIRSIGHT: \${data.reason}\`);
      return false; // Safely block the biased outcome
    }

    return true; // Outcome aligns with fairness constraints
  } catch (error) {
    console.error('FairSight API error. Failing safely...');
    return true;
  }
}

// Example usage in an Express route
app.post('/api/approve-loan', async (req, res) => {
  const { userId, loanDetails, userAttributes } = req.body;
  
  const score = mlModel.predict(loanDetails); // 0 (Deny) or 1 (Approve)
  
  const isFair = await fairSightFirewall('session_id_abc', score, userAttributes);
  
  if (!isFair) {
    return res.status(403).json({ 
      error: 'Decision intercepted by FairSight AI due to bias risk. Escalated to human review.' 
    });
  }
  
  res.json({ success: true, decision: score });
});`
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab])
    toast.success('Code copied to clipboard!')
  }

  return (
    <div className="report-page fade-up">
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>Developer <span className="gradient-text">API</span></h1>
        <p className="page-sub" style={{ maxWidth: '700px', margin: '0 auto' }}>
          Integrate the FairSight AI Safety Firewall directly into your production systems. 
          Intercept and prevent biased decisions in real-time before they impact humans.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '60px' }}>
        <div className="feature-card glass" style={{ borderTop: '4px solid var(--indigo)' }}>
          <div style={{ background: 'rgba(99,102,241,0.1)', padding: '12px', borderRadius: '12px', width: 'fit-content', marginBottom: '20px' }}>
            <Shield size={24} color="var(--indigo)" />
          </div>
          <h3>Live Interception</h3>
          <p style={{ fontSize: '.95rem' }}>Send model outputs to our `/firewall/evaluate` endpoint. If a decision violates demographic parity or disparate impact limits flag-checked from the audit, the API instantly returns a BLOCK signal.</p>
        </div>
        
        <div className="feature-card glass" style={{ borderTop: '4px solid var(--cyan)' }}>
          <div style={{ background: 'rgba(6,182,212,0.1)', padding: '12px', borderRadius: '12px', width: 'fit-content', marginBottom: '20px' }}>
            <BrainCircuit size={24} color="var(--cyan)" />
          </div>
          <h3>Zero-Latency Caching</h3>
          <p style={{ fontSize: '.95rem' }}>The Firewall operates on an extremely fast in-memory Redis-like `_bias_cache`. It maps live requests to pre-computed statistical audit limits in under 5ms, ensuring no slowdown to your UX.</p>
        </div>
        
        <div className="feature-card glass" style={{ borderTop: '4px solid var(--green)' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', padding: '12px', borderRadius: '12px', width: 'fit-content', marginBottom: '20px' }}>
            <Terminal size={24} color="var(--green)" />
          </div>
          <h3>Graceful Failsafe</h3>
          <p style={{ fontSize: '.95rem' }}>The API is designed for graceful failure. If FairSight is unreachable, your systems automatically fail-open. You control the ultimate business logic based on the BLOCK or ALLOW signal.</p>
        </div>
      </div>

      {/* Code Section */}
      <div className="glass" style={{ borderRadius: 'var(--r-l)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('python')}
              style={{
                background: activeTab === 'python' ? 'var(--indigo)' : 'transparent',
                border: activeTab === 'python' ? 'none' : '1px solid var(--border)',
                color: '#fff', padding: '6px 16px', borderRadius: 'var(--r-s)', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 500, fontSize: '.9rem', transition: 'all .2s'
              }}
            >
              Python
            </button>
            <button 
              onClick={() => setActiveTab('node')}
              style={{
                background: activeTab === 'node' ? 'var(--indigo)' : 'transparent',
                border: activeTab === 'node' ? 'none' : '1px solid var(--border)',
                color: '#fff', padding: '6px 16px', borderRadius: 'var(--r-s)', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 500, fontSize: '.9rem', transition: 'all .2s'
              }}
            >
              Node.js
            </button>
          </div>
          <button 
            onClick={handleCopy}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: '.9rem' }}
          >
            <Copy size={16} /> Copy Snippet
          </button>
        </div>
        <div style={{ padding: '24px', background: '#050508', overflowX: 'auto' }}>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '.9rem', color: '#c7d2fe', lineHeight: 1.6 }}>
            <code>{codeSnippets[activeTab]}</code>
          </pre>
        </div>
      </div>
      
    </div>
  )
}
