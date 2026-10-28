import express from 'express'
import { createServer } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'
import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector'

const PORT = Number(process.env.PORT) || 3001
const username = process.env.TIKTOK_USERNAME?.trim().replace(/^@/, '')
const sideLeftUsers = new Set(
  (process.env.SIDE_LEFT_USERS || '')
    .split(',')
    .map((name) => name.trim().replace(/^@/, '').toLowerCase())
    .filter(Boolean),
)
const sideRightUsers = new Set(
  (process.env.SIDE_RIGHT_USERS || '')
    .split(',')
    .map((name) => name.trim().replace(/^@/, '').toLowerCase())
    .filter(Boolean),
)
const viewerSideChoices = new Map()

const app = express()
const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer, path: '/live' })
let connection
let liveStatus = username ? 'connecting' : 'disconnected'
let shuttingDown = false
let connectInFlight = false
let retryTimer
let retryDelayMs = 20_000

function broadcast(payload) {
  const message = JSON.stringify(payload)
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(message)
  }
}

function setLiveStatus(status, message) {
  liveStatus = status
  broadcast({ type: 'status', status, ...(message ? { message } : {}) })
  console.log(`[tiktok] ${status}${message ? `: ${message}` : ''}`)
}

function scheduleReconnect(message) {
  setLiveStatus('disconnected', message)
  if (shuttingDown || retryTimer) return

  const delay = retryDelayMs
  retryDelayMs = Math.min(retryDelayMs * 2, 120_000)
  console.log(`[tiktok] retrying in ${Math.round(delay / 1000)} seconds`)
  retryTimer = setTimeout(() => {
    retryTimer = undefined
    void connectTikTok()
  }, delay)
}

async function connectTikTok() {
  if (!connection || shuttingDown || connectInFlight || connection.isConnected) return
  connectInFlight = true
  setLiveStatus('connecting')

  try {
    await connection.connect()
    clearTimeout(retryTimer)
    retryTimer = undefined
    retryDelayMs = 20_000
    setLiveStatus('connected')
  } catch (error) {
    console.error('[tiktok] unable to connect:', error?.message || 'Could not connect to LIVE room')
    scheduleReconnect(error?.message || 'Could not connect to LIVE room')
  } finally {
    connectInFlight = false
  }
}

// A small health endpoint makes it easy to tell whether the HTTP/WebSocket adapter
// is running and whether it has connected to the configured TikTok LIVE room.
app.get('/health', (_request, response) => {
  response.json({ service: 'voto-live-adapter', status: liveStatus, streamer: username || null })
})

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'status', status: liveStatus }))
  socket.on('message', (data) => {
    try {
      if (JSON.parse(data.toString()).type === 'ping' && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
      }
    } catch { /* Ignore non-JSON messages from clients. */ }
  })
  socket.on('error', (error) => console.warn('[websocket] client error:', error.message))
})

wss.on('error', (error) => console.error('[websocket] server error:', error.message))

if (!username) {
  console.log('[tiktok] TIKTOK_USERNAME is not set; adapter is ready in demo mode.')
} else {
  // Gift details are requested so the Rose filter uses the human-readable gift
  // name. The connector itself runs only on the server; no TikTok cookies or
  // credentials are sent to the browser.
  connection = new TikTokLiveConnection(username, { enableExtendedGiftInfo: true })

  connection.on(WebcastEvent.CHAT, (event) => {
    const sender = (event.user?.uniqueId || '').replace(/^@/, '').toLowerCase()
    const command = (event.comment || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    if (!sender || !['esquerda', 'direita'].includes(command)) return

    const side = command === 'esquerda' ? 'left' : 'right'
    viewerSideChoices.delete(sender)
    viewerSideChoices.set(sender, side)
    if (viewerSideChoices.size > 5000) viewerSideChoices.delete(viewerSideChoices.keys().next().value)
    broadcast({ type: 'side-choice', side, username: event.user?.nickname || sender, timestamp: Date.now() })
  })

  connection.on(WebcastEvent.GIFT, (event) => {
    const giftName = event.giftDetails?.giftName
      || event.extendedGiftInfo?.name
      || event.giftName
      || ''

    if (giftName.toLocaleLowerCase() !== 'rose') return

    // Streak gifts emit multiple updates with increasing repeatCount. Count once,
    // when the streak ends, using its final repeatCount. Ordinary gifts are counted
    // as soon as their event arrives.
    if (event.giftDetails?.giftType === 1 && !event.repeatEnd) return

    const sender = (event.user?.uniqueId || '').replace(/^@/, '')
    const nickname = event.user?.nickname || sender || 'Alguém'
    const quantity = Math.min(1000, Math.max(1, Number(event.repeatCount) || 1))
    // Explicit username assignment wins; otherwise use the side the viewer chose in chat.
    // A viewer without a prior choice defaults to the left side.
    const senderKey = sender.toLowerCase()
    const side = sideLeftUsers.has(senderKey)
      ? 'left'
      : sideRightUsers.has(senderKey)
        ? 'right'
        : viewerSideChoices.get(senderKey) || 'left'

    broadcast({
      type: 'rose',
      side,
      quantity,
      username: nickname,
      giftName: 'Rose',
      giftId: event.giftId,
      timestamp: Date.now(),
    })
  })

  connection.on('connected', () => {
    clearTimeout(retryTimer)
    retryTimer = undefined
    retryDelayMs = 20_000
    setLiveStatus('connected')
  })
  connection.on('disconnected', (event) => {
    scheduleReconnect(event?.reason || 'TikTok LIVE disconnected')
  })
  connection.on('error', (error) => {
    console.error('[tiktok] connection error:', error?.message || 'TikTok connection error')
  })

  void connectTikTok()
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] HTTP health check: http://localhost:${PORT}/health`)
  console.log(`[server] WebSocket events: ws://localhost:${PORT}/live`)
})

async function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  clearTimeout(retryTimer)
  console.log(`[server] ${signal}; closing connections...`)

  try {
    await connection?.disconnect()
  } catch (error) {
    console.warn('[tiktok] disconnect error:', error.message)
  }

  wss.clients.forEach((client) => client.close(1001, 'Server shutting down'))
  wss.close()
  httpServer.close(() => process.exit(0))
}

process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))
