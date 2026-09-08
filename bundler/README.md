# Bundler

The mental model, worked through Vite on the web and Metro + Gradle + Xcode on mobile.

## The mental model

A bundler is a compiler whose input is a graph of files and whose output is a handful of files a runtime can load fast. Everything else is a detail of that sentence.

It exists because the runtime can only do two things with your source: fetch a URL and execute JavaScript. It cannot resolve `import 'lodash'`, it does not know what `.tsx` or `.scss` are, and fetching three thousand small modules over a network is slow. The bundler sits between what is ergonomic to write and what is efficient to ship.

Every bundler runs the same five stages. They differ in speed, in defaults, and in what language they are written in — not in the shape of the work.

**Entry.** You name one or more starting files, `src/main.tsx` or `App.tsx`. Nothing else is discovered any other way; if a file is not reachable from an entry, it does not exist as far as the build is concerned.

**Resolve.** Turn each import specifier into a real file path. `'./utils'` becomes `/src/utils.ts`; `'react'` becomes `/node_modules/react/index.js`, found by reading the `exports`, `module` and `main` fields of that package's `package.json`. This is where most "module not found" pain lives, and it is also where a bundler can be made platform-aware — Metro picks `Button.ios.tsx` over `Button.tsx` at exactly this stage.

**Load and transform.** Read the file and run it through whatever converts it to JavaScript: TypeScript to JavaScript, JSX to function calls, SCSS to CSS to a JS module that injects a `<style>` tag. webpack calls these loaders; Rollup and Vite call them plugins. The insight worth internalizing is that **to a bundler, everything is a module**. An imported PNG becomes a JS module whose default export is a URL string. CSS becomes a module with a side effect.

**Build the graph.** Recurse through imports until nothing new is discovered. You now have a directed graph of modules, and that graph *is* the bundler's data structure — every optimization after this point is a graph operation.

**Optimize and emit.** Four things happen here. *Concatenation* flattens modules into one file, wrapped so each keeps its own scope. *Tree shaking* drops exports nobody imports, which only works because ESM `import`/`export` are static and analyzable without running the code — this is why dynamic `require()` defeats it, and why `"sideEffects": false` matters, since the bundler has to be told it is safe to delete a module that is imported purely for its effects. *Code splitting* treats each `import()` call as a cut point in the graph: everything reachable only through it moves to a separate chunk loaded on demand, with shared dependencies hoisted so they are not duplicated. Finally *minify and hash*, so names get shortened and the file is written as `main.a3f9c1.js` — cacheable forever, busted by content change. Source maps are produced throughout, mapping the mangled output back to the original lines so devtools can lie convincingly.

Bundlers exist because of history. Browsers had no module system for most of the web's life, so Browserify and then webpack emulated one by concatenating modules into a script wrapped in a runtime. Native ES modules are supported everywhere now, so the original justification is gone — but the rest is not. A thousand unbundled modules means a thousand requests and a waterfall of dependency discovery, and none of the minification, tree-shaking or asset handling happens on its own. Bundling survives as a production optimization even though it started as a compatibility hack.

The landscape maps cleanly onto the five stages. **webpack** is the everything-machine: most configurable, largest plugin ecosystem, slowest, written in JavaScript. **Rollup** is the graph-and-output purist, with the cleanest ESM output and the best tree shaking, which is why libraries use it. **esbuild** is the same pipeline written in Go, one to two orders of magnitude faster with fewer features, and usually a component inside another tool rather than the tool itself. **Vite** glues a fast dev server to a real production bundler. **Rspack** and **Turbopack** are webpack-compatible rewrites in Rust. **Parcel** is the zero-config take. **Metro** is the React Native one. Learn the pipeline once and every config file becomes readable — the only question to ask is which stage a given option touches.

| config key | stage |
| --- | --- |
| `entry`, `input` | entry |
| `resolve`, `alias`, `extensions` | resolve |
| `loaders`, `plugins`, `transform` | load and transform |
| `splitChunks`, `manualChunks`, `external` | optimize and emit |
| `output.format` (`esm` / `cjs` / `iife` / `umd`) | emit — decided by who consumes the output |

That last one is the app-versus-library split. An app has one entry, aggressive splitting and hashed filenames. A library preserves module structure, marks its dependencies `external` so React is not baked into it, and ships several formats.

## Vite on the web

Vite's central idea is that development and production have different goals, so they should not share a strategy. In development you want the fastest possible feedback loop; in production you want the smallest possible payload. Older tools bundled the whole application before the dev server could serve anything, which meant a cold start that got worse every time the project grew.

So in development, Vite does not bundle at all. It starts a server immediately and serves your source as native ES modules — the browser requests `main.tsx`, the server transforms that one file on demand and returns it, the browser follows its imports and requests those. Startup is near-instant regardless of project size, because work happens per file and only for files actually requested. Dependencies in `node_modules` are the exception: they get pre-bundled once and cached, because a package like `lodash-es` would otherwise explode into hundreds of requests. The same design gives very fast Hot Module Replacement — saving a file invalidates only that module, which is swapped into the running page so React component state survives the edit, and update time stays flat as the codebase grows.

For production Vite bundles properly, because unbundled modules over a network are slow. That build historically ran on Rollup with esbuild doing transforms, and is moving to Rolldown, a Rust rewrite of Rollup by the same team. Either way the output is the same: minification, tree shaking, automatic splitting per dynamic import, CSS extraction, hashed filenames.

The tradeoff to know is that dev and production run through different pipelines, so it is possible — uncommon, but possible — for something to work under `npm run dev` and break under `npm run build`. Running `npm run preview` serves the real built output locally and is how you catch it.

Configuration lives in `vite.config.ts` and is usually tiny:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

The React plugin wires up JSX transformation and Fast Refresh. Vite's plugin API is Rollup's plus a few dev-server hooks, so most of the Rollup ecosystem works unchanged. A few built-in behaviours are worth remembering: `index.html` sits at the project root and is the real entry point, treated as source with its script tags rewritten at build time, which is why it does not live in `public/`; files in `public/` are copied untouched and served from `/`; `import.meta.env` exposes environment variables prefixed with `VITE_`; and imports of `.css`, `.svg` or images work without extra loader configuration. Vite is also the foundation other tools build on — Vitest reuses its config and transform pipeline, and Astro, SvelteKit and Nuxt all sit on top of it.

## Mobile: the same pipeline, a very different runtime

On React Native the bundler is **Metro**. Expo is not a bundler — it is the platform and toolchain that owns one, the same way Next.js owns webpack or Turbopack without being a bundler itself.

```
Expo            toolchain: dev client, EAS Build, SDK modules, router, OTA updates
React Native    framework: JS components mapped to native views
Metro           the bundler
Hermes          the JS engine that executes the output
```

Metro runs the same five stages, under different constraints, because there is no browser and no runtime network fetch.

There is **no URL-based code splitting**. The app ships as one JavaScript bundle baked into the binary, so there is no `<script src>` to lazily fetch and no chunk graph to tune. Resolution is **platform-aware**: `Button.ios.tsx`, `Button.android.tsx` and `Button.web.tsx` are selected by target, a stage-two feature web bundlers do not have. Assets are **native resources** rather than files in a `dist/` folder — an imported PNG is copied into the platform's asset bundle and the import resolves to a numeric asset ID the native side looks up. Transforms run through **Babel** plus the Hermes compiler rather than esbuild, which is the main reason RN development feels sluggish next to Vite. And HMR becomes **Fast Refresh**, the same idea applied to a native app, where state preservation is handled by the RN runtime instead of the browser.

## Turning JavaScript into UI on a phone

The thing that unlocks this: **there are two separate programs**. There is a native app already installed on the phone — Expo Go, or your own dev client — which is a normally compiled iOS or Android app containing Hermes and all of React Native's native view code. And there is your JavaScript, on your machine. During development your code is never compiled into an iOS app at all. It is downloaded and executed by an app that was built months ago and knows nothing about your project. Expo Go is closer to a browser than to your app; the bundle is the page.

The development sequence:

1. `expo start` boots Metro as an HTTP server on your machine — say `http://192.168.1.50:8081` — and prints a QR code. Nothing has been bundled yet and the phone is not involved.
2. Scanning the QR opens that URL in Expo Go, which makes an ordinary HTTP request: `GET /index.bundle?platform=ios&dev=true`. The USB cable or shared WiFi exists only so the phone can reach that IP.
3. Metro runs the five stages — entry at `App.tsx`, resolution picking `.ios.tsx` files because of `platform=ios`, Babel stripping TypeScript and JSX, graph traversal, then concatenation into one large JavaScript text file — and returns it over HTTP.
4. The phone now holds a string of JavaScript. Not an app. Text.
5. Expo Go hands it to Hermes and executes it. Your `App()` runs, React reconciles, and produces a description of a tree. Nothing is on screen yet.

That last description is the pivot. React has produced something like `{ type: 'View', props: { style: { padding: 20 } }, children: [{ type: 'Text', children: ['Hello'] }] }`, and RN's renderer walks it, calling into the native code compiled inside the host app. `View` is not a thing — it is a name that resolves per platform:

| your JSX | iOS | Android |
| --- | --- | --- |
| `<View>` | `UIView` | `android.view.ViewGroup` |
| `<Text>` | `RCTTextView` / `NSAttributedString` | `TextView` / `Spannable` |
| `<ScrollView>` | `UIScrollView` | `ScrollView` |
| `<TextInput>` | `UITextField` | `EditText` |

"Create a View" becomes an allocated `UIView`; "set padding 20" sets a frame computed by Yoga, RN's flexbox layout engine; "add child" becomes `addSubview:`. Those objects attach to the app's root view and the operating system draws them. Real native widgets — not a webview, not a canvas the way Flutter does it. The same mechanism covers APIs: `Camera.takePhoto()` is a JS facade over a TurboModule, one native class registered under one name on each platform, reached through JSI, a C++ layer that lets JavaScript hold references to native objects.

Saving a file does not repeat any of this. Metro rebuilds only the changed module, pushes it over a WebSocket, Hermes swaps that module's code, React re-renders, and the renderer issues *update* instructions to the views that already exist.

## Gradle and Xcode: the production path

Production is the same thing minus the network. Metro runs once, at build time, and its output is embedded in the binary as a file; on launch the app reads the bundle from disk instead of over HTTP. Everything after that — Hermes, React, the renderer, the native views — is byte-for-byte identical to development.

The native build is what turns that into an installable app, and it is worth separating the IDEs from the toolchains, because the IDEs are not what build anything.

| | what you install | what actually builds |
| --- | --- | --- |
| iOS | Xcode and its Command Line Tools | `xcodebuild`, driving `clang`/`swiftc`, CocoaPods for dependencies, `codesign` at the end |
| Android | Android Studio | **Gradle**, driving the Android SDK build tools (`d8`, `aapt2`, `r8`) on a JDK |

**Gradle** is a build tool, not an Android thing and not part of Android Studio. The closest analogy is npm and webpack combined: it resolves dependencies from Maven repositories the way npm resolves from the registry, and orchestrates the build the way webpack does. `build.gradle` is `package.json`; `./gradlew` is `npx`, a checked-in wrapper script that downloads the exact Gradle version the project pins so everyone builds identically; `~/.gradle/caches` is `node_modules`. Android support comes from the Android Gradle Plugin, which is why there are two version numbers to keep compatible and why a mismatch is a classic React Native upgrade error. Gradle is also used well outside Android, by Spring and plain Java and Kotlin projects.

You can prove the IDE is optional by running `cd android && ./gradlew assembleDebug` in a terminal with Android Studio nowhere on the machine. That is exactly what CI does. Android Studio's real contribution is everything around the build: completion, the debugger, the emulator manager, the layout inspector, and the SDK Manager that installs the SDK Gradle then uses.

On `assembleDebug`, Gradle roughly does this in order: read `build.gradle` and download `.jar`/`.aar` dependencies; **run Metro**, via a task the React Native Gradle plugin contributes, bundling your JS into the app's assets; compile Kotlin and Java to `.class` files; convert those to `classes.dex` with `d8`, since Android runs its own bytecode format; compile XML resources and drawables to a binary form with `aapt2`; merge every `AndroidManifest.xml`, yours plus each library's; in release, shrink and obfuscate with R8; zip it into an APK or AAB; sign it with `apksigner`.

Xcode's chain is the analogous one, with the Metro step appearing as a "Bundle React Native code and images" shell script build phase that writes `main.jsbundle` into the app's resources before compilation and packaging.

The asymmetry between the two matters practically. **iOS genuinely requires macOS** — the iOS SDK, `xcodebuild` and the signing tools exist only there and Apple's licence forbids running them elsewhere, which is why cloud services like EAS Build run iOS builds on actual Mac hardware. **Android requires no IDE at all** — SDK, JDK and Gradle run headless on Linux, which is why Android builds are cheaper and faster and why `expo run:android` works on Windows.

So the full chain, in one picture:

```
your .tsx  ──Metro──►  main.jsbundle  ──┐
                                        ├──►  xcodebuild  ──►  .ipa
native project (generated by prebuild) ─┘    or Gradle          .aab
```

In a managed Expo project the `ios/` and `android/` folders usually do not exist in the repo. They are build artifacts, generated by `npx expo prebuild` from `app.json`, your dependencies, and config plugins — small JavaScript functions that patch `Info.plist`, `AndroidManifest.xml` and Gradle files. Expo calls this Continuous Native Generation. Editing the generated files directly is the trap, because the next `prebuild --clean` wipes them; changes belong in a config plugin instead.

## What "native code" actually means here

Your JavaScript never becomes native machine code. Hermes precompiles it to **bytecode** — a `.hbc` file for the Hermes VM embedded in your app — which is a compilation step web bundling does not have, but it is still interpreted code, not compiled binary.

That distinction draws a hard operational line. Over-the-air updates can replace the bundle: your JS, the Hermes bytecode, and Metro-resolved assets like images and fonts. They cannot change anything native — a newly added native module, entries in `Info.plist` or `AndroidManifest.xml`, permissions, the app icon, linked libraries, or a React Native version bump. Those require a new binary through the store.

The useful way to hold it: the installed app is a **native shell with a JavaScript slot**. OTA swaps what is in the slot, but the shell's shape was fixed at build time, and JS calling a native API the shell does not contain crashes at runtime. That is what Expo's runtime version guards against — `expo-updates` fingerprints the native side and refuses to serve an update to a mismatched binary. The boundary is App Store policy rather than a technical limit: Apple permits downloading code only when it is interpreted by an embedded engine, which JavaScript in Hermes satisfies and arbitrary machine code does not.

Practically this reduces to one question. Did anything outside your JavaScript source change? If no, `eas update` ships it in minutes. If yes, you rebuild through Gradle or Xcode and go back through review.
