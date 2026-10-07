import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, Sprout } from 'lucide-react'
import { useStore } from '../store/store'
import { Dialog } from '../components/ui'

/** Tela "Bem-vindo!" do esboço: login + registrar + explorar sem conta. */
export function Welcome() {
  const nav = useNavigate()
  const login = useStore((s) => s.login)
  const enterAsGuest = useStore((s) => s.enterAsGuest)
  const toast = useStore((s) => s.toast)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [forgot, setForgot] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Preencha e-mail e senha.'); return }
    const u = login(email, password)
    if (!u) { setError('E-mail/usuário ou senha incorretos.'); return }
    toast(`Olá, ${u.firstName}!`, 'success')
    nav('/', { replace: true })
  }

  return (
    <div className="screen">
      <div className="scroll">
        <div className="welcome-hero">
          <div className="logo"><Sprout size={44} /></div>
          <h1>Bem-vindo!</h1>
          <p className="muted" style={{ margin: 0 }}>Plantify · a flora do Campus do Vale, mapeada por quem passa por ela.</p>
        </div>
        <form className="pad stack" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="email">E-mail ou usuário</label>
            <input id="email" className={`input ${error && !email ? 'error' : ''}`} type="text" autoComplete="username"
              placeholder="voce@exemplo.com" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} />
          </div>
          <div className="field">
            <label htmlFor="pw">Senha</label>
            <input id="pw" className={`input ${error && !password ? 'error' : ''}`} type="password" autoComplete="current-password"
              placeholder="••••" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} />
            <button type="button" className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={() => setForgot(true)}>Esqueci a senha</button>
          </div>
          {error && <div className="err-msg" role="alert">{error}</div>}
          <button className="btn primary block" type="submit">Entrar</button>
          <button className="btn outline block" type="button" onClick={() => nav('/registro')}>Registrar</button>
          <button className="btn ghost block" type="button" onClick={() => { enterAsGuest(); nav('/', { replace: true }) }}>
            <Compass size={20} /> Explorar o mapa sem conta
          </button>
          <p className="hint center">Sem conta você pode ver o mapa e as fichas. Para cadastrar árvores, comentar e postar instants, faça login.</p>
        </form>
      </div>
      {forgot && (
        <Dialog title="Esqueci a senha" onClose={() => setForgot(false)}>
          <p style={{ margin: 0 }}>
            Na versão final, enviaríamos um link de recuperação para o seu e-mail. Neste protótipo, as contas ficam salvas
            apenas neste aparelho. Crie uma nova conta se não lembrar a senha.
          </p>
          <button className="btn primary" onClick={() => setForgot(false)}>Entendi</button>
        </Dialog>
      )}
    </div>
  )
}
