import { Fragment, useEffect, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Clock, MessageCircle, SendHorizontal } from 'lucide-react'
import { useMe, useStore } from '../store/store'
import { formatDate } from '../lib/util'
import { Avatar, Empty, Photo, RoleBadge, ScreenHeader, TreeTabs, userName } from '../components/ui'
import { useGuard } from '../components/guard'

export function Comments() {
  const { id } = useParams()
  const me = useMe()
  const guard = useGuard()
  const tree = useStore((s) => s.db.trees.find((t) => t.id === id))
  const all = useStore((s) => s.db.comments)
  const users = useStore((s) => s.db.users)
  const addComment = useStore((s) => s.addComment)
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const list = all.filter((c) => c.treeId === id).sort((a, b) => a.createdAt - b.createdAt)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [list.length])

  if (!tree) return <Navigate to="/" replace />

  function send() {
    const t = text.trim()
    if (!t) return
    guard('Para comentar, entre na sua conta.', () => {
      addComment(tree!.id, t)
      setText('')
    })
  }

  let lastDate = ''

  return (
    <div className="screen">
      <ScreenHeader title="Comentários" sub={tree.nicknames[0]} back="/" />
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
                <div className={`msg ${mine ? 'mine' : ''}`}>
                  <Avatar user={u} size={34} />
                  <div className="bubble">
                    <div className="who" style={{ justifyContent: mine ? 'flex-end' : undefined }}>
                      {mine ? `${u?.firstName ?? 'Você'} (Você)` : userName(u)} <RoleBadge user={u} />
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{c.text}</div>
                    <div className="meta" style={{ justifyContent: mine ? 'flex-end' : undefined }}>
                      {new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
      <div className="composer">
        <textarea
          rows={1} placeholder={me ? 'Digitar…' : 'Entre para comentar…'} value={text} aria-label="Escrever comentário"
          onChange={(e) => setText(e.target.value)}
          onFocus={() => !me && guard('Para comentar, entre na sua conta.', () => {})}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        />
        <button className="send-btn" aria-label="Publicar comentário" onClick={send} disabled={!text.trim()}><SendHorizontal size={22} /></button>
      </div>
      <TreeTabs treeId={tree.id} active="comentarios" />
    </div>
  )
}
