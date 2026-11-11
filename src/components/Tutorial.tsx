import { useState, type ReactNode } from 'react'
import {
  BadgeCheck, Camera, CloudOff, HelpCircle, Leaf, LocateFixed, MessageCircle, Microscope, Search,
  Sprout, TreeDeciduous, Zap, AlertTriangle, GitPullRequest, HandHelping, ShieldCheck, Ban, Flag,
} from 'lucide-react'

interface Step {
  title: string
  illus: ReactNode
  body: ReactNode
}

function Item({ icon, color, children }: { icon: ReactNode; color?: string; children: ReactNode }) {
  return (
    <div className="tut-item">
      <span className="ti-ico" style={color ? { background: color, color: '#fff', borderColor: color } : undefined}>{icon}</span>
      <div>{children}</div>
    </div>
  )
}

const COMMON: Step[] = [
  {
    title: 'Bem-vindo ao Plantify!',
    illus: <Sprout size={96} />,
    body: (
      <p>
        Descubra, registre e converse sobre as árvores do <strong>Campus do Vale</strong>. Cada ponto no mapa é uma árvore
        cadastrada pela comunidade: estudantes, curiosos e especialistas.
      </p>
    ),
  },
  {
    title: 'O mapa',
    illus: <><TreeDeciduous size={72} /><LocateFixed size={56} /></>,
    body: (
      <div className="stack">
        <p style={{ margin: 0 }}>A cor do marcador mostra a situação da árvore. Use os <strong>filtros</strong> no topo para ver só um tipo.</p>
        <Item icon={<BadgeCheck size={22} />} color="#15803d"><strong>Espécie verificada</strong><br /><span className="small muted">Confirmada por um especialista</span></Item>
        <Item icon={<Search size={22} />} color="#0e7490"><strong>Identificada</strong><br /><span className="small muted">Tem nome científico, aguardando verificação</span></Item>
        <Item icon={<HelpCircle size={22} />} color="#d97706"><strong>Identificação pendente</strong><br /><span className="small muted">Ainda não sabemos o que é. Ajude!</span></Item>
        <Item icon={<AlertTriangle size={22} />} color="#dc2626"><strong>Exótica invasora</strong><br /><span className="small muted">Espécie que ameaça a flora nativa</span></Item>
        <Item icon={<LocateFixed size={22} />}>O botão <strong>Localizar</strong> centraliza o mapa em você (ponto azul).</Item>
        <Item icon={<Sprout size={22} />}>O filtro <strong>Minhas</strong> mostra só as árvores que você cadastrou, editou ou verificou.</Item>
      </div>
    ),
  },
  {
    title: 'Encontrou uma árvore nova?',
    illus: <TreeDeciduous size={96} />,
    body: (
      <div className="stack">
        <p style={{ margin: 0 }}>Toque em <strong>Adicionar árvore</strong>, no canto inferior direito do mapa, e escolha:</p>
        <Item icon={<Zap size={22} />}><strong>Rápido</strong>: só tire a foto. A árvore entra no mapa como “identificação pendente” e a comunidade completa depois.</Item>
        <Item icon={<Search size={22} />}><strong>Detalhado</strong>: informe nome, características e fontes científicas.</Item>
      </div>
    ),
  },
  {
    title: 'Dentro de uma árvore',
    illus: <><Leaf size={60} /><Camera size={68} /><MessageCircle size={60} /></>,
    body: (
      <div className="stack">
        <p style={{ margin: 0 }}>Ao abrir uma árvore, a <strong>barra de baixo</strong> tem três seções:</p>
        <Item icon={<Leaf size={22} />}><strong>Ficha</strong>: apelidos, nome científico, local, características e fontes.</Item>
        <Item icon={<Camera size={22} />}><strong>Instants</strong>: fotos rápidas de visitas, florações e frutos. Tire o seu!</Item>
        <Item icon={<MessageCircle size={22} />}><strong>Comentários</strong>: histórias, curiosidades e conversas sobre a árvore.</Item>
        <p className="muted small" style={{ margin: 0 }}>A seta ← volta para a tela anterior; o ícone de mapa, no topo, leva direto ao mapa.</p>
      </div>
    ),
  },
]

const REVIEW_NOTE = <p className="muted small" style={{ margin: 0 }}>Você pode rever este tutorial a qualquer momento em <strong>Menu → Como usar o app</strong> ou nas Configurações.</p>

const EXPLORER: Step = {
  title: 'Colabore com a comunidade',
  illus: <><HandHelping size={68} /><GitPullRequest size={64} /></>,
  body: (
    <div className="stack">
      <Item icon={<HandHelping size={22} />}><strong>Ajude a identificar</strong> (no menu ☰): árvores de outras pessoas que ainda ninguém sabe o que são.</Item>
      <Item icon={<GitPullRequest size={22} />}>Em árvores com selo de <strong>Espécie verificada</strong>, sua edição vira uma <strong>sugestão</strong>: ela só aparece para todos depois que um especialista aprovar.</Item>
      <Item icon={<Sprout size={22} />}>Acompanhe tudo em <strong>Minhas contribuições</strong>.</Item>
      <Item icon={<CloudOff size={22} />}>Sem internet, seus registros ficam <strong>salvos no aparelho</strong> e são enviados quando o sinal voltar.</Item>
      {REVIEW_NOTE}
    </div>
  ),
}

const SPECIALIST: Step = {
  title: 'Você é especialista',
  illus: <><Microscope size={72} /><GitPullRequest size={64} /></>,
  body: (
    <div className="stack">
      <Item icon={<Microscope size={22} />}>Sua fila fica em <strong>Menu → Curadoria</strong>: árvores identificadas <strong>a verificar</strong> e <strong>sugestões</strong> de alteração.</Item>
      <Item icon={<GitPullRequest size={22} />}>Sugestões em árvores verificadas só são publicadas quando você <strong>aprova</strong>. Você vê o antes e o depois de cada campo.</Item>
      <Item icon={<AlertTriangle size={22} />}>Na ficha, marque <strong>exóticas invasoras</strong>. Suas edições em árvores verificadas são publicadas direto.</Item>
      <Item icon={<CloudOff size={22} />}>Sem internet, tudo fica salvo no aparelho e é enviado quando o sinal voltar.</Item>
      {REVIEW_NOTE}
    </div>
  ),
}

const MODERATOR: Step = {
  title: 'Moderação da comunidade',
  illus: <><ShieldCheck size={72} /><Flag size={60} /></>,
  body: (
    <div className="stack">
      <Item icon={<Flag size={22} />}>Qualquer pessoa pode <strong>denunciar</strong> comentários, instants e registros. As denúncias chegam em <strong>Menu → Moderação</strong>.</Item>
      <Item icon={<ShieldCheck size={22} />}>Você decide: <strong>remover o conteúdo</strong> ou <strong>arquivar</strong> a denúncia.</Item>
      <Item icon={<Ban size={22} />}>Em caso de abuso, <strong>suspenda a conta</strong>: a pessoa não consegue entrar nem contribuir. Dá para reativar depois.</Item>
      {REVIEW_NOTE}
    </div>
  ),
}

/** Passos do tutorial conforme o perfil da conta. */
function stepsFor(role: 'comum' | 'especialista', admin: boolean): Step[] {
  return [...COMMON, role === 'especialista' ? SPECIALIST : EXPLORER, ...(admin ? [MODERATOR] : [])]
}

export function Tutorial({ onDone, role = 'comum', admin = false }: { onDone: () => void; role?: 'comum' | 'especialista'; admin?: boolean }) {
  const [i, setI] = useState(0)
  const STEPS = stepsFor(role, admin)
  const step = STEPS[i]
  const last = i === STEPS.length - 1
  return (
    <div className="tutorial" role="dialog" aria-label="Tutorial">
      <div className="row between" style={{ padding: '12px 16px 0' }}>
        <span className="muted small"><strong>Como usar</strong> · {i + 1} de {STEPS.length}</span>
        {!last && <button className="btn ghost" onClick={onDone}>Pular</button>}
      </div>
      <div className="tut-body" key={i}>
        <div className="tut-illus">{step.illus}</div>
        <h2>{step.title}</h2>
        <div>{step.body}</div>
      </div>
      <div className="tut-foot">
        <div className="dots">{STEPS.map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}</div>
        <div className="row">
          {i > 0 && <button className="btn outline grow" onClick={() => setI(i - 1)}>Voltar</button>}
          <button className="btn primary grow" onClick={() => (last ? onDone() : setI(i + 1))}>{last ? 'Começar a explorar' : 'Próximo'}</button>
        </div>
      </div>
    </div>
  )
}
