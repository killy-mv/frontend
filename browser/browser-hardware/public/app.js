// Every action is deliberately written the long way, with no helper library, so
// the actual browser API being exercised is visible in the source.

// --- tiny logging helper ----------------------------------------------------

// Panels are addressed by their section id, so the error handler at the bottom
// can pass `section.id` straight through.
const logEl = (panel) => document.getElementById(`log-${panel}`)

function logTo(panel, text, cls = '') {
  const el = logEl(panel)
  const line = document.createElement('span')
  if (cls) line.className = cls
  line.textContent = text + '\n'
  el.appendChild(line)
  el.scrollTop = el.scrollHeight
}

const log = {
  gate: (t, c) => logTo('gate', t, c),
  camera: (t, c) => logTo('camera', t, c),
  screen: (t, c) => logTo('screen', t, c),
  sensors: (t, c) => logTo('sensors', t, c),
  devices: (t, c) => logTo('devices', t, c),
}

function clearLog(panel) {
  logEl(panel).textContent = ''
}

const yes = (value) => (value ? '✓' : '✗')

// The names are the same across every one of these APIs, and each one means
// something specific enough to act on.
function explain(err) {
  switch (err.name) {
    case 'NotFoundError':
      return 'You cancelled, or nothing matched the filters. The page cannot tell those two apart — by design.'
    case 'NotAllowedError':
      return 'Denied: either you refused, or a Permissions-Policy blocked it before you were ever asked.'
    case 'SecurityError':
      return 'Blocked by the context — not a secure origin, or no user gesture was in progress.'
    case 'InvalidAccessError':
      return 'This call needs transient activation: a click that the browser is still handling.'
    case 'NotReadableError':
      return 'The device exists but the OS or another application is holding it.'
    case 'OverconstrainedError':
      return `No device satisfies the "${err.constraint}" constraint. Only exact: constraints fail like this.`
    case 'AbortError':
      return 'The device was selected but could not be opened.'
    default:
      return null
  }
}

function report(panel, err) {
  logTo(panel, `✗ ${err.name}: ${err.message}`, 'err')
  const hint = explain(err)
  if (hint) logTo(panel, `  ${hint}`, 'dim')
}

const missing = (panel, path, where) => {
  logTo(panel, `✗ this browser has no ${path}`, 'err')
  logTo(panel, `  ${where}`, 'dim')
  return false
}

// --- the strip at the top ---------------------------------------------------

const ua = navigator.userAgent
const engine = /Firefox\//.test(ua)
  ? 'Gecko (Firefox)'
  : /Edg\//.test(ua)
    ? 'Blink (Edge)'
    : /Chrome\/|Chromium\//.test(ua)
      ? 'Blink (Chrome)'
      : /Safari\//.test(ua)
        ? 'WebKit (Safari)'
        : 'unknown'

const securePill = document.getElementById('secure-pill')
securePill.textContent = window.isSecureContext ? 'yes' : 'NO — nothing below will work'
securePill.className = `pill ${window.isSecureContext ? 'ok' : 'err'}`
document.getElementById('engine-pill').textContent = engine

// ============================================================================
// 1 · THE THREE GATES
// ============================================================================

// Detection is `in`, never a user-agent string. The comment on the right is the
// part you cannot detect: whether the omission is a plan or an accident.
const CAPABILITIES = [
  ['Camera / microphone', () => !!navigator.mediaDevices?.getUserMedia, 'every engine'],
  ['Screen capture', () => !!navigator.mediaDevices?.getDisplayMedia, 'every engine, desktop'],
  ['Geolocation', () => 'geolocation' in navigator, 'every engine'],
  ['Device orientation', () => 'DeviceOrientationEvent' in window, 'every engine, if sensors exist'],
  ['Device motion', () => 'DeviceMotionEvent' in window, 'every engine, if sensors exist'],
  ['Gamepad', () => 'getGamepads' in navigator, 'every engine'],
  ['Screen Wake Lock', () => 'wakeLock' in navigator, 'every engine'],
  ['Vibration', () => 'vibrate' in navigator, 'Chromium and Gecko, phones only'],
  ['Battery Status', () => 'getBattery' in navigator, 'Chromium only — removed elsewhere as a fingerprint'],
  ['Web Bluetooth', () => 'bluetooth' in navigator, 'Chromium only'],
  ['WebUSB', () => 'usb' in navigator, 'Chromium only'],
  ['Web Serial', () => 'serial' in navigator, 'Chromium, desktop only'],
  ['WebHID', () => 'hid' in navigator, 'Chromium only'],
  ['Web NFC', () => 'NDEFReader' in window, 'Chrome on Android only'],
  ['Idle detection', () => 'IdleDetector' in window, 'Chromium only'],
  ['Ambient light', () => 'AmbientLightSensor' in window, 'Chromium, behind a flag'],
]

// Not every browser answers for every name, and asking never prompts.
const PERMISSION_NAMES = [
  'camera',
  'microphone',
  'geolocation',
  'notifications',
  'accelerometer',
  'gyroscope',
  'persistent-storage',
]

const gate = {
  support() {
    clearLog('gate')
    log.gate(`${engine} · secure context: ${window.isSecureContext}\n`)

    let have = 0
    for (const [name, check, where] of CAPABILITIES) {
      const present = check()
      if (present) have++
      log.gate(`  ${yes(present)} ${name.padEnd(21)} ${where}`, present ? 'ok' : 'dim')
    }

    log.gate(`\n${have} of ${CAPABILITIES.length} present here.`)
    log.gate('Open this page in another browser and compare. The split is not random:', 'dim')
    log.gate('the bottom half reaches physical devices, and Gecko and WebKit have', 'dim')
    log.gate('declined that tier on fingerprinting and safety grounds. Declined, not', 'dim')
    log.gate('unimplemented — there are standards positions saying so explicitly.', 'dim')
  },

  // The Permissions API reads state without asking for anything, which is what
  // makes it safe to call on page load. `prompt` means "you may ask".
  async permissions() {
    clearLog('gate')
    if (!navigator.permissions) return log.gate('✗ no navigator.permissions in this browser', 'err')

    for (const name of PERMISSION_NAMES) {
      try {
        const status = await navigator.permissions.query({ name })
        const cls = status.state === 'granted' ? 'ok' : status.state === 'denied' ? 'err' : ''
        log.gate(`  ${name.padEnd(20)} ${status.state}`, cls)
      } catch {
        log.gate(`  ${name.padEnd(20)} not queryable in this browser`, 'dim')
      }
    }

    log.gate('\nNo prompt appeared. Reading the state is free; changing it is not.', 'ok')
    log.gate('"prompt" means you are allowed to ask. "denied" can mean the user said no,', 'dim')
    log.gate('or that a Permissions-Policy took the capability away entirely.', 'dim')
  },

  // Called straight from the click handler: transient activation is still live.
  async gestureOk() {
    clearLog('gate')
    log.gate('getDisplayMedia() called while your click is still being handled…')
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const [track] = stream.getVideoTracks()
      log.gate(`✓ picker shown, you chose a ${track.getSettings().displaySurface ?? 'surface'}`, 'ok')
      for (const t of stream.getTracks()) t.stop()
      log.gate('  (stopped again immediately — panel 3 is where this actually gets used)', 'dim')
    } catch (err) {
      report('gate', err)
    }
  },

  // Same call, one second later. The activation has expired, so the browser
  // refuses before any UI is shown.
  gestureBad() {
    clearLog('gate')
    log.gate('Scheduling the identical call for 1 second from now…')
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        for (const t of stream.getTracks()) t.stop()
        log.gate('✓ it worked — this browser is more permissive than Chromium here', 'ok')
      } catch (err) {
        report('gate', err)
        log.gate('\nNothing was shown to you. The gesture is not a formality: a capability', 'ok')
        log.gate('has to be traceable to something the user just did, or a page could open', 'dim')
        log.gate('the picker on load and hope for a stray click.', 'dim')
      }
    }, 1000)
  },

  // Three frames, one file, three different verdicts.
  frames() {
    clearLog('gate')
    const container = document.getElementById('frames')
    container.hidden = false

    for (const frame of container.querySelectorAll('iframe')) {
      // A different port is a different origin, which is all it takes.
      const origin = frame.dataset.cross ? `${location.protocol}//${location.hostname}:5183` : ''
      frame.src = origin + frame.dataset.src
    }

    log.gate('Loaded /sandbox/ three times — same bytes from the same server.')
    log.gate('Press "Try the camera" in each frame and read the three answers.\n')
    log.gate('  1. same origin, no allow=      → inherits, because the default allowlist is `self`')
    log.gate('  2. other origin, no allow=     → denied, silently, with no prompt')
    log.gate('  3. other origin, allow="camera" → the parent handed its permission down')
    log.gate('\nCase 2 is the one that matters: a third-party embed gets nothing unless the', 'ok')
    log.gate('page that embedded it says so. Delegation is opt-in, one feature at a time.', 'dim')
    log.gate('\nThen open /locked/ — the same file served with a Permissions-Policy header.', 'dim')
  },
}

// ============================================================================
// 2 · CAMERA AND MICROPHONE
// ============================================================================

let camStream = null
let micStream = null
let audioContext = null
let meterFrame = 0
let facingMode = 'user'

const video = document.getElementById('cam-video')

function summarise(track) {
  const s = track.getSettings()
  const parts = [
    s.width && s.height ? `${s.width}×${s.height}` : null,
    s.frameRate ? `${Math.round(s.frameRate)}fps` : null,
    s.sampleRate ? `${s.sampleRate}Hz` : null,
    s.facingMode,
    s.deviceId ? `id ${s.deviceId.slice(0, 8)}…` : null,
  ].filter(Boolean)
  return `${track.kind} "${track.label || '(unnamed)'}" — ${parts.join(', ')}`
}

const media = {
  // Run this before granting anything: the count is real, the names are not.
  async list() {
    clearLog('camera')
    if (!navigator.mediaDevices?.enumerateDevices) return missing('camera', 'navigator.mediaDevices', 'needs a secure context')

    const devices = await navigator.mediaDevices.enumerateDevices()
    const named = devices.filter((d) => d.label).length

    for (const kind of ['videoinput', 'audioinput', 'audiooutput']) {
      const group = devices.filter((d) => d.kind === kind)
      log.camera(`${kind} — ${group.length}`)
      for (const device of group) {
        log.camera(`   ${(device.label || '(blank)').padEnd(34)} id ${device.deviceId.slice(0, 12) || '(blank)'}…`, device.label ? '' : 'dim')
      }
    }

    log.camera(
      named === 0
        ? '\nEvery label is blank. You are told a camera exists, not which one it is —\na device list is a fingerprint, so it costs a permission.'
        : `\n${named} of ${devices.length} devices are named now. That is what the prompt bought.`,
      named === 0 ? 'dim' : 'ok',
    )
  },

  async camera() {
    clearLog('camera')
    if (camStream) for (const t of camStream.getTracks()) t.stop()

    log.camera(`getUserMedia({ video: { facingMode: "${facingMode}" } })`)
    camStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1280 } },
      audio: false,
    })
    video.srcObject = camStream

    for (const track of camStream.getVideoTracks()) log.camera(`✓ ${summarise(track)}`, 'ok')
    log.camera('\nThe label is filled in now, and so is every label in "List devices".', 'dim')
    log.camera('Note the indicator light on your machine. Only track.stop() puts it out.', 'dim')
  },

  async mic() {
    clearLog('camera')
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    for (const track of micStream.getAudioTracks()) log.camera(`✓ ${summarise(track)}`, 'ok')

    // A meter, so "the microphone is live" is something you can watch rather
    // than something the log claims.
    audioContext ??= new AudioContext()
    await audioContext.resume()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 1024
    audioContext.createMediaStreamSource(micStream).connect(analyser)

    const samples = new Uint8Array(analyser.fftSize)
    const bar = document.getElementById('mic-meter').firstElementChild
    const tick = () => {
      analyser.getByteTimeDomainData(samples)
      let sum = 0
      for (const sample of samples) sum += (sample - 128) ** 2
      const rms = Math.sqrt(sum / samples.length) / 128
      bar.style.width = `${Math.min(100, rms * 300).toFixed(1)}%`
      meterFrame = requestAnimationFrame(tick)
    }
    tick()

    log.camera('\nSpeak — the meter moves. Nothing is recorded or sent anywhere.', 'ok')
  },

  async flip() {
    facingMode = facingMode === 'user' ? 'environment' : 'user'
    await media.camera()
    log.camera(`\nRe-requested with facingMode: "${facingMode}". On a laptop there is only`, 'dim')
    log.camera('one camera, so you get the same one back and no error is raised.', 'dim')
  },

  // getSettings() is what you were given. getCapabilities() is what the hardware
  // could do. The gap between them is where constraint bugs live.
  settings() {
    clearLog('camera')
    const tracks = [...(camStream?.getTracks() ?? []), ...(micStream?.getTracks() ?? [])]
    if (tracks.length === 0) return log.camera('Nothing is on. Turn the camera or microphone on first.', 'err')

    for (const track of tracks) {
      log.camera(`${track.kind} — "${track.label}"  [${track.readyState}]`)
      log.camera('  getSettings()     what you actually got:')
      log.camera(`    ${JSON.stringify(track.getSettings(), null, 2).replaceAll('\n', '\n    ')}`, 'dim')

      const caps = track.getCapabilities?.()
      if (caps) {
        const interesting = Object.fromEntries(
          Object.entries(caps).filter(([key]) => !['deviceId', 'groupId'].includes(key)),
        )
        log.camera('  getCapabilities() what the hardware can do:')
        log.camera(`    ${JSON.stringify(interesting, null, 2).replaceAll('\n', '\n    ')}`, 'dim')
        if ('torch' in caps) log.camera('  ↑ this device reports a torch — applyConstraints({ advanced: [{ torch: true }] })', 'ok')
      }
      log.camera('')
    }
  },

  async fourK() {
    clearLog('camera')
    const track = camStream?.getVideoTracks()[0]
    if (!track) return log.camera('Turn the camera on first.', 'err')

    log.camera('applyConstraints({ width: { ideal: 3840 }, height: { ideal: 2160 } })')
    await track.applyConstraints({ width: { ideal: 3840 }, height: { ideal: 2160 } })
    const got = track.getSettings()
    log.camera(`→ you were given ${got.width}×${got.height}`, got.width >= 3840 ? 'ok' : 'err')
    log.camera('No error either way. "ideal" is a preference, and the camera answered', 'dim')
    log.camera('with whatever it had. Silent, and the single most common surprise here.\n', 'dim')

    log.camera('applyConstraints({ width: { exact: 3840 } })')
    try {
      await track.applyConstraints({ width: { exact: 3840 } })
      log.camera('→ accepted; you own a 4K camera', 'ok')
    } catch (err) {
      report('camera', err)
      log.camera('  So: use exact when you mean it, and check getSettings() when you do not.', 'ok')
    }
  },

  stop() {
    clearLog('camera')
    let stopped = 0
    for (const stream of [camStream, micStream]) {
      for (const track of stream?.getTracks() ?? []) {
        track.stop()
        stopped++
      }
    }
    camStream = micStream = null
    video.srcObject = null
    cancelAnimationFrame(meterFrame)
    document.getElementById('mic-meter').firstElementChild.style.width = '0%'

    log.camera(`stopped ${stopped} track(s).`, 'ok')
    log.camera('The indicator light is out. Clearing video.srcObject alone would not have', 'dim')
    log.camera('done it — the track stays live until something calls stop() on it, which is', 'dim')
    log.camera('exactly how sites end up holding a camera open after you leave the page.', 'dim')
  },
}

// ============================================================================
// 3 · THE SCREEN ITSELF
// ============================================================================

let screenStream = null
const screenVideo = document.getElementById('screen-video')

const display = {
  async share() {
    clearLog('screen')
    if (!navigator.mediaDevices?.getDisplayMedia) return missing('screen', 'getDisplayMedia', 'desktop browsers only')

    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
    screenVideo.srcObject = screenStream

    const [track] = screenStream.getVideoTracks()
    log.screen(`✓ ${summarise(track)}`, 'ok')
    if (screenStream.getAudioTracks().length) log.screen('  audio came with it — usually only for a tab', 'dim')

    // The user can revoke this from browser UI at any moment, and the only way
    // the page finds out is afterwards.
    track.addEventListener('ended', () => {
      log.screen('\n← the track ended and no code here asked for that.', 'ok')
      log.screen('You pressed the browser\'s own "Stop sharing". Handling "ended" is not', 'dim')
      log.screen('optional: it is the normal way a share finishes.', 'dim')
      screenVideo.srcObject = null
      screenStream = null
    })

    log.screen('\nThe picker was drawn by the browser, outside this page. A site cannot list', 'dim')
    log.screen('your windows, preselect one, restyle the dialog, or hide the sharing bar.', 'dim')
  },

  info() {
    clearLog('screen')
    const track = screenStream?.getVideoTracks()[0]
    if (!track) return log.screen('Nothing is being shared.', 'err')

    const settings = track.getSettings()
    log.screen(`displaySurface  ${settings.displaySurface ?? '(not reported)'}`)
    log.screen(`size            ${settings.width}×${settings.height} @ ${Math.round(settings.frameRate ?? 0)}fps`)
    log.screen(`cursor          ${settings.cursor ?? '(not reported)'}`)
    log.screen(`label           "${track.label}"`)
    log.screen('\nmonitor / window / browser is about the limit of what you are told.', 'dim')
    log.screen('Not which window, not which app, not what else is open.', 'dim')
  },

  shot() {
    clearLog('screen')
    if (!screenStream) return log.screen('Nothing is being shared.', 'err')

    const canvas = document.createElement('canvas')
    canvas.width = screenVideo.videoWidth
    canvas.height = screenVideo.videoHeight
    canvas.getContext('2d').drawImage(screenVideo, 0, 0)

    const image = new Image()
    image.src = canvas.toDataURL('image/png')
    document.getElementById('screen-shots').prepend(image)

    log.screen(`✓ ${canvas.width}×${canvas.height} frame copied into a canvas`, 'ok')
    log.screen('From here it is ordinary ImageData — readable, editable, uploadable.', 'dim')
    log.screen('Which is why the permission is granted per share and revoked with one click.', 'dim')
  },

  stop() {
    clearLog('screen')
    if (!screenStream) return log.screen('Nothing is being shared.', 'err')
    for (const track of screenStream.getTracks()) track.stop()
    screenStream = null
    screenVideo.srcObject = null
    log.screen('stopped from the page. Next time, use the browser\'s bar instead and watch', 'ok')
    log.screen('the "ended" handler fire — that is the path you have to write code for.', 'dim')
  },
}

// ============================================================================
// 4 · SENSORS AND INPUT
// ============================================================================

let watchId = null
let padFrame = 0
let orientationHandler = null
const readout = document.getElementById('sensor-readout')

const place = (position) => {
  const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords
  return [
    `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    `±${Math.round(accuracy)}m`,
    altitude != null ? `alt ${Math.round(altitude)}m` : null,
    heading != null ? `heading ${Math.round(heading)}°` : null,
    speed ? `${speed.toFixed(1)}m/s` : null,
  ]
    .filter(Boolean)
    .join('  ')
}

const geoError = (err) =>
  `${['', 'PERMISSION_DENIED', 'POSITION_UNAVAILABLE', 'TIMEOUT'][err.code]}: ${err.message}`

const sensors = {
  geo() {
    clearLog('sensors')
    if (!navigator.geolocation) return missing('sensors', 'navigator.geolocation', 'needs a secure context')

    log.sensors('getCurrentPosition({ enableHighAccuracy: true })…')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        log.sensors(`✓ ${place(position)}`, 'ok')
        const accuracy = position.coords.accuracy
        log.sensors(
          accuracy < 50
            ? '\nTens of metres — that is GPS or a very good Wi-Fi fix.'
            : '\nHundreds or thousands of metres — this was inferred from your IP address or\nnearby Wi-Fi networks, not from a satellite. Accuracy is the field that tells\nyou which, and code that ignores it will happily draw a pin on the wrong suburb.',
          'dim',
        )
      },
      (err) => {
        log.sensors(`✗ ${geoError(err)}`, 'err')
        if (err.code === 1) log.sensors('  Denied. Chrome remembers this per origin — reset it from the padlock icon.', 'dim')
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  },

  watch() {
    clearLog('sensors')
    if (watchId !== null) return log.sensors('Already watching.', 'dim')

    log.sensors('watchPosition() — the callback fires again whenever the estimate changes.')
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        readout.textContent = `geolocation  ${place(position)}`
        log.sensors(`  ${new Date().toLocaleTimeString()}  ${place(position)}`)
      },
      (err) => log.sensors(`✗ ${geoError(err)}`, 'err'),
      { enableHighAccuracy: true },
    )
    log.sensors('\nSitting still it may fire once and then never again — it reports changes,', 'dim')
    log.sensors('not a fixed tick. Leaving one of these running is a real battery cost.', 'dim')
  },

  unwatch() {
    if (watchId === null) return log.sensors('Not watching.', 'dim')
    navigator.geolocation.clearWatch(watchId)
    watchId = null
    readout.textContent = 'no live sensor running'
    log.sensors('clearWatch() — the GPS can power down again.', 'ok')
  },

  async orient() {
    clearLog('sensors')
    if (!('DeviceOrientationEvent' in window)) return missing('sensors', 'DeviceOrientationEvent', 'unusual — every engine ships this')

    // iOS 13 added a permission call that only works from a user gesture. It
    // does not exist anywhere else, so it has to be feature-detected.
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      log.sensors('iOS: DeviceOrientationEvent.requestPermission() — asking…')
      const state = await DeviceOrientationEvent.requestPermission()
      log.sensors(`→ ${state}`, state === 'granted' ? 'ok' : 'err')
      if (state !== 'granted') return
    }

    let seen = 0
    orientationHandler = (event) => {
      seen++
      const { alpha, beta, gamma } = event
      readout.textContent =
        alpha == null
          ? 'deviceorientation fired, but every value is null — no sensors on this machine'
          : `orientation  α ${alpha.toFixed(1)}°  β ${beta.toFixed(1)}°  γ ${gamma.toFixed(1)}°`
    }
    window.addEventListener('deviceorientation', orientationHandler)
    log.sensors('listening for "deviceorientation" — tilt the device.')

    setTimeout(() => {
      if (seen === 0) {
        log.sensors('\n…nothing arrived after 2 seconds.', 'err')
        log.sensors('The event exists and the listener is attached; the machine simply has no', 'dim')
        log.sensors('orientation sensor. Feature detection said yes, the hardware says no —', 'dim')
        log.sensors('which is why a timeout is the only honest check for this family of APIs.', 'dim')
      } else {
        log.sensors(`\n✓ ${seen} events in 2 seconds. α is compass heading, β front-to-back tilt,`, 'ok')
        log.sensors('γ side-to-side. Fusing accelerometer and gyroscope, done for you.', 'dim')
      }
    }, 2000)
  },

  unorient() {
    if (!orientationHandler) return log.sensors('Not listening.', 'dim')
    window.removeEventListener('deviceorientation', orientationHandler)
    orientationHandler = null
    readout.textContent = 'no live sensor running'
    log.sensors('stopped listening.', 'ok')
  },

  // The Gamepad API has no button events at all: you poll it, every frame.
  pads() {
    clearLog('sensors')
    if (!navigator.getGamepads) return missing('sensors', 'navigator.getGamepads', 'unusual — every engine ships this')

    const found = [...navigator.getGamepads()].filter(Boolean)
    if (found.length === 0) {
      log.sensors('No gamepads visible.', 'err')
      log.sensors('\nIf one is plugged in, press a button on it — the browser hides a controller', 'dim')
      log.sensors('until you interact with it, so that a page cannot silently enumerate your', 'dim')
      log.sensors('peripherals. Same idea as the blank camera labels in panel 2.', 'dim')
      window.addEventListener(
        'gamepadconnected',
        (event) => {
          log.sensors(`\n← gamepadconnected: "${event.gamepad.id}"`, 'ok')
          sensors.pads()
        },
        { once: true },
      )
      return
    }

    for (const pad of found) {
      log.sensors(`✓ [${pad.index}] "${pad.id}"`, 'ok')
      log.sensors(`   ${pad.buttons.length} buttons, ${pad.axes.length} axes, mapping "${pad.mapping}"`, 'dim')
    }

    cancelAnimationFrame(padFrame)
    const poll = () => {
      const pad = [...navigator.getGamepads()].filter(Boolean)[0]
      if (pad) {
        const pressed = pad.buttons.map((b, i) => (b.pressed ? i : null)).filter((i) => i !== null)
        const axes = pad.axes.map((a) => a.toFixed(2)).join(' ')
        readout.textContent = `gamepad  axes [${axes}]  pressed [${pressed.join(' ') || '—'}]`
      }
      padFrame = requestAnimationFrame(poll)
    }
    poll()

    log.sensors('\nPolling in requestAnimationFrame, because there is no "buttondown" event.', 'dim')
    log.sensors('The object you get back is a snapshot; you have to call getGamepads() again', 'dim')
    log.sensors('every frame to see anything change.', 'dim')
  },

  vibrate() {
    clearLog('sensors')
    if (!('vibrate' in navigator)) return missing('sensors', 'navigator.vibrate', 'Chromium and Gecko, phones only')

    const accepted = navigator.vibrate([200, 100, 200, 100, 400])
    log.sensors(`navigator.vibrate([200, 100, 200, 100, 400]) → ${accepted}`)
    log.sensors(
      '\nOn a phone that is buzz-pause-buzz-pause-buzz. On a desktop the call returns\nwithout throwing and nothing happens at all — the API is present and inert.\nDetecting the function tells you nothing about whether there is a motor.',
      'dim',
    )
  },

  async battery() {
    clearLog('sensors')
    if (!navigator.getBattery) {
      missing('sensors', 'navigator.getBattery', 'Chromium only')
      log.sensors('\nThis one is interesting because it was shipped and then withdrawn. Firefox', 'dim')
      log.sensors('and Safari removed it after researchers showed that charge level plus', 'dim')
      log.sensors('discharge time is a short-lived identifier that survives clearing cookies.', 'dim')
      return
    }

    const battery = await navigator.getBattery()
    log.sensors(`level      ${Math.round(battery.level * 100)}%`)
    log.sensors(`charging   ${battery.charging}`)
    log.sensors(`until full ${Number.isFinite(battery.chargingTime) ? `${battery.chargingTime}s` : '—'}`)
    log.sensors(`until flat ${Number.isFinite(battery.dischargingTime) ? `${battery.dischargingTime}s` : '—'}`)
    log.sensors('\nFirefox and Safari removed this API. Charge level plus discharge time is a', 'dim')
    log.sensors('short-lived identifier that survives clearing cookies, which turned out to', 'dim')
    log.sensors('be worth more to trackers than the feature was to anyone else.', 'dim')
  },
}

// ============================================================================
// 5 · DEVICES, DIRECTLY
// ============================================================================

const devices = {
  async usb() {
    clearLog('devices')
    if (!navigator.usb) return missing('devices', 'navigator.usb', 'WebUSB is Chromium only')

    log.devices('navigator.usb.requestDevice({ filters: [] })')
    log.devices('An empty filter list means "show everything you are willing to show".\n', 'dim')
    try {
      const device = await navigator.usb.requestDevice({ filters: [] })
      log.devices(`✓ ${device.manufacturerName ?? '?'} — ${device.productName ?? '?'}`, 'ok')
      log.devices(`   vendorId 0x${device.vendorId.toString(16)}  productId 0x${device.productId.toString(16)}`)
      log.devices(`   serial ${device.serialNumber ?? '(none)'}  USB ${device.usbVersionMajor}.${device.usbVersionMinor}`)
      log.devices('\nOne device, the one you picked. The page never saw the list.', 'ok')
      log.devices('device.open() then transferOut() is how firmware flashing works from here.', 'dim')
    } catch (err) {
      report('devices', err)
    }
  },

  async serial() {
    clearLog('devices')
    if (!navigator.serial) return missing('devices', 'navigator.serial', 'Web Serial is Chromium desktop only')

    log.devices('navigator.serial.requestPort()')
    try {
      const port = await navigator.serial.requestPort()
      const info = port.getInfo()
      log.devices(`✓ port granted — vendorId ${info.usbVendorId ?? '(none)'}, productId ${info.usbProductId ?? '(none)'}`, 'ok')
      log.devices('\nawait port.open({ baudRate: 115200 }) and it is a stream in both directions:', 'dim')
      log.devices('port.readable is a ReadableStream, port.writable a WritableStream. That is', 'dim')
      log.devices('the whole API — an Arduino from a browser tab is about fifteen lines.', 'dim')
    } catch (err) {
      report('devices', err)
    }
  },

  async hid() {
    clearLog('devices')
    if (!navigator.hid) return missing('devices', 'navigator.hid', 'WebHID is Chromium only')

    log.devices('navigator.hid.requestDevice({ filters: [] })')
    try {
      const picked = await navigator.hid.requestDevice({ filters: [] })
      if (picked.length === 0) return log.devices('Nothing chosen.', 'dim')
      for (const device of picked) {
        log.devices(`✓ "${device.productName}"  vendorId 0x${device.vendorId.toString(16)}`, 'ok')
        log.devices(`   ${device.collections.length} collection(s) — the report descriptor, parsed for you`, 'dim')
      }
      log.devices('\nHID is what keyboards, mice, controllers and most weird USB gadgets speak.', 'dim')
      log.devices('Note the browser refuses keyboards and mice here: granting a page raw access', 'dim')
      log.devices('to your keyboard would be a keylogger with a permission prompt.', 'dim')
    } catch (err) {
      report('devices', err)
    }
  },

  async bt() {
    clearLog('devices')
    if (!navigator.bluetooth) return missing('devices', 'navigator.bluetooth', 'Web Bluetooth is Chromium only')

    log.devices('navigator.bluetooth.requestDevice({ acceptAllDevices: true })')
    log.devices('Needs an adapter switched on; on Linux it also needs BlueZ running.\n', 'dim')
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information'],
      })
      log.devices(`✓ "${device.name ?? '(unnamed)'}"  id ${device.id.slice(0, 12)}…`, 'ok')
      log.devices('\ndevice.gatt.connect() then getPrimaryService() from here. Note you had to', 'dim')
      log.devices('name the services you wanted up front: a page cannot browse a device it was', 'dim')
      log.devices('handed, only reach the parts it declared an interest in beforehand.', 'dim')
    } catch (err) {
      report('devices', err)
    }
  },

  async nfc() {
    clearLog('devices')
    if (!('NDEFReader' in window)) return missing('devices', 'NDEFReader', 'Web NFC is Chrome on Android only')

    log.devices('new NDEFReader().scan() — hold a tag against the back of the phone.')
    try {
      const reader = new NDEFReader()
      await reader.scan()
      reader.onreading = (event) => {
        log.devices(`✓ tag ${event.serialNumber}`, 'ok')
        for (const record of event.message.records) {
          log.devices(`   ${record.recordType}  ${new TextDecoder().decode(record.data)}`)
        }
      }
      reader.onreadingerror = () => log.devices('✗ a tag was there but could not be read', 'err')
      log.devices('scanning…', 'dim')
    } catch (err) {
      report('devices', err)
    }
  },

  // Grants persist per origin and per device, which is what stops a tool from
  // re-prompting on every visit.
  async granted() {
    clearLog('devices')
    let total = 0

    if (navigator.usb) {
      const list = await navigator.usb.getDevices()
      total += list.length
      log.devices(`usb.getDevices()      ${list.length}`)
      for (const d of list) log.devices(`   ${d.productName ?? '?'} (${d.manufacturerName ?? '?'})`, 'dim')
    }
    if (navigator.serial) {
      const list = await navigator.serial.getPorts()
      total += list.length
      log.devices(`serial.getPorts()     ${list.length}`)
    }
    if (navigator.hid) {
      const list = await navigator.hid.getDevices()
      total += list.length
      log.devices(`hid.getDevices()      ${list.length}`)
      for (const d of list) log.devices(`   ${d.productName}`, 'dim')
    }
    if (navigator.bluetooth?.getDevices) {
      const list = await navigator.bluetooth.getDevices().catch(() => [])
      total += list.length
      log.devices(`bluetooth.getDevices() ${list.length}`)
    }

    log.devices(
      total === 0
        ? '\nNothing granted yet. These lists start empty and only ever contain what you\nhanded over through a picker.'
        : `\n${total} device(s) still granted. Survives reload; revoke them in Chrome under\nSettings → Privacy and security → Site settings → USB / Serial / HID devices.`,
      total === 0 ? 'dim' : 'ok',
    )
  },
}

// ============================================================================
// wiring
// ============================================================================

const actions = {
  'g-support': gate.support,
  'g-permissions': gate.permissions,
  'g-gesture-ok': gate.gestureOk,
  'g-gesture-bad': gate.gestureBad,
  'g-frames': gate.frames,

  'c-list': media.list,
  'c-camera': media.camera,
  'c-mic': media.mic,
  'c-flip': media.flip,
  'c-settings': media.settings,
  'c-4k': media.fourK,
  'c-stop': media.stop,

  's-share': display.share,
  's-info': display.info,
  's-shot': display.shot,
  's-stop': display.stop,

  'n-geo': sensors.geo,
  'n-watch': sensors.watch,
  'n-unwatch': sensors.unwatch,
  'n-orient': sensors.orient,
  'n-unorient': sensors.unorient,
  'n-pads': sensors.pads,
  'n-vibrate': sensors.vibrate,
  'n-battery': sensors.battery,

  'd-usb': devices.usb,
  'd-serial': devices.serial,
  'd-hid': devices.hid,
  'd-bt': devices.bt,
  'd-nfc': devices.nfc,
  'd-granted': devices.granted,
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
    report(button.closest('.panel').id, err)
  }
})

// The support table is the only thing worth knowing before pressing anything
// else, so it runs on load rather than waiting for a click.
gate.support()
