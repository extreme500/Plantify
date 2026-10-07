import { useEffect, useRef } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { useMyNotifications, useStore } from './store/store'
import { GeoTracker } from './components/mapParts'
import { Toasts } from './components/ui'
import { LoginPrompt } from './components/guard'
import { Tutorial } from './components/Tutorial'
import { Welcome } from './screens/Welcome'
import { Register } from './screens/Register'
import { MapScreen } from './screens/MapScreen'
import { QuickAdd } from './screens/QuickAdd'
import { TreeForm } from './screens/TreeForm'
import { TreeProfile } from './screens/TreeProfile'
import { Instants, NewInstant } from './screens/Instants'
import { Comments } from './screens/Comments'
import { Result } from './screens/Result'
import { Settings } from './screens/Settings'
import { Notifications, Pending } from './screens/Lists'

function Connectivity() {
  const setBrowserOnline = useStore((s) => s.setBrowserOnline)
  useEffect(() => {
    const on = () => setBrowserOnline(true)
    const off = () => setBrowserOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [setBrowserOnline])
  return null
}

/** Ao entrar numa conta, avisa se há notificações não lidas (ex.: especialista com árvores pendentes). */
function LoginNotice() {
  const session = useStore((s) => s.session)
  const enabled = useStore((s) => s.settings.notifications)
  const toast = useStore((s) => s.toast)
  const list = useMyNotifications()
  const shownFor = useRef<string | null>(null)
  useEffect(() => {
    if (!session || session === 'guest' || shownFor.current === session) return
    shownFor.current = session
    const unread = list.filter((n) => !n.readBy.includes(session)).length
    if (enabled && unread > 0) toast(`Você tem ${unread} ${unread === 1 ? 'notificação nova' : 'notificações novas'}. Veja no menu ☰.`)
  }, [session, list, enabled, toast])
  return null
}

function AppRoutes() {
  const session = useStore((s) => s.session)
  const tutorialSeen = useStore((s) => s.tutorialSeen)
  const setTutorialSeen = useStore((s) => s.setTutorialSeen)
  const loggedIn = !!session && session !== 'guest'

  if (!session) {
    return (
      <Routes>
        <Route path="/registro" element={<Register />} />
        <Route path="*" element={<Welcome />} />
      </Routes>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<MapScreen />} />
        <Route path="/arvore/:id" element={<TreeProfile />} />
        <Route path="/arvore/:id/instants" element={<Instants />} />
        <Route path="/arvore/:id/instants/novo" element={loggedIn ? <NewInstant /> : <Navigate to="/" replace />} />
        <Route path="/arvore/:id/comentarios" element={<Comments />} />
        <Route path="/arvore/:id/editar" element={loggedIn ? <TreeForm mode="edit" /> : <Navigate to="/" replace />} />
        <Route path="/nova/rapido" element={loggedIn ? <QuickAdd /> : <Navigate to="/" replace />} />
        <Route path="/nova/detalhado" element={loggedIn ? <TreeForm mode="create" /> : <Navigate to="/" replace />} />
        <Route path="/resultado" element={<Result />} />
        <Route path="/configuracoes" element={<Settings />} />
        <Route path="/perfil/editar" element={loggedIn ? <Register edit /> : <Navigate to="/" replace />} />
        <Route path="/pendentes" element={<Pending />} />
        <Route path="/notificacoes" element={<Notifications />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <LoginPrompt />
      {!tutorialSeen && <Tutorial onDone={() => setTutorialSeen(true)} />}
    </>
  )
}

export default function App() {
  const ready = useStore((s) => s.ready)
  const dark = useStore((s) => s.settings.darkMode)
  const init = useStore((s) => s.init)

  useEffect(() => { init() }, [init])
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0d1712' : '#14532d')
  }, [dark])

  return (
    <div className={`app ${dark ? 'theme-dark' : ''}`}>
      {ready ? (
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Connectivity />
          <GeoTracker />
          <LoginNotice />
          <AppRoutes />
        </HashRouter>
      ) : (
        <div className="result"><div className="logo"><Sprout size={44} /></div><strong>Carregando…</strong></div>
      )}
      <Toasts />
    </div>
  )
}
