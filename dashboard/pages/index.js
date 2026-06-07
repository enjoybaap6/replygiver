import { useEffect, useState } from 'react'
import Layout from '../components/Layout'

export default function Overview() {
  const [stats, setStats] = useState({ sites: 0, messages: 0, sessions: 0 })
  const [sites, setSites] = useState([])

  useEffect(() => {
    fetch('/api/sites').then(r => r.json()).then(d => {
      setSites(d)
      setStats(s => ({ ...s, sites: d.length }))
    }).catch(() => {})
    fetch('/api/history?limit=100').then(r => r.json()).then(d => {
      const msgs = d || []
      const sessions = new Set(msgs.map(m => m.session_id)).size
      setStats(s => ({ ...s, messages: msgs.length, sessions }))
    }).catch(() => {})
  }, [])

  return (
    <Layout>
      <div className="top"><h1>Overview</h1></div>
      <div className="grid-3">
        <div className="card stat-card"><div className="num">{stats.sites}</div><div className="lb">Indexed Sites</div></div>
        <div className="card stat-card"><div className="num">{stats.messages}</div><div className="lb">Total Messages</div></div>
        <div className="card stat-card"><div className="num">{stats.sessions}</div><div className="lb">Chat Sessions</div></div>
      </div>
      <div className="card" style={{ marginTop: 8 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Recent Sites</h2>
        {sites.length === 0 ? (
          <div style={{ color: '#687076', fontSize: 14 }}>No sites indexed yet. Go to Sites → Add a site.</div>
        ) : (
          <table>
            <thead><tr><th>Site</th><th>Pages</th><th>Status</th></tr></thead>
            <tbody>
              {sites.slice(0, 5).map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{s.pages || 0}</td>
                  <td><span className={`status ${s.status}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
