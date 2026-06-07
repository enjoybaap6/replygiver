import { useEffect, useState } from 'react'
import Layout from '../components/Layout'

export default function Sites() {
  const [sites, setSites] = useState([])
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => fetch('/api/sites').then(r => r.json()).then(setSites).catch(() => {})
  useEffect(() => { load() }, [])

  const addSite = async (e) => {
    e.preventDefault()
    if (!url) return
    setLoading(true); setMsg('')
    try {
      const r = await fetch('/api/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name: name || url })
      })
      const d = await r.json()
      setMsg(`✅ ${d.status} — ${d.pages || 0} pages, ${d.chunks || 0} chunks`)
      setUrl(''); setName('')
      load()
    } catch {
      setMsg('❌ Failed to index site')
    }
    setLoading(false)
  }

  const deleteSite = async (id) => {
    if (!confirm('Remove this site?')) return
    await fetch(`/api/sites/${id}`, { method: 'DELETE' }).catch(() => {})
    load()
  }

  return (
    <Layout>
      <div className="top"><h1>Sites</h1></div>
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>Add a new site</h2>
        <form onSubmit={addSite} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={{ fontSize: 12, color: '#687076', fontWeight: 600, display: 'block', marginBottom: 4 }}>Docs URL *</label>
            <input placeholder="https://yourproduct.com/help" value={url} onChange={e => setUrl(e.target.value)} required />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ fontSize: 12, color: '#687076', fontWeight: 600, display: 'block', marginBottom: 4 }}>Site Name</label>
            <input placeholder="My Docs" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-p" disabled={loading}>{loading ? 'Indexing...' : 'Index Site'}</button>
        </form>
        {msg && <div style={{ marginTop: 12, fontSize: 13, color: '#687076' }}>{msg}</div>}
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>URL</th><th>Pages</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {sites.length === 0 ? (
              <tr><td colSpan={5} style={{ color: '#687076', textAlign: 'center' }}>No sites yet</td></tr>
            ) : sites.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td style={{ color: '#687076', fontSize: 13 }}>{s.url}</td>
                <td>{s.pages || '-'}</td>
                <td><span className={`status ${s.status}`}>{s.status}</span></td>
                <td><button className="btn btn-s btn-sm" onClick={() => deleteSite(s.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
