# Reach hardware — what a page can touch, and what stops it

The companion to the **reach hardware** part of [`../README.md`](../README.md). One page, five
panels, a button for every action. Nothing is mocked — every button calls the real API, and where
there is no hardware the log says so instead of pretending.

```
npm start        # http://localhost:5182
```

No dependencies and no build step. The server is one file of plain Node, and the page is vanilla
HTML and JavaScript on purpose: the browser API being exercised should be the only thing in the
source, with no framework in front of it.

The demo is really about the **gates**, not the APIs. A page can open your camera, read your GPS and
write firmware to a USB device; the reason that is tolerable is a stack of restrictions that is
easier to watch working than to read about. Panel 1 is those restrictions. Panels 2 to 5 are what
lies behind them.

## Why a server at all

Three things cannot be faked from a `file://` page:

1. **A secure context.** Almost every API here requires one. `http://localhost` counts as secure,
   `file://` does not, so `getUserMedia` is simply absent until something serves the page.
2. **`Permissions-Policy` is a response header.** A document cannot restrict itself from
   JavaScript — only the server can send that header, and `/locked/` in panel 1 exists to show what
   happens when it does.
3. **A second origin.** The iframe delegation demo needs a genuinely different origin, which is what
   the extra listener on port **5183** is for: the same files, a different port, and therefore a
   different origin as far as the browser is concerned.

## What you need to see all of it

Every panel degrades honestly, and the log distinguishes *the API is missing* from *the device is
not there* — which are two very different problems that both look like "it didn't work".

| Panel | Works with nothing plugged in | Better with |
| --- | --- | --- |
| 1 · gates | **entirely** | a second browser to compare |
| 2 · camera & mic | no | any webcam |
| 3 · screen | **entirely** (desktop) | — |
| 4 · sensors | partly — geolocation and battery | a phone, a gamepad |
| 5 · devices | **the lesson, yes** — the picker is the point | any USB/serial/HID/BLE device |

Use Chrome or Edge for the full set. Then open it in Firefox and read panel 1 again — that contrast
is half of what the demo is for.

## 1 · The three gates

**A secure context.** Non-negotiable and the reason for the server. The pill at the top of the page
reports it.

**A user gesture.** Press **Ask for the screen (from your click)** and the picker appears. Press
**Ask 1 second after the click** and the identical call fails without showing you anything. The
difference is *transient activation*: the browser only honours the call while it is still handling a
real interaction. Without it, a page could open the picker on load and wait for a stray click to
land on it.

**An explicit permission**, which you can read without triggering. **What am I already allowed?**
queries the Permissions API for seven names and prompts for none of them. `prompt` means "you may
ask"; `granted` and `denied` are settled. `denied` is worth noticing because it has two very
different causes — the user refused, or a policy removed the capability entirely.

**And a Permissions-Policy**, which is the gate most people never meet. Press **Load the three
frames**: the same file, from the same server, three times.

| frame | result |
| --- | --- |
| same origin, no `allow=` | works — the default allowlist is `self`, and same-origin frames inherit |
| **other origin, no `allow=`** | **denied, silently, with no prompt** |
| other origin, `allow="camera"` | works — the parent chose to delegate |

The middle row is the important one, and it is the realistic case: a third-party embed gets nothing
unless the page embedding it says so, one feature at a time. Then open [`/locked/`](http://localhost:5182/locked/) —
the same file yet again, served with

```
Permissions-Policy: camera=(), microphone=(), geolocation=(), …
```

An empty allowlist denies the feature to the document and everything inside it, with no way for
script to opt back in. It is a top-level page you navigated to yourself and it still cannot ask.
That header is how a real site makes sure an XSS bug cannot reach the camera: if the application
never uses it, take it away from the whole document and the question stops arising.

## 2 · Camera and microphone

The capability every engine ships, and the easiest place to watch the privacy design working.

**Press *List devices* before granting anything.** You get the right *number* of entries with empty
`label` fields. The browser tells you a camera exists but not which one, because a list of your
hardware is a fingerprint. Grant access, press it again, and the names appear. That is precisely
what the prompt bought.

**Constraints negotiate; they do not command.** Press **Ask for 4K** and, unless you own a 4K
webcam, you are handed something else and *no error is raised*. `ideal:` is a preference. The same
button then tries `exact: 3840`, which fails loudly with `OverconstrainedError`. Both behaviours are
correct and the silent one is the one that bites — always read `getSettings()` back.

**`getSettings()` against `getCapabilities()`** is the pairing to remember: what you were given,
against what the hardware can do. On a phone the capabilities often include `torch` and `zoom`, and
that is how a web page turns on the flashlight.

**And `track.stop()` is not optional.** Turn the camera on, watch the indicator light on your
machine, then press **Turn everything off** and watch it go out. Clearing `video.srcObject` alone
would not have done it — the track stays live until something stops it, which is exactly how sites
end up holding a camera open after you have moved on.

## 3 · The screen itself

`getDisplayMedia` returns a video track of a monitor, a window or a tab, and every screen-sharing
tool you have used is this plus a WebRTC connection.

What makes it safe is the list of things the page *cannot* do: it cannot enumerate your windows,
cannot preselect one, cannot restyle the picker, and cannot suppress the browser's own "you are
sharing" bar. Afterwards it learns `displaySurface` — `monitor`, `window` or `browser` — and
essentially nothing else.

The step worth doing deliberately: start a share, then end it from **the browser's** stop button
rather than the page's. The log reports that the track fired `ended` and the page found out
afterwards. The user ends a share; the site is merely informed. Code that does not handle `ended` is
code that has not handled the normal case.

**Grab a still** pulls a frame into a canvas, at which point it is ordinary `ImageData` — readable,
editable, uploadable. Which is the reason the permission is per-share and revocable in one click.

## 4 · Sensors and input

Grouped together because their permission models are all different, and the differences are the
lesson.

**Geolocation** prompts, and the field to actually look at is `accuracy`. Tens of metres means GPS.
Hundreds or thousands means the browser inferred a position from your IP address or nearby Wi-Fi.
Code that ignores that number will confidently draw a pin on the wrong suburb. **Watch me move**
uses `watchPosition`, which fires when the estimate *changes* rather than on a timer — sit still and
it may never fire again — and holding one open is a real battery cost.

**Device orientation** needs no permission on Android or desktop, but iOS 13 added
`DeviceOrientationEvent.requestPermission()`, which only works from a user gesture and exists
nowhere else. On a laptop the event exists, the listener attaches, and nothing ever arrives — so the
panel waits two seconds and tells you that feature detection said yes while the hardware said no.
For this family of APIs a timeout is the only honest check.

**Gamepad** is hidden until you press a button on the controller, for the same reason camera labels
are blank. Once visible, note that there are no button events at all: `getGamepads()` returns a
snapshot and you must call it again every frame. The panel polls in `requestAnimationFrame`, which
is the only way this API is ever used.

**Vibration** on a desktop returns without throwing and does nothing. The function is present and
inert, which is a good reminder that detecting a function tells you nothing about whether a motor
exists.

**Battery Status** is the most interesting entry, because it is a capability that shipped and was
then taken back. It still works in Chromium; Firefox and Safari removed it after researchers showed
that charge level plus discharge time is a short-lived identifier that survives clearing cookies. It
is the clearest example in this whole demo of the trade the vendors are making.

## 5 · Devices, directly

The Chromium-only tier: USB, serial ports, HID and Bluetooth from a web page. The pattern is
identical for all four and worth learning once:

```js
const device = await navigator.usb.requestDevice({ filters: [] })
```

The page supplies filters, **the browser** runs the enumeration, and the page receives back exactly
the one device the user picked. A site can never list your hardware — which is precisely the thing a
native program can do. That single asymmetry is what makes "flash firmware from a web page"
defensible.

**This panel teaches with nothing plugged in.** Press any button: the picker appears, and that
dialog *is* the permission — there is no second prompt. Cancel it and the page receives
`NotFoundError`, the very same error it gets when no device exists. A site cannot distinguish "the
user refused" from "there was nothing there", and that is deliberate.

Grants persist per origin and per device, so a tool does not re-prompt on every visit. **What was I
granted?** lists them; Chrome lets you revoke them under *Settings → Privacy and security → Site
settings → USB devices*.

Two details worth noticing in passing. WebHID refuses to hand over keyboards and mice, because raw
keyboard access would be a keylogger with a permission prompt. And Web Bluetooth makes you declare
`optionalServices` up front — a page cannot browse a device it has been handed, only reach the parts
it said it wanted beforehand.

In Firefox and Safari every button here reports a missing API. That is not a gap in their backlog:
both engines have published positions declining this tier as a fingerprinting and safety risk. When
a capability is absent it is usually *declined*, not unimplemented, which is why "the browser can do
X" so often means "Chrome can do X".

## Trying it on a phone

Orientation, motion, vibration, NFC and the rear camera only mean anything on a real device, and
this is where the secure-context rule stops being free. `npm start` prints your LAN addresses, but
`http://192.168.x.x:5182` is **not** a secure context, so the interesting half of the page will be
missing. Two ways round it:

**A self-signed certificate.** Drop `cert.pem` and `key.pem` next to `server/index.mjs` and it
serves HTTPS instead, no code changes:

```
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout server/key.pem -out server/cert.pem -subj "/CN=localhost"
```

You will have to click through a warning on the phone, and Safari is stricter about this than
Chrome.

**Or forward the port**, which avoids certificates entirely because the phone then genuinely sees
`localhost`:

```
adb reverse tcp:5182 tcp:5182 && adb reverse tcp:5183 tcp:5183
```

## Files

```
server/index.mjs           static server; adds Permissions-Policy to /locked/, and listens twice
public/index.html          the five panels and their instructions
public/app.js              every action, one section per panel
public/styles.css          presentation only, nothing to learn here
public/sandbox/index.html  the page loaded by the three frames *and* served as /locked/
```

`sandbox/index.html` is deliberately one self-contained file with no external assets, because it is
served from two paths and two origins and has to behave identically at all of them. It reports its
own origin, whether it is framed, whether it is a secure context, and what the Permissions API says
about the camera before anything has been asked.

## What is not here

**WebAuthn and passkeys** also reach hardware — a security key or the platform TPM — but they belong
with authentication rather than device access, and the [`auth/`](../../auth/) examples cover that
ground.

**The File System Access API, wake lock, badging and Web Share** are the *behave like an installed
app* section of the parent README, not this one.

**Sensor APIs proper** (`Accelerometer`, `Gyroscope`, `AmbientLightSensor`) are the newer, more
uniform replacement for the `deviceorientation` events used here. Panel 1 detects them; they are
Chromium-only and mostly behind flags, which is why panel 4 uses the older events that actually fire
everywhere.

## Reset

Nothing here writes to disk, and every capability can be handed back. Reload to drop the live
camera, microphone and screen tracks. Permissions are revoked from the padlock icon in the address
bar; device grants from *Site settings*. `Ctrl+C` stops both listeners.
