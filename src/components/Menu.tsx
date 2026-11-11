import { useNavigate } from 'react-router-dom'
import { Bell, BookOpen, HandHelping, LogIn, LogOut, Map, Microscope, Settings, ShieldCheck, Sprout } from 'lucide-react'
import { useCurationCounts, useMe, useMyNotifications, useOpenReportsCount, useStore } from '../store/store'
import { treeStatus } from '../data/types'
import { Avatar, RoleBadge, userName } from './ui'

export function Menu({ onClose }: { onClose: () => void }) {
  const nav = useNavigate()
  const me = useMe()
  const logout = useStore((s) => s.logout)
  const openTutorial = useStore((s) => s.openTutorial)
  const needHelp = useStore((s) => s.db.trees.filter((t) => treeStatus(t) === 'pendente').length)
  const curation = useCurationCounts()
  const openReports = useOpenReportsCount()
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
            {(me?.role === 'especialista' || me?.admin) && <div className="row" style={{ marginTop: 4, gap: 4, filter: 'brightness(2)' }}><RoleBadge user={me} /></div>}
          </div>
        </div>
        <nav>
          <button onClick={() => go('/')}><Map /> Mapa da flora</button>
          {/* Pedido de ajuda da comunidade: contador neutro (vermelho fica para o que é do próprio usuário). */}
          <button onClick={() => go('/pendentes')}>
            <HandHelping /> Ajude a identificar {needHelp > 0 && <span className="count neutral" title="Árvores da comunidade sem identificação">{needHelp}</span>}
          </button>
          {me && <button onClick={() => go('/minhas')}><Sprout /> Minhas contribuições</button>}
          {me?.role === 'especialista' && (
            <button onClick={() => go('/curadoria')}><Microscope /> Curadoria {curation.total > 0 && <span className="count">{curation.total}</span>}</button>
          )}
          {me?.admin && (
            <button onClick={() => go('/moderacao')}><ShieldCheck /> Moderação {openReports > 0 && <span className="count">{openReports}</span>}</button>
          )}
          {me && <button onClick={() => go('/notificacoes')}><Bell /> Notificações {unread > 0 && <span className="count">{unread}</span>}</button>}
          <button onClick={() => go('/configuracoes')}><Settings /> Configurações</button>
          <button onClick={() => { onClose(); openTutorial() }}><BookOpen /> Como usar o app</button>
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
