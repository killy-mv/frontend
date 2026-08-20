# Bundler
 
## How to run preview

Open terminal, cd to this folder as root directory and type 'npm run dev' there and hit enter

## What is a bundler

A bundler is the build tool that takes the many small source files a frontend project is written in and turns them into the few optimized files a browser actually downloads. Source code is organized for humans — dozens or thousands of modules, each importing others, plus CSS, images, SVGs and TypeScript that no browser can run directly. A bundler starts from an entry point (here `src/main.tsx`), follows every `import` and `require` to build a dependency graph of the whole application, transforms each file into something the browser understands, and writes the result out as bundles.

The work it does along the way is what makes it worth having. It resolves module specifiers, so `import { useState } from 'react'` finds the right file inside `node_modules`. It runs transforms through loaders or plugins, so TypeScript becomes JavaScript, JSX becomes function calls, and modern syntax is compiled down to whatever browsers you target. It handles non-JavaScript assets as modules, so importing a stylesheet or a PNG just works and the file gets copied, inlined or hashed as appropriate. Then it optimizes: minifying the output, tree-shaking away exports nobody imports, code-splitting the graph so a route the user never visits is not downloaded up front, and adding content hashes to filenames so caching is safe across deploys.

Bundlers exist because of history. Browsers had no module system for most of the web's life, so tools like Browserify and later webpack emulated one by concatenating modules into a single script wrapped in a runtime. Native ES modules are supported everywhere now, so the "the browser can't do imports" reason has gone — but the rest has not. Shipping a thousand unbundled modules means a thousand HTTP requests and a waterfall of dependency discovery, and none of the minification, tree-shaking or asset handling happens on its own. So bundling survives as a production optimization even though it started as a compatibility hack. The main options today are webpack, the long-standing and most configurable one; Rollup, which focuses on clean library output and pioneered tree-shaking; esbuild and SWC, written in Go and Rust and roughly an order of magnitude faster than the JavaScript-based tools; Parcel, which aims for zero configuration; and Vite, which is what this project uses.

## What is Vite

Vite (French for "fast", pronounced */veet/*) is a frontend build tool created by Evan You, the author of Vue. Its central idea is that development and production have different needs, so they should not use the same strategy. Older tools bundled the entire application before the dev server could serve anything, which meant a cold start that got slower every time the project grew.

In development, Vite does not bundle your application at all. It starts a dev server immediately and serves your source files as native ES modules — the browser requests `main.tsx`, the server transforms that one file on demand and sends it back, the browser follows its imports and requests those. Startup is close to instant no matter how large the project is, because work happens per file, only for files actually requested. Dependencies from `node_modules` are the exception: they are pre-bundled once and cached, because a package like `lodash-es` would otherwise explode into hundreds of separate requests. This design also gives Vite very fast Hot Module Replacement — when you save a file, only that module is invalidated and swapped in the running page, so React component state survives the edit and the update time stays flat as the codebase grows.

For production, Vite bundles properly, because unbundled ES modules over the network are slow. That build used to run on Rollup with esbuild doing the fast transforms; the version installed here (Vite 8) has replaced both with Rolldown, a Rust rewrite of Rollup by the same team — you can see it in `node_modules`, where there is a `rolldown` package and no `rollup` or `esbuild` at all. Either way what you get out is the same: minification, tree-shaking, automatic code splitting per dynamic import, CSS extraction and hashed filenames. The tradeoff to be aware of is that dev and production run through different pipelines, so it is possible — though uncommon — for something to work in `npm run dev` and break in `npm run build`. Running `npm run preview` serves the real production build locally and is the way to catch that.

What you configure lives in `vite.config.ts`, which in this project is about as small as it gets:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

The React plugin is what wires up JSX transformation and Fast Refresh. Vite's plugin API is Rollup's, extended with a few dev-server hooks, so the existing Rollup plugin ecosystem mostly works as is. A few other things come built in and are worth knowing: `index.html` sits at the project root and is the real entry point (Vite treats it as source and rewrites the script tags at build time, which is why it is not in `public/`), files in `public/` are copied to the output untouched and served from `/`, `import.meta.env` exposes env vars prefixed with `VITE_`, and imports of `.css`, `.svg` or images are handled without extra loader configuration. Vite is also the foundation other tools build on — Vitest reuses its config and transform pipeline for testing, and Astro, SvelteKit and Nuxt all sit on top of it.

## Notes on this template

This folder is the standard React + TypeScript + Vite scaffold (`npm create vite@latest`), kept minimal on purpose so the config stays readable. Two official React plugins exist: [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react), which uses [Oxc](https://oxc.rs), and [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc), which uses [SWC](https://swc.rs/) — both are Rust-based, they differ mainly in which toolchain they pull in. The React Compiler is not enabled here because of its impact on dev and build performance; see [the installation docs](https://react.dev/learn/react-compiler/installation) to add it.

Scripts:

| command           | what it does                                          |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | start the dev server with HMR, no bundling            |
| `npm run build`   | type-check with `tsc -b`, then produce the real bundle |
| `npm run preview` | serve the built output locally to verify it           |
| `npm run lint`    | run ESLint over the project                            |
