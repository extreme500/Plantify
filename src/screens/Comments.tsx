import { Fragment, useEffect, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Clock, Flag, MessageCircle, MoreVertical, Pencil, SendHorizontal, Trash2, X } from 'lucide-react'
import type { Comment } from '../data/types'
import { useMe, useStore } from '../store/store'
import { formatDate } from '../lib/util'
import { Avatar, Dialog, Empty, Photo, RoleBadge, ScreenHeader, Sheet, TreeTabs, userName } from '../components/ui'
import { useGuard } from '../components/guard'
import { ReportDialog } from '../components/ReportDialog'

export function Comments() {
  const { id } = useParams()
  const me = useMe()
  const guard = useGuard()
  const tree = useStore((s) => s.db.trees.find((t) => t.id === id))
  const all = useStore((s) => s.db.comments)
  const users = useStore((s) => s.db.users)
  const addComment = useStore((s) => s.addComment)
  const editComment = useStore((s) => s.editComment)
  const deleteComment = useStore((s) => s.deleteComment)
  const toast = useStore((s) => s.toast)
  const [text, setText] = useState('')
  /** Comentário sendo editado (o texto vai para a caixa de digitação). */
  const [editing, setEditing] = useState<Comment | null>(null)
  const [actionsFor, setActionsFor] = useState<Comment | null>(null)
  const [toDelete, setToDelete] = useState<Comment | null>(null)
  const [toReport, setToReport] = useState<Comment | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const list = all.filter((c) => c.treeId === id).sort((a, b) => a.createdAt - b.createdAt)

  useEffect(() => {
    if (!editing) endRef.current?.scrollIntoView({ block: 'end' })
  }, [list.length, editing])

  if (!tree) return <Navigate to="/" replace />

  function send() {
    const t = text.trim()
    if (!t) return
    guard('Para comentar, entre na sua conta.', () => {
      if (editing) {
        if (t !== editing.text) { editComment(editing.id, t); toast('Comentário editado.', 'success') }
        setEditing(null)
      } else {
        addComment(tree!.id, t)
      }
      setText('')
    })
  }

  function startEdit(c: Comment) {
    setActionsFor(null)
    setEditing(c)
    setText(c.text)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function cancelEdit() {
    setEditing(null)
    setText('')
  }

  let lastDate = ''

  return (
    <div className="screen">
      <ScreenHeader title="Comentários" sub={tree.nicknames[0]} back mapShortcut />
      <div className="thread-head">
        <div style={{ minWidth: 0 }}>
          <strong style={{ fontFamily: 'var(--font-head)' }}>{tree.nicknames[0]}</strong>
          <div className="small italic muted">{tree.scientificName ? `“${tree.scientificName}”` : 'Sem identificação'}</div>
        </div>
        <Photo src={tree.photo} alt="" />
        <div className="small" style={{ minWidth: 0 }}>
          {tree.nicknames.length > 1 ? (
            <>
              <strong>AKA</strong>
              {tree.nicknames.slice(1, 4).map((n) => <div key={n} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>“{n}”</div>)}
            </>
          ) : <span className="muted">{list.length} {list.length === 1 ? 'comentário' : 'comentários'}</span>}
        </div>
      </div>
      <div className="scroll">
        <div className="pad stack" style={{ gap: 10 }}>
          {list.length === 0 && (
            <Empty icon={<MessageCircle size={48} />}>
              <strong>Nenhum comentário ainda</strong>
              <span>Conte uma história, uma curiosidade ou pergunte algo sobre esta árvore.</span>
            </Empty>
          )}
          {list.map((c) => {
            const u = users.find((x) => x.id === c.userId)
            const mine = me?.id === c.userId
            const date = formatDate(c.createdAt)
            const showDate = date !== lastDate
            lastDate = date
            return (
              <Fragment key={c.id}>
                {showDate && <div className="date-sep">{date}</div>}
                <div className={`msg ${mine ? 'mine' : ''}`} style={editing?.id === c.id ? { opacity: 0.55 } : undefined}>
                  <Avatar user={u} size={34} />
                  <div className="bubble">
                    <div className="who" style={{ justifyContent: mine ? 'flex-end' : undefined }}>
                      {mine ? `${u?.firstName ?? 'Você'} (Você)` : userName(u)} <RoleBadge user={u} />
                      {me && (
                        <button className="msg-actions" aria-label="Opções do comentário" onClick={() => setActionsFor(c)}>
                          <MoreVertical size={16} />
                        </button>
                      )}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{c.text}</div>
                    <div className="meta" style={{ justifyContent: mine ? 'flex-end' : undefined }}>
                      {new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {c.editedAt && <> · editado</>}
                      {c.sync === 'pending' && <><Clock size={12} /> aguardando envio</>}
                    </div>
                  </div>
                </div>
              </Fragment>
            )
          })}
          <div ref={endRef} />
        </div>
      </div>
      {editing && (
        <div className="editing-bar">
          <Pencil size={16} /> <span className="grow">Editando comentário</span>
          <button className="icon-btn" style={{ width: 32, height: 32 }} aria-label="Cancelar edição" onClick={cancelEdit}><X size={18} /></button>
        </div>
      )}
      <div className="composer">
        <textarea
          ref={inputRef}
          rows={1} placeholder={me ? 'Digitar…' : 'Entre para comentar…'} value={text} aria-label="Escrever comentário"
          onChange={(e) => setText(e.target.value)}
          onFocus={() => !me && guard('Para comentar, entre na sua conta.', () => {})}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        />
        <button className="send-btn" aria-label={editing ? 'Salvar edição' : 'Publicar comentário'} onClick={send} disabled={!text.trim()}><SendHorizontal size={22} /></button>
      </div>
      <TreeTabs treeId={tree.id} active="comentarios" />

      {actionsFor && (
        <Sheet onClose={() => setActionsFor(null)}>
          <div className="stack" style={{ gap: 8 }}>
            {actionsFor.userId === me?.id ? (
              <>
                <button className="btn outline block" onClick={() => startEdit(actionsFor)}><Pencil size={20} /> Editar comentário</button>
                <button className="btn danger block" onClick={() => { setToDelete(actionsFor); setActionsFor(null) }}><Trash2 size={20} /> Excluir comentário</button>
              </>
            ) : (
              <button className="btn danger block" onClick={() => { setToReport(actionsFor); setActionsFor(null) }}><Flag size={20} /> Denunciar comentário</button>
            )}
            <button className="btn ghost block" onClick={() => setActionsFor(null)}>Cancelar</button>
          </div>
        </Sheet>
      )}
      {toDelete && (
        <Dialog title="Excluir comentário?" onClose={() => setToDelete(null)}>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }} className="small muted">“{toDelete.text}”</p>
          <p style={{ margin: 0 }}>O comentário some para todos. Essa ação não pode ser desfeita.</p>
          <div className="row">
            <button className="btn outline grow" onClick={() => setToDelete(null)}>Cancelar</button>
            <button className="btn danger grow" onClick={() => { deleteComment(toDelete.id); if (editing?.id === toDelete.id) cancelEdit(); setToDelete(null); toast('Comentário excluído.') }}>
              <Trash2 size={20} /> Excluir
            </button>
          </div>
        </Dialog>
      )}
      {toReport && <ReportDialog kind="comment" targetId={toReport.id} onClose={() => setToReport(null)} />}
    </div>
  )
}
