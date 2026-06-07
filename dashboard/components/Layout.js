import Link from 'next/link'
import { useRouter } from 'next/router'

const NAV = [
  { href: '/', label: 'Overview', icon: '◉' },
  { href: '/sites', label: 'Sites', icon: '◈' },
  { href: '/history', label: 'Chat History', icon: '◎' },
  { href: '/widget', label: 'Widget', icon: '⊞' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Layout({ children }) {
  const router = useRouter()
  const logout = () => { localStorage.removeItem('replygiver-admin'); router.push('/login') }

  return (
    <div style={{ display: 'flex' }}>
      <div className="sidebar">
        <div className="logo">
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="24" height="24" rx="8" fill="#11181c"/>
            <path d="M8 14l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          ReplyGiver
        </div>
        <nav>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className={router.pathname === n.href ? 'active' : ''}>
              <span>{n.icon}</span> {n.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '20px', marginTop: 'auto', position: 'absolute', bottom: 0, width: '100%' }}>
          <button className="btn btn-s btn-sm" onClick={logout} style={{ width: '100%', justifyContent: 'center' }}>Sign out</button>
        </div>
      </div>
      <div className="main">
        {children}
      </div>
    </div>
  )
}
