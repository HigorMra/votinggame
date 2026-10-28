import express from 'express'
import { createServer } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'
import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector'

const PORT = Number(process.env.PORT) || 3001
const username = process.env.TIKTOK_USERNAME?.trim().replace(/^@/, '')
const side22Users = new Set(
  (process.env.SIDE_22_USERS || '')
    .split(',')
    .map((name) => name.trim().replace(/^@/, '').toLowerCase())
    .filter(Boolean),
)

const app = express()
const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer, path: '/live' })
let connection
let liveStatus = username ? 'connecting' : 'disconnected'
let shuttingDown = false

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
    // Configure SIDE_22_USERS to assign named gifters to 22. Other gifters vote 13.
    // With no assignment list, Roses default to side 22 for a useful first-run demo.
    const side = side22Users.size === 0 || side22Users.has(sender.toLowerCase()) ? '22' : '13'

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

  connection.on('connected', () => setLiveStatus('connected'))
  connection.on('disconnected', () => setLiveStatus('disconnected'))
  connection.on('error', (error) => {
    console.error('[tiktok] connection error:', error?.message || error)
    setLiveStatus('disconnected', 'TikTok connection error')
  })

  connection.connect()
    .then(() => setLiveStatus('connected'))
    .catch((error) => {
      console.error('[tiktok] unable to connect:', error.message)
      setLiveStatus('disconnected', error.message)
    })
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] HTTP health check: http://localhost:${PORT}/health`)
  console.log(`[server] WebSocket events: ws://localhost:${PORT}/live`)
})

async function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
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
