// A dependency-free server for the networking demo.
//
// It does three jobs, one per panel:
//   1. HTTP endpoints that are slow, streamed or large on purpose, so fetch has
//      something worth streaming, aborting and measuring
//   2. a WebSocket implementation written out by hand (RFC 6455 is short enough
//      that pulling in `ws` would hide the only interesting part: the upgrade)
//   3. a signalling relay, which is all a WebRTC connection ever needs a server
//      for — once the two peers are talking, this process can be killed
//
//   node server/index.mjs   →   http://localhost:5181

import { createServer } from 'node:http'
import { createHash, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = 5181
const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url))

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

const clamp = (n, lo, hi) => (Number.isFinite(n) ? Math.min(Math.max(n, lo), hi) : lo)
const bytes = (n) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(JSON.stringify(body, null, 2))
}

// ============================================================================
// 1 · HTTP endpoints for the fetch panel
// ============================================================================

const routes = {
  // The ordinary case, and the baseline every other endpoint is measured against.
  '/api/hello'(req, res) {
    json(res, 200, {
      message: 'One request, one response, connection done.',
      you: req.socket.remoteAddress,
      at: new Date().toISOString(),
    })
  },

  // Echoes the request headers back. Most of them were added by the browser
  // without the page asking, which is the same lesson as HttpOnly cookies:
  // a lot of the protocol is handled above your code, not by it.
  '/api/headers'(req, res) {
    json(res, 200, {
      method: req.method,
      httpVersion: req.httpVersion,
      headersTheServerReceived: req.headers,
      note: 'Your fetch() call set at most one of these. The browser wrote the rest.',
    })
  },

  // Answers after a delay, so there is something long enough to abort. The
  // interesting half is server-side: watch this terminal when you cancel.
  '/api/slow'(req, res, url) {
    const ms = clamp(Number(url.searchParams.get('ms')), 0, 60_000) || 8000
    const started = Date.now()
    const timer = setTimeout(() => {
      json(res, 200, { waitedMs: Date.now() - started, note: 'Nobody cancelled. Here is your response.' })
    }, ms)

    res.on('close', () => {
      if (res.writableEnded) return
      clearTimeout(timer)
      console.log(`  ✂  client aborted /api/slow after ${Date.now() - started}ms — the socket really closed`)
    })
  },

  // Chunked text with no Content-Length, written a line at a time. The browser
  // can start reading before the server has finished writing.
  '/api/stream'(req, res, url) {
    const chunks = clamp(Number(url.searchParams.get('chunks')), 1, 200) || 12
    const delay = clamp(Number(url.searchParams.get('delay')), 0, 2000) || 250

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      // No Content-Length → Node uses Transfer-Encoding: chunked, which is what
      // makes a response streamable in the first place.
      'X-Content-Type-Options': 'nosniff',
    })

    let sent = 0
    const timer = setInterval(() => {
      if (res.destroyed) return clearInterval(timer)
      sent++
      const stamp = new Date().toISOString().slice(11, 23)
      res.write(`chunk ${String(sent).padStart(2)} of ${chunks}  ·  written by the server at ${stamp}\n`)
      if (sent >= chunks) {
        clearInterval(timer)
        res.end('— end of stream —\n')
      }
    }, delay)

    res.on('close', () => clearInterval(timer))
  },

  // A known-size body dribbled out slowly, so download progress is measurable.
  // Content-Length is what makes a percentage possible at all.
  '/api/download'(req, res, url) {
    const total = clamp(Number(url.searchParams.get('bytes')), 1000, 50_000_000) || 4_000_000
    const block = Buffer.alloc(64 * 1024, 0x61)

    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(total),
      'Cache-Control': 'no-store',
    })

    let sent = 0
    const pump = () => {
      if (res.destroyed) return
      const size = Math.min(block.length, total - sent)
      sent += size
      const drained = res.write(size === block.length ? block : block.subarray(0, size))
      if (sent >= total) return res.end()
      if (drained) setTimeout(pump, 25)
      else res.once('drain', () => setTimeout(pump, 25))
    }
    pump()
  },

  // Reads the request body deliberately slowly. On localhost an upload finishes
  // instantly, and a progress bar that jumps to 100% teaches nothing.
  '/api/upload'(req, res) {
    if (req.method !== 'POST') return json(res, 405, { error: 'POST only' })
    let received = 0
    const started = Date.now()

    req.on('data', (chunk) => {
      received += chunk.length
      req.pause()
      setTimeout(() => req.resume(), 20) // backpressure, applied on purpose
    })
    req.on('end', () => {
      json(res, 200, {
        received,
        pretty: bytes(received),
        tookMs: Date.now() - started,
        contentType: req.headers['content-type'] ?? null,
      })
    })
  },
}

// ============================================================================
// 2 · WebSocket, written out by hand
// ============================================================================

// The handshake is an ordinary HTTP request with `Upgrade: websocket`. The
// server proves it understood by hashing the client's key with this fixed GUID
// from the spec — that is the whole ceremony.
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

const OPCODE = { CONTINUATION: 0x0, TEXT: 0x1, BINARY: 0x2, CLOSE: 0x8, PING: 0x9, PONG: 0xa }

/** Wrap a payload in a frame. Server→client frames are never masked. */
function encodeFrame(opcode, payload = Buffer.alloc(0)) {
  const len = payload.length
  let header
  if (len < 126) {
    header = Buffer.alloc(2)
    header[1] = len
  } else if (len < 65_536) {
    header = Buffer.alloc(4)
    header[1] = 126
    header.writeUInt16BE(len, 2)
  } else {
    header = Buffer.alloc(10)
    header[1] = 127
    header.writeBigUInt64BE(BigInt(len), 2)
  }
  header[0] = 0x80 | opcode // FIN + opcode
  return Buffer.concat([header, payload])
}

/**
 * TCP delivers a byte stream, not messages: one frame can arrive split across
 * several `data` events, and several frames can arrive in one. So bytes are
 * buffered and frames are pulled off only once complete. This bookkeeping is
 * most of what a WebSocket library does for you.
 */
function createFrameReader(handlers) {
  let buffer = Buffer.alloc(0)
  let fragments = []
  let fragmentOpcode = null

  return (chunk) => {
    buffer = Buffer.concat([buffer, chunk])

    for (;;) {
      if (buffer.length < 2) return
      const fin = (buffer[0] & 0x80) !== 0
      const opcode = buffer[0] & 0x0f
      const masked = (buffer[1] & 0x80) !== 0
      let length = buffer[1] & 0x7f
      let offset = 2

      if (length === 126) {
        if (buffer.length < 4) return
        length = buffer.readUInt16BE(2)
        offset = 4
      } else if (length === 127) {
        if (buffer.length < 10) return
        length = Number(buffer.readBigUInt64BE(2))
        offset = 10
      }

      // Client→server frames are *always* masked. It is not encryption — it
      // exists so a malicious page cannot craft bytes that a dumb proxy would
      // mistake for a real HTTP request.
      const mask = masked ? buffer.subarray(offset, offset + 4) : null
      if (masked) offset += 4
      if (buffer.length < offset + length) return

      const payload = Buffer.from(buffer.subarray(offset, offset + length))
      if (mask) for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3]
      buffer = buffer.subarray(offset + length)

      if (opcode === OPCODE.CLOSE) {
        const code = payload.length >= 2 ? payload.readUInt16BE(0) : 1005
        return handlers.close(code, payload.subarray(2).toString('utf8'))
      }
      if (opcode === OPCODE.PING) {
        handlers.ping(payload)
        continue
      }
      if (opcode === OPCODE.PONG) {
        handlers.pong(payload)
        continue
      }

      // A message may be split across frames: one non-zero opcode, then any
      // number of continuation frames, the last with FIN set.
      if (opcode !== OPCODE.CONTINUATION) fragmentOpcode = opcode
      fragments.push(payload)
      if (!fin) continue

      const body = fragments.length === 1 ? fragments[0] : Buffer.concat(fragments)
      fragments = []
      const wasBinary = fragmentOpcode === OPCODE.BINARY
      fragmentOpcode = null
      handlers.message(body, wasBinary)
    }
  }
}

const clients = new Map() // id → client

function broadcast(payload, exceptId) {
  for (const [id, client] of clients) if (id !== exceptId) client.sendJson(payload)
}

function handleUpgrade(req, socket, head) {
  const key = req.headers['sec-websocket-key']
  if (req.headers.upgrade?.toLowerCase() !== 'websocket' || !key) {
    return socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
  }

  const accept = createHash('sha1')
    .update(key + WS_GUID)
    .digest('base64')

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
  )
  socket.setNoDelay(true)

  const id = randomUUID().slice(0, 8)
  const client = {
    id,
    socket,
    ticker: null,
    pingSentAt: 0,
    sunkBytes: 0,
    send: (opcode, payload) => {
      if (!socket.destroyed) socket.write(encodeFrame(opcode, payload))
    },
    sendJson: (value) => client.send(OPCODE.TEXT, Buffer.from(JSON.stringify(value))),
  }
  clients.set(id, client)
  console.log(`  ⇅  ws ${id} connected  (${clients.size} open)`)

  const cleanup = () => {
    if (!clients.has(id)) return
    clearInterval(client.ticker)
    clients.delete(id)
    socket.destroy()
    console.log(`  ⇅  ws ${id} gone  (${clients.size} open)`)
    broadcast({ type: 'peer-left', id })
  }

  const read = createFrameReader({
    message: (payload, isBinary) => onWsMessage(client, payload, isBinary),
    ping: (payload) => client.send(OPCODE.PONG, payload),
    pong: () => {
      const rtt = Date.now() - client.pingSentAt
      console.log(`  ⇅  ws ${id} ponged in ${rtt}ms`)
      client.sendJson({ type: 'pong-seen', rttMs: rtt })
    },
    close: (code, reason) => {
      console.log(`  ⇅  ws ${id} sent close ${code} ${reason && `"${reason}"`}`)
      client.send(OPCODE.CLOSE, encodeCloseBody(1000, ''))
      cleanup()
    },
  })

  if (head?.length) read(head)
  socket.on('data', read)
  socket.on('error', cleanup)
  socket.on('close', cleanup)

  client.sendJson({ type: 'welcome', id, peers: [...clients.keys()].filter((k) => k !== id) })
  broadcast({ type: 'peer-joined', id }, id)
}

function encodeCloseBody(code, reason) {
  const body = Buffer.alloc(2 + Buffer.byteLength(reason))
  body.writeUInt16BE(code, 0)
  body.write(reason, 2)
  return body
}

function onWsMessage(client, payload, isBinary) {
  // Binary frames come back with the bytes reversed, so the page can prove the
  // round trip happened without any encoding step in between.
  if (isBinary) {
    console.log(`  ⇅  ws ${client.id} sent ${payload.length} binary bytes`)
    return client.send(OPCODE.BINARY, Buffer.from(payload).reverse())
  }

  const text = payload.toString('utf8')

  // The backpressure test sends megabytes it does not want echoed.
  if (text.startsWith('sink:')) {
    client.sunkBytes += payload.length
    return
  }

  let msg
  try {
    msg = JSON.parse(text)
  } catch {
    return client.sendJson({ type: 'error', error: 'not JSON', got: text.slice(0, 80) })
  }

  switch (msg.type) {
    case 'echo':
      return client.sendJson({ type: 'echo', text: msg.text, at: new Date().toISOString() })

    case 'broadcast':
      broadcast({ type: 'broadcast', from: client.id, text: msg.text }, client.id)
      return client.sendJson({ type: 'broadcast-sent', to: clients.size - 1 })

    // The direction fetch cannot do: the server talking first, unprompted.
    case 'ticker-start': {
      clearInterval(client.ticker)
      let n = 0
      client.ticker = setInterval(() => client.sendJson({ type: 'tick', n: ++n, at: Date.now() }), 1000)
      return client.sendJson({ type: 'ticker', running: true })
    }
    case 'ticker-stop':
      clearInterval(client.ticker)
      client.ticker = null
      return client.sendJson({ type: 'ticker', running: false })

    // A protocol-level ping. The browser answers this on its own; there is no
    // JavaScript API for it and no event fires on the page.
    case 'ping':
      client.pingSentAt = Date.now()
      return client.send(OPCODE.PING, Buffer.from('are you there'))

    case 'sink-report':
      return client.sendJson({ type: 'sink-report', bytes: client.sunkBytes, pretty: bytes(client.sunkBytes) })

    case 'peers':
      return client.sendJson({ type: 'peers', peers: [...clients.keys()].filter((k) => k !== client.id) })

    // Everything the WebRTC panel needs from a server: pass this blob to the
    // other tab. The server never looks inside it.
    case 'signal': {
      const targets = msg.to ? [clients.get(msg.to)].filter(Boolean) : [...clients.values()].filter((c) => c !== client)
      for (const target of targets) target.sendJson({ type: 'signal', from: client.id, payload: msg.payload })
      return client.sendJson({ type: 'signal-relayed', to: targets.map((t) => t.id) })
    }

    case 'bye':
      client.send(OPCODE.CLOSE, encodeCloseBody(4000, 'closed on request'))
      return setTimeout(() => client.socket.destroy(), 50)

    default:
      return client.sendJson({ type: 'error', error: `unknown type "${msg.type}"` })
  }
}

// ============================================================================
// static files
// ============================================================================

async function serveStatic(url, res) {
  let pathname = decodeURIComponent(url.pathname)
  if (pathname.endsWith('/')) pathname += 'index.html'

  // normalize() collapses `..` so a request cannot climb out of public/
  const filePath = join(PUBLIC_DIR, normalize(pathname))
  if (!filePath.startsWith(PUBLIC_DIR.endsWith(sep) ? PUBLIC_DIR : PUBLIC_DIR + sep)) {
    res.writeHead(403).end('Forbidden')
    return
  }

  try {
    const body = await readFile(filePath)
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    })
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(`404 — ${pathname} not found`)
  }
}

// ============================================================================
// server
// ============================================================================

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const route = routes[url.pathname]
  if (route) return route(req, res, url)
  await serveStatic(url, res)
})

// A WebSocket starts life as an HTTP request that Node hands over here instead
// of routing normally. From this point there is no more HTTP on this socket.
server.on('upgrade', handleUpgrade)

server.listen(PORT, () => {
  console.log(`browser-networking demo → http://localhost:${PORT}`)
  console.log('Open it in two tabs for the broadcast and WebRTC panels.\n')
})
