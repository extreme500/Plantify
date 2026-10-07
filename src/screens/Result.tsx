import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, HelpCircle, RefreshCw, X } from 'lucide-react'
import { isOnline, useStore } from '../store/store'
import { sleep } from '../lib/util'
import { Photo, ScreenHeader, SendingOverlay, TreeTabs } from '../components/ui'

export interface ResultState {
  ok: boolean
  kind: 'tree' | 'instant'
  treeId: string
  photo: string
  pendingId?: boolean
}

/**
 * Simula o envio ao servidor: mostra "Enviando…" e, conforme a conexão (real ou simulada),
 * leva para "Envio confirmado" ou "Erro no envio". Os dados sempre ficam salvos no aparelho.
 */
export function useSubmitFlow() {
  const nav = useNavigate()
  const [sending, setSending] = useState(false)
  async function run(kind: ResultState['kind'], action: () => Omit<ResultState, 'ok' | 'kind'>) {
    setSending(true)
    const online = isOnline(useStore.getState())
    await sleep(online ? 900 : 1600)
    const r = action()
    setSending(false)
    nav('/resultado', { replace: true, state: { ...r, ok: online, kind } satisfies ResultState })
  }
  return { sending, run, overlay: sending ? <SendingOverlay /> : null }
}

export function Result() {
  const nav = useNavigate()
  const loc = useLocation()
  const st = loc.state as ResultState | null
  const syncPending = useStore((s) => s.syncPending)
  const toast = useStore((s) => s.toast)
  const [retrying, setRetrying] = useState(false)

  if (!st) return <Navigate to="/" replace />

  const proceed = () => {
    if (st.kind === 'tree') nav('/', { replace: true, state: { focus: st.treeId } })
    else nav(`/arvore/${st.treeId}/instants`, { replace: true })
  }

  async function retry() {
    setRetrying(true)
    await sleep(1000)
    setRetrying(false)
    if (isOnline(useStore.getState())) {
      syncPending()
      nav('.', { replace: true, state: { ...st, ok: true } })
    } else {
      toast('Ainda sem conexão. Tentaremos de novo automaticamente.', 'warning')
    }
  }

  const what = st.kind === 'tree' ? 'árvore' : 'instant'

  return (
    <div className="screen">
      <ScreenHeader title={st.ok ? 'Envio confirmado' : 'Erro no envio'} sub={st.kind === 'tree' ? 'Cadastro de árvore' : 'Novo instant'} />
      <div className="scroll">
        {st.ok ? (
          <div className="result">
            <Photo src={st.photo} alt="Foto enviada" className="result-photo" />
            <div className="row" style={{ color: 'var(--primary)' }}><CheckCircle2 size={30} /><h2>Envio confirmado</h2></div>
            <p className="muted" style={{ margin: 0 }}>
              {st.kind === 'tree' ? 'Sua árvore já aparece no mapa para toda a comunidade.' : 'Seu instant foi publicado no perfil da árvore.'}
            </p>
            {st.pendingId && (
              <div className="card row" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                <HelpCircle color="var(--pending)" style={{ flexShrink: 0 }} />
                <span className="small">Ela foi marcada como <strong>Identificação pendente</strong>. Especialistas foram avisados e qualquer pessoa pode completar os dados.</span>
              </div>
            )}
            <button className="btn primary block" onClick={proceed}>Continuar</button>
          </div>
        ) : (
          <div className="result">
            <div className="result-icon fail"><X size={72} strokeWidth={3} /></div>
            <h2>Erro no envio</h2>
            <p className="muted" style={{ margin: 0 }}>
              Sem conexão com a internet. <strong>Não se preocupe:</strong> sua {what} foi salva neste aparelho e será enviada
              automaticamente assim que o sinal voltar.
            </p>
            <button className="btn primary block" onClick={retry}><RefreshCw size={20} /> Tentar novamente</button>
            <button className="btn outline block" onClick={proceed}>Continuar sem enviar</button>
          </div>
        )}
      </div>
      {st.kind === 'instant' && <TreeTabs treeId={st.treeId} active="instants" />}
      {retrying && <SendingOverlay text="Tentando novamente…" />}
    </div>
  )
}
