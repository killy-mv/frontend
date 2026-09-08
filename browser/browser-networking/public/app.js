// Every action is deliberately written the long way, with no helper library, so
// the actual browser API being exercised is visible in the source.

// --- tiny logging helper ----------------------------------------------------

// Panels are addressed by a short key; the section ids they map to are also
// accepted, so the error handler can pass `section.id` straight through.
const PANEL = { fetch: 'fetch', ws: 'websocket', rtc: 'webrtc' }
const logEl = (panel) => document.getElementById(`log-${PANEL[panel] ?? panel}`)

function logTo(panel, text, cls = '') {
  const el = logEl(panel)
  const line = document.createElement('span')
  if (cls) line.className = cls
  line.textContent = text + '\n'
  el.appendChild(line)
  el.scrollTop = el.scrollHeight
}

const log = {
  fetch: (t, c) => logTo('fetch', t, c),
  ws: (t, c) => logTo('ws', t, c),
  rtc: (t, c) => logTo('rtc', t, c),
}

function clearLog(panel) {
  logEl(panel).textContent = ''
}

const bytes = (n) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`

const clock = () => new Date().toISOString().slice(11, 23)

function setBar(id, ratio) {
  document.getElementById(id).firstElementChild.style.width = `${Math.min(100, ratio * 100).toFixed(1)}%`
}

// ============================================================================
// 1 · FETCH
// ============================================================================

let slowController = null

const http = {
  async hello() {
    clearLog('fetch')
    const started = performance.now()
    const res = await fetch('/api/hello')
    const body = await res.json()

    log.fetch(`GET /api/hello → ${res.status} ${res.statusText}  (${(performance.now() - started).toFixed(0)}ms)`)
    log.fetch(`content-type: ${res.headers.get('content-type')}\n`, 'dim')
    log.fetch(JSON.stringify(body, null, 2))
    log.fetch('\n✓ Request, response, connection closed. The server cannot speak again.', 'ok')
  },

  async headers() {
    clearLog('fetch')
    // One header is set here. Count how many arrive.
    const res = await fetch('/api/headers', { headers: { 'X-Written-By-Me': 'yes' } })
    const body = await res.json()
    const sent = Object.entries(body.headersTheServerReceived)

    log.fetch(`The server received ${sent.length} request headers. You wrote one:\n`)
    for (const [key, value] of sent) {
      const mine = key.toLowerCase() === 'x-written-by-me'
      log.fetch(`  ${mine ? '→' : ' '} ${key}: ${String(value).slice(0, 90)}`, mine ? 'ok' : 'dim')
    }
    log.fetch(`\n${body.note}`, 'ok')
  },

  // The response body is a ReadableStream. Reading it by hand is the difference
  // between "the answer arrived" and "the answer is arriving".
  async stream() {
    clearLog('fetch')
    const started = performance.now()
    log.fetch(`GET /api/stream — reading response.body as it arrives\n`, 'dim')

    const res = await fetch('/api/stream?chunks=10&delay=300')
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let received = 0

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.length
      // stream: true keeps a multi-byte character split across chunks intact.
      const text = decoder.decode(value, { stream: true })
      log.fetch(`  +${String(value.length).padStart(3)} B at ${(performance.now() - started).toFixed(0)}ms  ${text.trimEnd()}`)
    }

    log.fetch(`\n✓ ${bytes(received)} in, printed as it landed over ${(performance.now() - started).toFixed(0)}ms`, 'ok')
    log.fetch('Now press "Wait for the whole body" and compare the timestamps.', 'dim')
  },

  // Same endpoint, same bytes, one await instead of a loop.
  async buffered() {
    clearLog('fetch')
    const started = performance.now()
    log.fetch(`GET /api/stream — await res.text()\n`, 'dim')
    log.fetch(`  ${clock()}  waiting…`)

    const res = await fetch('/api/stream?chunks=10&delay=300')
    const text = await res.text()

    log.fetch(`  ${clock()}  got everything: ${bytes(text.length)} after ${(performance.now() - started).toFixed(0)}ms\n`)
    log.fetch(text.trimEnd(), 'dim')
    log.fetch('\n✓ Identical response. res.text() just hid the fact that it dripped in.', 'ok')
    log.fetch('That is fine for JSON and wrong for anything you want to show progressively.', 'dim')
  },

  async download() {
    clearLog('fetch')
    setBar('f-bar', 0)
    const res = await fetch('/api/download?bytes=4000000')

    // No Content-Length, no percentage — this is why some progress bars in the
    // wild are fake spinners: the server never said how much was coming.
    const total = Number(res.headers.get('content-length'))
    log.fetch(`content-length: ${total.toLocaleString()} bytes → a real percentage is possible\n`)

    const reader = res.body.getReader()
    const started = performance.now()
    let received = 0

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.length
      setBar('f-bar', received / total)
    }

    const seconds = (performance.now() - started) / 1000
    log.fetch(`✓ ${bytes(received)} in ${seconds.toFixed(2)}s  (${bytes(received / seconds)}/s)`, 'ok')
    log.fetch('The bar was counted by hand from the stream. fetch has no progress event.', 'dim')
  },

  // fetch cannot report upload progress. XHR can, and that single gap is why
  // XMLHttpRequest has outlived every prediction of its death.
  uploadXhr() {
    clearLog('fetch')
    setBar('f-bar', 0)
    const blob = makeBlob(4_000_000)
    log.fetch(`POST /api/upload — ${bytes(blob.size)} via XMLHttpRequest\n`)

    return new Promise((resolve, reject) => {
      const started = performance.now()
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload')

      // The event nobody has managed to add to fetch.
      xhr.upload.onprogress = (event) => {
        setBar('f-bar', event.loaded / event.total)
        if (event.loaded === event.total || event.loaded % 1_000_000 < 65_536) {
          log.fetch(`  uploaded ${bytes(event.loaded).padStart(9)} of ${bytes(event.total)}`)
        }
      }
      xhr.onload = () => {
        const body = JSON.parse(xhr.responseText)
        log.fetch(`\n✓ server counted ${body.pretty} in ${((performance.now() - started) / 1000).toFixed(2)}s`, 'ok')
        log.fetch('xhr.upload.onprogress fired all the way. Now try the same thing with fetch.', 'dim')
        resolve()
      }
      xhr.onerror = () => reject(new Error('upload failed'))
      xhr.send(blob)
    })
  },

  async uploadFetch() {
    clearLog('fetch')
    setBar('f-bar', 0)
    const blob = makeBlob(4_000_000)
    log.fetch(`POST /api/upload — ${bytes(blob.size)} via fetch\n`)
    log.fetch('  …no progress events exist. There is nothing to print here.', 'dim')

    const started = performance.now()
    const res = await fetch('/api/upload', { method: 'POST', body: blob })
    const body = await res.json()
    setBar('f-bar', 1)

    log.fetch(`\n✓ server counted ${body.pretty} in ${((performance.now() - started) / 1000).toFixed(2)}s`, 'ok')
    log.fetch('Same bytes, same time, zero visibility. The bar jumped from 0 to 100.', 'err')
    log.fetch(
      'Streaming a request body (duplex: "half") exists but needs HTTP/2, so it is not\n' +
        'a drop-in fix on a plain http:// origin like this one.',
      'dim',
    )
  },

  slow() {
    clearLog('fetch')
    slowController = new AbortController()
    const started = performance.now()
    log.fetch('GET /api/slow?ms=8000 with an AbortController attached.')
    log.fetch('Press "Abort it" — then watch the terminal, not this log.\n', 'dim')

    fetch('/api/slow?ms=8000', { signal: slowController.signal })
      .then((res) => res.json())
      .then((body) => log.fetch(`✓ completed after ${body.waitedMs}ms — you let it finish`, 'ok'))
      .catch((err) => {
        if (err.name !== 'AbortError') throw err
        log.fetch(`✗ AbortError after ${(performance.now() - started).toFixed(0)}ms`, 'err')
        log.fetch('\nThe promise rejected here, and the browser closed the TCP connection.', 'ok')
        log.fetch('The server printed "client aborted" — it stopped working on your behalf.', 'dim')
      })
  },

  abort() {
    if (!slowController) return log.fetch('Nothing in flight — press "Start a slow request" first.', 'err')
    slowController.abort()
    slowController = null
  },

  async timeout() {
    clearLog('fetch')
    log.fetch('GET /api/slow?ms=8000 with signal: AbortSignal.timeout(1000)\n')
    try {
      await fetch('/api/slow?ms=8000', { signal: AbortSignal.timeout(1000) })
      log.fetch('finished before the timeout — unexpected', 'err')
    } catch (err) {
      log.fetch(`✗ ${err.name}: ${err.message}`, 'err')
      log.fetch('\nSame machinery as the manual controller, one line instead of five.', 'ok')
      log.fetch('AbortSignal.any([a, b]) combines them, which is how you get "timeout OR', 'dim')
      log.fetch('user navigated away" without writing a state machine.', 'dim')
    }
  },
}

function makeBlob(size) {
  return new Blob([new Uint8Array(size).fill(0x61)], { type: 'application/octet-stream' })
}

// ============================================================================
// 2 · WEBSOCKET
// ============================================================================

let socket = null
let myId = null
let expectBinaryEcho = false

const statePill = document.getElementById('ws-state')
function setState(text, cls = '') {
  statePill.textContent = text
  statePill.className = `pill ${cls}`
}

function connect() {
  if (socket && socket.readyState <= WebSocket.OPEN) return socket

  // ws:// on an http:// origin, wss:// on https://. The handshake is an HTTP
  // request; only after the 101 does it stop being HTTP.
  const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`
  socket = new WebSocket(url)
  socket.binaryType = 'arraybuffer'
  setState('connecting…')

  socket.onopen = () => {
    setState('connected', 'ok')
    log.ws(`✓ open — ${url}`, 'ok')
    log.ws('DevTools → Network → WS → click the row → Messages tab shows every frame.', 'dim')
  }

  socket.onmessage = (event) => {
    if (event.data instanceof ArrayBuffer) {
      const view = new Uint8Array(event.data)
      log.ws(`← binary ${view.length} bytes: ${hex(view)}`, 'ok')
      if (expectBinaryEcho) {
        expectBinaryEcho = false
        log.ws('  reversed by the server and sent straight back — no encoding either way.', 'dim')
      }
      return
    }
    onServerMessage(JSON.parse(event.data))
  }

  socket.onclose = (event) => {
    setState(`closed (${event.code})`, 'err')
    log.ws(`✗ closed — code ${event.code}${event.reason ? ` "${event.reason}"` : ''}, clean: ${event.wasClean}`, 'err')
    if (event.code >= 4000) log.ws('Codes from 4000 up are application-defined. 1000 is a normal close.', 'dim')
    socket = null
  }

  socket.onerror = () => log.ws('✗ socket error — is the server running?', 'err')
  return socket
}

function onServerMessage(msg) {
  switch (msg.type) {
    case 'welcome':
      myId = msg.id
      log.ws(`you are ${myId}; ${msg.peers.length} other tab(s) connected: ${msg.peers.join(', ') || '(none)'}`)
      if (msg.peers.length === 0) log.ws('Open this page in a second tab to unlock broadcast and panel 3.', 'dim')
      return

    case 'peer-joined':
      return log.ws(`→ another tab connected (${msg.id})`, 'dim')
    case 'peer-left':
      return log.ws(`→ a tab disconnected (${msg.id})`, 'dim')

    case 'echo':
      return log.ws(`← echo "${msg.text}"  (server stamped ${msg.at.slice(11, 23)})`, 'ok')

    case 'broadcast':
      return log.ws(`← from tab ${msg.from}: "${msg.text}"`, 'ok')
    case 'broadcast-sent':
      return log.ws(
        msg.to > 0
          ? `→ relayed to ${msg.to} other tab(s). Look at the other window.`
          : '→ nobody else is connected. Open a second tab.',
        msg.to > 0 ? 'ok' : 'err',
      )

    case 'tick':
      return log.ws(`← tick ${msg.n} — you did not ask for this one`, 'ok')
    case 'ticker':
      return log.ws(msg.running ? 'ticker started; messages now arrive unprompted' : 'ticker stopped')

    case 'pong-seen':
      log.ws(`← the server saw your pong, ${msg.rttMs}ms round trip`, 'ok')
      return log.ws('No JavaScript ran for that pong. The browser answered it for you.', 'dim')

    case 'sink-report':
      return log.ws(`server received ${msg.pretty} in total from the flood`, 'ok')

    case 'signal':
      return rtc.onSignal(msg)
    case 'signal-relayed':
      return

    case 'peers':
      return log.ws(`peers: ${msg.peers.join(', ') || '(none)'}`)

    case 'error':
      return log.ws(`✗ server: ${msg.error}`, 'err')

    default:
      return log.ws(`← ${JSON.stringify(msg)}`)
  }
}

const hex = (view) =>
  [...view.slice(0, 16)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ') + (view.length > 16 ? ' …' : '')

function sendJson(value) {
  if (socket?.readyState !== WebSocket.OPEN) {
    log.ws('✗ not connected — press Connect.', 'err')
    return false
  }
  socket.send(JSON.stringify(value))
  return true
}

const ws = {
  connect() {
    clearLog('ws')
    connect()
  },

  echo() {
    const input = document.getElementById('ws-text')
    const text = input.value.trim() || `hello at ${clock()}`
    if (sendJson({ type: 'echo', text })) log.ws(`→ echo "${text}"`)
    input.value = ''
  },

  broadcast() {
    const input = document.getElementById('ws-text')
    const text = input.value.trim() || `hello from tab ${myId}`
    if (sendJson({ type: 'broadcast', text })) log.ws(`→ broadcast "${text}"`)
    input.value = ''
  },

  // Frames carry bytes, not text. There is no JSON layer unless you add one.
  binary() {
    if (socket?.readyState !== WebSocket.OPEN) return log.ws('✗ not connected.', 'err')
    const payload = new Uint8Array(16).map((_, i) => i + 1)
    expectBinaryEcho = true
    socket.send(payload)
    log.ws(`→ binary ${payload.length} bytes: ${hex(payload)}`)
  },

  tickerStart() {
    if (sendJson({ type: 'ticker-start' })) log.ws('→ asked the server to start pushing')
  },
  tickerStop() {
    sendJson({ type: 'ticker-stop' })
  },

  ping() {
    if (sendJson({ type: 'ping' })) {
      log.ws('→ asked the server to send a protocol-level ping frame')
      log.ws('Watch the Messages tab: the ping and pong do not appear as messages.', 'dim')
    }
  },

  // send() queues without limit and without complaint. bufferedAmount is the
  // only signal that you are producing faster than the socket can drain.
  async flood() {
    if (socket?.readyState !== WebSocket.OPEN) return log.ws('✗ not connected.', 'err')
    const chunk = 'sink:' + 'x'.repeat(256 * 1024)
    const rounds = 40

    for (let i = 0; i < rounds; i++) socket.send(chunk)
    log.ws(`→ queued ${rounds} × 256 KB in a tight loop; send() returned instantly every time`)
    log.ws(`   bufferedAmount right after the loop: ${bytes(socket.bufferedAmount)}`, 'err')

    const started = performance.now()
    while (socket?.bufferedAmount > 0) {
      await new Promise((resolve) => setTimeout(resolve, 150))
      log.ws(`   draining… ${bytes(socket.bufferedAmount)}`, 'dim')
    }

    log.ws(`✓ drained after ${((performance.now() - started) / 1000).toFixed(2)}s`, 'ok')
    log.ws('Nothing threw and nothing was dropped — it sat in memory until it fit.', 'dim')
    sendJson({ type: 'sink-report' })
  },

  bye() {
    if (sendJson({ type: 'bye' })) log.ws('→ asked the server to close with a custom code')
  },

  disconnect() {
    if (!socket) return log.ws('already closed', 'dim')
    socket.close(1000, 'closed from the page')
    log.ws('→ close(1000). If a WebRTC call is up, it keeps working — try panel 3.', 'dim')
  },
}

// ============================================================================
// 3 · WEBRTC DATA CHANNEL
// ============================================================================

let pc = null
let channel = null
let pendingCandidates = []
let incoming = null // in-flight bulk transfer

const STUN = [{ urls: 'stun:stun.l.google.com:19302' }]

function iceConfig() {
  const useStun = document.getElementById('rtc-stun').checked
  return { iceServers: useStun ? STUN : [] }
}

function createPeer() {
  const config = iceConfig()
  log.rtc(`new RTCPeerConnection({ iceServers: ${config.iceServers.length ? '[stun:…]' : '[]'} })`)
  const peer = new RTCPeerConnection(config)

  // Every address this machine might be reachable at, discovered one at a time
  // and sent to the other side as it is found ("trickle ICE").
  peer.onicecandidate = (event) => {
    if (!event.candidate) return log.rtc('   ICE gathering complete', 'dim')
    const { type, protocol, address } = event.candidate
    log.rtc(`   candidate ${type}/${protocol} ${address ?? ''}`, 'dim')
    sendJson({ type: 'signal', payload: { candidate: event.candidate } })
  }

  peer.onconnectionstatechange = () => {
    const state = peer.connectionState
    log.rtc(`connection state: ${state}`, state === 'connected' ? 'ok' : state === 'failed' ? 'err' : '')
    if (state === 'connected') {
      log.rtc('\n✓ The two tabs are now talking directly. The server is out of the path.', 'ok')
      log.rtc('Send a message and check the Network tab: there is no request to see.', 'dim')
    }
  }

  return peer
}

function attachChannel(dc) {
  channel = dc
  channel.binaryType = 'arraybuffer'

  channel.onopen = () => log.rtc(`data channel "${dc.label}" open — readyState ${dc.readyState}`, 'ok')
  channel.onclose = () => log.rtc('data channel closed', 'err')
  channel.onmessage = (event) => {
    if (typeof event.data === 'string') return onChannelControl(JSON.parse(event.data))

    // Bulk chunks: count them, never keep them.
    incoming.received += event.data.byteLength
    setBar('rtc-bar', incoming.received / incoming.total)
  }
}

function onChannelControl(msg) {
  if (msg.t === 'msg') return log.rtc(`← peer: "${msg.text}"`, 'ok')

  if (msg.t === 'blob-start') {
    incoming = { total: msg.bytes, received: 0, started: performance.now() }
    setBar('rtc-bar', 0)
    return log.rtc(`← incoming ${bytes(msg.bytes)} over the data channel…`)
  }

  if (msg.t === 'blob-end') {
    const seconds = (performance.now() - incoming.started) / 1000
    log.rtc(`← received ${bytes(incoming.received)} in ${seconds.toFixed(2)}s (${bytes(incoming.received / seconds)}/s)`, 'ok')
    log.rtc('Not one of those bytes went through Node. Check the terminal — silent.', 'dim')
    incoming = null
  }
}

const rtc = {
  // The caller creates the channel *before* making the offer, because the
  // channel's existence is part of what the offer describes.
  async start() {
    clearLog('rtc')
    if (socket?.readyState !== WebSocket.OPEN) {
      return log.rtc('✗ the signalling socket is closed — press Connect in panel 2 first.', 'err')
    }

    pc = createPeer()
    attachChannel(pc.createDataChannel('demo', { ordered: true }))

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    log.rtc(`\n→ offer (${offer.sdp.split('\n').length} lines of SDP) sent over the WebSocket`)
    log.rtc('That is the only thing the server is needed for.', 'dim')
    sendJson({ type: 'signal', payload: { sdp: pc.localDescription } })
  },

  async onSignal(msg) {
    const { sdp, candidate } = msg.payload

    if (sdp?.type === 'offer') {
      clearLog('rtc')
      log.rtc(`← offer from tab ${msg.from} — answering automatically`)
      pc = createPeer()
      // The callee does not create a channel; it is handed the caller's.
      pc.ondatachannel = (event) => {
        log.rtc(`← data channel "${event.channel.label}" arrived with the offer`)
        attachChannel(event.channel)
      }

      await pc.setRemoteDescription(sdp)
      await flushCandidates()
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      log.rtc('→ answer sent back through the server')
      return sendJson({ type: 'signal', payload: { sdp: pc.localDescription } })
    }

    if (sdp?.type === 'answer') {
      log.rtc(`← answer from tab ${msg.from}`)
      await pc.setRemoteDescription(sdp)
      return flushCandidates()
    }

    if (candidate) {
      // Candidates routinely arrive before the description they belong to, so
      // they have to be parked rather than dropped.
      if (!pc?.remoteDescription) return pendingCandidates.push(candidate)
      await pc.addIceCandidate(candidate).catch((err) => log.rtc(`candidate rejected: ${err.message}`, 'dim'))
    }
  },

  send() {
    const input = document.getElementById('rtc-text')
    if (channel?.readyState !== 'open') return log.rtc('✗ no open data channel — press "Start the connection".', 'err')
    const text = input.value.trim() || `hello from tab ${myId}`
    channel.send(JSON.stringify({ t: 'msg', text }))
    log.rtc(`→ peer: "${text}"  (no request, no server, no Network row)`)
    input.value = ''
  },

  async bulk() {
    if (channel?.readyState !== 'open') return log.rtc('✗ no open data channel.', 'err')

    const CHUNK = 16 * 1024 // comfortably under the SCTP message size limit
    const TOTAL = 8 * 1024 * 1024
    const HIGH_WATER = 4 * 1024 * 1024
    const block = new Uint8Array(CHUNK).fill(0x61)

    channel.bufferedAmountLowThreshold = 1024 * 1024
    channel.send(JSON.stringify({ t: 'blob-start', bytes: TOTAL }))
    log.rtc(`→ sending ${bytes(TOTAL)} in ${CHUNK / 1024} KB chunks…`)

    const started = performance.now()
    for (let sent = 0; sent < TOTAL; sent += CHUNK) {
      // Same lesson as bufferedAmount on a WebSocket, with an event to wait on.
      if (channel.bufferedAmount > HIGH_WATER) {
        await new Promise((resolve) => channel.addEventListener('bufferedamountlow', resolve, { once: true }))
      }
      channel.send(block)
      setBar('rtc-bar', sent / TOTAL)
    }
    channel.send(JSON.stringify({ t: 'blob-end' }))

    const seconds = (performance.now() - started) / 1000
    setBar('rtc-bar', 1)
    log.rtc(`✓ pushed ${bytes(TOTAL)} in ${seconds.toFixed(2)}s (${bytes(TOTAL / seconds)}/s)`, 'ok')
    log.rtc('Read the other tab for the receiving side.', 'dim')
  },

  // Which of all the candidate pairs actually won.
  async stats() {
    if (!pc) return log.rtc('✗ no connection yet.', 'err')
    const stats = await pc.getStats()

    let pair = null
    for (const report of stats.values()) {
      if (report.type === 'candidate-pair' && (report.nominated || report.state === 'succeeded')) pair = report
    }
    if (!pair) return log.rtc('no succeeded candidate pair (yet)', 'err')

    const local = stats.get(pair.localCandidateId)
    const remote = stats.get(pair.remoteCandidateId)
    log.rtc(`\nchosen route:`)
    log.rtc(`  local   ${local?.candidateType}  ${local?.address}:${local?.port}/${local?.protocol}`)
    log.rtc(`  remote  ${remote?.candidateType}  ${remote?.address}:${remote?.port}/${remote?.protocol}`)
    log.rtc(`  sent ${bytes(pair.bytesSent ?? 0)} · received ${bytes(pair.bytesReceived ?? 0)}`)
    log.rtc(
      '\nhost = an address this machine owns · srflx = your public IP, learned from a\n' +
        'STUN server · relay = a TURN server forwarding for you, when nothing else works.',
      'dim',
    )
  },

  hangup() {
    channel?.close()
    pc?.close()
    channel = null
    pc = null
    pendingCandidates = []
    log.rtc('hung up. Press "Start the connection" to negotiate again.', 'dim')
  },
}

async function flushCandidates() {
  for (const candidate of pendingCandidates) await pc.addIceCandidate(candidate).catch(() => {})
  if (pendingCandidates.length) log.rtc(`   applied ${pendingCandidates.length} early candidate(s)`, 'dim')
  pendingCandidates = []
}

// ============================================================================
// wiring
// ============================================================================

const actions = {
  'f-hello': http.hello,
  'f-headers': http.headers,
  'f-stream': http.stream,
  'f-buffered': http.buffered,
  'f-download': http.download,
  'f-upload-xhr': http.uploadXhr,
  'f-upload-fetch': http.uploadFetch,
  'f-slow': http.slow,
  'f-abort': http.abort,
  'f-timeout': http.timeout,

  'ws-connect': ws.connect,
  'ws-echo': ws.echo,
  'ws-broadcast': ws.broadcast,
  'ws-binary': ws.binary,
  'ws-ticker-start': ws.tickerStart,
  'ws-ticker-stop': ws.tickerStop,
  'ws-ping': ws.ping,
  'ws-flood': ws.flood,
  'ws-bye': ws.bye,
  'ws-disconnect': ws.disconnect,

  'rtc-start': rtc.start,
  'rtc-send': rtc.send,
  'rtc-bulk': rtc.bulk,
  'rtc-stats': rtc.stats,
  'rtc-hangup': rtc.hangup,
}

document.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-act]')
  if (!button) return
  const action = actions[button.dataset.act]
  if (!action) return
  try {
    await action()
  } catch (err) {
    console.error(err)
    logTo(button.closest('.panel').id, `✗ ${err.name}: ${err.message}`, 'err')
  }
})

// Enter submits in either text field.
for (const [id, act] of [
  ['ws-text', 'ws-echo'],
  ['rtc-text', 'rtc-send'],
]) {
  document.getElementById(id).addEventListener('keydown', (event) => {
    if (event.key === 'Enter') document.querySelector(`button[data-act="${act}"]`).click()
  })
}

// The socket is opened on load because panel 3 needs it for signalling before
// anything in panel 2 has been touched.
connect()
