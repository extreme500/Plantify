import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Archive, Ban, CheckCircle2, ChevronRight, ShieldCheck, Trash2, UserCheck } from 'lucide-react'
import type { Report, User } from '../data/types'
import { REPORT_KIND_LABEL, REPORT_REASON_LABEL } from '../data/types'
import { useMe, useStore } from '../store/store'
import { formatDate, timeAgo } from '../lib/util'
import { Avatar, Dialog, Empty, Photo, RoleBadge, ScreenHeader, userName } from '../components/ui'

/** O conteúdo denunciado, como aparece no app (ou aviso de que já foi removido). */
function ReportedContent({ r }: { r: Report }) {
  const comment = useStore((s) => s.db.comments.find((c) => c.id === r.targetId))
  const instant = useStore((s) => s.db.instants.find((i) => i.id === r.targetId))
  const tree = useStore((s) => s.db.trees.find((t) => t.id === (r.kind === 'tree' ? r.targetId : r.treeId)))
  if (r.kind === 'comment') {
    return comment
      ? <p style={{ margin: 0, whiteSpace: 'pre-wrap', background: 'var(--surface-2)', borderRadius: 12, padding: '8px 12px' }}>“{comment.text}”</p>
      : <p className="muted small" style={{ margin: 0 }}>Comentário já removido.</p>
  }
  if (r.kind === 'instant') {
    return instant
      ? <div className="row"><Photo src={instant.photo} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover' }} /><span className="small">{instant.caption || 'Sem legenda'}</span></div>
      : <p className="muted small" style={{ margin: 0 }}>Instant já removido.</p>
  }
  return tree
    ? <div className="row"><Photo src={tree.photo} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover' }} /><span className="small"><strong>{tree.nicknames[0]}</strong><br />{tree.characteristics.slice(0, 90)}</span></div>
    : <p className="muted small" style={{ margin: 0 }}>Registro já removido.</p>
}

function BanDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const banUser = useStore((s) => s.banUser)
  const toast = useStore((s) => s.toast)
  const [reason, setReason] = useState('')
  return (
    <Dialog title={`Suspender ${userName(user)}?`} onClose={onClose}>
      <p style={{ margin: 0 }}>A pessoa não conseguirá entrar nem contribuir. As denúncias abertas contra ela serão encerradas. Dá para reativar depois.</p>
      <textarea className="textarea" style={{ minHeight: 72 }} placeholder="Motivo (fica registrado), ex.: spam repetido" value={reason} onChange={(e) => setReason(e.target.value)} />
      <div className="row">
        <button className="btn outline grow" onClick={onClose}>Cancelar</button>
        <button className="btn danger grow" disabled={!reason.trim()} onClick={() => { banUser(user.id, reason); toast(`Conta de ${user.firstName} suspensa.`); onClose() }}>
          <Ban size={18} /> Suspender
        </button>
      </div>
    </Dialog>
  )
}

/**
 * Moderação (administradores): trata denúncias de comentários, instants e registros e suspende contas.
 * É um papel separado do especialista: cuida do comportamento, não da identificação botânica.
 */
export function Moderation() {
  const nav = useNavigate()
  const me = useMe()
  const reports = useStore((s) => s.db.reports)
  const users = useStore((s) => s.db.users)
  const removeReported = useStore((s) => s.removeReported)
  const dismissReport = useStore((s) => s.dismissReport)
  const unbanUser = useStore((s) => s.unbanUser)
  const toast = useStore((s) => s.toast)
  const [tab, setTab] = useState<'denuncias' | 'contas'>('denuncias')
  const [banning, setBanning] = useState<User | null>(null)
  const [query, setQuery] = useState('')
  if (!me?.admin) return <Navigate to="/" replace />

  const open = reports.filter((r) => r.status === 'aberta')
  const closed = reports.filter((r) => r.status === 'resolvida').slice(0, 10)
  const q = query.trim().toLowerCase()
  const accounts = users
    .filter((u) => u.id !== me.id)
    .filter((u) => !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q))
    .sort((a, b) => Number(!!b.banned) - Number(!!a.banned) || a.firstName.localeCompare(b.firstName))
  const userOf = (id: string) => users.find((u) => u.id === id)

  return (
    <div className="screen">
      <ScreenHeader title="Moderação" sub="Denúncias e contas da comunidade" back />
      <div className="scroll pad stack">
        <div className="segmented">
          <button className={tab === 'denuncias' ? 'on' : ''} onClick={() => setTab('denuncias')}>Denúncias ({open.length})</button>
          <button className={tab === 'contas' ? 'on' : ''} onClick={() => setTab('contas')}>Contas</button>
        </div>

        {tab === 'denuncias' && (
          <>
            {open.length === 0 && <Empty icon={<ShieldCheck size={48} />}><strong>Nenhuma denúncia aberta</strong><span>Tudo tranquilo na comunidade.</span></Empty>}
            {open.map((r) => {
              const author = userOf(r.reportedUser)
              return (
                <div key={r.id} className="card stack" style={{ gap: 10 }}>
                  <div className="row between">
                    <strong>{REPORT_KIND_LABEL[r.kind]}</strong>
                    <span className="badge invasive">{REPORT_REASON_LABEL[r.reason]}</span>
                  </div>
                  <ReportedContent r={r} />
                  <div className="small muted">
                    Autor: <strong>{userName(author)}</strong>{author?.banned && ' (suspenso)'} · denunciado por {userName(userOf(r.by))} {timeAgo(r.at)}
                    {r.details && <><br />“{r.details}”</>}
                  </div>
                  <button className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => nav(r.kind === 'comment' ? `/arvore/${r.treeId}/comentarios` : r.kind === 'instant' ? `/arvore/${r.treeId}/instants` : `/arvore/${r.treeId}`)}>
                    Ver no app <ChevronRight size={16} />
                  </button>
                  <div className="row" style={{ flexWrap: 'wrap' }}>
                    <button className="btn sm danger" onClick={() => { removeReported(r.id); toast('Conteúdo removido.') }}><Trash2 size={16} /> Remover conteúdo</button>
                    {author && !author.banned && !author.admin && (
                      <button className="btn sm danger" onClick={() => setBanning(author)}><Ban size={16} /> Suspender autor</button>
                    )}
                    <button className="btn sm outline" onClick={() => { dismissReport(r.id); toast('Denúncia arquivada.') }}><Archive size={16} /> Arquivar</button>
                  </div>
                </div>
              )
            })}
            {closed.length > 0 && (
              <div className="stack" style={{ gap: 6 }}>
                <div className="section-title" style={{ margin: '8px 0 0' }}>Resolvidas recentemente</div>
                {closed.map((r) => (
                  <div key={r.id} className="row small muted" style={{ alignItems: 'flex-start' }}>
                    <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{REPORT_KIND_LABEL[r.kind]} de {userName(userOf(r.reportedUser))} · {r.resolution} {r.resolvedAt && `em ${formatDate(r.resolvedAt)}`}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'contas' && (
          <>
            <input className="input" placeholder="Buscar por nome ou e-mail" value={query} onChange={(e) => setQuery(e.target.value)} />
            {accounts.map((u) => (
              <div key={u.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                <Avatar user={u} size={44} />
                <div className="grow stack" style={{ gap: 4, minWidth: 0 }}>
                  <strong>{userName(u)}</strong>
                  <span className="small muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span>
                  <span className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                    <RoleBadge user={u} />
                    {u.banned && <span className="badge invasive"><Ban size={12} /> Suspensa</span>}
                  </span>
                  {u.banned && <span className="small muted">“{u.banned.reason}” · {formatDate(u.banned.at)}</span>}
                </div>
                {u.admin ? null : u.banned ? (
                  <button className="btn sm outline" onClick={() => { unbanUser(u.id); toast(`Conta de ${u.firstName} reativada.`, 'success') }}><UserCheck size={16} /> Reativar</button>
                ) : (
                  <button className="btn sm danger" onClick={() => setBanning(u)}><Ban size={16} /> Suspender</button>
                )}
              </div>
            ))}
          </>
        )}
      </div>
      {banning && <BanDialog user={banning} onClose={() => setBanning(null)} />}
    </div>
  )
}
