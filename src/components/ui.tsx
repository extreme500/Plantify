import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, BadgeCheck, Camera, CheckCircle2, CloudOff, HelpCircle, Info,
  Leaf, MessageCircle, Microscope, Search, X,
} from 'lucide-react'
import type { Tree, User } from '../data/types'
import { treeStatus } from '../data/types'
import { initials } from '../lib/util'
import { photoSrc } from '../lib/art'
import { useStore } from '../store/store'

export function ScreenHeader({ title, sub, back, onBack, right }: {
  title: string
  sub?: string
  /** true = voltar no histórico; string = ir para a rota. */
  back?: boolean | string
  onBack?: () => void
  right?: ReactNode
}) {
  const nav = useNavigate()
  return (
    <header className="header">
      {(back || onBack) && (
        <button
          className="icon-btn"
          aria-label="Voltar"
          onClick={() => (onBack ? onBack() : typeof back === 'string' ? nav(back) : nav(-1))}
        >
          <ArrowLeft size={24} />
        </button>
      )}
      <div className="titles" style={{ paddingLeft: back || onBack ? 0 : 8 }}>
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {right}
    </header>
  )
}

const AVATAR_COLORS = ['#15803d', '#0e7490', '#7c3aed', '#c2410c', '#be185d', '#4d7c0f', '#1d4ed8', '#a16207']

export function Avatar({ user, size = 40 }: { user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'> | null; size?: number }) {
  if (!user) {
    return <span className="avatar" style={{ width: size, height: size, background: '#94a3b8', fontSize: size * 0.4 }}>?</span>
  }
  const color = AVATAR_COLORS[[...user.id].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
  return (
    <span
      className="avatar"
      style={{
        width: size, height: size, fontSize: size * 0.4, background: user.avatar ? undefined : color,
        backgroundImage: user.avatar ? `url(${user.avatar})` : undefined,
      }}
      aria-hidden
    >
      {!user.avatar && initials(user.firstName, user.lastName)}
    </span>
  )
}

export function userName(u?: Pick<User, 'firstName' | 'lastName'> | null) {
  return u ? `${u.firstName} ${u.lastName}`.trim() : 'Usuário removido'
}

export function StatusBadges({ tree, compact }: { tree: Tree; compact?: boolean }) {
  const st = treeStatus(tree)
  return (
    <span className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
      {st === 'verificada' && <span className="badge verificada"><BadgeCheck size={14} /> Espécie verificada</span>}
      {st === 'identificada' && <span className="badge identificada"><Search size={14} /> {compact ? 'Aguardando verificação' : 'Identificada · aguardando verificação'}</span>}
      {st === 'pendente' && <span className="badge pendente"><HelpCircle size={14} /> Identificação pendente</span>}
      {tree.invasive && <span className="badge invasive"><AlertTriangle size={14} /> Exótica invasora</span>}
      {tree.sync === 'pending' && <span className="badge sync"><CloudOff size={14} /> Aguardando envio</span>}
    </span>
  )
}

export function RoleBadge({ user }: { user?: User | null }) {
  if (user?.role !== 'especialista') return null
  return <span className="badge role" title="Especialista em Biologia/Agronomia"><Microscope size={12} /> Especialista</span>
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span />
    </label>
  )
}

export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        {children}
      </div>
    </div>
  )
}

export function Dialog({ onClose, title, children }: { onClose: () => void; title?: string; children: ReactNode }) {
  return (
    <div className="backdrop centered" onClick={onClose}>
      <div className="dialog stack" role="dialog" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="row between">
            <h2 style={{ fontSize: '1.25rem' }}>{title}</h2>
            <button className="icon-btn" aria-label="Fechar" onClick={onClose}><X /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismiss(t.id)}>
          {t.kind === 'success' ? <CheckCircle2 size={20} /> : t.kind === 'warning' ? <CloudOff size={20} /> : <Info size={20} />}
          {t.text}
        </div>
      ))}
    </div>
  )
}

export type TreeTab = 'ficha' | 'instants' | 'comentarios'

/** Barra inferior do contexto de uma árvore (Ficha · Instants · Comentários), com rótulos visíveis. */
export function TreeTabs({ treeId, active }: { treeId: string; active?: TreeTab }) {
  const nav = useNavigate()
  const go = (t: TreeTab) => nav(t === 'ficha' ? `/arvore/${treeId}` : `/arvore/${treeId}/${t}`, { replace: true })
  return (
    <nav className="tabbar" aria-label="Seções da árvore">
      <button className={active === 'ficha' ? 'on' : ''} onClick={() => go('ficha')} aria-current={active === 'ficha'}>
        <span className="tab-ico"><Leaf size={22} /></span>Ficha
      </button>
      <button className={`center ${active === 'instants' ? 'on' : ''}`} onClick={() => go('instants')} aria-current={active === 'instants'}>
        <span className="tab-ico"><Camera size={24} /></span>Instants
      </button>
      <button className={active === 'comentarios' ? 'on' : ''} onClick={() => go('comentarios')} aria-current={active === 'comentarios'}>
        <span className="tab-ico"><MessageCircle size={22} /></span>Comentários
      </button>
    </nav>
  )
}

export function Photo({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) {
  return <img src={photoSrc(src)} alt={alt} className={className} style={style} loading="lazy" />
}

export function SendingOverlay({ text = 'Enviando…' }: { text?: string }) {
  return (
    <div className="sending">
      <div className="dialog"><div className="spinner" /><strong>{text}</strong></div>
    </div>
  )
}

export function Empty({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return <div className="empty">{icon}{children}</div>
}
