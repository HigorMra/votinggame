import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, ArrowDownRight, ArrowRight, ChevronDown, ChevronUp, CircleHelp, Clock3, Gift, Heart, Keyboard, Pause, Play, Plus, Radio, RotateCcw, Settings2, Sparkles, Users, Volume2, VolumeX, Wifi, WifiOff, X } from 'lucide-react'
import { connectLive } from './live.js'
import { getVoteDelta } from './vote-math.js'
import './matchup.css'
import './theme-light.css'

const SIDE_META = {
  left: { label: 'ESQUERDA', color: 'blue', initial: 'E' },
  right: { label: 'DIREITA', color: 'red', initial: 'D' },
}

const CANDIDATES = {
  left: [
    { id: 'erika-hilton', name: 'Erika Hilton', photo: '/candidates/erika-hilton.jpg', party: 'PSOL', office: 'Deputada federal / SP', votes: 1596472 },
    { id: 'samia-bomfim', name: 'Sâmia Bomfim', photo: '/candidates/samia-bomfim.jpg', party: 'PSOL', office: 'Deputada federal / SP', votes: 583107 },
    { id: 'ana-elisa', name: 'Ana Elisa', photo: '/candidates/ana-elisa.jpg', party: 'PT', office: 'Deputada federal / MG', votes: 524219 },
    { id: 'tabata-amaral', name: 'Tabata Amaral', photo: '/candidates/tabata-amaral.jpg', party: 'PSB', office: 'Deputada federal / SP', votes: 476383 },
    { id: 'fernanda-melchionna', name: 'Fernanda Melchionna', photo: '/candidates/fernanda-melchionna.jpg', party: 'PSOL', office: 'Deputada federal / RS', votes: 280262 },
    { id: 'guilherme-cortez', name: 'Guilherme Cortez', photo: '/candidates/guilherme-cortez.jpg', party: 'PSOL', office: 'Deputado federal / SP', votes: 275450 },
    { id: 'eduardo-suplicy', name: 'Eduardo Suplicy', photo: '/candidates/eduardo-suplicy.jpg', party: 'PT', office: 'Deputado estadual / SP', votes: 654627 },
    { id: 'sofia-favero', name: 'Sofia Favero', photo: '/candidates/sofia-favero.jpg', party: 'PSOL', office: 'Deputada estadual / SP', votes: 407773 },
    { id: 'carlos-giannazi', name: 'Carlos Giannazi', photo: '/candidates/carlos-giannazi.jpg', party: 'PSOL', office: 'Deputado estadual / SP', votes: 367861 },
    { id: 'paula-bancada-feminista', name: 'Paula da Bancada Feminista', photo: '/candidates/paula-bancada-feminista.jpg', party: 'PSOL', office: 'Deputada estadual / SP', votes: 326190 },
    { id: 'ediane-maria', name: 'Ediane Maria', photo: '/candidates/ediane-maria.jpg', party: 'PSOL', office: 'Deputada estadual / SP', votes: 170844 },
    { id: 'luiza-erundina', name: 'Luiza Erundina', photo: '/candidates/luiza-erundina.jpg', party: 'PSOL', office: 'Deputada estadual / SP', votes: 169567 },
    { id: 'duda-hidalgo', name: 'Duda Hidalgo', photo: '/candidates/duda-hidalgo.jpg', party: 'PT', office: 'Deputada estadual / SP', votes: 154953 },
    { id: 'professora-bebel', name: 'Professora Bebel', photo: '/candidates/professora-bebel.jpg', party: 'PT', office: 'Deputada estadual / SP', votes: 142001 },
    { id: 'mariana-conti', name: 'Mariana Conti', photo: '/candidates/mariana-conti.jpg', party: 'PSOL', office: 'Deputada estadual / SP', votes: 126344 },
    { id: 'leonardo-grandini', name: 'Leonardo Grandini', photo: '/candidates/leonardo-grandini.jpg', party: 'PT', office: 'Deputado estadual / SP', votes: 122158 },
    { id: 'emidio', name: 'Emídio', photo: '/candidates/emidio.jpg', party: 'PT', office: 'Deputado estadual / SP', votes: 108275 },
    { id: 'rodrigo-mar', name: 'Rodrigo Mar', photo: '/candidates/rodrigo-mar.jpg', party: 'PT', office: 'Deputado estadual / SP', votes: 104820 },
    { id: 'enio-tatto', name: 'Enio Tatto', photo: '/candidates/enio-tatto.jpg', party: 'PT', office: 'Deputado estadual / SP', votes: 102892 },
    { id: 'paulo-fiorilo', name: 'Paulo Fiorilo', photo: '/candidates/paulo-fiorilo.jpg', party: 'PT', office: 'Deputado estadual / SP', votes: 96370 },
    { id: 'luiz-fernando', name: 'Luiz Fernando', photo: '/candidates/luiz-fernando.jpg', party: 'PT', office: 'Deputado estadual / SP', votes: 94901 },
    { id: 'debora-camilo', name: 'Débora Camilo', photo: '/candidates/debora-camilo.jpg', party: 'PSOL', office: 'Deputada estadual / SP', votes: 94895 },
    { id: 'donato', name: 'Donato', photo: '/candidates/donato.jpg', party: 'PT', office: 'Deputado estadual / SP', votes: 94779 },
    { id: 'ana-perugini', name: 'Ana Perugini', photo: '/candidates/ana-perugini.jpg', party: 'PT', office: 'Deputada estadual / SP', votes: 70737 },
  ],
  right: [
    { id: 'nikolas-ferreira', name: 'Nikolas Ferreira', photo: '/candidates/nikolas-ferreira.jpg', party: 'PL', office: 'Deputado federal / MG', votes: 3119318 },
    { id: 'lucas-pavanato', name: 'Lucas Pavanato', photo: '/candidates/lucas-pavanato.jpg', party: 'PL', office: 'Deputado federal / SP', votes: 3038438 },
    { id: 'andre-fernandes', name: 'André Fernandes', photo: '/candidates/andre-fernandes.jpg', party: 'PL', office: 'Deputado federal / CE', votes: 684372 },
    { id: 'julia-zanatta', name: 'Julia Zanatta', photo: '/candidates/julia-zanatta.jpg', party: 'PL', office: 'Deputada federal / SC', votes: 560223 },
    { id: 'jeffrey-chiquini', name: 'Jeffrey Chiquini', photo: '/candidates/jeffrey-chiquini.jpg', party: 'Novo', office: 'Deputado federal / PR', votes: 425399 },
    { id: 'lucas-polese', name: 'Lucas Polese', photo: '/candidates/lucas-polese.jpg', party: 'PL', office: 'Deputado federal / ES', votes: 419735 },
    { id: 'delegado-caveira', name: 'Delegado Caveira', photo: '/candidates/delegado-caveira.jpg', party: 'PL', office: 'Deputado federal / PA', votes: 414927 },
    { id: 'mauricio-marcon', name: 'Maurício Marcon', photo: '/candidates/mauricio-marcon.jpg', party: 'PL', office: 'Deputado federal / RS', votes: 379834 },
    { id: 'renato-bolsonaro', name: 'Renato Bolsonaro', photo: '/candidates/renato-bolsonaro.jpg', party: 'PL', office: 'Deputado federal / SP', votes: 379312 },
    { id: 'cabo-gilberto-silva', name: 'Cabo Gilberto Silva', photo: '/candidates/cabo-gilberto-silva.jpg', party: 'PL', office: 'Deputado federal / PB', votes: 267142 },
    { id: 'eduarda-campopiano', name: 'Eduarda Campopiano', photo: '/candidates/eduarda-campopiano.jpg', party: 'PL', office: 'Deputada estadual / SP', votes: 1956238 },
    { id: 'giovanni-sanches', name: 'Giovanni Sanches', photo: '/candidates/giovanni-sanches.jpg', party: 'PL', office: 'Deputado estadual / SP', votes: 235363 },
    { id: 'tenente-coimbra', name: 'Tenente Coimbra', photo: '/candidates/tenente-coimbra.jpg', party: 'PL', office: 'Deputado estadual / SP', votes: 198342 },
    { id: 'thomaz-henrique', name: 'Thomaz Henrique', photo: '/candidates/thomaz-henrique.jpg', party: 'PL', office: 'Deputado estadual / SP', votes: 178164 },
    { id: 'rodrigo-ashiuchi', name: 'Rodrigo Ashiuchi', photo: '/candidates/rodrigo-ashiuchi.jpg', party: 'PL', office: 'Deputado estadual / SP', votes: 162562 },
    { id: 'marcos-damasio', name: 'Marcos Damásio', photo: '/candidates/marcos-damasio.jpg', party: 'PL', office: 'Deputado estadual / SP', votes: 156691 },
    { id: 'dani-alonso', name: 'Dani Alonso', photo: '/candidates/dani-alonso.jpg', party: 'PL', office: 'Deputada estadual / SP', votes: 155574 },
    { id: 'conte-lopes', name: 'Conte Lopes', photo: '/candidates/conte-lopes.jpg', party: 'PL', office: 'Deputado estadual / SP', votes: 139225 },
    { id: 'felipe-sertanejo', name: 'Felipe Sertanejo', photo: '/candidates/felipe-sertanejo.jpg', party: 'PL', office: 'Deputado estadual / SP', votes: 138277 },
    { id: 'delegada-graciela', name: 'Delegada Graciela', photo: '/candidates/delegada-graciela.jpg', party: 'PL', office: 'Deputada estadual / SP', votes: 125624 },
    { id: 'alex-madureira', name: 'Alex Madureira', photo: '/candidates/alex-madureira.jpg', party: 'PL', office: 'Deputado estadual / SP', votes: 122704 },
    { id: 'paulo-mansur', name: 'Paulo Mansur', photo: '/candidates/paulo-mansur.jpg', party: 'PL', office: 'Deputado estadual / SP', votes: 107073 },
    { id: 'danilo-balas', name: 'Danilo Balas', photo: '/candidates/danilo-balas.jpg', party: 'PL', office: 'Deputado estadual / SP', votes: 96188 },
    { id: 'leticia-aguiar', name: 'Letícia Aguiar', photo: '/candidates/leticia-aguiar.jpg', party: 'PL', office: 'Deputada estadual / SP', votes: 94832 },
    { id: 'ricardo-madalena', name: 'Ricardo Madalena', photo: '/candidates/ricardo-madalena.jpg', party: 'PL', office: 'Deputado estadual / SP', votes: 94319 },
    { id: 'lucas-bove', name: 'Lucas Bove', photo: '/candidates/lucas-bove.jpg', party: 'PL', office: 'Deputado estadual / SP', votes: 71263 },
    { id: 'capitao-mosart', name: 'Capitão Mosart', photo: '/candidates/capitao-mosart.jpg', party: 'PL', office: 'Deputado estadual / SP', votes: 70997 },
    { id: 'fabiana-bolsonaro', name: 'Fabiana Bolsonaro', photo: '/candidates/fabiana-bolsonaro.jpg', party: 'PL', office: 'Deputada estadual / SP', votes: 61183 },
  ],
}

const initialScores = { left: 0, right: 0 }
const initialGifts = { left: 0, right: 0 }
const MATCH_DURATION = 5 * 60
const autoConnectOnLoad = import.meta.env.VITE_AUTO_CONNECT === 'true'
const autoPlayMusic = new URLSearchParams(window.location.search).get('audio') === '1'

function randomMatchup(previous) {
  let next
  do {
    next = {
      left: CANDIDATES.left[Math.floor(Math.random() * CANDIDATES.left.length)].id,
      right: CANDIDATES.right[Math.floor(Math.random() * CANDIDATES.right.length)].id,
    }
  } while (previous && next.left === previous.left && next.right === previous.right)
  return next
}

function formatTime(total) {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function scoreFormat(score) {
  return new Intl.NumberFormat('pt-BR').format(score)
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('pt-BR')
}

function ScoreNumber({ value }) {
  return <AnimatePresence mode="popLayout" initial={false}><motion.span key={value} initial={{ y: 11, opacity: 0, scale: 0.94 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -8, opacity: 0, scale: 1.02 }} transition={{ duration: 0.23, ease: 'easeOut' }}>{scoreFormat(value)}</motion.span></AnimatePresence>
}

function Panel({ children, className = '' }) {
  return <div className={`panel ${className}`}>{children}</div>
}

function VotingMachine({ side, candidate, pressed, onVote }) {
  const meta = SIDE_META[side]
  const color = meta.color
  const [lastPress, setLastPress] = useState(0)

  useEffect(() => { if (pressed) setLastPress(Date.now()) }, [pressed])

  return <button type="button" className="machine-vote-button" onClick={onVote} title={`Clique para apoiar ${candidate.name}`} aria-label={`Clique na urna para dar um apoio a ${candidate.name}`}><div className={`machine machine-${color} ${pressed ? 'machine-pressed' : ''}`}>
    <div className="machine-top"><span className="machine-brand">VOTO LIVE · X1</span><span className="machine-indicator"><i /> LIGADA</span></div>
    <div className="machine-screen-wrap">
      <div className="machine-screen">
        <div className="screen-head"><span>SEU VOTO PARA</span><strong>MELHOR MANDATO</strong></div>
        <div className="screen-candidate"><div className="candidate-avatar">{initials(candidate.name)}</div><div><span>PARTIDO</span><strong>{candidate.party}</strong></div></div>
        <div className="screen-person"><strong>{candidate.name}</strong><span>{candidate.office}</span></div>
        <div className="screen-footer"><span>CONFIRME</span><span>◀ ANULAR</span></div>
      </div>
    </div>
    <div className="machine-controls">
      <div className="keypad" aria-hidden="true">{['1', '2', '3', '4', '5', '6', '7', '8', '9', 'BR', '0', 'COR'].map((key, index) => <span className={`key ${index > 8 ? 'key-light' : ''}`} key={key}>{key}</span>)}</div>
      <div className="confirm-keys"><span className="key-cancel">ANULAR</span><span className="key-correct">CORRIGE</span><motion.span animate={pressed ? { scale: [1, 0.9, 1], boxShadow: ['0 3px 0 #17803d', '0 1px 0 #17803d', '0 3px 0 #17803d'] } : { scale: 1 }} className="key-confirm">CONFIRMA<ArrowRight size={9}/></motion.span></div>
    </div>
    <motion.div key={lastPress} className="machine-finger" initial={{ x: 0, y: 0, opacity: 0 }} animate={pressed ? { x: -35, y: -25, opacity: [0, 1, 1, 0] } : { opacity: 0 }} transition={{ duration: .52, times: [0, .2, .65, 1] }}>👆🏻</motion.div>
    <div className="machine-base" />
  </div></button>
}

function RoseFly({ side, username }) {
  const color = SIDE_META[side].color
  return <motion.div className={`rose-fly rose-${color}`} initial={{ opacity: 0, x: 0, y: 16, scale: .25, rotate: -25 }} animate={{ opacity: [0, 1, 1, 0], x: [0, 22, 82, 130], y: [16, -35, -42, -18], scale: [.3, 1.18, 1, .65], rotate: [-25, 5, 18, 32] }} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }}><span>🌹</span><small>{username || 'Rosa'}</small><Sparkles size={13}/></motion.div>
}

function SideCard({ side, candidate, score, total, percent, gifts, pressed, roseEvents, onVote }) {
  const meta = SIDE_META[side]
  const color = meta.color

  return <Panel className={`candidate-card card-${color}`}>
    <div className="card-glow" />
    <div className="candidate-head">
      <div className={`candidate-mark mark-${color}`}><span>{meta.initial}</span></div>
      <div className="candidate-label"><span className="candidate-tag">ESPECTRO · {meta.label}</span><strong className="match-lock">X1 ALEATÓRIO</strong></div>
      <div className={`side-share share-${color}`}><strong>{percent}<small>%</small></strong><span>DA LIVE</span></div>
    </div>
    <div className="card-divider" />
    <div className="score-row"><div><span className="micro-label">APOIOS NA LIVE</span><div className={`score score-${color}`}><ScoreNumber value={score}/><span className="score-unit">votos</span></div></div><div className="total-voter-pill"><Users size={13}/><span>{scoreFormat(total)} <b>na rodada</b></span></div></div>
    <div className="vote-progress"><div className={`progress-fill fill-${color}`} style={{ width: `${percent}%` }} /><span className={`progress-marker marker-dot-${color}`} style={{ left: `calc(${percent}% - 5px)` }} /></div>
    <div className="machine-holder"><div className="machine-caption"><span><Activity size={12}/> CLIQUE NA URNA PARA APOIAR</span><span className="machine-status"><i/> {meta.label}</span></div><div className="machine-stage"><div className="candidate-profile"><img src={candidate.photo} alt={`Foto oficial de ${candidate.name}, ${candidate.party}`} loading="eager"/><div className="candidate-description"><strong>{candidate.name}</strong><span className="candidate-party"><span />{candidate.party}</span><span className="candidate-office">{candidate.office}</span><small>{scoreFormat(candidate.votes)} VOTOS INFORMADOS</small></div></div><VotingMachine side={side} candidate={candidate} pressed={pressed} onVote={onVote}/></div><AnimatePresence>{roseEvents.map((event) => <RoseFly key={event.id} side={side} username={event.username}/>)}</AnimatePresence></div>
    <div className="card-footer"><span><Gift size={13}/>{gifts} rosas recebidas</span><span>ROSE <b>×1 APOIO</b></span></div>
  </Panel>
}

function FloatingControls({ open, setOpen, onVote, onReset, scores, liveStatus, selectedCandidates, round, audioPlaying, onToggleAudio, audioVolume, onAudioVolumeChange, audioError }) {
  return <>
    <motion.button className="control-toggle" onClick={() => setOpen(!open)} whileTap={{ scale: .94 }} aria-label="Abrir painel de controle"><Settings2 size={16}/><span>CONTROLES</span>{open ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}</motion.button>
    <AnimatePresence>{open && <motion.div className="control-panel panel" initial={{ opacity: 0, y: 22, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: .97 }} transition={{ duration: .2 }}>
      <div className="control-heading"><div className="control-heading-icon"><Keyboard size={16}/></div><div><strong>PAINEL DO CRIADOR</strong><span>Rodada {round} · o x1 troca a cada 5 minutos</span></div><button className="icon-button control-close" onClick={() => setOpen(false)} aria-label="Fechar controles"><X size={16}/></button></div>
      <div className="control-buttons"><button className="manual-vote vote-blue" onClick={() => onVote('left')}><Plus size={17}/><span><b>+1 Rosa · {selectedCandidates.left.name}</b><small>Simular apoio na esquerda</small></span><span className="manual-number">E</span></button><button className="manual-vote vote-red" onClick={() => onVote('right')}><Plus size={17}/><span><b>+1 Rosa · {selectedCandidates.right.name}</b><small>Simular apoio na direita</small></span><span className="manual-number">D</span></button></div>
      <div className="audio-controls"><button className="audio-toggle" onClick={onToggleAudio} aria-pressed={audioPlaying}>{audioPlaying ? <Pause size={15}/> : <Play size={15}/>}<span><b>{audioPlaying ? 'PAUSAR SOM' : 'ATIVAR FUNK EM LOOP'}</b><small>Funk da urna eletrônica 2026</small></span>{audioPlaying ? <Volume2 size={16}/> : <VolumeX size={16}/>}</button><label className="audio-volume"><span>VOLUME</span><input type="range" min="0" max="1" step="0.05" value={audioVolume} onChange={(event) => onAudioVolumeChange(Number(event.target.value))} aria-label="Volume do funk"/><b>{Math.round(audioVolume * 100)}%</b></label>{audioError && <small className="audio-error">Não foi possível iniciar o áudio. Tente ativar novamente.</small>}</div>
      <div className="control-bottom"><span><i className={`status-dot ${liveStatus === 'connected' ? 'dot-live' : ''}`}/>{liveStatus === 'connected' ? 'Live conectada' : 'Aguardando TikTok LIVE'}</span><button onClick={onReset}><RotateCcw size={12}/> REINICIAR PLACAR</button></div>
      <div className="control-footnote">PLACAR ATUAL <b>{scoreFormat(scores.left)}</b><span>—</span><b>{scoreFormat(scores.right)}</b></div>
    </motion.div>}</AnimatePresence>
  </>
}

function App() {
  const [scores, setScores] = useState(initialScores)
  const [gifts, setGifts] = useState(initialGifts)
  const [matchup, setMatchup] = useState(() => randomMatchup())
  const [round, setRound] = useState(1)
  const [elapsed, setElapsed] = useState(MATCH_DURATION)
  const [paused, setPaused] = useState(false)
  const [voteTotal, setVoteTotal] = useState(0)
  const [pressedSide, setPressedSide] = useState(null)
  const [roseEvents, setRoseEvents] = useState({ left: [], right: [] })
  const [panelOpen, setPanelOpen] = useState(false)
  const [liveStatus, setLiveStatus] = useState(autoConnectOnLoad ? 'connecting' : 'disconnected')
  const [liveUsername, setLiveUsername] = useState(autoConnectOnLoad ? 't.hetaxman' : '')
  const [showConnect, setShowConnect] = useState(false)
  const [inputUsername, setInputUsername] = useState('')
  const [connected, setConnected] = useState(autoConnectOnLoad)
  const [helpOpen, setHelpOpen] = useState(false)
  const [events, setEvents] = useState([])
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioVolume, setAudioVolume] = useState(0.25)
  const [audioError, setAudioError] = useState(false)
  const seq = useRef(0)
  const resetTimer = useRef()
  const sourceCleanups = useRef([])
  const audioRef = useRef(null)

  const candidatesBySide = useMemo(() => ({
    left: CANDIDATES.left.find((candidate) => candidate.id === matchup.left),
    right: CANDIDATES.right.find((candidate) => candidate.id === matchup.right),
  }), [matchup])
  const percentages = useMemo(() => {
    const sum = scores.left + scores.right
    if (!sum) return { left: 50, right: 50 }
    return { left: Math.round((scores.left / sum) * 100), right: Math.round((scores.right / sum) * 100) }
  }, [scores])
  const difference = scores.left - scores.right
  const leader = difference > 0 ? 'left' : difference < 0 ? 'right' : null

  const addVote = useCallback((side, quantity = 1, username = 'Teste local') => {
    if (!SIDE_META[side]) return
    const delta = getVoteDelta(quantity)
    setScores((current) => ({ ...current, [side]: current[side] + delta.points }))
    setGifts((current) => ({ ...current, [side]: current[side] + delta.roses }))
    setVoteTotal((current) => current + delta.total)
    setPressedSide(side)
    window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setPressedSide((current) => current === side ? null : current), 720)
    const id = ++seq.current
    setRoseEvents((current) => ({ ...current, [side]: [...current[side], { id, username }].slice(-5) }))
    setTimeout(() => setRoseEvents((current) => ({ ...current, [side]: current[side].filter((item) => item.id !== id) })), 1400)
    setEvents((current) => [{ id, side, username, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }, ...current].slice(0, 5))
  }, [])

  const resetScoreboard = () => {
    setScores(initialScores); setGifts(initialGifts); setVoteTotal(0); setEvents([]); setRoseEvents({ left: [], right: [] }); setPressedSide(null)
  }

  const resetGame = () => {
    resetScoreboard(); setElapsed(MATCH_DURATION); setPaused(false)
  }

  const startNextRound = useCallback(() => {
    setMatchup((current) => randomMatchup(current))
    resetScoreboard(); setElapsed(MATCH_DURATION); setRound((current) => current + 1)
  }, [])

  useEffect(() => {
    if (paused) return undefined
    if (elapsed <= 0) {
      startNextRound()
      return undefined
    }
    const timer = window.setTimeout(() => setElapsed((time) => Math.max(0, time - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [paused, elapsed, startNextRound])

  useEffect(() => () => { window.clearTimeout(resetTimer.current); sourceCleanups.current.forEach((cleanup) => cleanup()) }, [])

  useEffect(() => {
    if (!connected || (!liveUsername && !autoConnectOnLoad)) return undefined
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

  const toggleAudio = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (!audio.paused) {
      audio.pause()
      setAudioPlaying(false)
      return
    }
    audio.volume = audioVolume
    setAudioError(false)
    try {
      await audio.play()
      setAudioPlaying(true)
    } catch {
      setAudioPlaying(false)
      setAudioError(true)
    }
  }

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = audioVolume
  }, [audioVolume])

  useEffect(() => {
    if (!autoPlayMusic || !audioRef.current) return
    audioRef.current.volume = audioVolume
    audioRef.current.play().then(() => setAudioPlaying(true)).catch(() => setAudioError(true))
  }, [])

  return <main className="app-shell">
    <div className="ambient-glow glow-one"/><div className="ambient-glow glow-two"/>
    <header className="topbar">
      <a href="#top" className="brand"><div className="brand-icon"><span/><span/><span/></div><span>VOTO<span className="brand-light">LIVE</span></span><span className="brand-divider"/><span className="brand-edition">X1</span></a>
      <div className="header-center"><span className="live-indicator"><i/> TRANSMISSÃO AO VIVO</span><span className="header-separator"/><span className="header-event"><Radio size={13}/> X1 DE MANDATOS</span></div>
      <div className="header-actions"><button className="help-button" onClick={() => setHelpOpen(!helpOpen)} aria-label="Ajuda"><CircleHelp size={16}/></button><button className={`connect-button ${connected ? 'is-connected' : ''}`} onClick={() => connected ? disconnectLive() : setShowConnect(true)}><span className="connect-indicator"/>{connected ? liveStatus === 'connected' ? 'LIVE CONECTADA' : 'AGUARDANDO LIVE' : 'CONECTAR TIKTOK'}{connected ? <Wifi size={14}/> : <ArrowRight size={14}/>}</button></div>
    </header>

    <section className="match-info"><div className="event-overline"><span/><span>X1 ALEATÓRIO A CADA 5 MINUTOS</span><span/></div><h1>QUEM FARÁ <span>O MELHOR MANDATO?</span></h1><p>Escreva <b>ESQUERDA</b> ou <b>DIREITA</b> no chat e mande uma <b>rosa 🌹</b> para votar.</p></section>

    <section className="scoreboard" aria-label="Placar do x1 de candidatos">
      <Panel className="status-panel"><button className="timer-block" onClick={() => setPaused(!paused)} title={paused ? 'Retomar rodada' : 'Pausar rodada'}><span className="timer-label"><Clock3 size={12}/>PRÓXIMO X1 EM</span><strong className={elapsed <= 30 ? 'timer-urgent' : ''}>{formatTime(elapsed)}</strong><span className="timer-hint">{paused ? 'PAUSADO · CLIQUE PARA RETOMAR' : `RODADA ${round} · CLIQUE PARA PAUSAR`}</span></button><div className="status-divider"/><div className="status-metric"><span><Users size={13}/>APOIOS NA LIVE</span><strong><ScoreNumber value={voteTotal}/></strong><small>nesta rodada</small></div><div className="status-divider"/><div className="difference-metric"><span>{leader ? <ArrowDownRight size={14}/> : <Activity size={14}/>}DIFERENÇA</span><strong className={leader ? `diff-${SIDE_META[leader].color}` : ''}>{difference === 0 ? '—' : `${difference > 0 ? '+' : ''}${scoreFormat(difference)}`}</strong><small>{leader ? <>VANTAGEM <b>{SIDE_META[leader].label}</b></> : 'TUDO IGUAL'}</small></div><div className="status-live"><i/> RODADA {round}</div></Panel>
      <div className="candidate-grid"><SideCard side="left" candidate={candidatesBySide.left} score={scores.left} total={voteTotal} percent={percentages.left} gifts={gifts.left} pressed={pressedSide === 'left'} roseEvents={roseEvents.left} onVote={() => addVote('left', 1, 'Toque na urna')}/><div className="versus"><span>VS</span><div/><small>AO VIVO</small></div><SideCard side="right" candidate={candidatesBySide.right} score={scores.right} total={voteTotal} percent={percentages.right} gifts={gifts.right} pressed={pressedSide === 'right'} roseEvents={roseEvents.right} onVote={() => addVote('right', 1, 'Toque na urna')}/></div>
    </section>

    <section className="activity-strip"><div className="activity-title"><span className="activity-icon"><Activity size={14}/></span><div><strong>ÚLTIMOS APOIOS</strong><small>ACOMPANHE O X1</small></div></div><div className="activity-items"><AnimatePresence initial={false}>{events.length ? events.slice(0, 3).map((event) => <motion.div key={event.id} className="activity-item" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}><span className={`event-avatar avatar-${SIDE_META[event.side].color}`}>{SIDE_META[event.side].initial}</span><span className="activity-user"><b>{event.username}</b><small>enviou uma Rosa</small></span><span className={`event-vote vote-label-${SIDE_META[event.side].color}`}>APOIOU {SIDE_META[event.side].label}</span><span className="activity-time">{event.time}</span></motion.div>) : <span className="empty-activity">Aguardando os primeiros apoios da rodada...</span>}</AnimatePresence></div><div className="activity-rules"><span><span className="rose-mini">🌹</span><b>LADO NO CHAT</b><ArrowRight size={12}/><b>1 ROSA</b></span><small>ESCREVA ESQUERDA OU DIREITA</small></div></section>

    <footer className="site-footer"><span>© 2026 VOTO LIVE <span className="footer-dot">·</span> FOTOS DE CANDIDATURAS · TSE 2026</span><span className="footer-powered"><span/><span>FEITO PARA A COMUNIDADE</span><Heart size={11}/></span></footer>

      <FloatingControls open={panelOpen} setOpen={setPanelOpen} onVote={(side) => addVote(side, 1)} onReset={resetGame} scores={scores} liveStatus={liveStatus} selectedCandidates={candidatesBySide} round={round} audioPlaying={audioPlaying} onToggleAudio={toggleAudio} audioVolume={audioVolume} onAudioVolumeChange={setAudioVolume} audioError={audioError}/>

      <audio ref={audioRef} src="/audio/funk-da-urna-2026.mp3" loop preload="auto" onPlay={() => setAudioPlaying(true)} onPause={() => setAudioPlaying(false)} />

    <AnimatePresence>{showConnect && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setShowConnect(false) }}><motion.form className="connect-modal panel" onSubmit={connectToLive} initial={{ opacity: 0, y: 15, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .98 }}><button className="icon-button modal-close" type="button" onClick={() => setShowConnect(false)} aria-label="Fechar"><X size={17}/></button><div className="modal-icon"><Radio size={21}/></div><span className="modal-overline">CONECTAR TRANSMISSÃO</span><h2>Entre na disputa</h2><p>Conecte seu usuário do TikTok Live para computar rosas da transmissão.</p><label className="input-label" htmlFor="live-username">USUÁRIO DO TIKTOK</label><div className="username-input"><span>@</span><input id="live-username" autoFocus placeholder="seu.usuario" value={inputUsername} onChange={(event) => setInputUsername(event.target.value)} /></div><div className="connection-note"><WifiOff size={14}/><span>Para receber eventos reais, rode o adaptador do servidor com <code>TIKTOK_USERNAME</code>.</span></div><button className="modal-submit" type="submit">CONECTAR LIVE <ArrowRight size={15}/></button><button className="demo-link" type="button" onClick={() => { setShowConnect(false); setPanelOpen(true) }}>Continuar no modo demonstração</button></motion.form></motion.div>}</AnimatePresence>

    <AnimatePresence>{helpOpen && <motion.div className="help-popover panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}><button className="icon-button help-close" onClick={() => setHelpOpen(false)} aria-label="Fechar ajuda"><X size={14}/></button><strong>COMO FUNCIONA</strong><p>Um x1 aleatório começa a cada rodada de cinco minutos. Escreva ESQUERDA ou DIREITA no chat antes de enviar uma Rosa. Você também pode clicar na urna para simular um apoio.</p><div><span>🌹</span> 1 ROSA = 1 APOIO</div></motion.div>}</AnimatePresence>
  </main>
}

export default App
