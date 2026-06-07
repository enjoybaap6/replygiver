import { useEffect, useState, useRef } from 'react'
import Layout from '../components/Layout'

export default function History() {
  const [msgs, setMsgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const pollRef = useRef(null)

  const load = () => {
    fetch('/api/history?limit=100').then(r => r.json()).then(d => {
      setMsgs(Array.isArray(d) ? d : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
    pollRef.current = setInterval(load, 5000)
    return () => clearInterval(pollRef.current)
  }, [])

  const grouped = {}
  msgs.forEach(m => {
    const key = m.session_id || 'unknown'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(m)
  })

  const sessions = Object.entries(grouped)
    .filter(([, msgs]) => !filter || msgs.some(m => m.content?.toLowerCase().includes(filter.toLowerCase())))

  return (
    <Layout>
      <div className="top">
        <h1>Chat History</h1>
        <input placeholder="Search messages..." value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 240 }} />
      </div>
      {loading ? (
        <div style={{ color: '#687076' }}>Loading...</div>
      ) : sessions.length === 0 ? (
        <div style={{ color: '#687076', textAlign: 'center', padding: 48 }}>
          No chat sessions yet. Embed the widget on your site to see conversations here.
        </div>
      ) : sessions.map(([sid, messages]) => (
        <div key={sid} className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#687076', marginBottom: 8 }}>
            Session: <code>{sid.slice(0, 16)}...</code> · {messages.length} messages
          </div>
          {messages.map((m, i) => (
            <div key={m.id || i} className={`msg-row ${m.role}`}>
              <div className="bub">{m.content}</div>
            </div>
          ))}
        </div>
      ))}
    </Layout>
  )
}
