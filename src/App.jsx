import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, ArrowDownRight, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, CircleHelp, Clock3, Gift, Heart, Keyboard, Minus, Plus, Radio, RotateCcw, Settings2, Sparkles, Trophy, Users, Wifi, WifiOff, X } from 'lucide-react'
import { connectLive } from './live.js'

const initialScores = { '22': 508, '13': 181 }
const initialGifts = { '22': 24, '13': 9 }
const SIDE_META = {
  '22': { name: 'LUCAS FERREIRA', party: 'PARTIDO AZUL', color: 'blue', initial: 'LF', sprite: '🧑🏽‍💼' },
  '13': { name: 'MARINA COSTA', party: 'PARTIDO VERMELHO', color: 'red', initial: 'MC', sprite: '👩🏻‍💼' },
}

function formatTime(total) {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function scoreFormat(score) {
  return new Intl.NumberFormat('pt-BR').format(score)
}

function ScoreNumber({ value }) {
  return <AnimatePresence mode="popLayout" initial={false}><motion.span key={value} initial={{ y: 11, opacity: 0, scale: 0.94 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -8, opacity: 0, scale: 1.02 }} transition={{ duration: 0.23, ease: 'easeOut' }}>{scoreFormat(value)}</motion.span></AnimatePresence>
}

function Panel({ children, className = '' }) {
  return <div className={`panel ${className}`}>{children}</div>
}

function VotingMachine({ side, pressed }) {
  const meta = SIDE_META[side]
  const color = meta.color
  const [lastPress, setLastPress] = useState(0)

  useEffect(() => { if (pressed) setLastPress(Date.now()) }, [pressed])

  return <div className={`machine machine-${color} ${pressed ? 'machine-pressed' : ''}`} aria-label={`Urna de ${meta.name}`}>
    <div className="machine-top"><span className="machine-brand">JUSTIÇA ELEITORAL</span><span className="machine-indicator"><i /> LIGADA</span></div>
    <div className="machine-screen-wrap">
      <div className="machine-screen">
        <div className="screen-head"><span>SEU VOTO PARA</span><strong>PRESIDENTE</strong></div>
        <div className="screen-candidate"><div className="candidate-avatar">{meta.sprite}</div><div><span>NÚMERO</span><strong>{side}</strong></div></div>
        <div className="screen-person"><strong>{meta.name}</strong><span>{meta.party}</span></div>
        <div className="screen-footer"><span>CONFIRME</span><span>◀ ANULAR</span></div>
      </div>
    </div>
    <div className="machine-controls">
      <div className="keypad" aria-hidden="true">{['1', '2', '3', '4', '5', '6', '7', '8', '9', 'BR', '0', 'COR'].map((key, index) => <span className={`key ${index > 8 ? 'key-light' : ''}`} key={key}>{key}</span>)}</div>
      <div className="confirm-keys"><span className="key-cancel">ANULAR</span><span className="key-correct">CORRIGE</span><motion.span animate={pressed ? { scale: [1, 0.9, 1], boxShadow: ['0 3px 0 #17803d', '0 1px 0 #17803d', '0 3px 0 #17803d'] } : { scale: 1 }} className="key-confirm">CONFIRMA<ArrowRight size={9}/></motion.span></div>
    </div>
    <motion.div key={lastPress} className="machine-finger" initial={{ x: 0, y: 0, opacity: 0 }} animate={pressed ? { x: -35, y: -25, opacity: [0, 1, 1, 0] } : { opacity: 0 }} transition={{ duration: .52, times: [0, .2, .65, 1] }}>👆🏻</motion.div>
    <div className="machine-base" />
  </div>
}

function RoseFly({ id, side, username }) {
  const color = SIDE_META[side].color
  return <motion.div className={`rose-fly rose-${color}`} initial={{ opacity: 0, x: 0, y: 16, scale: .25, rotate: -25 }} animate={{ opacity: [0, 1, 1, 0], x: [0, 22, 82, 130], y: [16, -35, -42, -18], scale: [.3, 1.18, 1, .65], rotate: [-25, 5, 18, 32] }} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }}><span>🌹</span><small>{username || 'Rosa'}</small><Sparkles size={13}/></motion.div>
}

function SideCard({ side, score, total, percent, gifts, pressed, roseEvents }) {
  const meta = SIDE_META[side]
  const color = meta.color

  return <Panel className={`candidate-card card-${color}`}>
    <div className="card-glow" />
    <div className="candidate-head">
      <div className={`candidate-mark mark-${color}`}><span>{side}</span><div>{meta.initial}</div></div>
      <div className="candidate-label"><span className="candidate-tag">CANDIDATO</span><h2>{meta.name}</h2><span className="candidate-party"><span />{meta.party}</span></div>
      <div className={`side-share share-${color}`}><strong>{percent}<small>%</small></strong><span>DOS VOTOS</span></div>
    </div>
    <div className="card-divider" />
    <div className="score-row"><div><span className="micro-label">VOTOS CONFIRMADOS</span><div className={`score score-${color}`}><ScoreNumber value={score}/><span className="score-unit">votos</span></div></div><div className="total-voter-pill"><Users size={13}/><span>{scoreFormat(total)} <b>total</b></span></div></div>
    <div className="vote-progress"><div className={`progress-fill fill-${color}`} style={{ width: `${percent}%` }} /><span className={`progress-marker marker-dot-${color}`} style={{ left: `calc(${percent}% - 5px)` }} /></div>
    <div className="machine-holder"><div className="machine-caption"><span><Activity size={12}/> URNA ELETRÔNICA</span><span className="machine-status"><i/> REGISTRANDO VOTOS</span></div><VotingMachine side={side} pressed={pressed}/><AnimatePresence>{roseEvents.map((event) => <RoseFly key={event.id} id={event.id} side={side} username={event.username}/>)}</AnimatePresence></div>
    <div className="card-footer"><span><Gift size={13}/>{gifts} presentes recebidos</span><span>ROSE <b>×1</b></span></div>
  </Panel>
}

function FloatingControls({ open, setOpen, onVote, onReset, scores, liveStatus }) {
  return <>
    <motion.button className="control-toggle" onClick={() => setOpen(!open)} whileTap={{ scale: .94 }} aria-label="Abrir painel de controle"><Settings2 size={16}/><span>CONTROLES</span>{open ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}</motion.button>
    <AnimatePresence>{open && <motion.div className="control-panel panel" initial={{ opacity: 0, y: 22, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: .97 }} transition={{ duration: .2 }}>
      <div className="control-heading"><div className="control-heading-icon"><Keyboard size={16}/></div><div><strong>PAINEL DO CRIADOR</strong><span>Teste a votação em tempo real</span></div><button className="icon-button control-close" onClick={() => setOpen(false)} aria-label="Fechar controles"><X size={16}/></button></div>
      <div className="control-buttons"><button className="manual-vote vote-blue" onClick={() => onVote('22')}><Plus size={17}/><span><b>+1 Rosa</b><small>Votar no candidato 22</small></span><span className="manual-number">22</span></button><button className="manual-vote vote-red" onClick={() => onVote('13')}><Plus size={17}/><span><b>+1 Rosa</b><small>Votar na candidata 13</small></span><span className="manual-number">13</span></button></div>
      <div className="control-bottom"><span><i className={`status-dot ${liveStatus === 'connected' ? 'dot-live' : ''}`}/>{liveStatus === 'connected' ? 'Live conectada' : 'Modo demonstração'}</span><button onClick={onReset}><RotateCcw size={12}/> REINICIAR PLACAR</button></div>
      <div className="control-footnote">PLACAR ATUAL <b>{scoreFormat(scores['22'])}</b><span>—</span><b>{scoreFormat(scores['13'])}</b></div>
    </motion.div>}</AnimatePresence>
  </>
}

function App() {
  const [scores, setScores] = useState(initialScores)
  const [gifts, setGifts] = useState(initialGifts)
  const [elapsed, setElapsed] = useState(4 * 60 + 32)
  const [paused, setPaused] = useState(false)
  const [voteTotal, setVoteTotal] = useState(689)
  const [pressedSide, setPressedSide] = useState(null)
  const [roseEvents, setRoseEvents] = useState({ '22': [], '13': [] })
  const [panelOpen, setPanelOpen] = useState(false)
  const [liveStatus, setLiveStatus] = useState('disconnected')
  const [liveUsername, setLiveUsername] = useState('')
  const [showConnect, setShowConnect] = useState(false)
  const [inputUsername, setInputUsername] = useState('')
  const [connected, setConnected] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [events, setEvents] = useState([])
  const seq = useRef(0)
  const resetTimer = useRef()
  const sourceCleanups = useRef([])

  const percentages = useMemo(() => {
    const sum = scores['22'] + scores['13'] || 1
    return { '22': Math.round((scores['22'] / sum) * 100), '13': Math.round((scores['13'] / sum) * 100) }
  }, [scores])
  const difference = scores['22'] - scores['13']
  const leader = difference > 0 ? '22' : difference < 0 ? '13' : null

  const addVote = useCallback((side, quantity = 1, username = 'Teste local') => {
    const safeQuantity = Math.min(1000, Math.max(1, Number(quantity) || 1))
    setScores((current) => ({ ...current, [side]: current[side] + safeQuantity }))
    setGifts((current) => ({ ...current, [side]: current[side] + 1 }))
    setVoteTotal((current) => current + safeQuantity)
    setPressedSide(side)
    window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setPressedSide((current) => current === side ? null : current), 720)
    const id = ++seq.current
    setRoseEvents((current) => ({ ...current, [side]: [...current[side], { id, username }].slice(-5) }))
    setTimeout(() => setRoseEvents((current) => ({ ...current, [side]: current[side].filter((item) => item.id !== id) })), 1400)
    setEvents((current) => [{ id, side, username, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }, ...current].slice(0, 5))
  }, [])

  const resetGame = () => {
    setScores(initialScores); setGifts(initialGifts); setVoteTotal(689); setElapsed(4 * 60 + 32); setEvents([]); setRoseEvents({ '22': [], '13': [] }); setPressedSide(null)
  }

  useEffect(() => {
    if (paused) return undefined
    const interval = window.setInterval(() => setElapsed((time) => Math.max(0, time - 1)), 1000)
    return () => window.clearInterval(interval)
  }, [paused])

  useEffect(() => () => { window.clearTimeout(resetTimer.current); sourceCleanups.current.forEach((cleanup) => cleanup()) }, [])

  useEffect(() => {
    if (!connected || !liveUsername) return undefined
    const timer = window.setTimeout(() => {
      const cleanup = connectLive((event) => addVote(event.side, event.quantity, event.username), setLiveStatus)
      sourceCleanups.current.push(cleanup)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [connected, liveUsername, addVote])

  const connectToLive = (event) => {
    event.preventDefault()
    const username = inputUsername.trim().replace(/^@/, '')
    if (!username) return
    setLiveUsername(username); setConnected(true); setLiveStatus('connecting'); setShowConnect(false)
  }

  const disconnectLive = () => {
    sourceCleanups.current.forEach((cleanup) => cleanup())
    sourceCleanups.current = []
    setConnected(false); setLiveStatus('disconnected'); setLiveUsername('')
  }

  return <main className="app-shell">
    <div className="ambient-glow glow-one"/><div className="ambient-glow glow-two"/>
    <header className="topbar">
      <a href="#top" className="brand"><div className="brand-icon"><span/><span/><span/></div><span>VOTO<span className="brand-light">LIVE</span></span><span className="brand-divider"/><span className="brand-edition">ARENA</span></a>
      <div className="header-center"><span className="live-indicator"><i/> TRANSMISSÃO AO VIVO</span><span className="header-separator"/><span className="header-event"><Radio size={13}/> BATALHA DE ROSAS</span></div>
      <div className="header-actions"><button className="help-button" onClick={() => setHelpOpen(!helpOpen)} aria-label="Ajuda"><CircleHelp size={16}/></button><button className={`connect-button ${connected ? 'is-connected' : ''}`} onClick={() => connected ? disconnectLive() : setShowConnect(true)}><span className="connect-indicator"/>{connected ? liveStatus === 'connected' ? 'LIVE CONECTADA' : 'CONECTANDO...' : 'CONECTAR TIKTOK'}{connected ? <Wifi size={14}/> : <ArrowRight size={14}/>}</button></div>
    </header>

    <section className="match-info"><div className="event-overline"><span/><span>DISPUTA EM ANDAMENTO</span><span/></div><h1>A <span>DECISÃO</span> É SUA</h1><p>Envie uma <b>rosa 🌹</b> e transforme seu apoio em voto.</p></section>

    <section className="scoreboard" aria-label="Placar da votação">
      <Panel className="status-panel"><button className="timer-block" onClick={() => setPaused(!paused)} title={paused ? 'Retomar cronômetro' : 'Pausar cronômetro'}><span className="timer-label"><Clock3 size={12}/>TEMPO DE VOTAÇÃO</span><strong className={elapsed <= 30 ? 'timer-urgent' : ''}>{formatTime(elapsed)}</strong><span className="timer-hint">{paused ? 'PAUSADO · CLIQUE PARA RETOMAR' : 'CLIQUE PARA PAUSAR'}</span></button><div className="status-divider"/><div className="status-metric"><span><Users size={13}/>VOTOS COMPUTADOS</span><strong><ScoreNumber value={voteTotal}/></strong><small>nesta rodada</small></div><div className="status-divider"/><div className="difference-metric"><span>{leader ? <ArrowDownRight size={14}/> : <Activity size={14}/>}DIFERENÇA</span><strong className={leader ? `diff-${SIDE_META[leader].color}` : ''}>{difference === 0 ? '—' : `${difference > 0 ? '+' : ''}${scoreFormat(difference)}`}</strong><small>{leader ? <>VANTAGEM <b>{leader}</b></> : 'TUDO IGUAL'}</small></div><div className="status-live"><i/> AO VIVO</div></Panel>
      <div className="candidate-grid"><SideCard side="22" score={scores['22']} total={voteTotal} percent={percentages['22']} gifts={gifts['22']} pressed={pressedSide === '22'} roseEvents={roseEvents['22']}/><div className="versus"><span>VS</span><div/><small>AO VIVO</small></div><SideCard side="13" score={scores['13']} total={voteTotal} percent={percentages['13']} gifts={gifts['13']} pressed={pressedSide === '13'} roseEvents={roseEvents['13']}/></div>
    </section>

    <section className="activity-strip"><div className="activity-title"><span className="activity-icon"><Activity size={14}/></span><div><strong>ÚLTIMOS VOTOS</strong><small>ACOMPANHE A DISPUTA</small></div></div><div className="activity-items"><AnimatePresence initial={false}>{events.length ? events.slice(0, 3).map((event) => <motion.div key={event.id} className="activity-item" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}><span className={`event-avatar avatar-${SIDE_META[event.side].color}`}>{SIDE_META[event.side].initial}</span><span className="activity-user"><b>{event.username}</b><small>enviou uma Rosa</small></span><span className={`event-vote vote-label-${SIDE_META[event.side].color}`}>VOTOU {event.side}</span><span className="activity-time">{event.time}</span></motion.div>) : <span className="empty-activity">Aguardando os primeiros votos da rodada...</span>}</AnimatePresence></div><div className="activity-rules"><span><span className="rose-mini">🌹</span><b>1 ROSA</b><ArrowRight size={12}/><b>1 VOTO</b></span><small>PRESENTES DE ROSA COMPUTADOS AUTOMATICAMENTE</small></div></section>

    <footer className="site-footer"><span>© 2025 VOTO LIVE <span className="footer-dot">·</span> ARENA DE VOTAÇÃO INTERATIVA</span><span className="footer-powered"><span/><span>FEITO PARA A COMUNIDADE</span><Heart size={11}/></span></footer>

    <FloatingControls open={panelOpen} setOpen={setPanelOpen} onVote={(side) => addVote(side, 1)} onReset={resetGame} scores={scores} liveStatus={liveStatus}/>

    <AnimatePresence>{showConnect && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setShowConnect(false) }}><motion.form className="connect-modal panel" onSubmit={connectToLive} initial={{ opacity: 0, y: 15, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .98 }}><button className="icon-button modal-close" type="button" onClick={() => setShowConnect(false)} aria-label="Fechar"><X size={17}/></button><div className="modal-icon"><Radio size={21}/></div><span className="modal-overline">CONECTAR TRANSMISSÃO</span><h2>Entre na disputa</h2><p>Conecte seu usuário do TikTok Live para computar rosas da transmissão.</p><label className="input-label" htmlFor="live-username">USUÁRIO DO TIKTOK</label><div className="username-input"><span>@</span><input id="live-username" autoFocus placeholder="seu.usuario" value={inputUsername} onChange={(event) => setInputUsername(event.target.value)} /></div><div className="connection-note"><WifiOff size={14}/><span>Para receber eventos reais, rode o adaptador do servidor com <code>TIKTOK_USERNAME</code>.</span></div><button className="modal-submit" type="submit">CONECTAR LIVE <ArrowRight size={15}/></button><button className="demo-link" type="button" onClick={() => { setShowConnect(false); setPanelOpen(true) }}>Continuar no modo demonstração</button></motion.form></motion.div>}</AnimatePresence>

    <AnimatePresence>{helpOpen && <motion.div className="help-popover panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}><button className="icon-button help-close" onClick={() => setHelpOpen(false)} aria-label="Fechar ajuda"><X size={14}/></button><strong>COMO FUNCIONA</strong><p>Cada rosa enviada na live vira um voto. Use o painel de controle para simular presentes e testar as animações.</p><div><span>🌹</span> 1 ROSA = 1 VOTO</div></motion.div>}</AnimatePresence>
  </main>
}

export default App
