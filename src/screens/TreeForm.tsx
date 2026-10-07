import { useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Camera as CameraIcon, ChevronDown, ChevronUp, Link2, Lock, Plus, Save, Sparkles, Trash2, X } from 'lucide-react'
import type { Source } from '../data/types'
import { findSpecies, searchSpecies, suggestedSources, type Species } from '../data/species'
import { isOnline, useMe, useStore } from '../store/store'
import { distance, formatDistance } from '../lib/util'
import { photoSrc } from '../lib/art'
import { Camera } from '../components/Camera'
import { LocationPicker } from '../components/mapParts'
import { ScreenHeader, Toggle } from '../components/ui'
import { useSubmitFlow } from './Result'
import { DEFAULT_NICKNAME } from './QuickAdd'

interface Prefill { photo?: string; pos?: [number, number]; nickname?: string }

/** Cadastro detalhado (criação) e "Completar informações" (edição) de uma árvore. */
export function TreeForm({ mode }: { mode: 'create' | 'edit' }) {
  const nav = useNavigate()
  const { id } = useParams()
  const prefill = (useLocation().state as Prefill | null) ?? {}
  const me = useMe()
  const tree = useStore((s) => s.db.trees.find((t) => t.id === id))
  const position = useStore((s) => s.position)
  const addTree = useStore((s) => s.addTree)
  const updateTree = useStore((s) => s.updateTree)
  const toast = useStore((s) => s.toast)
  const { run, overlay } = useSubmitFlow()
  const topRef = useRef<HTMLDivElement>(null)

  const editing = mode === 'edit' && tree
  const [photo, setPhoto] = useState<string | null>(editing ? tree.photo : prefill.photo ?? null)
  const [nickname, setNickname] = useState(editing ? tree.nicknames[0] : prefill.nickname ?? '')
  const [otherNicks, setOtherNicks] = useState<string[]>(editing ? tree.nicknames.slice(1) : [])
  const [newNick, setNewNick] = useState('')
  const [sci, setSci] = useState(editing ? tree.scientificName : '')
  const [family, setFamily] = useState(editing ? tree.family : '')
  const [invasive, setInvasive] = useState(editing ? tree.invasive : false)
  const [characteristics, setCharacteristics] = useState(editing ? tree.characteristics : '')
  const [sources, setSources] = useState<Source[]>(editing ? tree.sources : [])
  const [locMode, setLocMode] = useState<'atual' | 'escolher'>(editing || prefill.pos ? 'escolher' : 'atual')
  const [pos, setPos] = useState<[number, number] | null>(editing ? [tree.lat, tree.lng] : prefill.pos ?? null)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Species[]>([])
  const [sourcesOpen, setSourcesOpen] = useState(true)
  const [addingSource, setAddingSource] = useState(false)
  const [srcLabel, setSrcLabel] = useState('')
  const [srcUrl, setSrcUrl] = useState('')
  const [camera, setCamera] = useState(false)
  const [picking, setPicking] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (mode === 'edit' && !tree) return <Navigate to="/" replace />

  const isSpecialist = me?.role === 'especialista'
  const lockedTaxonomy = !!(editing && tree.verifiedBy && !isSpecialist)
  const finalPos: [number, number] = locMode === 'atual' ? position.pos : pos ?? position.pos
  const catalog = findSpecies(sci)

  function pickSpecies(s: Species) {
    setSci(s.scientific)
    setFamily(s.family)
    if (!nickname.trim()) {
      setNickname(s.popular.split(' / ')[0])
      setErrors({ ...errors, nickname: '' })
    }
    if (s.origin === 'exótica invasora') setInvasive(true)
    setQuery('')
    setSuggestions([])
  }

  function addSource() {
    if (!srcUrl.trim()) return
    const url = /^https?:\/\//.test(srcUrl.trim()) ? srcUrl.trim() : `https://${srcUrl.trim()}`
    setSources([...sources, { label: srcLabel.trim() || url.replace(/^https?:\/\//, '').split('/')[0], url }])
    setSrcLabel(''); setSrcUrl(''); setAddingSource(false)
  }

  function addNick() {
    const n = newNick.trim()
    if (n && !otherNicks.includes(n) && n !== nickname.trim()) setOtherNicks([...otherNicks, n])
    setNewNick('')
  }

  function save() {
    const err: Record<string, string> = {}
    if (!photo) err.photo = 'Tire ou escolha uma foto da árvore.'
    if (!nickname.trim()) err.nickname = 'Dê um apelido à árvore (pode ser provisório).'
    setErrors(err)
    if (Object.keys(err).length) { topRef.current?.scrollIntoView({ behavior: 'smooth' }); return }

    const data = {
      nicknames: [nickname.trim() || DEFAULT_NICKNAME, ...otherNicks],
      scientificName: sci.trim(), family: family.trim(), characteristics: characteristics.trim(),
      sources, lat: finalPos[0], lng: finalPos[1], photo: photo!, invasive,
    }
    if (editing) {
      // Mudar a espécie de uma árvore verificada remove o selo (precisa de nova verificação).
      const taxonomyChanged = tree.verifiedBy && data.scientificName !== tree.scientificName
      updateTree(tree.id, { ...data, ...(taxonomyChanged ? { verifiedBy: null, verifiedAt: null } : {}) })
      toast(isOnline(useStore.getState()) ? 'Informações salvas.' : 'Salvo no aparelho. Será enviado quando a conexão voltar.', isOnline(useStore.getState()) ? 'success' : 'warning')
      nav(-1)
    } else {
      run('tree', () => {
        const t = addTree({ ...data, createdBy: me!.id })
        return { treeId: t.id, photo: t.photo, pendingId: !t.scientificName }
      })
    }
  }

  if (camera) {
    return <Camera title="Foto da árvore" hint="Enquadre a árvore inteira, se possível" onClose={() => setCamera(false)} onCapture={(p) => { setPhoto(p); setCamera(false); setErrors({ ...errors, photo: '' }) }} />
  }

  return (
    <div className="screen">
      <ScreenHeader
        title={editing ? 'Completar informações' : 'Cadastro detalhado'}
        sub={editing ? tree.nicknames[0] : 'Campos com * são obrigatórios'}
        back
      />
      <div className="scroll">
        <div className="pad stack" ref={topRef}>
          <div className="profile-top">
            <div className="stack" style={{ gap: 4, alignItems: 'center' }}>
              <button type="button" className={`photo-circle ${photo ? 'has' : ''} ${errors.photo ? 'error' : ''}`} onClick={() => setCamera(true)} aria-label={photo ? 'Trocar foto' : 'Tirar foto'}>
                {photo ? <img src={photoSrc(photo)} alt="Foto da árvore" /> : <><CameraIcon size={44} /><span>Foto<span className="req">*</span></span></>}
                {photo && <span className="edit-ov"><CameraIcon size={16} /></span>}
              </button>
              {errors.photo && <span className="err-msg center">{errors.photo}</span>}
            </div>
            <div className="field">
              <label htmlFor="nick">Apelido<span className="req">*</span></label>
              <input id="nick" className={`input ${errors.nickname ? 'error' : ''}`} value={nickname} placeholder="Ex.: Amigo do Couto"
                onChange={(e) => { setNickname(e.target.value); setErrors({ ...errors, nickname: '' }) }} />
              {errors.nickname && <span className="err-msg">{errors.nickname}</span>}
              <span className="hint">Nome popular ou como a comunidade chama esta árvore.</span>
            </div>
          </div>

          <div className="field">
            <span className="label">Outros apelidos</span>
            {otherNicks.length > 0 && (
              <div className="row" style={{ flexWrap: 'wrap' }}>
                {otherNicks.map((n) => (
                  <span key={n} className="chip" style={{ minHeight: 34 }}>
                    {n}
                    <button type="button" aria-label={`Remover ${n}`} onClick={() => setOtherNicks(otherNicks.filter((x) => x !== n))} style={{ border: 'none', background: 'none', padding: 0, display: 'flex' }}><X size={16} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="row">
              <input className="input" value={newNick} placeholder="Adicionar apelido" onChange={(e) => setNewNick(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNick())} />
              <button type="button" className="btn outline sm" onClick={addNick} disabled={!newNick.trim()}><Plus size={18} /></button>
            </div>
          </div>

          <div className="card stack">
            <div className="section-title" style={{ margin: 0 }}><Sparkles size={18} /> Identificação botânica <span className="muted small" style={{ fontWeight: 400 }}>(opcional)</span></div>
            {lockedTaxonomy ? (
              <div className="row small" style={{ alignItems: 'flex-start' }}>
                <Lock size={18} style={{ flexShrink: 0 }} />
                <span>Esta espécie foi <strong>verificada por um especialista</strong>. Apenas especialistas podem alterar a identificação.</span>
              </div>
            ) : (
              <div className="field" style={{ position: 'relative' }}>
                <label htmlFor="q">Buscar espécie</label>
                <input id="q" className="input" placeholder="Digite um nome popular, ex.: ipê, butiá" value={query}
                  onChange={(e) => { setQuery(e.target.value); setSuggestions(searchSpecies(e.target.value)) }} />
                {suggestions.length > 0 && (
                  <div className="suggest">
                    {suggestions.map((s) => (
                      <button type="button" key={s.scientific} onClick={() => pickSpecies(s)}>
                        <strong>{s.popular}</strong><br />
                        <span className="italic small">{s.scientific}</span> <span className="small muted">· {s.family} · {s.origin}</span>
                      </button>
                    ))}
                  </div>
                )}
                {query.trim().length >= 2 && suggestions.length === 0 && <span className="hint">Nenhuma sugestão. Você pode digitar o nome científico abaixo.</span>}
              </div>
            )}
            <div className="field">
              <label htmlFor="sci">Nome científico</label>
              <input id="sci" className="input italic" placeholder="Gênero espécie (ex.: Araucaria angustifolia)" value={sci} readOnly={lockedTaxonomy} onChange={(e) => setSci(e.target.value)} />
              {!sci.trim() && <span className="hint">Se não souber, deixe vazio: a árvore fica como “Identificação pendente”.</span>}
              {editing && tree.verifiedBy && isSpecialist && sci.trim() !== tree.scientificName && <span className="err-msg">Alterar a espécie removerá o selo de verificação.</span>}
            </div>
            <div className="field">
              <label htmlFor="fam">Família</label>
              <input id="fam" className="input" placeholder="Ex.: Bignoniaceae" value={family} readOnly={lockedTaxonomy} onChange={(e) => setFamily(e.target.value)} />
            </div>
            {isSpecialist ? (
              <div className="settings-row">
                <div className="sr-text"><strong><AlertTriangle size={16} color="var(--invasive)" /> Espécie exótica invasora</strong><span className="small muted">Exibe um alerta na ficha e no mapa.</span></div>
                <Toggle checked={invasive} onChange={setInvasive} label="Espécie exótica invasora" />
              </div>
            ) : invasive ? (
              <div className="badge invasive" style={{ alignSelf: 'flex-start' }}><AlertTriangle size={14} /> Exótica invasora{catalog ? ' (catálogo)' : ''}</div>
            ) : null}
          </div>

          <div className="field">
            <span className="label">Local<span className="req">*</span></span>
            <div className="segmented" role="radiogroup">
              <button type="button" className={locMode === 'atual' ? 'on' : ''} onClick={() => setLocMode('atual')}>Atual</button>
              <button type="button" className={locMode === 'escolher' ? 'on' : ''} onClick={() => { setLocMode('escolher'); setPicking(true) }}>Escolher</button>
            </div>
            <span className="hint">
              {locMode === 'atual'
                ? `Sua posição atual (${position.source === 'gps' ? 'GPS' : 'simulada'}).`
                : `Local escolhido no mapa, a ${formatDistance(distance(finalPos, position.pos))} de você. `}
              {locMode === 'escolher' && <button type="button" className="link-btn" onClick={() => setPicking(true)}>Ajustar no mapa</button>}
            </span>
          </div>

          <div className="field">
            <label htmlFor="car">Características</label>
            <textarea id="car" className="textarea" placeholder="Altura, flores, frutos, folhas, histórias… tudo que ajude a reconhecer esta árvore." value={characteristics} onChange={(e) => setCharacteristics(e.target.value)} />
          </div>

          <div className="card stack" style={{ gap: 8 }}>
            <button type="button" className="row between" style={{ border: 'none', background: 'none', padding: 0 }} onClick={() => setSourcesOpen(!sourcesOpen)} aria-expanded={sourcesOpen}>
              <span className="section-title" style={{ margin: 0 }}><Link2 size={18} /> Fontes ({sources.length})</span>
              {sourcesOpen ? <ChevronUp /> : <ChevronDown />}
            </button>
            {sourcesOpen && (
              <>
                {sources.map((s, i) => (
                  <div key={i} className="source-item">
                    <span className="grow small"><strong>{s.label}</strong><br /><span className="muted">{s.url}</span></span>
                    <button type="button" className="icon-btn" aria-label="Remover fonte" onClick={() => setSources(sources.filter((_, k) => k !== i))}><Trash2 size={18} /></button>
                  </div>
                ))}
                {sources.length === 0 && <span className="hint">Cite bases abertas (Flora e Funga do Brasil, GBIF…) para dar confiabilidade ao registro.</span>}
                {addingSource ? (
                  <div className="stack" style={{ gap: 8 }}>
                    <input className="input" placeholder="Nome da fonte (ex.: Flora e Funga do Brasil)" value={srcLabel} onChange={(e) => setSrcLabel(e.target.value)} />
                    <input className="input" placeholder="Link (https://…)" inputMode="url" value={srcUrl} onChange={(e) => setSrcUrl(e.target.value)} />
                    <div className="row">
                      <button type="button" className="btn outline sm grow" onClick={() => setAddingSource(false)}>Cancelar</button>
                      <button type="button" className="btn primary sm grow" onClick={addSource} disabled={!srcUrl.trim()}>Adicionar</button>
                    </div>
                  </div>
                ) : (
                  <div className="row" style={{ flexWrap: 'wrap' }}>
                    <button type="button" className="btn outline sm" onClick={() => setAddingSource(true)}><Plus size={18} /> Adicionar fonte</button>
                    {sci.trim() && (
                      <button type="button" className="btn ghost sm" onClick={() => setSources([...sources, ...suggestedSources(sci).filter((s) => !sources.some((x) => x.url === s.url))])}>
                        <Sparkles size={16} /> Sugerir fontes abertas
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="sticky-foot">
        <button className="btn outline" onClick={() => nav(-1)}>Cancelar</button>
        <button className="btn primary grow" onClick={save}><Save size={20} /> {editing ? 'Salvar alterações' : 'Salvar registro'}</button>
      </div>
      {picking && (
        <LocationPicker initial={finalPos} onClose={() => { setPicking(false); if (!pos) setLocMode('atual') }} onPick={(p) => { setPos(p); setLocMode('escolher'); setPicking(false) }} />
      )}
      {overlay}
    </div>
  )
}
