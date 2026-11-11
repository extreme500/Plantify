import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, BadgeCheck, Pencil, Trash2, X } from 'lucide-react'
import type { ContentField, TreeContent } from '../data/types'
import { changedFields } from '../data/types'
import { useMe, useStore } from '../store/store'
import { distance, formatDate, formatDistance, timeAgo } from '../lib/util'
import { Avatar, Dialog, Photo, ScreenHeader, useBack, userName } from '../components/ui'

const FIELD_LABEL: Record<ContentField, string> = {
  photo: 'Foto',
  nicknames: 'Apelidos',
  scientificName: 'Nome científico',
  family: 'Família',
  characteristics: 'Características',
  sources: 'Fontes',
  location: 'Local',
  invasive: 'Exótica invasora',
}

function FieldValue({ field, c }: { field: ContentField; c: TreeContent }) {
  switch (field) {
    case 'photo': return <Photo src={c.photo} alt="" />
    case 'nicknames': return <>{c.nicknames.join(' · ')}</>
    case 'scientificName': return <i>{c.scientificName || '—'}</i>
    case 'family': return <>{c.family || '—'}</>
    case 'characteristics': return <>{c.characteristics || '—'}</>
    case 'sources': return <>{c.sources.length ? c.sources.map((s) => s.label).join(', ') : 'Nenhuma'}</>
    case 'location': return <>{c.lat.toFixed(5)}, {c.lng.toFixed(5)}</>
    case 'invasive': return <>{c.invasive ? 'Sim' : 'Não'}</>
  }
}

/**
 * Revisão de uma sugestão de alteração em árvore verificada.
 * Especialista: aprova (vira a versão publicada e verificada) ou rejeita. Autor: acompanha, edita ou cancela.
 */
export function SuggestionReview() {
  const { id, sid } = useParams()
  const nav = useNavigate()
  const back = useBack()
  const me = useMe()
  const tree = useStore((s) => s.db.trees.find((t) => t.id === id))
  const users = useStore((s) => s.db.users)
  const approve = useStore((s) => s.approveSuggestion)
  const reject = useStore((s) => s.rejectSuggestion)
  const cancel = useStore((s) => s.cancelSuggestion)
  const toast = useStore((s) => s.toast)
  const [dialog, setDialog] = useState<'aprovar' | 'rejeitar' | 'cancelar' | null>(null)
  const [reason, setReason] = useState('')

  const s = tree?.suggestions.find((x) => x.id === sid)
  if (!tree) return <Navigate to="/" replace />
  if (!s) return <Navigate to={`/arvore/${tree.id}`} replace />
  const isSpecialist = me?.role === 'especialista'
  const isAuthor = me?.id === s.by
  if (!isSpecialist && !isAuthor) return <Navigate to={`/arvore/${tree.id}`} replace />

  const author = users.find((u) => u.id === s.by)
  const fields = changedFields(tree, s.content)
  const stale = !!tree.verifiedAt && s.baseVerifiedAt !== tree.verifiedAt

  const row = (field: ContentField): ReactNode => (
    <div key={field} className="stack" style={{ gap: 6 }}>
      <span className="label">{FIELD_LABEL[field]}</span>
      <div className="diff-row">
        <div className="diff-col old"><span className="diff-label">Publicado (verificado)</span><FieldValue field={field} c={tree} /></div>
        <div className="diff-col new"><span className="diff-label">Sugerido</span><FieldValue field={field} c={s.content} /></div>
      </div>
      {field === 'location' && (
        <span className="hint">O ponto foi movido {formatDistance(distance([tree.lat, tree.lng], [s.content.lat, s.content.lng]))}.</span>
      )}
    </div>
  )

  return (
    <div className="screen">
      <ScreenHeader title="Sugestão de alteração" sub={tree.nicknames[0]} back />
      <div className="scroll pad stack">
        <div className="card row" style={{ alignItems: 'flex-start' }}>
          <Avatar user={author} size={40} />
          <div className="grow small">
            <strong>{isAuthor ? 'Sua sugestão' : `Sugerida por ${userName(author)}`}</strong> · {timeAgo(s.at)}
            <div className="muted">
              {isAuthor
                ? 'Ela só aparece para todos depois que um especialista aprovar. Até lá, a ficha mostra a versão verificada.'
                : `Árvore verificada em ${formatDate(tree.verifiedAt ?? tree.updatedAt)}. ${fields.length} ${fields.length === 1 ? 'campo alterado' : 'campos alterados'}.`}
            </div>
          </div>
        </div>
        {stale && (
          <div className="card row small" style={{ alignItems: 'flex-start', borderColor: 'var(--pending)' }}>
            <AlertTriangle color="var(--pending)" style={{ flexShrink: 0 }} />
            <span>Esta sugestão foi feita sobre uma versão anterior da árvore. Ao aprovar, ela substitui também as alterações publicadas depois.</span>
          </div>
        )}
        {fields.map(row)}
        {fields.length === 0 && <p className="muted">Nenhuma diferença em relação à versão publicada.</p>}
      </div>
      <div className="sticky-foot">
        {isSpecialist ? (
          <>
            <button className="btn danger" onClick={() => setDialog('rejeitar')}><X size={20} /> Rejeitar</button>
            <button className="btn primary grow" onClick={() => setDialog('aprovar')}><BadgeCheck size={20} /> Aprovar e publicar</button>
          </>
        ) : (
          <>
            <button className="btn danger" onClick={() => setDialog('cancelar')}><Trash2 size={20} /> Cancelar</button>
            <button className="btn primary grow" onClick={() => nav(`/arvore/${tree.id}/editar`)}><Pencil size={20} /> Editar sugestão</button>
          </>
        )}
      </div>

      {dialog === 'aprovar' && (
        <Dialog title="Aprovar sugestão?" onClose={() => setDialog(null)}>
          <p style={{ margin: 0 }}>A ficha passa a mostrar esta versão para todos, com o selo de <strong>Espécie verificada</strong> em seu nome.</p>
          <div className="row">
            <button className="btn outline grow" onClick={() => setDialog(null)}>Voltar</button>
            <button className="btn primary grow" onClick={() => { approve(tree.id, s.id); toast('Sugestão aprovada e publicada.', 'success'); nav(`/arvore/${tree.id}`, { replace: true }) }}>
              <BadgeCheck size={20} /> Aprovar
            </button>
          </div>
        </Dialog>
      )}
      {dialog === 'rejeitar' && (
        <Dialog title="Rejeitar sugestão?" onClose={() => setDialog(null)}>
          <p style={{ margin: 0 }}>A versão verificada continua publicada. {userName(author)} será avisado(a).</p>
          <textarea className="textarea" style={{ minHeight: 72 }} placeholder="Motivo (opcional), ex.: informação sem fonte" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="row">
            <button className="btn outline grow" onClick={() => setDialog(null)}>Voltar</button>
            <button className="btn danger grow" onClick={() => { reject(tree.id, s.id, reason); toast('Sugestão rejeitada.'); back() }}><X size={20} /> Rejeitar</button>
          </div>
        </Dialog>
      )}
      {dialog === 'cancelar' && (
        <Dialog title="Cancelar sugestão?" onClose={() => setDialog(null)}>
          <p style={{ margin: 0 }}>Suas alterações serão descartadas. A árvore continua como está publicada.</p>
          <div className="row">
            <button className="btn outline grow" onClick={() => setDialog(null)}>Voltar</button>
            <button className="btn danger grow" onClick={() => { cancel(tree.id, s.id); toast('Sugestão cancelada.'); back() }}><Trash2 size={20} /> Cancelar sugestão</button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
