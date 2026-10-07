import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Microscope, Plus, User as UserIcon, X } from 'lucide-react'
import { useMe, useStore } from '../store/store'
import type { Role } from '../data/types'
import { compressImage, readFile } from '../lib/util'
import { ScreenHeader } from '../components/ui'

/** Tela "Registro" do esboço; também usada para editar o perfil (`edit`). */
export function Register({ edit }: { edit?: boolean }) {
  const nav = useNavigate()
  const me = useMe()
  const register = useStore((s) => s.register)
  const updateProfile = useStore((s) => s.updateProfile)
  const toast = useStore((s) => s.toast)
  const fileRef = useRef<HTMLInputElement>(null)

  const [f, setF] = useState({
    firstName: edit && me ? me.firstName : '',
    lastName: edit && me ? me.lastName : '',
    email: edit && me ? me.email : '',
    password: '',
    bio: edit && me ? me.bio : '',
    avatar: edit && me ? me.avatar : (null as string | null),
    role: (edit && me ? me.role : 'comum') as Role,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: keyof typeof f, v: string | null) => { setF({ ...f, [k]: v }); setErrors({ ...errors, [k]: '' }) }

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) set('avatar', await compressImage(await readFile(file), 300))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (!f.firstName.trim()) err.firstName = 'Informe seu nome.'
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) err.email = 'Informe um e-mail válido.'
    if (!edit && f.password.length < 4) err.password = 'A senha precisa ter pelo menos 4 caracteres.'
    if (edit && f.password && f.password.length < 4) err.password = 'A senha precisa ter pelo menos 4 caracteres.'
    setErrors(err)
    if (Object.keys(err).length) return

    const data = {
      firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim(),
      bio: f.bio.trim(), avatar: f.avatar, role: f.role,
    }
    if (edit && me) {
      updateProfile(me.id, { ...data, ...(f.password ? { password: f.password } : {}) })
      toast('Perfil atualizado.', 'success')
      nav(-1)
    } else {
      const r = register({ ...data, password: f.password })
      if (r.error) { setErrors({ email: r.error }); return }
      toast(`Conta criada! Bem-vindo(a), ${data.firstName}.`, 'success')
      nav('/', { replace: true })
    }
  }

  return (
    <div className="screen">
      <ScreenHeader
        title={edit ? 'Editar perfil' : 'Registro'}
        right={<button className="icon-btn" aria-label="Fechar" onClick={() => nav(-1)}><X /></button>}
      />
      <form className="screen" onSubmit={submit} noValidate>
        <div className="scroll"><div className="pad stack">
          <div className="center">
            <button type="button" className="photo-circle has" style={{ margin: '0 auto', borderRadius: 24 }} onClick={() => fileRef.current?.click()} aria-label="Escolher foto de perfil">
              {f.avatar ? <img src={f.avatar} alt="" /> : <UserIcon size={72} />}
              <span className="edit-ov"><Plus size={20} /></span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickAvatar} />
            <div className="hint" style={{ marginTop: 6 }}>Foto de perfil (opcional)</div>
          </div>

          <Field label="Nome" required error={errors.firstName}>
            <input className={`input ${errors.firstName ? 'error' : ''}`} value={f.firstName} onChange={(e) => set('firstName', e.target.value)} autoComplete="given-name" />
          </Field>
          <Field label="Sobrenome">
            <input className="input" value={f.lastName} onChange={(e) => set('lastName', e.target.value)} autoComplete="family-name" />
          </Field>
          <Field label="E-mail" required error={errors.email}>
            <input className={`input ${errors.email ? 'error' : ''}`} type="email" value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
          </Field>
          <Field label={edit ? 'Nova senha (deixe vazio para manter)' : 'Senha'} required={!edit} error={errors.password}>
            <input className={`input ${errors.password ? 'error' : ''}`} type="password" value={f.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Sobre você">
            <textarea className="textarea" placeholder="Ex.: Tenho curiosidade sobre plantas e natureza!" value={f.bio} onChange={(e) => set('bio', e.target.value)} />
          </Field>

          <div className="field">
            <span className="label">Como você vai usar o app?</span>
            <div className="segmented" role="radiogroup">
              <button type="button" role="radio" aria-checked={f.role === 'comum'} className={f.role === 'comum' ? 'on' : ''} onClick={() => set('role', 'comum')}>Explorador(a)</button>
              <button type="button" role="radio" aria-checked={f.role === 'especialista'} className={f.role === 'especialista' ? 'on' : ''} onClick={() => set('role', 'especialista')}><Microscope size={18} /> Especialista</button>
            </div>
            <span className="hint">
              {f.role === 'especialista'
                ? 'Para estudantes e docentes de Biologia/Agronomia: você recebe avisos de árvores com identificação pendente e pode atribuir o selo de “Espécie verificada”.'
                : 'Explore o mapa, cadastre árvores, poste instants e comente. Ideal para quem é curioso(a) sobre a flora do campus.'}
            </span>
          </div>
        </div></div>
        <div className="sticky-foot">
          <button className="btn primary block" type="submit">{edit ? 'Salvar alterações' : 'Concluído'}</button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label>{label}{required && <span className="req">*</span>}</label>
      {children}
      {error && <span className="err-msg">{error}</span>}
    </div>
  )
}
