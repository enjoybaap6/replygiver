import '../styles/globals.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

const ADMIN_KEY = 'replygiver-admin'

export default function App({ Component, pageProps }) {
  const [authed, setAuthed] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setAuthed(localStorage.getItem(ADMIN_KEY) === 'true')
    setReady(true)
  }, [])

  if (!ready) return null

  if (router.pathname === '/login') {
    return <Component {...pageProps} onLogin={() => {
      localStorage.setItem(ADMIN_KEY, 'true')
      setAuthed(true)
      router.push('/')
    }} />
  }

  if (!authed) {
    router.push('/login')
    return null
  }

  return <Component {...pageProps} />
}
