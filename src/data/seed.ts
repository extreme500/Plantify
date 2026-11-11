import type { DB, Report, Tree, User } from './types'
import { treeContent } from './types'
import { suggestedSources } from './species'

/**
 * v2: último registro verificado preservado após edições.
 * v3: edições em árvores verificadas viram sugestões (a versão verificada continua publicada),
 *     moderação (denúncias, contas suspensas) e contribuições por usuário.
 */
export const DB_VERSION = 3

/** Conta de moderação da demonstração (moderadores não se cadastram: são definidos pela instituição). */
export const DEMO_ADMIN = { email: 'moderacao@plantify.app', password: 'moderacao' }

function adminUser(): User {
  return {
    id: 'u-admin', firstName: 'Moderação', lastName: 'Plantify', email: DEMO_ADMIN.email, password: DEMO_ADMIN.password,
    bio: 'Equipe de moderação da comunidade.', avatar: null, role: 'comum', admin: true, banned: null, createdAt: Date.now() - 120 * DAY,
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Atualiza dados salvos por versões anteriores do protótipo sem apagar o que o usuário cadastrou. */
export function migrateDb(db: any): DB | null {
  if (db.version !== 1 && db.version !== 2) return null
  let n = 0
  const trees: Tree[] = db.trees.map((t: any) => {
    const { verifiedSnapshot: snap, ...rest } = t
    const base: Tree = {
      ...rest,
      lastEditedBy: t.lastEditedBy ?? null,
      lastEditedAt: t.lastEditedAt ?? null,
      contributors: [...new Set([t.createdBy, t.lastEditedBy].filter(Boolean))] as string[],
      suggestions: [],
    }
    if (snap && !t.verifiedBy) {
      // v2: árvore editada depois de verificada. Agora a versão verificada volta a ser a publicada
      // e a edição vira uma sugestão aguardando revisão.
      return {
        ...base, ...treeContent(snap), verifiedBy: snap.verifiedBy, verifiedAt: snap.verifiedAt,
        suggestions: [{
          id: `s-mig-${n++}`, by: t.lastEditedBy ?? t.createdBy, at: t.lastEditedAt ?? t.updatedAt,
          content: treeContent(t), baseVerifiedAt: snap.verifiedAt,
        }],
      }
    }
    return base
  })
  const users: User[] = db.users.map((u: any) => ({ admin: false, banned: null, ...u }))
  if (!users.some((u) => u.admin)) users.push(adminUser())
  return { ...db, version: DB_VERSION, trees, users, reports: db.reports ?? [] }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

function user(id: string, firstName: string, lastName: string, role: User['role'], bio: string): User {
  // Usuários de demonstração não têm senha: servem só como autores do conteúdo inicial.
  return { id, firstName, lastName, email: `${id}@demo.plantify`, bio, avatar: null, role, createdAt: Date.now() - 90 * DAY }
}

export function createSeed(now = Date.now()): DB {
  const users: User[] = [
    user('u-olivia', 'Olívia', 'da Silva', 'especialista', 'Pós-graduanda em Botânica/Ecologia. Validando registros do campus.'),
    user('u-valentina', 'Valentina', 'Rigo', 'comum', 'Estudante de Biologia. Amo caminhar e observar a natureza.'),
    user('u-lucas', 'Lucas', 'Triste', 'comum', 'CIC. Só reconheço ipês e jacarandás (por enquanto).'),
    user('u-pedrinho', 'Pedrinho', 'Lima', 'comum', ''),
    user('u-oliver', 'Oliver', 'Souza', 'comum', ''),
    user('u-couto', 'Couto', 'Ramos', 'comum', 'Amigo da araucária.'),
    user('u-eduardo', 'Eduardo', 'Mello', 'comum', ''),
    user('u-sofia', 'Sofia', 'Andrade', 'comum', ''),
    user('u-promo', 'Rafa', 'Promoções', 'comum', ''),
    adminUser(),
  ]

  const base = {
    verifiedBy: null, verifiedAt: null, suggestions: [], contributors: [], lastEditedBy: null, lastEditedAt: null,
    invasive: false, sync: 'synced' as const, characteristics: '', sources: [], family: '', scientificName: '',
  }
  const verified = (daysAgo: number) => ({ verifiedBy: 'u-olivia', verifiedAt: now - daysAgo * DAY })
  const src = (sci: string) => suggestedSources(sci)

  const rawTrees: Tree[] = [
    {
      ...base, ...verified(40), id: 't-araucaria',
      nicknames: ['Amigo do Couto', 'Gotinha', "Oliver's Tree", 'Berço de Pedrinho'],
      scientificName: 'Araucaria angustifolia', family: 'Araucariaceae',
      characteristics:
        'A araucária é uma espécie arbórea de gimnosperma pertencente à família Araucariaceae. Nativa da Floresta Ombrófila Mista do Sul do Brasil, está ameaçada de extinção. Pode passar de 30 m de altura e tem copa em forma de taça. Sua semente, o pinhão, alimenta gralhas-azuis, cutias e papagaios no inverno. Este exemplar fica no caminho entre a Informática e a Biociências e é ponto de encontro de muitos estudantes.',
      sources: src('Araucaria angustifolia'),
      lat: -30.06842, lng: -51.12052, photo: 'art:araucaria:dia:pessoa',
      createdBy: 'u-couto', createdAt: now - 60 * DAY, updatedAt: now - 40 * DAY,
    },
    {
      ...base, id: 't-ipe', nicknames: ['Ipê do RU'], scientificName: 'Handroanthus albus', family: 'Bignoniaceae',
      characteristics: 'Floresce entre agosto e setembro, antes das folhas novas. As flores amarelas cobrem o chão em frente ao RU3.',
      sources: src('Handroanthus albus'),
      lat: -30.07148, lng: -51.12048, photo: 'art:ipe:dia:none',
      createdBy: 'u-lucas', createdAt: now - 20 * DAY, updatedAt: now - 20 * DAY,
    },
    {
      ...base, ...verified(25), id: 't-jacaranda', nicknames: ['Jacarandá da parada'],
      scientificName: 'Jacaranda mimosifolia', family: 'Bignoniaceae',
      characteristics: 'Espécie exótica (nativa da Argentina e Bolívia), muito usada na arborização urbana de Porto Alegre. Flores lilases na primavera.',
      sources: src('Jacaranda mimosifolia'),
      lat: -30.07052, lng: -51.11862, photo: 'art:jacaranda:tarde:none',
      createdBy: 'u-lucas', createdAt: now - 30 * DAY, updatedAt: now - 25 * DAY,
    },
    {
      ...base, ...verified(12), id: 't-figueira', nicknames: ['Figueira dos macacos'],
      scientificName: 'Ficus cestrifolia', family: 'Moraceae',
      characteristics: 'Figueira nativa de copa ampla. Bugios e saguis são vistos com frequência nos galhos mais altos pela manhã.',
      sources: src('Ficus cestrifolia'),
      lat: -30.06955, lng: -51.11968, photo: 'art:figueira:dia:macaco',
      createdBy: 'u-valentina', createdAt: now - 14 * DAY, updatedAt: now - 12 * DAY,
    },
    {
      ...base, ...verified(5), id: 't-hovenia', nicknames: ['Uva-do-japão do estacionamento'],
      scientificName: 'Hovenia dulcis', family: 'Rhamnaceae', invasive: true,
      characteristics: 'Espécie exótica invasora no RS: seus frutos são dispersos por animais e ela compete com espécies nativas da mata. Recomenda-se não plantar novos exemplares.',
      sources: src('Hovenia dulcis'),
      lat: -30.07228, lng: -51.12152, photo: 'art:generic:nublado:none',
      createdBy: 'u-eduardo', createdAt: now - 9 * DAY, updatedAt: now - 5 * DAY,
    },
    {
      ...base, id: 't-misterio', nicknames: ['Árvore de flores rosadas'],
      characteristics: 'Vi no caminho da parada até a Informática. Tem florzinhas rosadas pequenas.',
      lat: -30.06988, lng: -51.11925, photo: 'art:misterio:dia:none',
      createdBy: 'u-lucas', createdAt: now - 3 * HOUR, updatedAt: now - 3 * HOUR,
    },
    {
      ...base, id: 't-butia', nicknames: ['Butiá da Biociências'], scientificName: 'Butia odorata', family: 'Arecaceae',
      characteristics: 'Palmeira nativa dos campos do Sul. Os frutos amarelo-alaranjados amadurecem no verão.',
      sources: src('Butia odorata'),
      lat: -30.06778, lng: -51.11975, photo: 'art:palmeira:dia:none',
      createdBy: 'u-valentina', createdAt: now - 6 * DAY, updatedAt: now - 6 * DAY,
    },
    {
      ...base, ...verified(18), id: 't-corticeira', nicknames: ['Corticeira'],
      scientificName: 'Erythrina crista-galli', family: 'Fabaceae',
      characteristics: 'Flor-símbolo do Rio Grande do Sul. Flores vermelhas atraem beija-flores.',
      sources: src('Erythrina crista-galli'),
      lat: -30.07305, lng: -51.12035, photo: 'art:corticeira:dia:none',
      createdBy: 'u-sofia', createdAt: now - 22 * DAY, updatedAt: now - 18 * DAY,
    },
    {
      ...base, id: 't-torta', nicknames: ['Árvore torta do RU6'],
      lat: -30.06748, lng: -51.12118, photo: 'art:generic:tarde:none',
      createdBy: 'u-sofia', createdAt: now - 2 * DAY, updatedAt: now - 2 * DAY,
    },
    {
      ...base, ...verified(50), id: 't-pinus', nicknames: ['Pinus da encosta'],
      scientificName: 'Pinus elliottii', family: 'Pinaceae', invasive: true,
      characteristics: 'Exótica invasora: forma bosques densos que sombreiam e acidificam o solo, impedindo a regeneração do campo nativo.',
      sources: src('Pinus elliottii'),
      lat: -30.07395, lng: -51.1226, photo: 'art:pinus:nublado:none',
      createdBy: 'u-olivia', createdAt: now - 55 * DAY, updatedAt: now - 50 * DAY,
    },
  ]

  // Exemplo de sugestão: a Figueira foi verificada pela Dra. Olívia e, ontem, o Lucas sugeriu trocar
  // a foto, acrescentar um apelido e uma informação sem fonte. A versão verificada continua publicada;
  // a sugestão só aparece para ele e para os especialistas até ser aprovada ou rejeitada.
  const trees = rawTrees.map((t): Tree => {
    const withContrib = { ...t, contributors: [t.createdBy] }
    if (t.id !== 't-figueira') return withContrib
    return {
      ...withContrib,
      suggestions: [{
        id: 's-figueira', by: 'u-lucas', at: now - DAY, baseVerifiedAt: t.verifiedAt,
        content: {
          ...treeContent(t),
          nicknames: ['Figueira dos macacos', 'Casa dos bugios'],
          characteristics: `${t.characteristics} Dizem que ela tem mais de 80 anos e que foi plantada na inauguração do campus.`,
          photo: 'art:figueira:tarde:none',
        },
      }],
    }
  })

  const d = (iso: string) => new Date(iso).getTime()
  const comments = [
    { treeId: 't-araucaria', userId: 'u-pedrinho', createdAt: d('2026-09-08T10:12:00-03:00'), text: 'Essa árvore é a minha favorita do campus! Ela lembra a minha cidade natal!!' },
    { treeId: 't-araucaria', userId: 'u-oliver', createdAt: d('2026-09-15T16:40:00-03:00'), text: 'Ela também é muito especial pra mim! Pedi a minha esposa em casamento embaixo dela! Nossas iniciais estão escritas ali até hoje... :)' },
    { treeId: 't-araucaria', userId: 'u-valentina', createdAt: d('2026-09-22T12:05:00-03:00'), text: 'Eu lembro desse dia! A árvore ficou muito linda atrás da foto de vocês! Choveu tanto depois que eu e meus amigos começamos a chamá-la de Gotinha KKKK' },
    { treeId: 't-araucaria', userId: 'u-couto', createdAt: d('2026-09-22T13:30:00-03:00'), text: 'Não critiquem minha amiga!! Se choveu, não foi culpa dela!! >:(' },
    { treeId: 't-figueira', userId: 'u-valentina', createdAt: now - 12 * DAY, text: 'Hoje de manhã tinha uma família de macacos nos galhos de cima! 🐒' },
    { treeId: 't-figueira', userId: 'u-olivia', createdAt: now - 11 * DAY, text: 'Provavelmente bugios-ruivos (Alouatta guariba). Ótimo registro, ajuda a mostrar a importância da figueira para a fauna.' },
    { treeId: 't-hovenia', userId: 'u-olivia', createdAt: now - 5 * DAY, text: 'Atenção: espécie exótica invasora. Já avisei a prefeitura do campus.' },
    { treeId: 't-misterio', userId: 'u-lucas', createdAt: now - 3 * HOUR, text: 'Alguém sabe que árvore é essa? Passo por ela todo dia indo pra aula.' },
    { treeId: 't-ipe', userId: 'u-promo', createdAt: now - 5 * HOUR, text: 'GANHE 1000 SEGUIDORES GRÁTIS!!! 🔥🔥 Chama no privado, promoção só hoje!!!' },
  ].map((c, i) => ({ ...c, id: `c-${i}`, sync: 'synced' as const }))

  const instants = [
    { treeId: 't-araucaria', userId: 'u-pedrinho', createdAt: now - 15 * MIN, photo: 'art:araucaria:noite:coracao', tag: 'visita' as const, caption: 'Passando pra dar boa noite 🌙' },
    { treeId: 't-araucaria', userId: 'u-sofia', createdAt: now - 2 * HOUR, photo: 'art:araucaria:dia:coracao', tag: 'visita' as const, caption: 'Achei as iniciais!' },
    { treeId: 't-araucaria', userId: 'u-eduardo', createdAt: now - 23 * HOUR, photo: 'art:araucaria:nublado:pessoa', tag: 'visita' as const, caption: '' },
    { treeId: 't-ipe', userId: 'u-lucas', createdAt: now - 20 * DAY, photo: 'art:ipe:dia:flores', tag: 'floracao' as const, caption: 'Começou a florir!' },
    { treeId: 't-figueira', userId: 'u-valentina', createdAt: now - 12 * DAY, photo: 'art:figueira:dia:macaco', tag: 'visita' as const, caption: 'Macacos nos galhos!' },
    { treeId: 't-jacaranda', userId: 'u-eduardo', createdAt: now - 4 * DAY, photo: 'art:jacaranda:dia:flores', tag: 'floracao' as const, caption: '' },
  ].map((x, i) => ({ ...x, id: `i-${i}`, sync: 'synced' as const }))

  const notifications = [
    { id: 'n-0', to: 'especialistas', treeId: 't-misterio', text: 'Novo ponto com identificação pendente: "Árvore de flores rosadas".', createdAt: now - 3 * HOUR, readBy: [] },
    { id: 'n-1', to: 'especialistas', treeId: 't-torta', text: 'Novo ponto com identificação pendente: "Árvore torta do RU6".', createdAt: now - 2 * DAY, readBy: [] },
    { id: 'n-2', to: 'especialistas', treeId: 't-figueira', text: 'Nova sugestão de alteração em "Figueira dos macacos" aguardando revisão.', createdAt: now - DAY, readBy: [] },
    { id: 'n-3', to: 'moderacao', treeId: 't-ipe', text: 'Nova denúncia: comentário em "Ipê do RU" (Spam ou propaganda).', createdAt: now - 4 * HOUR, readBy: [] },
  ]

  const spam = comments.find((c) => c.userId === 'u-promo')!
  const reports: Report[] = [{
    id: 'r-0', kind: 'comment', targetId: spam.id, treeId: 't-ipe', reportedUser: 'u-promo', by: 'u-valentina',
    reason: 'spam', details: 'Propaganda, nada a ver com a árvore.', at: now - 4 * HOUR,
    status: 'aberta', resolution: null, resolvedBy: null, resolvedAt: null,
  }]

  return { version: DB_VERSION, users, trees, comments, instants, notifications, reports }
}
