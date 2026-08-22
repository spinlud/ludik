# Migrating vendored GLTFLoader / DRACOLoader to three.js `examples/jsm` under Vite

Research for GitHub issue [#77](https://github.com/spinlud/ludik/issues/77) (Wayfinder ticket).
Target stack: npm `three` latest (r185 / `three@0.185.1` at time of research) + Vite + Vue 3 + Node 22.

All external facts below are from primary sources (three.js manual/docs, `mrdoob/three.js`
source at tag `r185`, the npm `three` package `exports`, and the Vite documentation).
URLs are listed per section.

---

## 0. Current state in this repo (what we are replacing)

- The vendored loaders are **r104-era global scripts**, not ESM:
  - `src/components/shared/GLTFLoader.js` defines `THREE.GLTFLoader` (IIFE assigned to the global `THREE` namespace).
  - `src/components/shared/DRACOLoader.js` defines `THREE.DRACOLoader` (the old 2016 "Draco Authors" standalone loader; instance methods `setPath` / `setVerbosity` / `setDrawMode` / `setSkipDequantization` / `decodeDracoFile`, plus static `THREE.DRACOLoader.setDecoderPath` / `setDecoderConfig` / `getDecoderModule` / `releaseDecoderModule`, default `decoderPath = './'`).
- They are pulled in as side-effect requires in `src/components/shared/LoaderManager.js`:
  ```js
  const T = THREE
  require("./GLTFLoader.js")
  require("./DRACOLoader.js")
  ...
  this.gltfLoader = LoaderManager.promisifyLoader(new T.GLTFLoader(this.manager))
  ```
- **Call sites** (only two consumers, both via `LoaderManager`):
  - `src/components/home/HomeHeader.vue:97` — `new LoaderManager(1)`
  - `src/components/world/World.vue:3594` — `new LoaderManager(67)`
  - `LoaderManager.promisifyLoader` wraps every loader as `loader.load(url, onLoad, onProgress, onError)` returning a Promise. That 4-arg `.load` signature is the only loader API the app depends on.
- **Important:** `DRACOLoader` is `require`d but **never instantiated and never wired into GLTFLoader**. There is no `setDRACOLoader(...)`, no `new DRACOLoader()`, and no `setDecoderPath(...)` anywhere in app code (grep of `src`, excluding `src/libs/` and the vendored defs).
- **The GLB assets are not Draco-compressed.** Neither `assets/level/Level_256_combined.glb` (4.9M) nor `assets/level/LevelNavigation6.glb` (8K) contains the `KHR_draco_mesh_compression` extension (`grep -aoc` → 0 matches on both).

> **Consequence:** DRACO decoding is effectively dead code in the current app. For the
> migration, `GLTFLoader` is the only loader that must work; `DRACOLoader` can be dropped
> unless/until a Draco-compressed asset is introduced. The DRACO strategy below is documented
> for correctness and future-proofing (§2).

---

## 1. Correct import paths (npm `three`, r185)

Use the ESM addons paths, **with the `.js` extension**:

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
```

- The `.js` extension is **required**; every manual example includes it. The source files even
  carry a `@three_import` JSDoc tag stating the exact import line (e.g. DRACOLoader.js:
  `import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';`).
- `three/addons/*` is a real alias in the package `exports` field of `three@0.185.1`, so it
  resolves under Node/Vite bundler resolution with no extra config:
  ```json
  "./addons": "./examples/jsm/Addons.js",
  "./addons/*": "./examples/jsm/*",
  "./examples/jsm/*": "./examples/jsm/*"
  ```
  Therefore `three/addons/loaders/GLTFLoader.js` and the legacy
  `three/examples/jsm/loaders/GLTFLoader.js` **resolve to the same file**. `three/addons/`
  is the documented/preferred spelling; `three/examples/jsm/` still works.
- No-bundler / importmap setups (not ours, but for reference) map `three/addons/` to jsDelivr
  — note the **trailing slash** on the importmap key:
  ```json
  { "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@<version>/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@<version>/examples/jsm/"
  }}
  ```

Sources:
- npm registry `three@latest` (version + `exports`): https://registry.npmjs.org/three/latest
- Manual — Installation: https://threejs.org/manual/en/installation.html
- Manual — Loading 3D models: https://threejs.org/manual/en/loading-3d-models.html
- `@three_import` tags in `examples/jsm/loaders/{GLTFLoader,DRACOLoader}.js` @ tag `r185`

---

## 2. DRACO decoder assets under Vite

### Where the decoder files live in the npm package
`three/examples/jsm/libs/draco/`:
- `README.md`, `draco_decoder.js`, `draco_decoder.wasm`, `draco_wasm_wrapper.js`
- `gltf/` subfolder (the glTF-tuned build — **use this one for GLB/glTF**):
  `draco_decoder.js`, `draco_decoder.wasm`, `draco_wasm_wrapper.js`

### Decoder path defaults / API (r185)
- **Correction to a common assumption:** r185's DRACOLoader default is **not** a jsDelivr CDN.
  The constructor points at the **local package copy** via `import.meta.url`:
  ```js
  const WASM_BIN_URL = new URL( '../libs/draco/draco_decoder.wasm', import.meta.url ).toString();
  const WASM_JS_URL  = new URL( '../libs/draco/draco_wasm_wrapper.js', import.meta.url ).toString();
  const JS_URL       = new URL( '../libs/draco/draco_decoder.js', import.meta.url ).toString();
  // constructor:
  this.decoderPaths = { js: WASM_JS_URL, wasm: WASM_BIN_URL, dep_js: JS_URL };
  this.decoderConfig = {};
  ```
  (Older releases such as r170 defaulted `decoderPath = ''`, forcing an explicit
  `setDecoderPath`.) jsDelivr only ever appears in the manual's importmap for loading the
  modules — never as a decoder default inside DRACOLoader.
- `setDecoderPath(path)` accepts a **string** or an **object**:
  - String form concatenates `path + filename` via `LoaderUtils.resolveURL(...)`, so the
    **trailing slash is required**: `setDecoderPath('/draco/')`, not `'/draco'`.
  - Object form `{ js, wasm }` sets those explicitly and nulls `dep_js`, which then **requires
    WebAssembly**.
- `setDecoderConfig(config)` is **deprecated in r185** (warns, removal slated r194); its only
  meaningful field was `{ type: 'js' | 'wasm' }`. Do not use it in new code.
- **Auto-detect wasm vs js:** yes —
  `const useJS = typeof WebAssembly !== 'object' || this.decoderConfig.type === 'js';`
  With WebAssembly available it loads `draco_wasm_wrapper.js` + `draco_decoder.wasm`, else
  `draco_decoder.js`. If the object form of `setDecoderPath` was used (`dep_js === null`) and
  WebAssembly is unavailable it throws
  `THREE.DRACOLoader: WebAssembly is required when using a custom decoder paths.`
- `preload()` eagerly spins up the decoder/worker pool (avoids first-decode latency);
  `dispose()` terminates the worker pool. JSDoc recommends creating **one** DRACOLoader
  instance, reusing it, and calling `dispose()` when done. Default `workerLimit = 4`
  (`setWorkerLimit(n)`).

### Recommended Vite pattern
Copy the decoder folder into Vite's `public/` and point the loader at the root-absolute path:

1. Copy `node_modules/three/examples/jsm/libs/draco/gltf/` → `public/draco/`
   (the `gltf/` build is the correct one for GLB). Automate it so it survives `three`
   upgrades, e.g. a `postinstall`/prebuild step:
   ```json
   "scripts": {
     "predev":   "cpy 'node_modules/three/examples/jsm/libs/draco/gltf/*' public/draco/ --flat",
     "prebuild": "cpy 'node_modules/three/examples/jsm/libs/draco/gltf/*' public/draco/ --flat"
   }
   ```
   (or `vite-plugin-static-copy`).
2. Wire it up once and reuse:
   ```js
   const dracoLoader = new DRACOLoader();
   dracoLoader.setDecoderPath('/draco/');   // trailing slash required
   dracoLoader.preload();                    // optional, avoids first-decode latency
   const gltfLoader = new GLTFLoader(manager);
   gltfLoader.setDRACOLoader(dracoLoader);
   ```

### Why `public/` and not a bundler-transformed path
Per Vite "Static Asset Handling": files in `public/` are "served at root path `/` during dev,
and copied to the root of the dist directory as-is," must "retain the exact same file name
(without hashing)," and should be referenced "using root absolute path — for example,
`public/icon.png` should be referenced in source code as `/icon.png`." That non-hashed,
root-served, stable-filename behavior is exactly what the Draco worker/wasm trio needs:
DRACOLoader fetches those **sibling filenames itself at runtime** relative to `decoderPath`,
and spins workers up from generated blob URLs — the files are never statically `import`-ed, so
the bundler cannot rewrite the references. The `new URL(asset, import.meta.url)` pattern (which
r185's *defaults* rely on) does work in Vite for a single statically-analyzable asset, but
Vite warns the URL "must be static … otherwise the code will be left as is, which can cause
runtime errors," and that it "does not work if you are using Vite for Server-Side Rendering."
Because DRACOLoader resolves a *runtime set* of sibling files plus workers, `public/` +
`setDecoderPath('/draco/')` is the reliable, recommended approach.

Sources:
- `mrdoob/three.js` @ `r185` `examples/jsm/loaders/DRACOLoader.js` (defaults lines 17-24, 63-72;
  `setDecoderPath`/`setDecoderConfig`/auto-detect lines ~96-137, 372-412; error line ~504)
- `r170` `DRACOLoader.js` (old empty-string default)
- GitHub contents API for `examples/jsm/libs/draco` and `.../draco/gltf`
- Vite — Static Asset Handling / public directory / `new URL(..., import.meta.url)`:
  https://vite.dev/guide/assets

---

## 3. API differences that affect our call sites (r104 vendored → r185 jsm)

| Aspect | r104 vendored (current) | r185 jsm (target) | Call-site impact |
| --- | --- | --- | --- |
| Module system | Globals on `THREE` (`THREE.GLTFLoader`), `<script>` / side-effect `require` | ESM `import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'` | **Change required** — drop `require(...)` + `THREE.`-prefixed access; import named exports |
| `GLTFLoader` constructor | `new GLTFLoader(manager)`, manager optional | `new GLTFLoader(manager)`, manager optional (`super(manager)`) | No change — keep passing `this.manager` |
| `.load(url, onLoad, onProgress, onError)` | 4-arg | 4-arg (stable) | No change — `promisifyLoader` keeps working |
| `GLTFLoader.setDRACOLoader(dracoLoader)` | present | present | Same pattern (only needed if Draco assets exist) |
| `DRACOLoader.setDecoderPath` | present (string) | present; string **or** object form; string needs trailing slash | Use `'/draco/'` |
| `DRACOLoader.setDecoderConfig` | present | **deprecated** (removal r194) | Drop it |
| `DRACOLoader.setWorkerLimit` | present | present (default 4) | Optional |
| `DRACOLoader.preload` / `dispose` | present | present | Optional; prefer one shared instance |
| `DRACOLoader.setVerbosity` | present (old standalone loader) | **removed** | Remove any usage (none in app code) |
| wasm vs js selection | manual | auto-detected | Don't force `type` (that path is deprecated) |
| glTF result shape | `{ scene, scenes, animations, cameras, asset, ... }` | same (stable) | No change — `gltf.scene` / `.scenes` / `.animations` reads keep working |

### Net for this repo
- Rewrite `LoaderManager.js`: replace the two `require(...)` side-effects and `T.GLTFLoader`
  with `import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'` and
  `new GLTFLoader(this.manager)`. Same for the other loaders currently taken off the `THREE`
  global (`TextureLoader`, `CubeTextureLoader`, `AudioLoader`, `FontLoader` — these are core
  `three` exports; note `FontLoader`/`TTFLoader` also moved to `three/addons/...`).
- `promisifyLoader` and both call sites (`HomeHeader.vue`, `World.vue`) need **no change** —
  they only depend on the stable `.load(url, onLoad, onProgress, onError)` signature and
  `gltf.scene`/`.scenes`/`.animations`.
- DRACO is currently unused (no Draco-compressed assets, never wired in). Simplest correct
  migration: **omit DRACOLoader entirely**. If Draco assets are added later, apply §2.

Sources:
- `r185` `GLTFLoader.js` (ctor lines 135-137, `.load` line 264, `setDRACOLoader` line 348),
  `r185`/`r170` `DRACOLoader.js`
- three.js docs — GLTFLoader: https://threejs.org/docs/#examples/en/loaders/GLTFLoader
