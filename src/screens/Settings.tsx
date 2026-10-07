import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, LogIn, LogOut, RotateCcw } from 'lucide-react'
import { useMe, useOnline, useStore } from '../store/store'
import { Avatar, Dialog, RoleBadge, ScreenHeader, Toggle, userName } from '../components/ui'

export function Settings() {
  const nav = useNavigate()
  const me = useMe()
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const logout = useStore((s) => s.logout)
  const resetDemo = useStore((s) => s.resetDemo)
  const setTutorialSeen = useStore((s) => s.setTutorialSeen)
  const browserOnline = useStore((s) => s.browserOnline)
  const online = useOnline()
  const [confirmReset, setConfirmReset] = useState(false)

  async function toggleNotifications(v: boolean) {
    setSettings({ notifications: v })
    if (v && 'Notification' in window && Notification.permission === 'default') {
      try { await Notification.requestPermission() } catch { /* sem suporte */ }
    }
  }

  return (
    <div className="screen">
      <ScreenHeader title="Configurações" back />
      <div className="scroll">
        <div className="pad stack">
          <div className="card row">
            <Avatar user={me} size={72} />
            <div className="grow" style={{ minWidth: 0 }}>
              <strong style={{ fontSize: '1.1rem' }}>{me ? userName(me) : 'Visitante'}</strong>
              <div className="small muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{me ? me.email : 'Você está explorando sem conta'}</div>
              <RoleBadge user={me} />
            </div>
            {me ? (
              <button className="btn outline sm" onClick={() => nav('/perfil/editar')}>Editar</button>
            ) : (
              <button className="btn primary sm" onClick={() => logout()}><LogIn size={16} /> Entrar</button>
            )}
          </div>

          <div className="card">
            <div className="settings-row">
              <span className="sr-text"><strong>Modo escuro</strong></span>
              <Toggle checked={settings.darkMode} onChange={(v) => setSettings({ darkMode: v })} label="Modo escuro" />
            </div>
            <div className="settings-row">
              <span className="sr-text"><strong>Idioma</strong></span>
              <select className="select" style={{ width: 'auto', minHeight: 44 }} value={settings.language} onChange={() => {}} aria-label="Idioma">
                <option value="pt">Português</option>
                <option value="en" disabled>English (em breve)</option>
                <option value="es" disabled>Español (em breve)</option>
              </select>
            </div>
            <div className="settings-row">
              <span className="sr-text"><strong>Permitir notificações</strong><span className="small muted">{me?.role === 'especialista' ? 'Novas árvores com identificação pendente, comentários e verificações.' : 'Comentários e verificações nas suas árvores.'}</span></span>
              <Toggle checked={settings.notifications} onChange={toggleNotifications} label="Permitir notificações" />
            </div>
          </div>

          <button className="btn outline block" onClick={() => setTutorialSeen(false)}><BookOpen size={20} /> Como usar o app (tutorial)</button>

          <div className="card">
            <div className="section-title">Simulações do protótipo</div>
            <div className="settings-row">
              <span className="sr-text">
                <strong>Simular sem conexão</strong>
                <span className="small muted">Testa o salvamento offline. Ao desligar, os itens pendentes são sincronizados. {!browserOnline && '(O aparelho está realmente offline agora.)'}</span>
              </span>
              <Toggle checked={settings.simulateOffline} onChange={(v) => setSettings({ simulateOffline: v })} label="Simular sem conexão" />
            </div>
            <div className="settings-row">
              <span className="sr-text">
                <strong>Simular posição no campus</strong>
                <span className="small muted">Ignora o GPS. Arraste o ponto roxo no mapa para “caminhar”. Fora do campus isso acontece automaticamente.</span>
              </span>
              <Toggle checked={settings.simulatePosition} onChange={(v) => setSettings({ simulatePosition: v })} label="Simular posição" />
            </div>
            <div className="small muted" style={{ paddingTop: 8 }}>Status atual: <strong>{online ? 'online' : 'offline'}</strong></div>
          </div>

          <button className="btn danger block" onClick={() => setConfirmReset(true)}><RotateCcw size={20} /> Restaurar dados de demonstração</button>
          {me && <button className="btn ghost block" onClick={() => { logout(); nav('/', { replace: true }) }}><LogOut size={20} /> Sair da conta</button>}
          <p className="hint center">Protótipo · os dados ficam salvos apenas neste aparelho (IndexedDB).</p>
        </div>
      </div>
      {confirmReset && (
        <Dialog title="Restaurar dados?" onClose={() => setConfirmReset(false)}>
          <p style={{ margin: 0 }}>Todas as contas, árvores, instants e comentários criados neste aparelho serão apagados e os dados de exemplo voltarão ao estado inicial.</p>
          <div className="row">
            <button className="btn outline grow" onClick={() => setConfirmReset(false)}>Cancelar</button>
            <button className="btn danger grow" onClick={async () => { await resetDemo(); nav('/', { replace: true }) }}>Restaurar</button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
