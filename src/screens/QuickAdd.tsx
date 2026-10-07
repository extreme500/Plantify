import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera as CameraIcon, HelpCircle, MapPin, Save, Search } from 'lucide-react'
import { useStore } from '../store/store'
import { distance, formatDistance } from '../lib/util'
import { Camera } from '../components/Camera'
import { LocationPicker } from '../components/mapParts'
import { ScreenHeader } from '../components/ui'
import { useSubmitFlow } from './Result'

export const DEFAULT_NICKNAME = 'Árvore sem nome'

/**
 * Cadastro rápido: abre direto na câmera. Depois da foto, basta tocar em "Salvar registro".
 * O local é fixado no momento da foto; o apelido é opcional.
 */
export function QuickAdd() {
  const nav = useNavigate()
  const position = useStore((s) => s.position)
  const addTree = useStore((s) => s.addTree)
  const me = useStore((s) => s.session)
  const { run, overlay } = useSubmitFlow()

  const [photo, setPhoto] = useState<string | null>(null)
  const [pos, setPos] = useState<[number, number] | null>(null)
  const [nickname, setNickname] = useState('')
  const [picking, setPicking] = useState(false)

  if (!photo) {
    return (
      <Camera
        title="Cadastro rápido: tire a foto"
        hint="Enquadre a árvore inteira, se possível"
        onClose={() => nav(-1)}
        onCapture={(p) => { setPhoto(p); setPos(position.pos) }}
      />
    )
  }

  const save = () =>
    run('tree', () => {
      const t = addTree({
        nicknames: [nickname.trim() || DEFAULT_NICKNAME], scientificName: '', family: '', characteristics: '',
        sources: [], lat: pos![0], lng: pos![1], photo, invasive: false, createdBy: me!,
      })
      return { treeId: t.id, photo, pendingId: true }
    })

  return (
    <div className="screen">
      <ScreenHeader title="Cadastro rápido" sub="Confira a foto e salve" back />
      <div className="scroll pad stack">
        <div style={{ position: 'relative' }}>
          <img src={photo} alt="Foto da árvore" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 20 }} />
          <button className="btn sm" style={{ position: 'absolute', right: 10, bottom: 10, boxShadow: 'var(--shadow)', background: 'var(--surface)' }} onClick={() => setPhoto(null)}>
            <CameraIcon size={18} /> Tirar outra
          </button>
        </div>

        <div className="card row between">
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <MapPin color="var(--primary)" style={{ flexShrink: 0 }} />
            <div>
              <strong>Local fixado na foto</strong>
              <div className="small muted">
                {position.source === 'gps' ? 'GPS' : 'Posição simulada'}
                {pos && ` · ${formatDistance(distance(pos, position.pos))} de você agora`}
              </div>
            </div>
          </div>
          <button className="btn ghost" onClick={() => setPicking(true)}>Alterar</button>
        </div>

        <div className="field">
          <label htmlFor="nick">Apelido <span className="muted small">(opcional)</span></label>
          <input id="nick" className="input" placeholder="Ex.: Árvore de flores roxas da parada" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          <span className="hint">Se deixar vazio, ela aparece como “{DEFAULT_NICKNAME}”.</span>
        </div>

        <div className="card row" style={{ alignItems: 'flex-start' }}>
          <HelpCircle color="var(--pending)" style={{ flexShrink: 0 }} />
          <span className="small">A árvore entra no mapa com a tag <strong>Identificação pendente</strong>. Outras pessoas e especialistas poderão completar os dados depois.</span>
        </div>
      </div>
      <div className="sticky-foot">
        <button className="btn outline" onClick={() => nav('/nova/detalhado', { replace: true, state: { photo, pos, nickname } })}>
          <Search size={20} /> Completo
        </button>
        <button className="btn primary grow" onClick={save}><Save size={20} /> Salvar registro</button>
      </div>
      {picking && pos && <LocationPicker initial={pos} onClose={() => setPicking(false)} onPick={(p) => { setPos(p); setPicking(false) }} />}
      {overlay}
    </div>
  )
}
