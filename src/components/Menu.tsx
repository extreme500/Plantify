import { useNavigate } from 'react-router-dom'
import { Bell, BookOpen, HelpCircle, LogIn, LogOut, Map, Settings } from 'lucide-react'
import { useMe, useMyNotifications, useStore } from '../store/store'
import { treeStatus } from '../data/types'
import { Avatar, RoleBadge, userName } from './ui'

export function Menu({ onClose }: { onClose: () => void }) {
  const nav = useNavigate()
  const me = useMe()
  const logout = useStore((s) => s.logout)
  const setTutorialSeen = useStore((s) => s.setTutorialSeen)
  const pending = useStore((s) => s.db.trees.filter((t) => treeStatus(t) === 'pendente').length)
  const unread = useMyNotifications().filter((n) => me && !n.readBy.includes(me.id)).length
  const go = (path: string) => { onClose(); nav(path) }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" aria-label="Menu">
        <div className="drawer-head">
          <Avatar user={me} size={56} />
          <div style={{ minWidth: 0 }}>
            <strong style={{ fontSize: '1.05rem' }}>{me ? userName(me) : 'Visitante'}</strong>
            <div className="small" style={{ opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis' }}>{me ? me.email : 'Explorando sem conta'}</div>
            {me?.role === 'especialista' && <div style={{ marginTop: 4, filter: 'brightness(2)' }}><RoleBadge user={me} /></div>}
          </div>
        </div>
        <nav>
          <button onClick={() => go('/')}><Map /> Mapa da flora</button>
          <button onClick={() => go('/pendentes')}><HelpCircle /> Identificação pendente {pending > 0 && <span className="count">{pending}</span>}</button>
          {me && <button onClick={() => go('/notificacoes')}><Bell /> Notificações {unread > 0 && <span className="count">{unread}</span>}</button>}
          <button onClick={() => go('/configuracoes')}><Settings /> Configurações</button>
          <button onClick={() => { onClose(); setTutorialSeen(false) }}><BookOpen /> Como usar o app</button>
          {me ? (
            <button onClick={() => { onClose(); logout() }}><LogOut /> Sair</button>
          ) : (
            <button onClick={() => { onClose(); logout() }}><LogIn /> Entrar ou criar conta</button>
          )}
        </nav>
        <div className="small muted" style={{ padding: 16 }}>Plantify · protótipo IHC · UFRGS</div>
      </aside>
    </>
  )
}
