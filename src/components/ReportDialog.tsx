import { useState } from 'react'
import { Flag } from 'lucide-react'
import type { ReportKind, ReportReason } from '../data/types'
import { REPORT_KIND_LABEL, REPORT_REASON_LABEL } from '../data/types'
import { useStore } from '../store/store'
import { Dialog } from './ui'

/** Denúncia de conteúdo (comentário, instant ou registro de árvore) para a equipe de moderação. */
export function ReportDialog({ kind, targetId, onClose }: { kind: ReportKind; targetId: string; onClose: () => void }) {
  const report = useStore((s) => s.report)
  const toast = useStore((s) => s.toast)
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')

  function send() {
    if (!reason) return
    report(kind, targetId, reason, details)
    toast('Denúncia enviada. A moderação vai analisar.', 'success')
    onClose()
  }

  return (
    <Dialog title={`Denunciar ${REPORT_KIND_LABEL[kind].toLowerCase()}`} onClose={onClose}>
      <p className="small muted" style={{ margin: 0 }}>A equipe de moderação vai analisar. Quem publicou não fica sabendo quem denunciou.</p>
      <div className="stack" style={{ gap: 8 }} role="radiogroup" aria-label="Motivo">
        {(Object.keys(REPORT_REASON_LABEL) as ReportReason[]).map((r) => (
          <button key={r} role="radio" aria-checked={reason === r} className={`chip ${reason === r ? 'on' : ''}`} style={{ justifyContent: 'flex-start' }} onClick={() => setReason(r)}>
            {REPORT_REASON_LABEL[r]}
          </button>
        ))}
      </div>
      <textarea className="textarea" style={{ minHeight: 72 }} placeholder="Detalhes (opcional)" value={details} onChange={(e) => setDetails(e.target.value)} />
      <div className="row">
        <button className="btn outline grow" onClick={onClose}>Cancelar</button>
        <button className="btn danger grow" disabled={!reason} onClick={send}><Flag size={18} /> Denunciar</button>
      </div>
    </Dialog>
  )
}
