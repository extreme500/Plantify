export type Role = 'comum' | 'especialista'

export interface Ban {
  at: number
  by: string
  reason: string
}

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
  /**
   * Moderação (independente de ser especialista): trata denúncias e pode suspender contas.
   * Não é escolhido no cadastro — numa versão final, seria atribuído pela instituição.
   */
  admin?: boolean
  /** Conta suspensa pela moderação: não consegue entrar nem contribuir. */
  banned?: Ban | null
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

/**
 * Alteração sugerida por um explorador numa árvore VERIFICADA. Não aparece para a comunidade:
 * só o autor e os especialistas a veem, até um especialista aprovar (vira a versão publicada) ou rejeitar.
 */
export interface Suggestion {
  id: string
  by: string
  at: number
  content: TreeContent
  /** verifiedAt da versão sobre a qual a sugestão foi feita (para avisar se ela ficou desatualizada). */
  baseVerifiedAt: number | null
}

export interface Tree extends TreeContent {
  id: string
  verifiedBy: string | null
  verifiedAt: number | null
  suggestions: Suggestion[]
  /** Quem já cadastrou ou editou o registro (para "Minhas contribuições"). */
  contributors: string[]
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
  editedAt?: number | null
  sync: SyncState
}

export type ReportKind = 'comment' | 'instant' | 'tree'
export type ReportReason = 'spam' | 'ofensivo' | 'falso' | 'outro'

export interface Report {
  id: string
  kind: ReportKind
  targetId: string
  treeId: string
  /** Autor do conteúdo denunciado. */
  reportedUser: string
  by: string
  reason: ReportReason
  details: string
  at: number
  status: 'aberta' | 'resolvida'
  resolution: string | null
  resolvedBy: string | null
  resolvedAt: number | null
}

export interface AppNotification {
  id: string
  /** id do usuário, 'especialistas' ou 'moderacao'. */
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
  reports: Report[]
}

export const TAG_LABEL: Record<InstantTag, string> = {
  visita: 'Visita',
  floracao: 'Floração',
  frutificacao: 'Frutificação',
  fitossanidade: 'Saúde da árvore',
}

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  spam: 'Spam ou propaganda',
  ofensivo: 'Conteúdo ofensivo',
  falso: 'Informação falsa ou vandalismo',
  outro: 'Outro motivo',
}

export const REPORT_KIND_LABEL: Record<ReportKind, string> = {
  comment: 'Comentário',
  instant: 'Instant',
  tree: 'Registro de árvore',
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

export type ContentField = 'photo' | 'nicknames' | 'scientificName' | 'family' | 'characteristics' | 'sources' | 'location' | 'invasive'

/** Quais campos mudam entre duas versões (para a tela de revisão de sugestões). */
export function changedFields(a: TreeContent, b: TreeContent): ContentField[] {
  const out: ContentField[] = []
  const eq = (x: unknown, y: unknown) => JSON.stringify(x) === JSON.stringify(y)
  if (a.photo !== b.photo) out.push('photo')
  if (!eq(a.nicknames, b.nicknames)) out.push('nicknames')
  if (a.scientificName !== b.scientificName) out.push('scientificName')
  if (a.family !== b.family) out.push('family')
  if (a.characteristics !== b.characteristics) out.push('characteristics')
  if (!eq(a.sources, b.sources)) out.push('sources')
  if (a.lat !== b.lat || a.lng !== b.lng) out.push('location')
  if (a.invasive !== b.invasive) out.push('invasive')
  return out
}

/** A árvore tem relação com o usuário: cadastrou, editou, sugeriu ou verificou. */
export function isMyTree(t: Tree, userId: string | null | undefined): boolean {
  if (!userId) return false
  return t.createdBy === userId || t.contributors.includes(userId) || t.verifiedBy === userId || t.suggestions.some((s) => s.by === userId)
}
