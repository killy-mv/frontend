# Everything about the Browser

## What is a browser

- A browser is the client application that fetches web resources and turns them into an interactive page. Given a URL, it resolves the domain name to an IP address, opens a connection to the hosting server, and issues HTTP requests for the document and everything it references. What comes back is just text and bytes, so the browser's real work is the rendering pipeline: it parses HTML into the DOM, parses CSS into the CSSOM, combines them into a render tree, calculates the geometry of every element in a layout pass, paints the result into layers, and composites those layers onto the screen. Alongside this sits a JavaScript engine — V8 in Chrome, SpiderMonkey in Firefox, JavaScriptCore in Safari — which executes scripts that can mutate the DOM and trigger further layout and paint work. Modern browsers are built as multi-process applications, isolating each tab in its own sandboxed renderer process so that a crash or a malicious page cannot reach the rest of the system, and they enforce security boundaries such as the same-origin policy on top of that. Because most browsers now share only a handful of engines (Blink, Gecko, WebKit), the practical concern for frontend work is less about rendering differences than about feature support and the developer tooling each one ships.

## What a browser can do

The useful reframe is that a browser is an operating system that happens to render documents. Rendering a page is only the part it was originally built for; what it exposes to the code running inside that page is close to what a native application gets from the OS underneath it. The interesting question is not how the rendering works but what is in the capability surface, what is deliberately left out, and what it costs to unlock.

### Store things

> **Runnable demo → [`browser-storage/`](./browser-storage/README.md)** — one page, four panels, a
> button for every action, and step-by-step instructions for watching each write land in DevTools.
> `npm start`, no dependencies.

The browser gives a site several storage systems with different shapes rather than one general one. Cookies are small, are attached to outgoing requests automatically, and exist mainly so the server can recognise a returning client. `localStorage` holds roughly 5MB of strings and is synchronous, which makes it convenient and easy to misuse — a large read blocks the main thread. IndexedDB is the real database: asynchronous, transactional, holds structured objects and hundreds of megabytes. The Cache API stores whole HTTP responses keyed by request, which is what makes offline work possible. And the Origin Private File System (OPFS) gives a site an actual private filesystem with file handles and streaming writes. In practice you can ship a database inside a tab.

### Talk to the network beyond request/response

> **Runnable demo → [`browser-networking/`](./browser-networking/README.md)** — one page, three
> panels, and a WebSocket implemented by hand so the upgrade handshake is visible. The payoff is
> panel 3: kill the server and the two tabs keep talking. `npm start`, no dependencies.

`fetch` is the ordinary case: the page asks, the server answers. Beyond it, WebSocket opens a persistent duplex channel so either side can send at any time; Server-Sent Events is the cheaper one-way version, a server-to-client stream over plain HTTP; WebTransport is the newer alternative built on HTTP/3. The genuinely surprising one is WebRTC, which establishes a peer-to-peer connection directly between two browsers — after a signalling handshake, the audio, video or data flows between the two clients with no server in the path at all.

### Draw and compute at native-ish speed

Canvas gives a 2D drawing surface, WebGL exposes the GPU for 3D, and WebGPU goes further by exposing compute shaders, which means machine-learning inference can run on the user's own GPU from a web page. WebAssembly runs compiled C, Rust or Go at close to native speed, so existing native codebases can be ported rather than rewritten. Web Workers provide real background threads, and `SharedArrayBuffer` lets them share memory. Figma, Photoshop on the web and Google Earth are browser applications because of this group of capabilities, not in spite of it. Alongside them sit the media APIs — Web Audio for synthesis and processing, WebCodecs for direct access to encoders and decoders, and Encrypted Media Extensions for DRM-protected playback.

### Reach hardware

Camera and microphone through `getUserMedia`, screen capture, geolocation, gamepads, device orientation and vibration are broadly available. Chromium goes considerably further with Web Bluetooth, WebUSB, Web Serial, WebHID and Web NFC, to the point where flashing firmware onto a microcontroller from a web page is a normal thing to do.

### Behave like an installed app

A Service Worker is a script that sits between the page and the network and intercepts the site's own requests, so a site can serve itself from the cache and work with no connection at all. Add push notifications, background sync, an install prompt so the site gets its own window and icon, file handler associations, the File System Access API for reading and writing real user files, clipboard access, Web Share, app badging, screen wake lock, Picture-in-Picture and fullscreen, and the distinction between "a site" and "an app" mostly stops meaning anything.

### Prove who the user is

WebAuthn and passkeys give hardware-backed public-key authentication, with the browser mediating between the site and a security key or the platform's TPM, so no shared secret is ever sent. The Credential Management API handles storing and retrieving those credentials, Payment Request standardises checkout, and WebCrypto exposes real cryptographic primitives for anything built by hand.

### The rule behind all of it

Powerful capabilities are gated by three things: a secure context (HTTPS), a user gesture, and an explicit permission prompt. The browser's whole design stance is that a page is untrusted code from a stranger, so every capability has to be earned rather than assumed. This is why the permission UX, not the API itself, is usually what decides whether an idea is viable — an API that requires a scary prompt on first load will be refused by most users regardless of how well it works.

The other thing worth carrying around is the fault line between engines. Chromium ships the hardware APIs; Safari and Firefox deliberately decline most of them, treating them as fingerprinting and privacy risks rather than missing features. So "the browser can do X" frequently means "Chrome can do X", and checking that assumption is part of the work.
