import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Camera as CameraIcon, CloudOff, ImageOff, Send, Trash2 } from 'lucide-react'
import { TAG_LABEL, type Instant, type InstantTag } from '../data/types'
import { useMe, useStore } from '../store/store'
import { timeAgo } from '../lib/util'
import { Camera } from '../components/Camera'
import { Avatar, Dialog, Empty, Photo, ScreenHeader, TreeTabs, userName } from '../components/ui'
import { useGuard } from '../components/guard'
import { useSubmitFlow } from './Result'

/** Feed de instants da árvore (fotos rápidas de visitas, florações etc.). */
export function Instants() {
  const { id } = useParams()
  const nav = useNavigate()
  const me = useMe()
  const guard = useGuard()
  const tree = useStore((s) => s.db.trees.find((t) => t.id === id))
  const all = useStore((s) => s.db.instants)
  const users = useStore((s) => s.db.users)
  const deleteInstant = useStore((s) => s.deleteInstant)
  const toast = useStore((s) => s.toast)
  const [toDelete, setToDelete] = useState<Instant | null>(null)
  const [tag, setTag] = useState<InstantTag | 'todos'>('todos')

  if (!tree) return <Navigate to="/" replace />
  const list = all.filter((i) => i.treeId === tree.id && (tag === 'todos' || i.tag === tag)).sort((a, b) => b.createdAt - a.createdAt)
  const take = () => guard('Para postar um instant, entre na sua conta.', () => nav(`/arvore/${tree.id}/instants/novo`))

  return (
    <div className="screen">
      <ScreenHeader title="Instants" sub={tree.nicknames[0]} back="/" />
      <div className="scroll">
        <div className="pad stack">
          <button className="btn primary block" onClick={take}><CameraIcon size={22} /> Tirar um instant desta árvore</button>
          <div className="chips">
            {(['todos', ...Object.keys(TAG_LABEL)] as (InstantTag | 'todos')[]).map((t) => (
              <button key={t} className={`chip ${tag === t ? 'on' : ''}`} onClick={() => setTag(t)}>{t === 'todos' ? 'Todos' : TAG_LABEL[t]}</button>
            ))}
          </div>
          {list.length === 0 && (
            <Empty icon={<ImageOff size={48} />}>
              <strong>Nenhum instant {tag !== 'todos' ? `de ${TAG_LABEL[tag].toLowerCase()} ` : ''}ainda</strong>
              <span>Registre sua visita, uma floração ou a saúde da árvore com uma foto rápida.</span>
            </Empty>
          )}
          {list.map((i) => {
            const u = users.find((x) => x.id === i.userId)
            const mine = me?.id === i.userId
            return (
              <article key={i.id} className="instant-card">
                <div className="ic-head">
                  <Avatar user={u} size={38} />
                  <div className="grow">
                    <strong>{mine ? 'Você' : userName(u)}</strong>
                    <div className="small muted">{timeAgo(i.createdAt)}</div>
                  </div>
                  {i.sync === 'pending' && <span className="badge sync" title="Aguardando conexão"><CloudOff size={14} /></span>}
                  {mine && <button className="icon-btn" aria-label="Excluir instant" onClick={() => setToDelete(i)}><Trash2 size={20} /></button>}
                </div>
                <Photo src={i.photo} alt={`Instant de ${userName(u)}`} />
                <div className="ic-foot">
                  <span className="badge role" style={{ alignSelf: 'flex-start' }}>{TAG_LABEL[i.tag]}</span>
                  {i.caption && <span>{i.caption}</span>}
                </div>
              </article>
            )
          })}
        </div>
      </div>
      <TreeTabs treeId={tree.id} active="instants" />

      {toDelete && (
        <Dialog title="Excluir instant?" onClose={() => setToDelete(null)}>
          <Photo src={toDelete.photo} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12 }} />
          <p style={{ margin: 0 }}>Esta foto será removida do perfil da árvore. Essa ação não pode ser desfeita.</p>
          <div className="row">
            <button className="btn outline grow" onClick={() => setToDelete(null)}>Cancelar</button>
            <button className="btn danger grow" onClick={() => { deleteInstant(toDelete.id); setToDelete(null); toast('Instant excluído.') }}><Trash2 size={20} /> Excluir</button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

/** Câmera → prévia com tipo de registro e legenda → publicar. */
export function NewInstant() {
  const { id } = useParams()
  const tree = useStore((s) => s.db.trees.find((t) => t.id === id))
  const addInstant = useStore((s) => s.addInstant)
  const nav = useNavigate()
  const { run, overlay } = useSubmitFlow()
  const [photo, setPhoto] = useState<string | null>(null)
  const [tag, setTag] = useState<InstantTag>('visita')
  const [caption, setCaption] = useState('')

  if (!tree) return <Navigate to="/" replace />

  if (!photo) {
    return (
      <div className="screen">
        <Camera embedded title={`Instant · ${tree.nicknames[0]}`} hint="Mostre a árvore agora: flores, frutos, sua visita…" onClose={() => nav(-1)} onCapture={setPhoto} />
        <TreeTabs treeId={tree.id} active="instants" />
      </div>
    )
  }

  const publish = () =>
    run('instant', () => {
      addInstant({ treeId: tree.id, photo, tag, caption: caption.trim() })
      return { treeId: tree.id, photo }
    })

  return (
    <div className="screen">
      <ScreenHeader title="Novo instant" sub={tree.nicknames[0]} onBack={() => setPhoto(null)} />
      <div className="scroll pad stack">
        <img src={photo} alt="Prévia do instant" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 20 }} />
        <div className="field">
          <span className="label">O que você está registrando?</span>
          <div className="chips" style={{ flexWrap: 'wrap' }}>
            {(Object.keys(TAG_LABEL) as InstantTag[]).map((t) => (
              <button key={t} className={`chip ${tag === t ? 'on' : ''}`} onClick={() => setTag(t)}>{TAG_LABEL[t]}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="cap">Legenda <span className="muted small">(opcional)</span></label>
          <input id="cap" className="input" maxLength={140} placeholder="Ex.: Primeiras flores da estação!" value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>
      </div>
      <div className="sticky-foot">
        <button className="btn outline" onClick={() => setPhoto(null)}><CameraIcon size={20} /> Refazer</button>
        <button className="btn primary grow" onClick={publish}><Send size={20} /> Publicar instant</button>
      </div>
      {overlay}
    </div>
  )
}
