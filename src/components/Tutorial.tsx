import { useState, type ReactNode } from 'react'
import {
  BadgeCheck, Camera, CloudOff, HelpCircle, Leaf, LocateFixed, MessageCircle, Microscope, Search,
  Sprout, TreeDeciduous, Zap, AlertTriangle,
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

const STEPS: Step[] = [
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
      </div>
    ),
  },
  {
    title: 'Sem sinal? Sem problema.',
    illus: <><CloudOff size={72} /><Microscope size={72} /></>,
    body: (
      <div className="stack">
        <Item icon={<CloudOff size={22} />}>Sem internet, seus registros ficam <strong>salvos no aparelho</strong> e são enviados quando o sinal voltar.</Item>
        <Item icon={<Microscope size={22} />}><strong>Especialistas</strong> (Biologia/Agronomia) recebem avisos de árvores pendentes e atribuem o selo de espécie verificada.</Item>
        <p className="muted small" style={{ margin: 0 }}>Você pode rever este tutorial a qualquer momento em <strong>Configurações → Como usar o app</strong>.</p>
      </div>
    ),
  },
]

export function Tutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
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
