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

export interface Tree {
  id: string
  /** O primeiro é o apelido principal; os demais aparecem como "AKA". */
  nicknames: string[]
  scientificName: string
  family: string
  characteristics: string
  sources: Source[]
  lat: number
  lng: number
  photo: string
  verifiedBy: string | null
  verifiedAt: number | null
  invasive: boolean
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
