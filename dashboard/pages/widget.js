import { useState, useEffect } from 'react'
import Layout from '../components/Layout'

export default function WidgetPage() {
  const [copied, setCopied] = useState('')
  const [sites, setSites] = useState([])
  const [selectedId, setSelectedId] = useState(1)
  const [apiUrl, setApiUrl] = useState('http://localhost:8000')

  useEffect(() => {
    fetch('/api/sites').then(r => r.json()).then(d => {
      setSites(d)
      if (d.length) setSelectedId(d[0].id)
    }).catch(() => {})
  }, [])

  const script = `<script>
window.REPLYGIVER_SITE_ID = ${selectedId};
window.REPLYGIVER_API_URL = '${apiUrl}';
</script>
<script src="${apiUrl}/api/widget.js"></script>`

  const copy = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <Layout>
      <div className="top"><h1>Widget</h1></div>
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>Embed on Your Site</h2>
        <p style={{ color: '#687076', fontSize: 14, marginBottom: 8 }}>
          Paste this just before <code>&lt;/body&gt;</code> on any HTML page:
        </p>
        <div className="copy-snip">
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, flex: 1 }}>{script}</pre>
          <button className="cp" onClick={() => copy(script, 'script')}>
            {copied === 'script' ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>Configuration</h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12, color: '#687076', fontWeight: 600, display: 'block', marginBottom: 4 }}>Site ID</label>
            <select value={selectedId} onChange={e => setSelectedId(Number(e.target.value))}>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name} (ID: {s.id})</option>)}
              {sites.length === 0 && <option value={1}>Default (no sites yet)</option>}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12, color: '#687076', fontWeight: 600, display: 'block', marginBottom: 4 }}>API URL</label>
            <input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="http://localhost:8000" />
          </div>
        </div>
      </div>
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>Preview</h2>
        <div style={{ background: '#f8f9fa', border: '1px solid #e4e8ec', borderRadius: 8, padding: 24, position: 'relative', minHeight: 200 }}>
          <div style={{
            position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
            borderRadius: '50%', background: '#11181c', display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.1)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div style={{ color: '#687076', fontSize: 13, textAlign: 'center', paddingTop: 60 }}>
            Chat bubble will appear bottom-right on your site
          </div>
        </div>
      </div>
    </Layout>
  )
}
