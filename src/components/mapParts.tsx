import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polygon, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { Check, MapPin } from 'lucide-react'
import type { Tree } from '../data/types'
import { treeStatus } from '../data/types'
import { CAMPUS_CENTER, CAMPUS_OUTLINE } from '../data/campus'
import { useStore } from '../store/store'
import { distance } from '../lib/util'
import { ScreenHeader } from './ui'

const TREE_SVG = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 19a4 4 0 0 1-2.24-7.32A3.5 3.5 0 0 1 9 6.03V6a3 3 0 1 1 6 0v.04a3.5 3.5 0 0 1 3.24 5.65A4 4 0 0 1 16 19Z"/><path d="M12 19v3"/></svg>'

const COLORS = { verificada: '#15803d', identificada: '#0e7490', pendente: '#d97706' }

export function treeIcon(t: Tree, selected = false) {
  const st = treeStatus(t)
  const badge = t.invasive
    ? '<span class="pin-badge" style="color:#dc2626">!</span>'
    : st === 'verificada'
      ? '<span class="pin-badge" style="color:#15803d">✓</span>'
      : st === 'pendente'
        ? '<span class="pin-badge" style="color:#d97706">?</span>'
        : ''
  const color = t.invasive ? '#dc2626' : COLORS[st]
  return L.divIcon({
    className: '',
    html: `<div class="tree-pin ${t.sync === 'pending' ? 'unsynced' : ''} ${selected ? 'selected' : ''}"><div class="pin-body" style="background:${color}">${TREE_SVG}</div>${badge}</div>`,
    iconSize: [44, 52],
    iconAnchor: [22, 48],
  })
}

export const meIcon = (simulated: boolean) =>
  L.divIcon({ className: '', html: `<div class="me-dot ${simulated ? 'sim' : ''}"></div>`, iconSize: [22, 22], iconAnchor: [11, 11] })

export function BaseTiles() {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      maxZoom={19}
    />
  )
}

export function CampusOutline() {
  return (
    <Polygon
      positions={CAMPUS_OUTLINE}
      pathOptions={{ color: '#166534', weight: 3, dashArray: '8 6', fillColor: '#22c55e', fillOpacity: 0.06 }}
      interactive={false}
    />
  )
}

/** Mapa estático pequeno (usado na ficha: um aproximado e um geral do campus). */
export function MiniMap({ tree, zoom, label }: { tree: Tree; zoom: number; label: string }) {
  return (
    <div className="minimap">
      <MapContainer
        center={[tree.lat, tree.lng]} zoom={zoom} zoomControl={false} attributionControl={false}
        dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} keyboard={false}
      >
        <BaseTiles />
        <CampusOutline />
        <Marker position={[tree.lat, tree.lng]} icon={treeIcon(tree)} />
      </MapContainer>
      <span className="minimap-label">{label}</span>
    </div>
  )
}

function CenterTracker({ onMove }: { onMove: (c: [number, number]) => void }) {
  const map = useMapEvents({ move: () => { const c = map.getCenter(); onMove([c.lat, c.lng]) } })
  return null
}

/** Tela cheia para "Escolher" o local: o usuário arrasta o mapa até o alfinete ficar sobre a árvore. */
export function LocationPicker({ initial, onPick, onClose }: {
  initial: [number, number]
  onPick: (p: [number, number]) => void
  onClose: () => void
}) {
  const [center, setCenter] = useState(initial)
  const trees = useStore((s) => s.db.trees)
  return (
    <div className="backdrop" style={{ background: 'var(--bg)', flexDirection: 'column', alignItems: 'stretch' }}>
      <ScreenHeader title="Escolher local" sub="Arraste o mapa até o alfinete ficar sobre a árvore" onBack={onClose} />
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={initial} zoom={18} zoomControl={false} style={{ position: 'absolute', inset: 0 }}>
          <BaseTiles />
          <CampusOutline />
          {trees.map((t) => <Marker key={t.id} position={[t.lat, t.lng]} icon={treeIcon(t)} interactive={false} />)}
          <CenterTracker onMove={setCenter} />
        </MapContainer>
        <div className="picker-pin"><MapPin size={48} fill="currentColor" stroke="#fff" /></div>
      </div>
      <div className="sticky-foot">
        <button className="btn outline grow" onClick={onClose}>Cancelar</button>
        <button className="btn primary grow" onClick={() => onPick(center)}><Check size={20} /> Usar este local</button>
      </div>
    </div>
  )
}

/** Recentraliza o mapa quando `target` muda. */
export function FlyTo({ target, zoom }: { target: [number, number] | null; zoom?: number }) {
  const map = useMap()
  const last = useRef<string>('')
  useEffect(() => {
    if (!target) return
    const key = target.join(',') + zoom
    if (key === last.current) return
    last.current = key
    map.flyTo(target, zoom ?? Math.max(map.getZoom(), 17), { duration: 0.6 })
  }, [target, zoom, map])
  return null
}

const MAX_CAMPUS_DISTANCE = 2500

/**
 * Mantém a posição do usuário na store. Usa o GPS real quando disponível e dentro do campus;
 * caso contrário (ou se o usuário pedir), usa uma posição simulada arrastável no mapa.
 */
export function GeoTracker() {
  const simulate = useStore((s) => s.settings.simulatePosition)
  const simulatedPos = useStore((s) => s.simulatedPos)
  const setPosition = useStore((s) => s.setPosition)
  const [gps, setGps] = useState<{ pos?: [number, number]; accuracy?: number; error?: string }>({})

  useEffect(() => {
    if (simulate) return
    if (!navigator.geolocation) { setGps({ error: 'GPS indisponível neste navegador' }); return }
    const id = navigator.geolocation.watchPosition(
      (p) => setGps({ pos: [p.coords.latitude, p.coords.longitude], accuracy: p.coords.accuracy }),
      (e) => setGps({ error: e.code === e.PERMISSION_DENIED ? 'Permissão de localização negada' : 'Não foi possível obter o GPS' }),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [simulate])

  useEffect(() => {
    if (simulate) {
      setPosition({ pos: simulatedPos, source: 'simulado', reason: 'Simulação ativada nas configurações' })
    } else if (gps.pos && distance(gps.pos, CAMPUS_CENTER) <= MAX_CAMPUS_DISTANCE) {
      setPosition({ pos: gps.pos, source: 'gps', accuracy: gps.accuracy })
    } else {
      const reason = gps.error ?? (gps.pos ? 'Você está fora do Campus do Vale' : 'Aguardando GPS…')
      setPosition({ pos: simulatedPos, source: 'simulado', reason })
    }
  }, [simulate, simulatedPos, gps, setPosition])

  return null
}
