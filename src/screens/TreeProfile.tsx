import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, BadgeCheck, ExternalLink, History, Map, Microscope, Pencil, ShieldOff } from 'lucide-react'
import { editedAfterVerification, treeStatus, verifiedVersion } from '../data/types'
import { useMe, useStore } from '../store/store'
import { distance, formatDate, formatDistance } from '../lib/util'
import { MiniMap } from '../components/mapParts'
import { Dialog, Photo, ScreenHeader, StatusBadges, TreeTabs, userName } from '../components/ui'
import { useGuard } from '../components/guard'

export function TreeProfile() {
  const { id } = useParams()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const me = useMe()
  const guard = useGuard()
  const tree = useStore((s) => s.db.trees.find((t) => t.id === id))
  const users = useStore((s) => s.db.users)
  const instants = useStore((s) => s.db.instants)
  const position = useStore((s) => s.position)
  const verifyTree = useStore((s) => s.verifyTree)
  const setInvasive = useStore((s) => s.setInvasive)
  const toast = useStore((s) => s.toast)
  const [moreNicks, setMoreNicks] = useState(false)
  const [moreText, setMoreText] = useState(false)
  const [confirmVerify, setConfirmVerify] = useState(false)

  if (!tree) return <Navigate to="/" replace />

  // Árvore editada depois de verificada: dá para alternar entre a versão atual e o último registro verificado.
  const edited = editedAfterVerification(tree)
  const showingVerified = edited && params.get('versao') === 'verificada'
  const view = showingVerified ? verifiedVersion(tree)! : tree
  const setVersion = (verified: boolean) => setParams(verified ? { versao: 'verificada' } : {}, { replace: true })

  const status = treeStatus(tree)
  const author = users.find((u) => u.id === tree.createdBy)
  const verifier = users.find((u) => u.id === view.verifiedBy)
  const snapshotVerifier = users.find((u) => u.id === tree.verifiedSnapshot?.verifiedBy)
  const editor = users.find((u) => u.id === tree.lastEditedBy)
  const gallery = instants.filter((i) => i.treeId === tree.id)
  const nicks = moreNicks ? view.nicknames : view.nicknames.slice(0, 3)
  const isSpecialist = me?.role === 'especialista'
  const edit = () => guard('Para completar as informações desta árvore, entre na sua conta.', () => nav(`/arvore/${tree.id}/editar`))
  const editedOn = tree.lastEditedAt ? formatDate(tree.lastEditedAt) : formatDate(tree.updatedAt)

  return (
    <div className="screen">
      <ScreenHeader title="Ficha da árvore" sub={showingVerified ? `${view.nicknames[0]} · versão verificada` : tree.nicknames[0]} back="/" />
      <div className="scroll">
        <div className="pad stack">
          {edited && (
            <div className="stack" style={{ gap: 8 }}>
              <div className="segmented" role="tablist" aria-label="Versão do registro">
                <button role="tab" aria-selected={!showingVerified} className={!showingVerified ? 'on' : ''} onClick={() => setVersion(false)} style={{ fontSize: '0.9rem', padding: '4px 6px' }}>
                  <Pencil size={16} /> Versão atual
                </button>
                <button role="tab" aria-selected={showingVerified} className={showingVerified ? 'on' : ''} onClick={() => setVersion(true)} style={{ fontSize: '0.9rem', padding: '4px 6px' }}>
                  <BadgeCheck size={16} /> Último registro verificado
                </button>
              </div>
              {showingVerified ? (
                <div className="card row small" style={{ alignItems: 'flex-start', borderColor: 'var(--verified)' }}>
                  <BadgeCheck color="var(--verified)" style={{ flexShrink: 0 }} />
                  <span>
                    Você está vendo o <strong>último registro verificado</strong>, verificado por {userName(snapshotVerifier)} em {formatDate(tree.verifiedSnapshot!.verifiedAt)}.
                    Depois disso, a árvore foi editada por {userName(editor)} em {editedOn} e aguarda nova verificação.
                  </span>
                </div>
              ) : (
                <div className="card row small" style={{ alignItems: 'flex-start', borderColor: 'var(--identified)' }}>
                  <History color="var(--identified)" style={{ flexShrink: 0 }} />
                  <span>
                    Esta versão foi editada por {userName(editor)} em {editedOn}, depois da verificação, e aguarda um especialista.{' '}
                    <button className="link-btn" style={{ padding: 0 }} onClick={() => setVersion(true)}>Ver o último registro verificado</button>
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="profile-top">
            <div className="photo-circle"><Photo src={view.photo} alt={`Foto de ${view.nicknames[0]}`} /></div>
            <div>
              <div className="label" style={{ marginBottom: 2 }}>Apelido{view.nicknames.length > 1 ? 's' : ''}</div>
              <ul className="nick-list">
                {nicks.map((n, i) => <li key={n}>{i === 0 ? n : `“${n}”`}</li>)}
              </ul>
              {view.nicknames.length > 3 && (
                <button className="link-btn small" onClick={() => setMoreNicks(!moreNicks)}>{moreNicks ? 'Ler menos' : `Ler mais (+${view.nicknames.length - 3})`}</button>
              )}
            </div>
          </div>

          <StatusBadges tree={view} />

          {view.invasive && (
            <div className="card row" style={{ borderColor: 'var(--invasive)', alignItems: 'flex-start' }}>
              <AlertTriangle color="var(--invasive)" style={{ flexShrink: 0 }} />
              <span className="small"><strong>Espécie exótica invasora.</strong> Ela compete com a flora nativa do campus. Não plante novas mudas e avise a gestão ambiental se encontrar exemplares jovens.</span>
            </div>
          )}

          <div>
            <div className="label">Nome científico</div>
            {view.scientificName ? (
              <div style={{ fontSize: '1.15rem' }}><span className="italic">{view.scientificName}</span>{view.family && <span className="muted"> · {view.family}</span>}</div>
            ) : (
              <div className="card row" style={{ borderStyle: 'dashed', borderColor: 'var(--pending)' }}>
                <span className="grow small">Ainda não identificada. Você sabe que árvore é esta?</span>
                <button className="btn sm outline" onClick={edit}>Identificar</button>
              </div>
            )}
          </div>

          <div>
            <div className="row between" style={{ marginBottom: 6 }}>
              <span className="label">Local</span>
              <span className="small muted">{formatDistance(distance(position.pos, [view.lat, view.lng]))} de você</span>
            </div>
            <div className="minimaps">
              <MiniMap tree={view} zoom={18} label="Aproximado" />
              <MiniMap tree={view} zoom={15} label="No campus" />
            </div>
            <button className="btn ghost sm" style={{ marginTop: 4 }} onClick={() => nav('/', { state: { focus: tree.id, filter: showingVerified ? 'verificada' : 'todas' } })}><Map size={18} /> Ver no mapa</button>
          </div>

          <div>
            <div className="label">Características</div>
            {view.characteristics ? (
              <>
                <p className={moreText ? '' : 'clamp'} style={{ margin: '4px 0 0', lineHeight: 1.5 }}>{view.characteristics}</p>
                {view.characteristics.length > 160 && <button className="link-btn small" onClick={() => setMoreText(!moreText)}>{moreText ? 'Ler menos' : 'Ler mais'}</button>}
              </>
            ) : <p className="muted small" style={{ margin: '4px 0' }}>Nenhuma característica descrita ainda.</p>}
          </div>

          <div>
            <div className="label">Fonte{view.sources.length !== 1 ? 's' : ''}</div>
            {view.sources.length ? view.sources.map((s, i) => (
              <a key={i} className="source-item" href={s.url} target="_blank" rel="noreferrer">
                <span className="muted">({i + 1})</span>
                <span className="grow small"><strong>{s.label}</strong><br /><span className="muted">{s.url}</span></span>
                <ExternalLink size={16} />
              </a>
            )) : <p className="muted small" style={{ margin: '4px 0' }}>Sem fontes citadas.</p>}
          </div>

          <div>
            <div className="row between">
              <span className="label">Galeria ({gallery.length})</span>
              <button className="btn ghost sm" onClick={() => nav(`/arvore/${tree.id}/instants`, { replace: true })}>Ver instants</button>
            </div>
            {gallery.length ? (
              <div className="gallery-strip">
                {[{ id: 'main', photo: view.photo }, ...gallery].slice(0, 8).map((g) => <Photo key={g.id} src={g.photo} alt="" />)}
              </div>
            ) : <p className="muted small" style={{ margin: '4px 0' }}>Nenhum instant ainda. Seja o primeiro!</p>}
          </div>

          <div className="small muted">
            Registrada por <strong>{userName(author)}</strong> em {formatDate(tree.createdAt)}.
            {verifier && view.verifiedAt && <> Verificada por <strong>{userName(verifier)}</strong> em {formatDate(view.verifiedAt)}.</>}
            {!showingVerified && edited && <> Editada por <strong>{userName(editor)}</strong> em {editedOn}.</>}
          </div>

          {showingVerified ? (
            <button className="btn outline block" onClick={() => setVersion(false)}><Pencil size={20} /> Ver a versão atual</button>
          ) : (
            <button className="btn outline block" onClick={edit}><Pencil size={20} /> Completar informações</button>
          )}

          {isSpecialist && !showingVerified && (
            <div className="card curation stack">
              <div className="section-title" style={{ margin: 0 }}><Microscope size={18} /> Curadoria científica</div>
              {status === 'verificada' ? (
                <>
                  <span className="small">Você é especialista. Remova o selo se a identificação estiver incorreta.</span>
                  <button className="btn danger block" onClick={() => { verifyTree(tree.id, false); toast('Selo removido.') }}><ShieldOff size={20} /> Remover selo de verificação</button>
                </>
              ) : status === 'identificada' ? (
                <>
                  <span className="small">
                    {edited
                      ? 'Esta edição aguarda verificação. Compare com o último registro verificado antes de decidir.'
                      : 'Confira a foto, o nome científico e as fontes antes de verificar.'}
                  </span>
                  <button className="btn primary block" onClick={() => setConfirmVerify(true)}>
                    <BadgeCheck size={20} /> {edited ? 'Verificar esta edição' : 'Atribuir selo “Espécie verificada”'}
                  </button>
                </>
              ) : (
                <>
                  <span className="small">Para verificar, primeiro informe o nome científico e uma fonte.</span>
                  <button className="btn primary block" onClick={edit}><Pencil size={20} /> Identificar espécie</button>
                </>
              )}
              <div className="settings-row">
                <span className="sr-text"><strong>Exótica invasora</strong><span className="small muted">Alerta para a comunidade</span></span>
                <button className={`btn sm ${tree.invasive ? 'danger' : 'outline'}`} onClick={() => { setInvasive(tree.id, !tree.invasive); toast(tree.invasive ? 'Alerta removido.' : 'Alerta de espécie invasora adicionado.') }}>
                  {tree.invasive ? 'Remover alerta' : 'Marcar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <TreeTabs treeId={tree.id} active="ficha" />

      {confirmVerify && (
        <Dialog title={edited ? 'Verificar esta edição?' : 'Verificar espécie?'} onClose={() => setConfirmVerify(false)}>
          <p style={{ margin: 0 }}>Você confirma que esta árvore é <strong className="italic">{tree.scientificName}</strong>{tree.family && ` (${tree.family})`}?</p>
          {edited && tree.verifiedSnapshot && (
            <p className="small" style={{ margin: 0 }}>A versão atual passa a ser o registro verificado, substituindo o de {formatDate(tree.verifiedSnapshot.verifiedAt)}.</p>
          )}
          {tree.sources.length === 0 && <p className="err-msg" style={{ margin: 0 }}>Atenção: o registro ainda não cita nenhuma fonte.</p>}
          <div className="row">
            <button className="btn outline grow" onClick={() => setConfirmVerify(false)}>Cancelar</button>
            <button className="btn primary grow" onClick={() => { verifyTree(tree.id, true); setConfirmVerify(false); toast('Selo “Espécie verificada” atribuído!', 'success') }}><BadgeCheck size={20} /> Verificar</button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
