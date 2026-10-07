import { create } from 'zustand'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import type { AppNotification, Comment, DB, Instant, Settings, Tree, User } from '../data/types'
import { createSeed, DB_VERSION } from '../data/seed'
import { SIMULATED_START } from '../data/campus'
import { uid } from '../lib/util'

const DB_KEY = 'plantify:db'
const LS_SETTINGS = 'plantify:settings'
const LS_SESSION = 'plantify:session'
const LS_TUTORIAL = 'plantify:tutorialSeen'

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

interface State {
  ready: boolean
  db: DB
  settings: Settings
  /** id do usuário logado; 'guest' = explorando sem conta; null = tela de boas-vindas. */
  session: string | null
  tutorialSeen: boolean
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
  setTutorialSeen(v: boolean): void

  login(email: string, password: string): User | null
  enterAsGuest(): void
  register(data: Omit<User, 'id' | 'createdAt'>): { user?: User; error?: string }
  updateProfile(id: string, data: Partial<User>): void
  logout(): void

  addTree(data: Omit<Tree, 'id' | 'createdAt' | 'updatedAt' | 'sync' | 'verifiedBy' | 'verifiedAt'>): Tree
  updateTree(id: string, data: Partial<Tree>, opts?: { silent?: boolean }): void
  verifyTree(id: string, verified: boolean): void
  addComment(treeId: string, text: string): Comment
  addInstant(data: Pick<Instant, 'treeId' | 'photo' | 'tag' | 'caption'>): Instant
  deleteInstant(id: string): void
  markNotificationsRead(): void
  syncPending(): number
  resetDemo(): Promise<void>
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
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

export const useStore = create<State>((set, get) => {
  /** Aplica uma alteração no "banco" local e agenda a gravação no IndexedDB. */
  const mutate = (fn: (db: DB) => DB) => {
    const db = fn(get().db)
    set({ db })
    persistDb(db)
  }
  const me = () => get().session
  const online = () => get().browserOnline && !get().settings.simulateOffline
  const notify = (n: Omit<AppNotification, 'id' | 'createdAt' | 'readBy'>) =>
    mutate((db) => ({ ...db, notifications: [{ ...n, id: uid('n-'), createdAt: Date.now(), readBy: [] }, ...db.notifications] }))

  return {
    ready: false,
    db: { version: DB_VERSION, users: [], trees: [], comments: [], instants: [], notifications: [] },
    settings: loadJSON(LS_SETTINGS, DEFAULT_SETTINGS),
    session: localStorage.getItem(LS_SESSION),
    tutorialSeen: localStorage.getItem(LS_TUTORIAL) === '1',
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
      if (!db || db.version !== DB_VERSION) {
        db = createSeed()
        persistDb(db)
      }
      const session = get().session
      const validSession = session === 'guest' || db.users.some((u) => u.id === session) ? session : null
      set({ db, ready: true, session: validSession })
    },

    toast(text, kind = 'info') {
      const t = { id: uid('t'), text, kind }
      set({ toasts: [...get().toasts, t] })
      setTimeout(() => get().dismissToast(t.id), 3800)
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
    setTutorialSeen(v) {
      set({ tutorialSeen: v })
      localStorage.setItem(LS_TUTORIAL, v ? '1' : '0')
    },

    login(email, password) {
      const e = email.trim().toLowerCase()
      const u = get().db.users.find(
        (x) => x.password && (x.email.toLowerCase() === e || `${x.firstName} ${x.lastName}`.toLowerCase() === e) && x.password === password,
      )
      if (u) {
        set({ session: u.id })
        localStorage.setItem(LS_SESSION, u.id)
      }
      return u ?? null
    },
    enterAsGuest() {
      set({ session: 'guest' })
      localStorage.setItem(LS_SESSION, 'guest')
    },
    register(data) {
      const email = data.email.trim().toLowerCase()
      if (get().db.users.some((u) => u.email.toLowerCase() === email)) return { error: 'Este e-mail já está cadastrado.' }
      const user: User = { ...data, email, id: uid('u-'), createdAt: Date.now() }
      mutate((db) => ({ ...db, users: [...db.users, user] }))
      set({ session: user.id })
      localStorage.setItem(LS_SESSION, user.id)
      return { user }
    },
    updateProfile(id, data) {
      mutate((db) => ({ ...db, users: db.users.map((u) => (u.id === id ? { ...u, ...data } : u)) }))
    },
    logout() {
      set({ session: null })
      localStorage.removeItem(LS_SESSION)
    },

    addTree(data) {
      const now = Date.now()
      const tree: Tree = {
        ...data, id: uid('t-'), createdAt: now, updatedAt: now,
        verifiedBy: null, verifiedAt: null, sync: online() ? 'synced' : 'pending',
      }
      mutate((db) => ({ ...db, trees: [...db.trees, tree] }))
      if (!tree.scientificName.trim()) {
        notify({ to: 'especialistas', treeId: tree.id, text: `Novo ponto com identificação pendente: "${tree.nicknames[0]}".` })
      }
      return tree
    },
    updateTree(id, data, opts) {
      const before = get().db.trees.find((t) => t.id === id)
      mutate((db) => ({
        ...db,
        trees: db.trees.map((t) => (t.id === id ? { ...t, ...data, updatedAt: Date.now(), sync: online() ? t.sync : 'pending' } : t)),
      }))
      if (!opts?.silent && before && before.createdBy !== me() && me() !== 'guest') {
        notify({ to: before.createdBy, treeId: id, text: `Alguém completou informações de "${before.nicknames[0]}".` })
      }
    },
    verifyTree(id, verified) {
      const t = get().db.trees.find((x) => x.id === id)
      get().updateTree(id, verified ? { verifiedBy: me(), verifiedAt: Date.now() } : { verifiedBy: null, verifiedAt: null }, { silent: true })
      if (t && verified && t.createdBy !== me()) {
        notify({ to: t.createdBy, treeId: id, text: `Seu registro "${t.nicknames[0]}" recebeu o selo de Espécie Verificada!` })
      }
    },
    addComment(treeId, text) {
      const c: Comment = { id: uid('c-'), treeId, userId: me()!, text, createdAt: Date.now(), sync: online() ? 'synced' : 'pending' }
      mutate((db) => ({ ...db, comments: [...db.comments, c] }))
      const t = get().db.trees.find((x) => x.id === treeId)
      if (t && t.createdBy !== me()) notify({ to: t.createdBy, treeId, text: `Novo comentário em "${t.nicknames[0]}".` })
      return c
    },
    addInstant(data) {
      const i: Instant = { ...data, id: uid('i-'), userId: me()!, createdAt: Date.now(), sync: online() ? 'synced' : 'pending' }
      mutate((db) => ({ ...db, instants: [i, ...db.instants] }))
      return i
    },
    deleteInstant(id) {
      mutate((db) => ({ ...db, instants: db.instants.filter((i) => i.id !== id) }))
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
      set({ db, session: null })
      localStorage.removeItem(LS_SESSION)
      get().setTutorialSeen(false)
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
  return all.filter((n) => n.to === me.id || (n.to === 'especialistas' && me.role === 'especialista'))
}
