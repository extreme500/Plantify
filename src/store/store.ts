import { create } from 'zustand'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import type {
  AppNotification, Comment, DB, Instant, Report, ReportKind, ReportReason, Settings, Suggestion, Tree, TreeContent, User,
} from '../data/types'
import { REPORT_KIND_LABEL, REPORT_REASON_LABEL, sameContent, treeContent } from '../data/types'
import { createSeed, DB_VERSION, migrateDb } from '../data/seed'
import { SIMULATED_START } from '../data/campus'
import { uid } from '../lib/util'

const DB_KEY = 'plantify:db'
const LS_SETTINGS = 'plantify:settings'
const LS_SESSION = 'plantify:session'
/** Contas (ou 'guest') que já viram o tutorial neste aparelho. */
const LS_TUTORIAL = 'plantify:tutorialSeenBy'

export interface Toast {
  id: string
  text: string
  kind: 'info' | 'success' | 'warning'
}

export interface Position {
  pos: [number, number]
  source: 'gps' | 'simulado'
  /** Motivo de estar simulando (GPS negado, fora do campus...). */
  reason?: string
  accuracy?: number
}

/**
 * unchanged: nada mudou · saved: edição publicada · suggested: virou sugestão (árvore verificada) ·
 * published-verified: especialista editou e a árvore continua verificada.
 */
export type EditResult = 'unchanged' | 'saved' | 'suggested' | 'published-verified'

interface State {
  ready: boolean
  db: DB
  settings: Settings
  /** id do usuário logado; 'guest' = explorando sem conta; null = tela de boas-vindas. */
  session: string | null
  tutorialSeenBy: string[]
  /** Tutorial aberto manualmente (menu ou configurações). */
  tutorialOpen: boolean
  browserOnline: boolean
  position: Position
  simulatedPos: [number, number]
  toasts: Toast[]
  /** Mensagem do convite de login exibido quando um visitante tenta contribuir. */
  askLogin: string | null

  setAskLogin(msg: string | null): void
  init(): Promise<void>
  toast(text: string, kind?: Toast['kind']): void
  dismissToast(id: string): void
  setSettings(p: Partial<Settings>): void
  setBrowserOnline(v: boolean): void
  setPosition(p: Position): void
  setSimulatedPos(p: [number, number]): void
  openTutorial(): void
  finishTutorial(): void

  login(email: string, password: string): { user?: User; error?: string }
  enterAsGuest(): void
  register(data: Omit<User, 'id' | 'createdAt'>): { user?: User; error?: string }
  updateProfile(id: string, data: Partial<User>): void
  logout(): void

  addTree(data: TreeContent & Pick<Tree, 'createdBy'>): Tree
  updateTree(id: string, data: Partial<Tree>, opts?: { silent?: boolean }): void
  /**
   * Salva o formulário "Completar informações". Em árvore verificada, a edição de um explorador vira
   * uma sugestão (a versão verificada continua publicada); a de um especialista é publicada e segue verificada.
   */
  editTree(id: string, content: TreeContent): EditResult
  cancelSuggestion(treeId: string, suggestionId: string): void
  approveSuggestion(treeId: string, suggestionId: string): void
  rejectSuggestion(treeId: string, suggestionId: string, reason: string): void
  verifyTree(id: string, verified: boolean): void
  setInvasive(id: string, invasive: boolean): void
  deleteTree(id: string): void

  addComment(treeId: string, text: string): Comment
  editComment(id: string, text: string): void
  deleteComment(id: string): void
  addInstant(data: Pick<Instant, 'treeId' | 'photo' | 'tag' | 'caption'>): Instant
  deleteInstant(id: string): void

  report(kind: ReportKind, targetId: string, reason: ReportReason, details: string): void
  /** Moderação: remove o conteúdo denunciado e encerra a denúncia. */
  removeReported(reportId: string): void
  dismissReport(reportId: string): void
  banUser(userId: string, reason: string): void
  unbanUser(userId: string): void

  markNotificationsRead(): void
  syncPending(): number
  resetDemo(): Promise<void>
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(fallback) ? parsed : { ...fallback, ...parsed }
  } catch {
    return fallback
  }
}

function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* armazenamento indisponível (aba anônima etc.) */
  }
}

const DEFAULT_SETTINGS: Settings = {
  darkMode: false,
  language: 'pt',
  notifications: true,
  simulateOffline: false,
  simulatePosition: false,
}

let saveTimer: ReturnType<typeof setTimeout> | undefined
function persistDb(db: DB) {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    idbSet(DB_KEY, db).catch((e) => console.error('Falha ao salvar no IndexedDB', e))
  }, 250)
}

const BAN_MESSAGE = 'Esta conta foi suspensa pela moderação por violar as regras da comunidade.'

export const useStore = create<State>((set, get) => {
  /** Aplica uma alteração no "banco" local e agenda a gravação no IndexedDB. */
  const mutate = (fn: (db: DB) => DB) => {
    const db = fn(get().db)
    set({ db })
    persistDb(db)
  }
  const me = () => get().session
  const meUser = () => get().db.users.find((u) => u.id === me())
  const online = () => get().browserOnline && !get().settings.simulateOffline
  const notify = (n: Omit<AppNotification, 'id' | 'createdAt' | 'readBy'>) =>
    mutate((db) => ({ ...db, notifications: [{ ...n, id: uid('n-'), createdAt: Date.now(), readBy: [] }, ...db.notifications] }))
  const tree = (id: string) => get().db.trees.find((t) => t.id === id)
  const withContributor = (t: Tree, userId: string | null) =>
    userId && !t.contributors.includes(userId) ? [...t.contributors, userId] : t.contributors
  const resolve = (r: Report, resolution: string): Report => ({ ...r, status: 'resolvida', resolution, resolvedBy: me(), resolvedAt: Date.now() })

  return {
    ready: false,
    db: { version: DB_VERSION, users: [], trees: [], comments: [], instants: [], notifications: [], reports: [] },
    settings: loadJSON(LS_SETTINGS, DEFAULT_SETTINGS),
    session: localStorage.getItem(LS_SESSION),
    tutorialSeenBy: loadJSON<string[]>(LS_TUTORIAL, []),
    tutorialOpen: false,
    browserOnline: navigator.onLine,
    position: { pos: SIMULATED_START, source: 'simulado', reason: 'Obtendo localização…' },
    simulatedPos: SIMULATED_START,
    toasts: [],
    askLogin: null,

    setAskLogin(msg) {
      set({ askLogin: msg })
    },

    async init() {
      let db: DB | undefined
      try {
        db = await idbGet<DB>(DB_KEY)
      } catch (e) {
        console.error(e)
      }
      if (db && db.version !== DB_VERSION) {
        db = migrateDb(db) ?? undefined
        if (db) persistDb(db)
      }
      if (!db) {
        db = createSeed()
        persistDb(db)
      }
      const session = get().session
      const sessionUser = db.users.find((u) => u.id === session)
      const validSession = session === 'guest' || (sessionUser && !sessionUser.banned) ? session : null
      set({ db, ready: true, session: validSession })
    },

    toast(text, kind = 'info') {
      const t = { id: uid('t'), text, kind }
      set({ toasts: [...get().toasts, t] })
      setTimeout(() => get().dismissToast(t.id), 4200)
    },
    dismissToast(id) {
      set({ toasts: get().toasts.filter((t) => t.id !== id) })
    },

    setSettings(p) {
      const wasOnline = online()
      const settings = { ...get().settings, ...p }
      set({ settings })
      saveJSON(LS_SETTINGS, settings)
      if (!wasOnline && online()) get().syncPending()
    },
    setBrowserOnline(v) {
      const wasOnline = online()
      set({ browserOnline: v })
      if (!wasOnline && online()) get().syncPending()
    },
    setPosition(p) {
      set({ position: p })
    },
    setSimulatedPos(p) {
      set({ simulatedPos: p })
    },
    openTutorial() {
      set({ tutorialOpen: true })
    },
    finishTutorial() {
      const id = me()
      const seen = id && !get().tutorialSeenBy.includes(id) ? [...get().tutorialSeenBy, id] : get().tutorialSeenBy
      set({ tutorialOpen: false, tutorialSeenBy: seen })
      saveJSON(LS_TUTORIAL, seen)
    },

    login(email, password) {
      const e = email.trim().toLowerCase()
      const u = get().db.users.find(
        (x) => x.password && (x.email.toLowerCase() === e || `${x.firstName} ${x.lastName}`.toLowerCase() === e) && x.password === password,
      )
      if (!u) return { error: 'E-mail/usuário ou senha incorretos.' }
      if (u.banned) return { error: BAN_MESSAGE }
      set({ session: u.id })
      localStorage.setItem(LS_SESSION, u.id)
      return { user: u }
    },
    enterAsGuest() {
      set({ session: 'guest' })
      localStorage.setItem(LS_SESSION, 'guest')
    },
    register(data) {
      const email = data.email.trim().toLowerCase()
      if (get().db.users.some((u) => u.email.toLowerCase() === email)) return { error: 'Este e-mail já está cadastrado.' }
      const user: User = { ...data, email, admin: false, banned: null, id: uid('u-'), createdAt: Date.now() }
      mutate((db) => ({ ...db, users: [...db.users, user] }))
      set({ session: user.id })
      localStorage.setItem(LS_SESSION, user.id)
      return { user }
    },
    updateProfile(id, data) {
      mutate((db) => ({ ...db, users: db.users.map((u) => (u.id === id ? { ...u, ...data } : u)) }))
    },
    logout() {
      set({ session: null, tutorialOpen: false })
      localStorage.removeItem(LS_SESSION)
    },

    addTree(data) {
      const now = Date.now()
      const t: Tree = {
        ...data, id: uid('t-'), createdAt: now, updatedAt: now,
        verifiedBy: null, verifiedAt: null, suggestions: [], contributors: [data.createdBy],
        lastEditedBy: null, lastEditedAt: null, sync: online() ? 'synced' : 'pending',
      }
      mutate((db) => ({ ...db, trees: [...db.trees, t] }))
      if (!t.scientificName.trim()) {
        notify({ to: 'especialistas', treeId: t.id, text: `Novo ponto com identificação pendente: "${t.nicknames[0]}".` })
      }
      return t
    },
    updateTree(id, data, opts) {
      const before = tree(id)
      mutate((db) => ({
        ...db,
        trees: db.trees.map((t) => (t.id === id ? { ...t, ...data, updatedAt: Date.now(), sync: online() ? t.sync : 'pending' } : t)),
      }))
      if (!opts?.silent && before && before.createdBy !== me() && me() !== 'guest') {
        notify({ to: before.createdBy, treeId: id, text: `Alguém completou informações de "${before.nicknames[0]}".` })
      }
    },
    editTree(id, content) {
      const t = tree(id)
      const user = meUser()
      if (!t || !user) return 'unchanged'
      const now = Date.now()
      const mine = t.suggestions.find((s) => s.by === user.id)

      if (t.verifiedBy && user.role !== 'especialista') {
        // Árvore verificada: a edição do explorador vira sugestão; a versão publicada não muda.
        if (sameContent(content, t)) {
          if (mine) get().cancelSuggestion(id, mine.id)
          return 'unchanged'
        }
        if (mine && sameContent(content, mine.content)) return 'unchanged'
        const suggestion: Suggestion = { id: mine?.id ?? uid('s-'), by: user.id, at: now, content: treeContent(content), baseVerifiedAt: t.verifiedAt }
        get().updateTree(id, { suggestions: [...t.suggestions.filter((s) => s.by !== user.id), suggestion] }, { silent: true })
        if (!mine) notify({ to: 'especialistas', treeId: id, text: `Nova sugestão de alteração em "${t.nicknames[0]}" aguardando revisão.` })
        return 'suggested'
      }

      if (sameContent(content, t)) return 'unchanged'
      const edit = { ...treeContent(content), lastEditedBy: user.id, lastEditedAt: now, contributors: withContributor(t, user.id) }
      if (t.verifiedBy) {
        // Especialista editando árvore verificada: publica e a árvore continua verificada.
        get().updateTree(id, { ...edit, verifiedBy: user.id, verifiedAt: now })
        return 'published-verified'
      }
      get().updateTree(id, edit)
      return 'saved'
    },
    cancelSuggestion(treeId, suggestionId) {
      const t = tree(treeId)
      if (!t) return
      get().updateTree(treeId, { suggestions: t.suggestions.filter((s) => s.id !== suggestionId) }, { silent: true })
    },
    approveSuggestion(treeId, suggestionId) {
      const t = tree(treeId)
      const s = t?.suggestions.find((x) => x.id === suggestionId)
      if (!t || !s) return
      const now = Date.now()
      get().updateTree(treeId, {
        ...treeContent(s.content),
        verifiedBy: me(), verifiedAt: now,
        lastEditedBy: s.by, lastEditedAt: now,
        contributors: withContributor(t, s.by),
        suggestions: t.suggestions.filter((x) => x.id !== suggestionId),
      }, { silent: true })
      notify({ to: s.by, treeId, text: `Sua sugestão em "${t.nicknames[0]}" foi aprovada e já está publicada. Obrigado!` })
    },
    rejectSuggestion(treeId, suggestionId, reason) {
      const t = tree(treeId)
      const s = t?.suggestions.find((x) => x.id === suggestionId)
      if (!t || !s) return
      get().cancelSuggestion(treeId, suggestionId)
      const why = reason.trim() ? ` Motivo: ${reason.trim()}` : ''
      notify({ to: s.by, treeId, text: `Sua sugestão em "${t.nicknames[0]}" não foi aprovada.${why}` })
    },
    verifyTree(id, verified) {
      const t = tree(id)
      if (!t) return
      get().updateTree(id, verified ? { verifiedBy: me(), verifiedAt: Date.now() } : { verifiedBy: null, verifiedAt: null }, { silent: true })
      if (verified && t.createdBy !== me()) {
        notify({ to: t.createdBy, treeId: id, text: `Seu registro "${t.nicknames[0]}" recebeu o selo de Espécie Verificada!` })
      }
    },
    setInvasive(id, invasive) {
      get().updateTree(id, { invasive }, { silent: true })
    },
    deleteTree(id) {
      mutate((db) => ({
        ...db,
        trees: db.trees.filter((t) => t.id !== id),
        comments: db.comments.filter((c) => c.treeId !== id),
        instants: db.instants.filter((i) => i.treeId !== id),
        notifications: db.notifications.filter((n) => n.treeId !== id),
      }))
    },

    addComment(treeId, text) {
      const c: Comment = { id: uid('c-'), treeId, userId: me()!, text, createdAt: Date.now(), sync: online() ? 'synced' : 'pending' }
      mutate((db) => ({ ...db, comments: [...db.comments, c] }))
      const t = tree(treeId)
      if (t && t.createdBy !== me()) notify({ to: t.createdBy, treeId, text: `Novo comentário em "${t.nicknames[0]}".` })
      return c
    },
    editComment(id, text) {
      mutate((db) => ({
        ...db,
        comments: db.comments.map((c) => (c.id === id ? { ...c, text, editedAt: Date.now(), sync: online() ? c.sync : 'pending' } : c)),
      }))
    },
    deleteComment(id) {
      mutate((db) => ({ ...db, comments: db.comments.filter((c) => c.id !== id) }))
    },
    addInstant(data) {
      const i: Instant = { ...data, id: uid('i-'), userId: me()!, createdAt: Date.now(), sync: online() ? 'synced' : 'pending' }
      mutate((db) => ({ ...db, instants: [i, ...db.instants] }))
      return i
    },
    deleteInstant(id) {
      mutate((db) => ({ ...db, instants: db.instants.filter((i) => i.id !== id) }))
    },

    report(kind, targetId, reason, details) {
      const db = get().db
      const target =
        kind === 'comment' ? db.comments.find((c) => c.id === targetId)
          : kind === 'instant' ? db.instants.find((i) => i.id === targetId)
            : db.trees.find((t) => t.id === targetId)
      if (!target) return
      const treeId = 'treeId' in target ? target.treeId : target.id
      const reportedUser = 'userId' in target ? target.userId : target.createdBy
      const r: Report = {
        id: uid('r-'), kind, targetId, treeId, reportedUser, by: me()!, reason, details: details.trim(), at: Date.now(),
        status: 'aberta', resolution: null, resolvedBy: null, resolvedAt: null,
      }
      mutate((d) => ({ ...d, reports: [r, ...d.reports] }))
      const t = tree(treeId)
      notify({ to: 'moderacao', treeId, text: `Nova denúncia: ${REPORT_KIND_LABEL[kind].toLowerCase()} em "${t?.nicknames[0] ?? 'árvore'}" (${REPORT_REASON_LABEL[reason]}).` })
    },
    removeReported(reportId) {
      const r = get().db.reports.find((x) => x.id === reportId)
      if (!r) return
      if (r.kind === 'comment') get().deleteComment(r.targetId)
      else if (r.kind === 'instant') get().deleteInstant(r.targetId)
      else get().deleteTree(r.targetId)
      // Outras denúncias do mesmo conteúdo também ficam resolvidas.
      mutate((db) => ({
        ...db,
        reports: db.reports.map((x) => (x.targetId === r.targetId && x.status === 'aberta' ? resolve(x, 'Conteúdo removido') : x)),
      }))
    },
    dismissReport(reportId) {
      mutate((db) => ({ ...db, reports: db.reports.map((x) => (x.id === reportId ? resolve(x, 'Denúncia arquivada') : x)) }))
    },
    banUser(userId, reason) {
      if (userId === me()) return
      mutate((db) => ({
        ...db,
        users: db.users.map((u) => (u.id === userId ? { ...u, banned: { at: Date.now(), by: me()!, reason: reason.trim() } } : u)),
        reports: db.reports.map((x) => (x.reportedUser === userId && x.status === 'aberta' ? resolve(x, 'Autor suspenso') : x)),
      }))
    },
    unbanUser(userId) {
      mutate((db) => ({ ...db, users: db.users.map((u) => (u.id === userId ? { ...u, banned: null } : u)) }))
    },

    markNotificationsRead() {
      const id = me()
      if (!id) return
      mutate((db) => ({
        ...db,
        notifications: db.notifications.map((n) => (n.readBy.includes(id) ? n : { ...n, readBy: [...n.readBy, id] })),
      }))
    },
    syncPending() {
      const db = get().db
      const count =
        db.trees.filter((t) => t.sync === 'pending').length +
        db.comments.filter((c) => c.sync === 'pending').length +
        db.instants.filter((i) => i.sync === 'pending').length
      if (!count) return 0
      mutate((d) => ({
        ...d,
        trees: d.trees.map((t) => ({ ...t, sync: 'synced' })),
        comments: d.comments.map((c) => ({ ...c, sync: 'synced' })),
        instants: d.instants.map((i) => ({ ...i, sync: 'synced' })),
      }))
      get().toast(`Conexão restabelecida: ${count} ${count === 1 ? 'item sincronizado' : 'itens sincronizados'}.`, 'success')
      return count
    },
    async resetDemo() {
      const db = createSeed()
      await idbSet(DB_KEY, db)
      set({ db, session: null, tutorialSeenBy: [], tutorialOpen: false })
      localStorage.removeItem(LS_SESSION)
      saveJSON(LS_TUTORIAL, [])
    },
  }
})

// ---- Seletores / helpers ----

export function isOnline(s: Pick<State, 'browserOnline' | 'settings'>) {
  return s.browserOnline && !s.settings.simulateOffline
}

export function useOnline() {
  return useStore((s) => s.browserOnline && !s.settings.simulateOffline)
}

export function useMe(): User | null {
  return useStore((s) => s.db.users.find((u) => u.id === s.session) ?? null)
}

export function useUserMap() {
  return useStore((s) => s.db.users)
}

export function usePendingCount() {
  return useStore(
    (s) =>
      s.db.trees.filter((t) => t.sync === 'pending').length +
      s.db.comments.filter((c) => c.sync === 'pending').length +
      s.db.instants.filter((i) => i.sync === 'pending').length,
  )
}

export function useMyNotifications(): AppNotification[] {
  const me = useMe()
  const all = useStore((s) => s.db.notifications)
  if (!me) return []
  return all.filter(
    (n) => n.to === me.id || (n.to === 'especialistas' && me.role === 'especialista') || (n.to === 'moderacao' && me.admin),
  )
}

/** Itens da fila de curadoria do especialista: árvores a verificar + sugestões a revisar. */
export function useCurationCounts() {
  const trees = useStore((s) => s.db.trees)
  const toVerify = trees.filter((t) => !t.verifiedBy && t.scientificName.trim()).length
  const suggestions = trees.reduce((n, t) => n + t.suggestions.length, 0)
  return { toVerify, suggestions, total: toVerify + suggestions }
}

export function useOpenReportsCount() {
  return useStore((s) => s.db.reports.filter((r) => r.status === 'aberta').length)
}
