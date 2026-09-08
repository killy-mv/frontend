# Talk to the network — three ways to move bytes

The companion to the **talk to the network** part of [`../README.md`](../README.md). One page, three
panels, a button for every action. Nothing is mocked — every button drives a real connection, and
the point of the demo is that you go and look at the result in DevTools and in the server's terminal
rather than trust the log output.

```
npm start        # http://localhost:5181
```

No dependencies and no build step. The server is one file of plain Node, and the page is vanilla
HTML and JavaScript on purpose: the browser API being exercised should be the only thing in the
source, with no framework in front of it. Panels 2 and 3 need **two tabs** open on the same URL.

Keep two things visible the whole time: DevTools on the **Network** tab (`F12` → Network), and the
terminal running `npm start`. Half of what this demo shows is only observable from the server side —
an abort, a pong, a connection that goes quiet because the traffic stopped going through Node at
all.

## The three panels

| | Who may speak first | Connection | Server in the data path |
| --- | --- | --- | --- |
| 1 | **fetch** — the page, once | one request, then closed | yes |
| 2 | **WebSocket** — either side, any time | held open | yes |
| 3 | **WebRTC** — either peer | held open, peer-to-peer | **no** |

That table is the whole argument. Each row buys a capability the row above cannot express, and pays
for it with something: a connection you have to keep alive, then a negotiation that can fail for
reasons no server log will explain.

## 1 · fetch — the parts that are easy to never use

Everyone knows `await fetch(url).then(r => r.json())`. The two things worth knowing are hiding
behind that one line.

**A response body is a stream, not a lump.** Press **Read the body as it arrives** and the lines
print one at a time as the server writes them; press **Wait for the whole body** and the same
endpoint prints nothing for three seconds and then everything at once. Same bytes, same request —
`res.text()` just hid the fact that they dripped in. That is fine for JSON and wrong for anything
you want to show progressively.

**A request is cancellable, and cancelling is real.** Press **Start a slow request**, press
**Abort it**, and then stop looking at the browser: the server prints

```
  ✂  client aborted /api/slow after 812ms — the socket really closed
```

An `AbortController` is not "ignore the response when it comes". It tears down the TCP connection,
and the server stops doing work on your behalf. `AbortSignal.timeout(1000)` is the same machinery
in one line, and `AbortSignal.any([a, b])` composes them, which is how you express "time out **or**
the user navigated away" without writing a state machine.

**The asymmetry at the end** is the one that catches people out. **Download 4 MB with progress**
works — but only because the server sent `Content-Length`, and only because the percentage is
counted by hand out of the stream; `fetch` has no progress event. Then press **Upload 4 MB with
progress (XHR)** and **Same upload with fetch** back to back. Only one of them can tell you how far
it got. That single gap is why `XMLHttpRequest` is still being written in 2026. (Streaming a request
body with `duplex: 'half'` exists, but it needs HTTP/2, so it is not a drop-in fix on a plain
`http://` origin like this one.)

## 2 · WebSocket — the server gets to speak

It begins as an ordinary HTTP request with `Upgrade: websocket` and a random `Sec-WebSocket-Key`.
The server proves it understood by SHA-1 hashing that key together with a fixed GUID from the spec
and answering `101 Switching Protocols`. From that instant there is no more HTTP on the socket, just
frames. DevTools → Network → **WS** → click the row: the `Headers` tab has the handshake, and the
`Messages` tab shows every frame live.

`server/index.mjs` implements RFC 6455 by hand rather than importing `ws`, because the handshake and
the frame layout are the only interesting parts and a library hides both. Three details there are
worth reading:

- **TCP delivers a byte stream, not messages.** One frame can arrive split across several `data`
  events and several frames can arrive in one, so bytes are buffered and frames pulled off only once
  complete. That bookkeeping is most of what a WebSocket library does for you.
- **Payload length has three encodings** — 7-bit, 16-bit and 64-bit — which is why the parser looks
  the way it does.
- **Client→server frames are always masked**, and it is not encryption. It exists so a malicious
  page cannot craft bytes that a careless proxy would mistake for a real HTTP request.

The buttons that show something you cannot get from `fetch`:

**Start the ticker**, then stop clicking. Messages keep arriving that this page never asked for.
That is the entire reason the row exists.

**Broadcast to other tabs** needs the second tab. The message goes up to the server and back down
into a different browsing context — no polling anywhere.

**Server ping** sends a protocol-level ping frame. Watch the `Messages` tab: neither the ping nor
the pong appears, and no event fires on the page. The browser answered it on your behalf, exactly
the way it attaches `Cookie:` headers you never wrote. The round-trip time comes back afterwards as
an ordinary message, because that is the only way the page can learn about it.

**Flood 10 MB** queues forty 256 KB messages in a tight loop. Every `send()` returns instantly,
nothing throws, and nothing is dropped — it all sits in memory until the socket can drain it.
`bufferedAmount` is the only warning you get that you are producing faster than the network can
carry, and code that never reads it is code that leaks under a slow connection.

**Ask the server to close** closes with code `4000`. Codes from 4000 up are application-defined and
yours to assign; `1000` is a normal close, and the `wasClean` flag on the event tells you whether a
close frame was exchanged at all or the socket just died.

## 3 · WebRTC — no server in the path

This is the one that is different in kind. It is not a protocol you send messages over, it is a
negotiation: each side describes itself in an **SDP** offer or answer, both sides collect **ICE
candidates** (every address they might be reachable at) and trickle them across as they are found,
and then the pairs are tried until one works.

Open two tabs and press **Start the connection** in one. The other answers by itself, and the two
logs read as a conversation: offer → answer → candidates → `connected`.

Everything the server does here is on one line of `server/index.mjs`: take this blob, hand it to the
other tab. It never looks inside. Which is why the payoff works —

> Establish the connection, then press **Disconnect** in panel 2, or stop the server entirely with
> `Ctrl+C`, and keep sending messages. They still arrive.

Then press **Send 8 MB** and read the throughput. Those bytes never touched Node; the terminal stays
silent and the Network tab has no row to show you, because there is no request. The signalling
server was only ever needed for the introduction.

**Show the chosen route** prints the candidate pair that won, and the vocabulary is worth keeping:

- `host` — an address the machine owns. On one computer, both ends are host candidates.
- `srflx` — *server reflexive*: your public IP, learned by asking a STUN server what address your
  packets appear to come from. Tick **Use a STUN server** and start over to watch these appear.
  This is also why WebRTC is a fingerprinting concern — a page can learn your real IP behind a VPN.
- `relay` — a TURN server forwarding for you, for when the two networks refuse to meet. TURN is the
  expensive fallback, and it is the reason "peer-to-peer means no servers" is only mostly true.

Two implementation details in `public/app.js` that are easy to get wrong and are commented in place:
the caller must create the data channel *before* making the offer, because the channel's existence
is part of what the offer describes; and ICE candidates routinely arrive before the description they
belong to, so they have to be parked and applied later rather than dropped.

## Files

```
server/index.mjs        HTTP endpoints, a hand-written WebSocket, and the signalling relay
public/index.html       the three panels and their instructions
public/app.js           every action, one section per transport
public/styles.css       presentation only, nothing to learn here
```

The HTTP endpoints are all deliberately awkward, because a correct fast server teaches nothing:

| | |
| --- | --- |
| `/api/hello` | the baseline: small, instant, JSON |
| `/api/headers` | echoes back everything the browser added under you |
| `/api/slow?ms=` | answers late, and logs to the terminal when you abort |
| `/api/stream?chunks=&delay=` | chunked, no `Content-Length`, written a line at a time |
| `/api/download?bytes=` | known size, dribbled out slowly so progress is measurable |
| `/api/upload` | reads the body slowly on purpose, so the upload bar crawls |

## What is not here

**Server-Sent Events** is the cheap one-way version of panel 2 — a server-to-client stream over
plain HTTP, with automatic reconnection and `Last-Event-ID` resumption built into `EventSource`. If
you only need server push and not a duplex channel, reach for it before a WebSocket.

**WebTransport** is the same territory rebuilt on HTTP/3, with unreliable and unordered delivery
available when you want it. It needs a real HTTP/3 server and a certificate, which is more setup
than this demo is worth.

## Reset

Nothing here writes to disk. Reload the page to drop every connection, or `Ctrl+C` the server —
except, as panel 3 exists to prove, the one connection that does not care whether the server is
running.
