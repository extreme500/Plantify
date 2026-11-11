import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, GitPullRequest, HelpCircle, PartyPopper, Sprout } from 'lucide-react'
import type { Suggestion, Tree } from '../data/types'
import { changedFields, treeStatus } from '../data/types'
import { useMe, useMyNotifications, useStore } from '../store/store'
import { distance, formatDistance, timeAgo } from '../lib/util'
import { Empty, Photo, ScreenHeader, StatusBadges, userName } from '../components/ui'

/** Linha de árvore numa lista, com quem registrou (para não parecer que a pendência é do usuário). */
function TreeRow({ tree, extra, to }: { tree: Tree; extra?: ReactNode; to?: string }) {
  const nav = useNavigate()
  const users = useStore((s) => s.db.users)
  const position = useStore((s) => s.position)
  const author = users.find((u) => u.id === tree.createdBy)
  return (
    <button className="list-item" onClick={() => nav(to ?? `/arvore/${tree.id}`)}>
      <Photo src={tree.photo} alt="" />
      <div className="grow stack" style={{ gap: 4, minWidth: 0 }}>
        <strong>{tree.nicknames[0]}</strong>
        <StatusBadges tree={tree} compact />
        {extra ?? (
          <span className="small muted">
            Registrada por {userName(author)} · {timeAgo(tree.createdAt)} · {formatDistance(distance(position.pos, [tree.lat, tree.lng]))} de você
          </span>
        )}
      </div>
      <ChevronRight />
    </button>
  )
}

/** "Ajude a identificar": pedido de ajuda da comunidade, aberto a todos. */
export function Pending() {
  const trees = useStore((s) => s.db.trees)
  const list = useMemo(() => trees.filter((t) => treeStatus(t) === 'pendente').sort((a, b) => b.createdAt - a.createdAt), [trees])
  return (
    <div className="screen">
      <ScreenHeader title="Ajude a identificar" sub="Árvores da comunidade ainda sem identificação" back />
      <div className="scroll pad stack">
        <p className="hint" style={{ margin: 0 }}>
          Estas árvores foram cadastradas por outras pessoas e ninguém sabe ainda que espécie são. Sabe qual é? Abra a ficha e toque em “Identificar”.
        </p>
        {list.length === 0 && <Empty icon={<PartyPopper size={48} />}><strong>Nada por aqui!</strong><span>Todas as árvores do campus já têm identificação.</span></Empty>}
        {list.map((t) => <TreeRow key={t.id} tree={t} />)}
      </div>
    </div>
  )
}

function SuggestionRow({ tree, s }: { tree: Tree; s: Suggestion }) {
  const users = useStore((st) => st.db.users)
  const n = changedFields(tree, s.content).length
  const stale = !!tree.verifiedAt && s.baseVerifiedAt !== tree.verifiedAt
  return (
    <TreeRow
      tree={tree}
      to={`/arvore/${tree.id}/sugestao/${s.id}`}
      extra={
        <span className="small muted">
          <GitPullRequest size={13} style={{ verticalAlign: '-2px' }} /> Sugestão de {userName(users.find((u) => u.id === s.by))} · {n} {n === 1 ? 'campo' : 'campos'} · {timeAgo(s.at)}
          {stale && <><br /><strong style={{ color: 'var(--pending)' }}>Feita sobre uma versão anterior</strong></>}
        </span>
      }
    />
  )
}

/** Fila do especialista: árvores identificadas a verificar e sugestões de alteração em árvores verificadas. */
export function Curation() {
  const me = useMe()
  const trees = useStore((s) => s.db.trees)
  const users = useStore((s) => s.db.users)
  const [tab, setTab] = useState<'verificar' | 'sugestoes'>('verificar')
  const toVerify = useMemo(() => trees.filter((t) => treeStatus(t) === 'identificada').sort((a, b) => b.createdAt - a.createdAt), [trees])
  const suggestions = useMemo(
    () => trees.flatMap((t) => t.suggestions.map((s) => ({ tree: t, s }))).sort((a, b) => b.s.at - a.s.at),
    [trees],
  )
  if (me?.role !== 'especialista') return <Navigate to="/" replace />

  return (
    <div className="screen">
      <ScreenHeader title="Curadoria" sub="Sua fila como especialista" back />
      <div className="scroll pad stack">
        <div className="segmented">
          <button className={tab === 'verificar' ? 'on' : ''} onClick={() => setTab('verificar')}>A verificar ({toVerify.length})</button>
          <button className={tab === 'sugestoes' ? 'on' : ''} onClick={() => setTab('sugestoes')}>Sugestões ({suggestions.length})</button>
        </div>
        <p className="hint" style={{ margin: 0 }}>
          {tab === 'verificar'
            ? 'Árvores que já têm nome científico e aguardam o selo de espécie verificada.'
            : 'Alterações sugeridas em árvores verificadas. Só aparecem para a comunidade depois que um especialista aprova.'}
        </p>
        {tab === 'verificar' && (
          <>
            {toVerify.length === 0 && <Empty icon={<PartyPopper size={48} />}><strong>Nada a verificar!</strong></Empty>}
            {toVerify.map((t) => (
              <TreeRow key={t.id} tree={t} extra={<span className="small muted">Registrada por {userName(users.find((u) => u.id === t.createdBy))} · {timeAgo(t.createdAt)}</span>} />
            ))}
          </>
        )}
        {tab === 'sugestoes' && (
          <>
            {suggestions.length === 0 && <Empty icon={<PartyPopper size={48} />}><strong>Nenhuma sugestão aguardando revisão</strong></Empty>}
            {suggestions.map(({ tree, s }) => <SuggestionRow key={s.id} tree={tree} s={s} />)}
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, count, children, empty }: { title: string; count: number; children: ReactNode; empty: string }) {
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="section-title" style={{ margin: 0 }}>{title} <span className="muted small">({count})</span></div>
      {count === 0 ? <p className="hint" style={{ margin: 0 }}>{empty}</p> : children}
    </div>
  )
}

/** Acompanhamento das próprias contribuições (cadastradas, editadas, sugestões e, para especialistas, verificadas). */
export function MyContributions() {
  const me = useMe()
  const trees = useStore((s) => s.db.trees)
  if (!me) return <Navigate to="/" replace />

  const created = trees.filter((t) => t.createdBy === me.id).sort((a, b) => b.createdAt - a.createdAt)
  const edited = trees.filter((t) => t.createdBy !== me.id && t.contributors.includes(me.id))
  const mySuggestions = trees.flatMap((t) => t.suggestions.filter((s) => s.by === me.id).map((s) => ({ tree: t, s })))
  const verifiedByMe = trees.filter((t) => t.verifiedBy === me.id)
  const total = created.length + edited.length + mySuggestions.length + verifiedByMe.length

  return (
    <div className="screen">
      <ScreenHeader title="Minhas contribuições" sub="Acompanhe o status das suas árvores" back />
      <div className="scroll pad stack" style={{ gap: 20 }}>
        {total === 0 && (
          <Empty icon={<Sprout size={48} />}>
            <strong>Você ainda não contribuiu</strong>
            <span>Cadastre uma árvore ou complete informações de uma ficha. Elas aparecem aqui, com o status de verificação.</span>
          </Empty>
        )}
        {mySuggestions.length > 0 && (
          <Section title="Sugestões aguardando revisão" count={mySuggestions.length} empty="">
            {mySuggestions.map(({ tree, s }) => (
              <TreeRow key={s.id} tree={tree} to={`/arvore/${tree.id}/sugestao/${s.id}`}
                extra={<span className="small muted"><GitPullRequest size={13} style={{ verticalAlign: '-2px' }} /> Enviada {timeAgo(s.at)} · aguardando um especialista</span>} />
            ))}
          </Section>
        )}
        {total > 0 && (
          <>
            <Section title="Cadastradas por mim" count={created.length} empty="Nenhuma árvore cadastrada ainda.">
              {created.map((t) => <TreeRow key={t.id} tree={t} extra={<span className="small muted">Cadastrada {timeAgo(t.createdAt)}</span>} />)}
            </Section>
            <Section title="Completadas por mim" count={edited.length} empty="Você ainda não completou informações de outras árvores.">
              {edited.map((t) => <TreeRow key={t.id} tree={t} extra={<span className="small muted">Editada por você</span>} />)}
            </Section>
            {me.role === 'especialista' && (
              <Section title="Verificadas por mim" count={verifiedByMe.length} empty="Você ainda não verificou nenhuma árvore.">
                {verifiedByMe.map((t) => <TreeRow key={t.id} tree={t} extra={<span className="small muted">Verificada {timeAgo(t.verifiedAt ?? t.updatedAt)}</span>} />)}
              </Section>
            )}
          </>
        )}
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
          const open = () => (n.to === 'moderacao' ? nav('/moderacao') : t && nav(`/arvore/${t.id}`))
          return (
            <button key={n.id} className="list-item" onClick={open} style={unreadIds.has(n.id) ? { borderColor: 'var(--primary)', borderWidth: 2 } : undefined}>
              {t ? <Photo src={t.photo} alt="" /> : <HelpCircle />}
              <div className="grow">
                <div style={{ fontWeight: unreadIds.has(n.id) ? 700 : 400 }}>{n.text}</div>
                <div className="small muted">{timeAgo(n.createdAt)}{n.to === 'moderacao' ? ' · abrir moderação' : t && ` · ${treeStatus(t) === 'pendente' ? 'ainda pendente' : 'abrir ficha'}`}</div>
              </div>
              <ChevronRight />
            </button>
          )
        })}
      </div>
    </div>
  )
}
