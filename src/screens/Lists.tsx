import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, HelpCircle, PartyPopper } from 'lucide-react'
import type { Tree } from '../data/types'
import { treeStatus } from '../data/types'
import { useMe, useMyNotifications, useStore } from '../store/store'
import { distance, formatDistance, timeAgo } from '../lib/util'
import { Empty, Photo, ScreenHeader, StatusBadges } from '../components/ui'

function TreeRow({ tree, extra }: { tree: Tree; extra?: string }) {
  const nav = useNavigate()
  return (
    <button className="list-item" onClick={() => nav(`/arvore/${tree.id}`)}>
      <Photo src={tree.photo} alt="" />
      <div className="grow stack" style={{ gap: 4, minWidth: 0 }}>
        <strong>{tree.nicknames[0]}</strong>
        <StatusBadges tree={tree} compact />
        {extra && <span className="small muted">{extra}</span>}
      </div>
      <ChevronRight />
    </button>
  )
}

/** Lista de árvores que precisam de ajuda da comunidade / verificação de especialistas. */
export function Pending() {
  const me = useMe()
  const trees = useStore((s) => s.db.trees)
  const position = useStore((s) => s.position)
  const [tab, setTab] = useState<'pendente' | 'identificada'>('pendente')
  const list = useMemo(
    () => trees.filter((t) => treeStatus(t) === tab).sort((a, b) => b.createdAt - a.createdAt),
    [trees, tab],
  )
  return (
    <div className="screen">
      <ScreenHeader title="Precisam de ajuda" sub="Árvores sem identificação ou verificação" back />
      <div className="scroll pad stack">
        <div className="segmented">
          <button className={tab === 'pendente' ? 'on' : ''} onClick={() => setTab('pendente')}>Sem identificação</button>
          <button className={tab === 'identificada' ? 'on' : ''} onClick={() => setTab('identificada')}>A verificar</button>
        </div>
        <p className="hint" style={{ margin: 0 }}>
          {tab === 'pendente'
            ? 'Sabe que árvore é? Abra a ficha e toque em “Identificar”.'
            : me?.role === 'especialista'
              ? 'Como especialista, você pode conferir e atribuir o selo de espécie verificada.'
              : 'Estas árvores já têm nome científico e aguardam a verificação de um especialista.'}
        </p>
        {list.length === 0 && <Empty icon={<PartyPopper size={48} />}><strong>Nada por aqui!</strong><span>Todas as árvores desta lista foram resolvidas.</span></Empty>}
        {list.map((t) => (
          <TreeRow key={t.id} tree={t} extra={`Registrada ${timeAgo(t.createdAt)} · ${formatDistance(distance(position.pos, [t.lat, t.lng]))} de você`} />
        ))}
      </div>
    </div>
  )
}

export function Notifications() {
  const nav = useNavigate()
  const me = useMe()
  const list = useMyNotifications()
  const markRead = useStore((s) => s.markNotificationsRead)
  const trees = useStore((s) => s.db.trees)
  const enabled = useStore((s) => s.settings.notifications)
  // Guarda quais estavam não lidas ao abrir, para destacá-las mesmo depois de marcar como lidas.
  const [unreadIds] = useState(() => new Set(list.filter((n) => me && !n.readBy.includes(me.id)).map((n) => n.id)))

  useEffect(() => { markRead() }, [markRead])

  return (
    <div className="screen">
      <ScreenHeader title="Notificações" back />
      <div className="scroll pad stack">
        {!enabled && (
          <div className="card row small">
            <Bell size={18} /> As notificações estão desativadas. <button className="link-btn" onClick={() => nav('/configuracoes')}>Ativar</button>
          </div>
        )}
        {list.length === 0 && <Empty icon={<Bell size={48} />}><strong>Nenhuma notificação</strong><span>Você será avisado sobre comentários e verificações nas suas árvores.</span></Empty>}
        {list.map((n) => {
          const t = trees.find((x) => x.id === n.treeId)
          return (
            <button key={n.id} className="list-item" onClick={() => t && nav(`/arvore/${t.id}`)} style={unreadIds.has(n.id) ? { borderColor: 'var(--primary)', borderWidth: 2 } : undefined}>
              {t ? <Photo src={t.photo} alt="" /> : <HelpCircle />}
              <div className="grow">
                <div style={{ fontWeight: unreadIds.has(n.id) ? 700 : 400 }}>{n.text}</div>
                <div className="small muted">{timeAgo(n.createdAt)}{t && ` · ${treeStatus(t) === 'pendente' ? 'ainda pendente' : 'abrir ficha'}`}</div>
              </div>
              <ChevronRight />
            </button>
          )
        })}
      </div>
    </div>
  )
}
