import { useEffect, useRef, useState } from 'react'
import { Camera as CameraIcon, ImageIcon, RefreshCw, X } from 'lucide-react'
import { compressImage, readFile } from '../lib/util'

/**
 * Câmera dentro do app (visor + disparador + trocar câmera + galeria), como no esboço.
 * Se o navegador não liberar a câmera (sem HTTPS, sem permissão ou sem webcam), cai para
 * a câmera/galeria nativa via <input type="file">.
 */
export function Camera({ title, hint, onCapture, onClose, embedded }: {
  title: string
  hint?: string
  onCapture: (dataUrl: string) => void
  onClose?: () => void
  embedded?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const nativeRef = useRef<HTMLInputElement>(null)
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    let stream: MediaStream | undefined
    let cancelled = false
    setReady(false)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(window.isSecureContext ? 'Este navegador não dá acesso à câmera.' : 'A câmera só funciona em conexão segura (HTTPS ou localhost).')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return }
        stream = s
        setError(null)
        if (videoRef.current) {
          videoRef.current.srcObject = s
          videoRef.current.play().catch(() => {})
        }
      })
      .catch((e: Error) => {
        setError(e.name === 'NotAllowedError' ? 'Permissão da câmera negada.' : 'Nenhuma câmera encontrada neste aparelho.')
      })
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [facing])

  async function shoot() {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    setFlash(true)
    setTimeout(() => setFlash(false), 120)
    // Recorte quadrado central, como uma "polaroid".
    const side = Math.min(v.videoWidth, v.videoHeight)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = Math.min(side, 1000)
    const ctx = canvas.getContext('2d')!
    if (facing === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
    ctx.drawImage(v, (v.videoWidth - side) / 2, (v.videoHeight - side) / 2, side, side, 0, 0, canvas.width, canvas.height)
    onCapture(canvas.toDataURL('image/jpeg', 0.8))
  }

  async function fromFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    onCapture(await compressImage(await readFile(f)))
  }

  return (
    <div className={`camera ${embedded ? 'embedded' : ''}`}>
      <div className="cam-top">
        {onClose && <button className="icon-btn" aria-label="Fechar câmera" onClick={onClose}><X /></button>}
        <h1 style={{ fontSize: '1.1rem', color: '#fff', paddingLeft: onClose ? 0 : 8 }}>{title}</h1>
      </div>
      <div className="viewfinder">
        {error ? (
          <div className="cam-msg">
            <CameraIcon size={48} />
            <strong>{error}</strong>
            <span className="small">Você ainda pode usar a câmera do aparelho ou escolher uma foto da galeria.</span>
            <button className="btn primary" onClick={() => nativeRef.current?.click()}><CameraIcon size={20} /> Abrir câmera do aparelho</button>
            <button className="btn outline" style={{ color: '#fff', borderColor: '#fff' }} onClick={() => galleryRef.current?.click()}><ImageIcon size={20} /> Escolher da galeria</button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef} playsInline muted onLoadedMetadata={() => setReady(true)}
              style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined, opacity: flash ? 0.2 : 1 }}
            />
            <div className="guide" />
            {hint && <div className="guide-text">{hint}</div>}
          </>
        )}
      </div>
      <div className="cam-controls">
        <button className="cam-side" aria-label="Escolher da galeria" onClick={() => galleryRef.current?.click()}><ImageIcon /></button>
        <button className="shutter" aria-label="Tirar foto" onClick={shoot} disabled={!!error || !ready}><span /></button>
        <button className="cam-side" aria-label="Trocar câmera" onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))} disabled={!!error}><RefreshCw /></button>
      </div>
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={fromFile} />
      <input ref={nativeRef} type="file" accept="image/*" capture="environment" hidden onChange={fromFile} />
    </div>
  )
}
