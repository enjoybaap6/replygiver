import Layout from '../components/Layout'

export default function Settings() {
  return (
    <Layout>
      <div className="top"><h1>Settings</h1></div>
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>Admin Key</h2>
        <p style={{ color: '#687076', fontSize: 13, marginBottom: 16 }}>
          Used to log into this dashboard. Default: <code>replygiver123</code>
        </p>
        <p style={{ color: '#687076', fontSize: 13 }}>
          Change by setting <code>NEXT_PUBLIC_ADMIN_KEY</code> in <code>.env</code>.
        </p>
      </div>
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>AI (Anthropic Claude)</h2>
        <p style={{ color: '#687076', fontSize: 13, marginBottom: 8 }}>
          Set <code>ANTHROPIC_API_KEY</code> in <code>.env</code> for AI-powered chat responses.
          Without a key, the widget runs in demo mode (returns raw documentation text).
        </p>
      </div>
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>API</h2>
        <p style={{ color: '#687076', fontSize: 13, marginBottom: 8 }}>Your backend runs at:</p>
        <div className="copy-snip"><span>http://localhost:8000</span></div>
        <div style={{ fontSize: 13, color: '#687076' }}>
          Full API docs at <a href="http://localhost:8000/docs" target="_blank">http://localhost:8000/docs</a>
        </div>
      </div>
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>About</h2>
        <p style={{ color: '#687076', fontSize: 13 }}>
          ReplyGiver v1.0 · Open source (MIT) · A self-hosted documentation chat widget.
        </p>
      </div>
    </Layout>
  )
}
