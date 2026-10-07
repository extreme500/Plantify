import { useNavigate } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import { useMe, useStore } from '../store/store'
import { Sheet } from './ui'

/** Executa a ação se houver usuário logado; senão abre o convite de "login rápido". */
export function useGuard() {
  const me = useMe()
  const ask = useStore((s) => s.setAskLogin)
  return (message: string, action: () => void) => (me ? action() : ask(message))
}

export function LoginPrompt() {
  const msg = useStore((s) => s.askLogin)
  const close = useStore((s) => s.setAskLogin)
  const logout = useStore((s) => s.logout)
  const nav = useNavigate()
  if (!msg) return null
  return (
    <Sheet onClose={() => close(null)}>
      <div className="stack">
        <h2 style={{ fontSize: '1.2rem' }}>Entre para contribuir</h2>
        <p className="muted" style={{ margin: 0 }}>{msg}</p>
        <button className="btn primary block" onClick={() => { close(null); logout(); nav('/', { replace: true }) }}><LogIn size={20} /> Entrar</button>
        <button className="btn outline block" onClick={() => { close(null); logout(); nav('/registro') }}><UserPlus size={20} /> Criar conta</button>
        <button className="btn ghost block" onClick={() => close(null)}>Agora não</button>
      </div>
    </Sheet>
  )
}
