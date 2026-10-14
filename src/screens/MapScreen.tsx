import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MapContainer, Marker, useMapEvents } from 'react-leaflet'
import {
  Camera, ChevronRight, CloudOff, CloudUpload, Leaf, LocateFixed, Menu as MenuIcon, MessageCircle,
  Navigation, Search, TreeDeciduous, Zap,
} from 'lucide-react'
import type { Tree } from '../data/types'
import { treeStatus } from '../data/types'
import { CAMPUS_CENTER } from '../data/campus'
import { useMe, useMyNotifications, useOnline, usePendingCount, useStore } from '../store/store'
import { distance, formatDistance } from '../lib/util'
import { BaseTiles, CampusOutline, FlyTo, meIcon, treeIcon } from '../components/mapParts'
import { Dialog, Photo, Sheet, StatusBadges } from '../components/ui'
import { Menu } from '../components/Menu'
import { useGuard } from '../components/guard'

type Filter = 'todas' | 'verificada' | 'identificada' | 'pendente' | 'invasora'

const FILTERS: { id: Filter; label: string; color?: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'verificada', label: 'Verificadas', color: '#15803d' },
  { id: 'identificada', label: 'Identificadas', color: '#0e7490' },
  { id: 'pendente', label: 'Pendentes', color: '#d97706' },
  { id: 'invasora', label: 'Invasoras', color: '#dc2626' },
]

function matches(t: Tree, f: Filter) {
  if (f === 'todas') return true
  if (f === 'invasora') return t.invasive
  return treeStatus(t) === f
}

// Mantém a câmera do mapa e o filtro ao navegar para outras telas e voltar.
let lastView: { center: [number, number]; zoom: number } = { center: CAMPUS_CENTER, zoom: 16 }
let lastFilter: Filter = 'todas'
const NEARBY_METERS = 20

function ViewSaver({ onClick }: { onClick: () => void }) {
  const map = useMapEvents({
    moveend: () => { const c = map.getCenter(); lastView = { center: [c.lat, c.lng], zoom: map.getZoom() } },
    click: onClick,
  })
  return null
}

export function MapScreen() {
  const nav = useNavigate()
  const location = useLocation()
  const trees = useStore((s) => s.db.trees)
  const instants = useStore((s) => s.db.instants)
  const comments = useStore((s) => s.db.comments)
  const position = useStore((s) => s.position)
  const setSimulatedPos = useStore((s) => s.setSimulatedPos)
  const online = useOnline()
  const pendingSync = usePendingCount()
  const me = useMe()
  const unread = useMyNotifications().filter((n) => me && !n.readBy.includes(me.id)).length
  const guard = useGuard()

  const [filter, setFilterState] = useState<Filter>(lastFilter)
  const setFilter = (f: Filter) => { lastFilter = f; setFilterState(f) }
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [flyTarget, setFlyTarget] = useState<{ pos: [number, number]; zoom?: number } | null>(null)
  const [nearby, setNearby] = useState<Tree[] | null>(null)
  const [choose, setChoose] = useState(false)

  // Ao voltar de um cadastro/ficha com { focus: id }, centraliza e abre a prévia da árvore.
  useEffect(() => {
    const focus = (location.state as { focus?: string } | null)?.focus
    if (!focus) return
    const t = trees.find((x) => x.id === focus)
    if (t) {
      setFilter('todas')
      setSelectedId(t.id)
      setFlyTarget({ pos: [t.lat, t.lng], zoom: 18 })
    }
    nav('.', { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  // O filtro ativo fica sempre visível na barra de filtros (ela rola na horizontal).
  const chipsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const bar = chipsRef.current
    const chip = bar?.querySelector<HTMLElement>('.chip.on')
    if (bar && chip) bar.scrollTo({ left: chip.offsetLeft - bar.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' })
  }, [filter])

  const visible = useMemo(() => trees.filter((t) => matches(t, filter)), [trees, filter])
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, trees.filter((t) => matches(t, f.id)).length])), [trees])
  const selected = trees.find((t) => t.id === selectedId) ?? null

  function startAdd() {
    guard('Para cadastrar uma árvore, entre na sua conta (leva poucos segundos).', () => {
      const close = trees
        .map((t) => ({ t, d: distance(position.pos, [t.lat, t.lng]) }))
        .filter((x) => x.d <= NEARBY_METERS)
        .sort((a, b) => a.d - b.d)
        .map((x) => x.t)
      if (close.length) setNearby(close)
      else setChoose(true)
    })
  }

  return (
    <div className="screen">
      <div className="map-wrap">
        <MapContainer center={lastView.center} zoom={lastView.zoom} zoomControl={false} maxZoom={19} minZoom={14}>
          <BaseTiles />
          <CampusOutline />
          <ViewSaver onClick={() => setSelectedId(null)} />
          <FlyTo target={flyTarget?.pos ?? null} zoom={flyTarget?.zoom} />
          {visible.map((t) => (
            <Marker
              key={t.id + t.updatedAt + (t.id === selectedId)}
              position={[t.lat, t.lng]}
              icon={treeIcon(t, t.id === selectedId)}
              eventHandlers={{ click: () => setSelectedId(t.id) }}
              title={t.nicknames[0]}
              alt={t.nicknames[0]}
            />
          ))}
          <Marker
            position={position.pos}
            icon={meIcon(position.source === 'simulado')}
            draggable={position.source === 'simulado'}
            zIndexOffset={1000}
            eventHandlers={{ dragend: (e) => { const ll = e.target.getLatLng(); setSimulatedPos([ll.lat, ll.lng]) } }}
            title={position.source === 'simulado' ? 'Você (posição simulada, arraste para mover)' : 'Você está aqui'}
          />
        </MapContainer>
      </div>

      <div className="map-top">
        <div className="map-titlebar">
          <button className="icon-btn" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
            <MenuIcon size={26} />
            {unread > 0 && <span className="dot-badge">{unread}</span>}
          </button>
          <h1>Mapa da Flora</h1>
          <span className="small muted" style={{ fontWeight: 700 }}>{visible.length} {visible.length === 1 ? 'árvore' : 'árvores'}</span>
        </div>
        <div className="chips" role="radiogroup" aria-label="Filtrar árvores" ref={chipsRef}>
          {FILTERS.map((f) => (
            <button key={f.id} role="radio" aria-checked={filter === f.id} className={`chip ${filter === f.id ? 'on' : ''}`} onClick={() => { setFilter(f.id); setSelectedId(null) }} style={{ boxShadow: 'var(--shadow)' }}>
              {f.color && <span className="swatch" style={{ background: f.color, border: '2px solid #fff' }} />}
              {f.label} <span style={{ opacity: 0.75 }}>{counts[f.id]}</span>
            </button>
          ))}
        </div>
        {!online && (
          <div className="banner offline"><CloudOff size={18} /> Sem conexão. Seus registros ficam salvos no aparelho.{pendingSync > 0 && ` (${pendingSync} aguardando)`}</div>
        )}
        {online && pendingSync > 0 && (
          <div className="banner pending"><CloudUpload size={18} /> {pendingSync} itens aguardando envio…</div>
        )}
      </div>

      {!selected && (
        <div className="map-status" role="status">
          <Navigation size={16} style={{ flexShrink: 0, marginTop: 1, color: position.source === 'gps' ? '#2563eb' : '#7c3aed' }} />
          {position.source === 'gps' ? (
            <span><strong>GPS ativo</strong>{position.accuracy ? ` · ±${Math.round(position.accuracy)} m` : ''}</span>
          ) : (
            <span><strong>Posição simulada</strong><br /><span className="muted">{position.reason}. Arraste o ponto roxo para se mover.</span></span>
          )}
        </div>
      )}

      {!selected && (
        <div className="map-actions">
          <button className="fab primary" onClick={startAdd} aria-label="Adicionar árvore">
            <span className="fab-circle"><TreeDeciduous size={34} /><span style={{ fontSize: 22, fontWeight: 900, marginLeft: -6, marginTop: 18 }}>+</span></span>
            <span className="fab-label">Adicionar árvore</span>
          </button>
          <button className="fab" onClick={() => setFlyTarget({ pos: [...position.pos] as [number, number], zoom: 18 })} aria-label="Centralizar na minha posição">
            <span className="fab-circle"><LocateFixed size={28} /></span>
            <span className="fab-label">Localizar</span>
          </button>
        </div>
      )}

      {selected && (
        <TreePreview tree={selected} onClose={() => setSelectedId(null)}
          dist={distance(position.pos, [selected.lat, selected.lng])}
          nInstants={instants.filter((i) => i.treeId === selected.id).length}
          nComments={comments.filter((c) => c.treeId === selected.id).length}
        />
      )}

      {nearby && (
        <Sheet onClose={() => setNearby(null)}>
          <div className="stack">
            <h2 style={{ fontSize: '1.2rem' }}>Esta árvore já está no mapa?</h2>
            <p className="muted" style={{ margin: 0 }}>Encontramos {nearby.length === 1 ? 'uma árvore registrada' : `${nearby.length} árvores registradas`} a menos de {NEARBY_METERS} m de você.</p>
            {nearby.map((t) => (
              <button key={t.id} className="list-item" onClick={() => nav(`/arvore/${t.id}`)}>
                <Photo src={t.photo} alt="" />
                <div className="grow">
                  <strong>{t.nicknames[0]}</strong>
                  <div className="small muted italic">{t.scientificName || 'Sem identificação'}</div>
                  <div className="small muted">{formatDistance(distance(position.pos, [t.lat, t.lng]))} de você · <strong style={{ color: 'var(--primary)' }}>É esta, abrir ficha</strong></div>
                </div>
                <ChevronRight />
              </button>
            ))}
            <button className="btn primary block" onClick={() => { setNearby(null); setChoose(true) }}>Não, é outra árvore</button>
          </div>
        </Sheet>
      )}

      {choose && (
        <Dialog title="Cadastro" onClose={() => setChoose(false)}>
          <button className="choice" onClick={() => nav('/nova/rapido')}>
            <span className="choice-icon"><Zap size={28} /></span>
            <span><strong>Rápido</strong><span className="small muted">Só tire a foto. A comunidade completa o resto depois.</span></span>
          </button>
          <button className="choice" onClick={() => nav('/nova/detalhado')}>
            <span className="choice-icon"><Search size={28} /></span>
            <span><strong>Detalhado</strong><span className="small muted">Foto, nome, características e fontes científicas.</span></span>
          </button>
        </Dialog>
      )}

      {menuOpen && <Menu onClose={() => setMenuOpen(false)} />}
    </div>
  )
}

/** Bottom sheet exibido ao tocar num marcador (fotos + taxonomia, como no diagrama de atividades). */
function TreePreview({ tree, dist, nInstants, nComments, onClose }: {
  tree: Tree; dist: number; nInstants: number; nComments: number; onClose: () => void
}) {
  const nav = useNavigate()
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 800 }}>
      <div className="sheet" style={{ boxShadow: '0 -6px 24px rgba(0,0,0,0.2)' }}>
        <div className="grab" onClick={onClose} />
        <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
          <Photo src={tree.photo} alt={`Foto de ${tree.nicknames[0]}`} style={{ width: 92, height: 92, borderRadius: 16, objectFit: 'cover', flexShrink: 0 }} />
          <div className="grow stack" style={{ gap: 4, minWidth: 0 }}>
            <h2 style={{ fontSize: '1.2rem' }}>{tree.nicknames[0]}</h2>
            <div className="italic muted">{tree.scientificName || 'Espécie ainda não identificada'}{tree.family && <span style={{ fontStyle: 'normal' }}> · {tree.family}</span>}</div>
            <StatusBadges tree={tree} compact />
            <div className="small muted">{formatDistance(dist)} de você</div>
          </div>
          <button className="icon-btn" aria-label="Fechar prévia" onClick={onClose} style={{ marginTop: -6 }}>✕</button>
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn primary grow" onClick={() => nav(`/arvore/${tree.id}`)}><Leaf size={20} /> Ver ficha</button>
          <button className="btn outline" onClick={() => nav(`/arvore/${tree.id}/instants`)} aria-label={`Instants (${nInstants})`}><Camera size={20} /> {nInstants}</button>
          <button className="btn outline" onClick={() => nav(`/arvore/${tree.id}/comentarios`)} aria-label={`Comentários (${nComments})`}><MessageCircle size={20} /> {nComments}</button>
        </div>
      </div>
    </div>
  )
}
