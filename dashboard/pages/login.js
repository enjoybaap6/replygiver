import { useState } from 'react'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_KEY || 'replygiver123'

export default function Login({ onLogin }) {
  const [key, setKey] = useState('')
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (key === ADMIN_PASSWORD) {
      onLogin()
    } else {
      setErr('Invalid admin key')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
      <div style={{ background: '#fff', border: '1px solid #e4e8ec', borderRadius: 16, padding: 40, width: 380, boxShadow: '0 4px 24px rgba(0,0,0,.04)' }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>ReplyGiver</div>
        <div style={{ color: '#687076', fontSize: '.9rem', marginBottom: 24 }}>Dashboard — sign in</div>
        <form onSubmit={submit}>
          <label style={{ fontSize: 13, color: '#687076', fontWeight: 600, marginBottom: 6, display: 'block' }}>Admin Key</label>
          <input type="password" placeholder="Enter your admin key" value={key} onChange={e => setKey(e.target.value)} autoFocus />
          {err && <div style={{ color: '#e5484d', fontSize: 13, marginTop: 8 }}>{err}</div>}
          <button type="submit" className="btn btn-p" style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: 12 }}>Sign in</button>
        </form>
        <div style={{ marginTop: 16, fontSize: 12, color: '#687076', textAlign: 'center' }}>
          Default key: <code style={{ background: '#f1f3f5', padding: '2px 6px', borderRadius: 4 }}>replygiver123</code>
        </div>
      </div>
    </div>
  )
}
