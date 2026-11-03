export type Role = 'comum' | 'especialista'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  /** Protótipo local: senha guardada em texto puro no aparelho. */
  password?: string
  bio: string
  avatar: string | null
  role: Role
  createdAt: number
}

/** 'synced' = já "enviado ao servidor"; 'pending' = salvo só no aparelho, aguardando conexão. */
export type SyncState = 'synced' | 'pending'

export interface Source {
  label: string
  url: string
}

/** Campos editáveis de um registro de árvore (o que a comunidade preenche e o especialista verifica). */
export interface TreeContent {
  /** O primeiro é o apelido principal; os demais aparecem como "AKA". */
  nicknames: string[]
  scientificName: string
  family: string
  characteristics: string
  sources: Source[]
  lat: number
  lng: number
  photo: string
  invasive: boolean
}

/** Cópia do registro no momento em que recebeu o selo de verificação. */
export interface VerifiedSnapshot extends TreeContent {
  verifiedBy: string
  verifiedAt: number
}

export interface Tree extends TreeContent {
  id: string
  /** Preenchidos quando a versão ATUAL do registro está verificada. */
  verifiedBy: string | null
  verifiedAt: number | null
  /**
   * Último registro verificado. Continua guardado quando alguém edita a árvore depois da
   * verificação: a versão atual perde o selo, mas esta cópia segue disponível na ficha e no filtro.
   */
  verifiedSnapshot: VerifiedSnapshot | null
  lastEditedBy: string | null
  lastEditedAt: number | null
  createdBy: string
  createdAt: number
  updatedAt: number
  sync: SyncState
}

export type TreeStatus = 'pendente' | 'identificada' | 'verificada'

export type InstantTag = 'visita' | 'floracao' | 'frutificacao' | 'fitossanidade'

export interface Instant {
  id: string
  treeId: string
  userId: string
  photo: string
  tag: InstantTag
  caption: string
  createdAt: number
  sync: SyncState
}

export interface Comment {
  id: string
  treeId: string
  userId: string
  text: string
  createdAt: number
  sync: SyncState
}

export interface AppNotification {
  id: string
  /** id do usuário, ou 'especialistas' para todos os especialistas. */
  to: string
  treeId: string
  text: string
  createdAt: number
  readBy: string[]
}

export interface Settings {
  darkMode: boolean
  language: 'pt'
  notifications: boolean
  simulateOffline: boolean
  simulatePosition: boolean
}

export interface DB {
  version: number
  users: User[]
  trees: Tree[]
  instants: Instant[]
  comments: Comment[]
  notifications: AppNotification[]
}

export const TAG_LABEL: Record<InstantTag, string> = {
  visita: 'Visita',
  floracao: 'Floração',
  frutificacao: 'Frutificação',
  fitossanidade: 'Saúde da árvore',
}

export function treeStatus(t: Tree): TreeStatus {
  if (t.verifiedBy) return 'verificada'
  if (t.scientificName.trim()) return 'identificada'
  return 'pendente'
}

export function treeContent(t: TreeContent): TreeContent {
  return {
    nicknames: t.nicknames, scientificName: t.scientificName, family: t.family, characteristics: t.characteristics,
    sources: t.sources, lat: t.lat, lng: t.lng, photo: t.photo, invasive: t.invasive,
  }
}

export function sameContent(a: TreeContent, b: TreeContent): boolean {
  return JSON.stringify(treeContent(a)) === JSON.stringify(treeContent(b))
}

/** A árvore foi editada depois de verificada: a versão atual aguarda nova verificação. */
export function editedAfterVerification(t: Tree): boolean {
  return !t.verifiedBy && !!t.verifiedSnapshot
}

/** A árvore tem uma versão verificada (a atual ou o último registro verificado). */
export function hasVerifiedVersion(t: Tree): boolean {
  return !!t.verifiedBy || !!t.verifiedSnapshot
}

/**
 * A árvore como estava no último registro verificado (para a ficha e o filtro "Verificadas").
 * Se a versão atual já é a verificada, devolve a própria árvore.
 */
export function verifiedVersion(t: Tree): Tree | null {
  if (t.verifiedBy) return t
  const s = t.verifiedSnapshot
  if (!s) return null
  return { ...t, ...treeContent(s), verifiedBy: s.verifiedBy, verifiedAt: s.verifiedAt }
}
