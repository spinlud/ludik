# #98 — Modern postprocessing stack for the World scene

Research against primary sources (local `node_modules`/vendored code + upstream repos, npm registry, threejs.org docs), 2026-08-25. This document is the single upstream reference for the #99 effects rework.

## Executive summary

**Recommendation: stay on pmndrs `postprocessing@6.39.4` for the #99 work; treat the 7.x migration as a tracked follow-up, blocked today by upstream facts, not by our code.** The decided direction "upgrade to latest 7.x + the latest three it supports" hits three hard blockers verified against npm and the pmndrs repo on 2026-08-25:

1. **7.x has never shipped stable.** The npm `latest` tag is `6.39.4` (published 2026-07-27). The newest 7.x is `7.0.0-beta.16` (published 2026-02-19); the v7 migration guide's own install snippet asks for `>= 7.0.0-beta.17`, which does not exist on npm yet.
2. **Published 7.x would force a three DOWNGRADE, not an upgrade.** `7.0.0-beta.16` peer-pins `three >= 0.179.0 < 0.184.0` — it cannot run with our current `three@0.185`. The unreleased v7 branch HEAD widened this to `< 0.186.0`, but that is unpublished. Meanwhile the latest three on npm is **`0.185.1`** (2026-07-01) — `r186+` does not exist yet, so the strategic premise "7.x unlocks r186+" is moot today: `6.39.4` (`three >= 0.168 < 0.186`) already covers the newest three.
3. **7.x is missing 3 of our 5 effects.** The v7 branch ships only Bloom, SMAA, FXAA, ToneMapping, LUT, and a few others. There is **no `GodRaysEffect`, no `HueSaturationEffect`, no `BrightnessContrastEffect`** — even the v7 manual's own hue-saturation demo has the effect commented out pending a port. Migrating now means re-implementing three effects as custom v7 effects.

Per-effect the answer is therefore: keep all five on pmndrs 6.39.4, fix the one real bug found in our current chain (Bloom is silently running mipmap blur, not the Kawase LARGE kernel we configured — see §5.4), and implement the #99 gamma-space work with the mechanisms 6.39.4 already provides (`Effect.inputColorSpace`, `EffectPass.fullscreenMaterial.encodeOutput` — see §8). Everything in this doc that concerns effect wiring, buffer choice, and color-space topology carries over to v7 conceptually (v7 uses the same `colorspace_fragment` / `sRGBTransferOETF` encode path), so the eventual migration (§9) loses none of this work.

## 1. Clarification: this app has always used pmndrs `postprocessing`, never three.js addons passes

Two unrelated codebases both call themselves "EffectComposer":

- **pmndrs `postprocessing`** (github.com/pmndrs/postprocessing, formerly vanruesc/postprocessing) — a standalone npm library. Its `EffectComposer`/`RenderPass`/`EffectPass` and the *effect-merging* architecture (many `Effect`s compiled into one fullscreen shader per `EffectPass`) are its own design.
- **three.js addons** (`three/examples/jsm/postprocessing/*` — `EffectComposer`, `RenderPass`, `ShaderPass`, `UnrealBloomPass`, `OutputPass`, `SMAAPass`, …) — one pass = one fullscreen draw, shipped inside the three repo.

The original app vendored **pmndrs postprocessing 6.3.2** (`src/libs/postprocessing_6.3.2`) against vendored three r104, and `web/` uses **pmndrs postprocessing 6.39.4** from npm. No three-addons pass has ever been used in this project. Notably, three.js itself now leans the same way: the official r185 god-rays example imports the *pmndrs* composer (§4.5).

## 2. Version and release-status landscape (npm registry, 2026-08-25)

| Package | Version | Published | three peer range |
|---|---|---|---|
| `three` (latest) | 0.185.1 | 2026-07-01 | — |
| `postprocessing` `latest` | 6.39.4 | 2026-07-27 | `>= 0.168.0 < 0.186.0` |
| `postprocessing` `beta` | 7.0.0-beta.16 | 2026-02-19 | `>= 0.179.0 < 0.184.0` |
| `postprocessing` `alpha` | 7.0.0-alpha.4 | (older) | — |
| pmndrs repo `main` branch | 6.39.4 | pushed 2026-08-24 | `>= 0.168.0 < 0.186.0` |
| pmndrs repo `v7` branch HEAD | 7.0.0-beta.16 (unreleased changes) | pushed 2026-08-24 | `>= 0.179.0 < 0.186.0` |

Both `main` (v6) and `v7` received commits the day before this research — **v6 is still the actively maintained, stable line**; the newest stable release (6.39.4) is five months newer than the newest 7.x beta. `web/package.json` currently pins `postprocessing ^6.39.4`, `three ~0.185.0`.

## 3. Where we are: the current chain and the original

Current chain (`web/src/components/world/World.vue`): renderer `outputColorSpace = SRGBColorSpace` (line 3656), default-constructed `EffectComposer` — i.e. 8-bit buffers (line 3662) — then `RenderPass` → `aaPass` (`EffectPass(SMAAEffect)`, disabled by default, toggled with key L, lines 693–698) → `beautyPass` (`EffectPass(hueSaturation, brightnessContrast, godRays, bloom)`, `renderToScreen = true`, lines 700–708). The app patches the `sRGBTransferOETF` body in `THREE.ShaderChunk.colorspace_pars_fragment` to pure `pow(rgb, 1/2.2)` (lines 164–189) to reproduce r104's output curve.

The original (vendored) pipeline: three r104 with `renderer.gammaOutput = true; renderer.gammaFactor = 2.2` (`src/components/world/World.vue:3568-3569`). In r104, `WebGLPrograms.getTextureEncodingFromMap(target.texture, renderer.gammaOutput)` promoted `LinearEncoding` to `GammaEncoding` *even when rendering into a render target* (`src/libs/three_0.104.0/src/renderers/webgl/WebGLPrograms.js:80-107`, used at line 140). So the scene was gamma-encoded in-shader into the composer's plain RGBA8 buffer; **every effect computed on gamma-space values**, and the final pass was a passthrough. Vendored postprocessing 6.3.2 contains no color-space logic in its core (its only encoding-related file is an optional `GammaCorrectionEffect` the app never used, `src/libs/postprocessing_6.3.2/src/effects/GammaCorrectionEffect.js`).

## 4. Corpus review — three.js (r185)

### 4.1 Color management manual (`manual/en/color-management.html` @ r185)

- Working color space is **Linear-sRGB**; "Rendering, interpolation, and many other operations must be performed in an open domain linear working color space."
- Output: conversion defined by `WebGLRenderer.outputColorSpace`; "**When using post-processing, this requires OutputPass.**" (three-addons composer context.)
- Render targets: "Render targets may use either sRGB or Linear-sRGB. **sRGB makes better use of limited precision. In the closed domain, 8 bits often suffice for sRGB whereas ≥12 bits (half float) may be required for Linear-sRGB.**"
- Custom `ShaderMaterial`s "have to implement their own output color space conversion … adding the `colorspace_fragment` shader chunk … should be sufficient" — this is exactly the mechanism both pmndrs 6.x and v7 use, and the hook our OETF patch rides on.
- `ColorManagement.enabled = true` is the default; hex/CSS color setters auto-convert sRGB → Linear-sRGB.

### 4.2 Migration-guide entries relevant to us (r104 → r185)

From github.com/mrdoob/three.js/wiki/Migration-Guide: `ColorManagement.legacyMode=false` → `ColorManagement.enabled=true` (r150); `Texture.encoding` → `Texture.colorSpace` (r152); `WebGLRenderer.outputEncoding` → `outputColorSpace`, default `SRGBColorSpace`, and `ColorManagement.enabled=true` by default (r153); three-addons `EffectComposer` default render-target type became `HalfFloatType` (r154); `OutputPass` introduced for tone mapping/color-space conversion, `useLegacyLights` default `false` (r156). `gammaOutput`/`gammaFactor`/`GammaEncoding` were removed in the r14x–r152 era; there is no renderer-level "encode into render target" switch anymore — that behavior is what #99 must reproduce another way (§8).

### 4.3 three post-processing guide + OutputPass

`manual/en/post-processing.html` describes the three-addons composer (ping-pong rtA/rtB; passes with `enabled`/`needsSwap`/`clear`). `examples/jsm/postprocessing/OutputPass.js` (r185) doc comment: "This pass is responsible for including tone mapping and color space conversion … should be included at the end of each pass chain. **If a pass requires sRGB input (e.g. like FXAA), the pass must follow OutputPass in the pass chain.**" — upstream confirmation that AA-type passes belong *after* the encode, i.e. they want perceptual input (§8.2).

### 4.4 UnrealBloomPass (`examples/jsm/postprocessing/UnrealBloomPass.js` @ r185)

Mip-chain bloom "inspired by the bloom pass of Unreal Engine": builds a mip pyramid, blurs each level with different radii, combines with weighted **additive** blending, allocates `HalfFloatType` targets, and its doc comment states "**When using this pass, tone mapping must be enabled in the renderer settings.**" It is a fundamentally different look from 6.3.2's Kawase-blur + SCREEN-blend bloom (large retune, HDR-oriented). Interestingly, pmndrs Bloom (mipmapBlur path, both 6.x and v7) is now the *same family* of algorithm (mip chain per Froyok's UE4 bloom article), so "switch to UnrealBloomPass" buys nothing pmndrs doesn't already have.

### 4.5 God rays: three has no native pass

`examples/webgl_postprocessing_godrays.html` (r185) does **not** use a three-addons god-rays pass — none exists. Its import map loads `postprocessing@6.39.1` (the pmndrs composer!) and `three-good-godrays@0.12.0` (`GodraysPass`), a screen-space *raymarched, shadow-map-based* volumetric technique (lines 24–25, 39–40; composer constructed with `frameBufferType: THREE.HalfFloatType`, line 121). That technique needs a shadow-casting directional/point light and produces crepuscular shafts through occluders — not our radial sun-glow. The pmndrs `GodRaysEffect` (Sousa-style radial blur from a light-source mesh) is the only drop-in match for the original look, and three.js itself endorses the pmndrs composer by using it in an official example.

### 4.6 Hue/saturation, brightness/contrast, SMAA in three addons

`examples/jsm/shaders/HueSaturationShader.js` and `BrightnessContrastShader.js` exist (r185) as bare `ShaderPass` shaders — same-era ports of the same simple algorithms pmndrs uses, but with no color-space awareness at all; under the addons convention (OutputPass last) they run on linear values, changing the look vs both the original and pmndrs (which converts BrightnessContrast input to sRGB — §5.3). `SMAAPass` and `FXAAPass` exist as addons passes. There is no advantage over the pmndrs equivalents, and mixing the two composers is not practical (both want to own the ping-pong buffers).

### 4.7 The demofox article (theoretical grounding for the buffer choice)

"Don't Convert sRGB U8 to Linear U8" (blog.demofox.org, 2018-03-10), cited by both pmndrs READMEs: storing *linear* color in 8 bits collapses dark-tone resolution. Round-tripping sRGB u8 → linear u8 → sRGB u8: "at gamma 2.2 … an input u8 value of 21" is the first that survives as non-zero — every darker input quantizes to black; error concentrates "in the areas of shadows"; dark images show "sections of the images turning from dark colors into complete blackness." Takeaway: "**you should 'never' … store linear color data as uint8**" (u12 is roughly the floor, hence HalfFloat). Fixes: sRGB-tagged hardware formats (`SRGB8_ALPHA8` — encode on write, decode on read, storage stays perceptual) or float intermediates. Our scene sits at mean luminance ~20–40/255 — the exact worst case — which is why the buffer type and dithering must be decided together (§7).

## 5. Corpus review — pmndrs `postprocessing@6.39.4` (installed; `web/node_modules/postprocessing/build/index.js`)

### 5.1 Composer buffers

- `EffectComposer` option `frameBufferType`; docs: "It's recommended to use HalfFloatType if possible" (line 918). **Default is undefined → `UnsignedByteType`** (three's `WebGLRenderTarget` default).
- With 8-bit buffers and `renderer.outputColorSpace === SRGBColorSpace`, the composer tags both ping-pong buffers `texture.colorSpace = SRGBColorSpace` (`setRenderer`, lines 995–1001; `createBuffer`, lines 1146–1149). three then allocates `SRGB8_ALPHA8`: **storage is sRGB-encoded (banding-resistant per §4.7), but the hardware decodes on sample and encodes on write — effect shaders still compute on LINEAR values.** This is the README's "sRGB frame buffers" and it does *not* reproduce r104's gamma-space working values; it is a storage-precision device only. The working-space topology question (#97/#99) is orthogonal and stays open in 6.x and 7.x alike.
- README "Output Color Space": linear workflow is automatic from `renderer.outputColorSpace = SRGBColorSpace`; 8-bit sRGB buffers trade quality for compatibility — "information loss will shift to the darker spectrum which leads to noticable banding in dark scenes"; `frameBufferType: HalfFloatType` is "the preferred option for HDR-like workflows on desktop devices" (README lines 50–62). Recommended renderer flags: `antialias: false, stencil: false, depth: false, powerPreference: "high-performance"` (README Usage).

### 5.2 Output encoding mechanics (the #99 hook)

- `EffectMaterial` defines `ENCODE_OUTPUT: "1"` by default (line ~14679); the merged fragment shader ends with `#ifdef ENCODE_OUTPUT / #include <colorspace_fragment> / #endif` then `#include <dithering_fragment>` (lines ~14653–14656).
- `colorspace_fragment` compiles to three's `linearToOutputTexel()`, chosen per render target: a no-op into linear-tagged targets, the sRGB OETF (i.e. **our patched `pow(1/2.2)`**) when rendering to screen. So intermediate EffectPasses don't double-encode, and the final on-screen pass applies the patched curve — confirming the routing assumed in World.vue's comment.
- The encode is switchable: `EffectMaterial.encodeOutput` get/set adds/removes the define (lines 14830–14841); `EffectPass.encodeOutput` is a deprecated alias (lines 15517–15524). **Yes — 6.39.4 offers a clean way to skip the final encode: `beautyPass.fullscreenMaterial.encodeOutput = false`.**

### 5.3 Per-effect color-space plumbing

- `Effect` base: `_inputColorSpace = LinearSRGBColorSpace`, `_outputColorSpace = NoColorSpace`, both with (experimental) setters that trigger a shader rebuild (lines 2604–2646).
- `integrateEffect()` inserts, per effect whose `inputColorSpace` differs from the running space: `color0 = sRGBTransferOETF(color0)` (to sRGB) or `color0 = sRGBToLinear(color0)` (to linear), and carries the space forward (lines 15444–15451). After all effects, `updateMaterial()` appends `color0 = sRGBToLinear(color0)` if the chain ended in sRGB (line 15586), so `ENCODE_OUTPUT` always receives linear.
- **`BrightnessContrastEffect` already declares `this.inputColorSpace = SRGBColorSpace`** (line 4423) — pmndrs itself treats brightness/contrast as a gamma-space operation. `HueSaturationEffect`, `BloomEffect`, `GodRaysEffect`, `SMAAEffect` leave the linear default.
- Caveat for our OETF patch: the *inline* `sRGBTransferOETF()` conversions above call the same patched chunk function, but the inverse direction uses postprocessing's own true-sRGB `sRGBToLinear()` helper baked into the effect shader header (line 14635). Patched-OETF → true-EOTF round trips are identical at high luminance but slightly off in deep shadows (the r104 pow curve vs the sRGB linear toe) — a small, quantifiable asymmetry to keep in mind wherever both appear in one shader.

### 5.4 Our five effects in 6.39.4 (vs vendored 6.3.2)

- **BloomEffect** — options `luminanceThreshold=1, luminanceSmoothing=0.03, mipmapBlur=true, intensity=1, radius=0.85, levels=8`; `kernelSize`, `resolutionScale`, `width/height` are all "**Deprecated. Use mipmapBlur instead.**" (lines 4074–4131). The Kawase path (`KawaseBlurPass`, not itself deprecated, line 3175) still exists and is selected by `mipmapBlur: false`. 6.3.2's luminance mask was `l = pow(abs(l), distinction)` with `distinction = 1.0` (`src/libs/postprocessing_6.3.2/src/materials/glsl/luminance/shader.frag`; uniform default in `src/materials/LuminanceMaterial.js:46`); 6.39.4's is a smooth-thresholded high-pass, so `luminanceThreshold: 0 + luminanceSmoothing: 1.0` is the closest analogue, as already implemented.
  **Bug found in the current replica** (`web/src/components/world/World.vue:530-540`): the constructor gets `kernelSize: KernelSize.LARGE, resolutionScale: 0.7` but **not `mipmapBlur: false`** — and `mipmapBlur` defaults to `true` in 6.39.4 (`this.mipmapBlurPass.enabled = mipmapBlur`, map uniform bound to the mipmap texture, lines 4118–4124). The chain is therefore running **mipmap bloom**, and both `kernelSize` and `resolutionScale` are silently ignored. Add `mipmapBlur: false` for the 6.3.2-replica look (or embrace the mipmap look deliberately under the parity-or-better rule — but then drop the dead kernelSize/resolutionScale options and retune `radius`/`levels`).
- **GodRaysEffect** — same Sousa-style parameters as 6.3.2 (`density, decay, weight, exposure, clampMax, samples, kernelSize, resolutionScale, blur`), constructor lines 6907–6990. `dithering` is supported (get/set at 7078–7089, forwards to the god-rays material) — our anti-banding requirement for 8-bit buffers. `getResolutionScale()/setResolutionScale()` (used by the debug panel) are deprecated-but-present.
- **BrightnessContrastEffect / HueSaturationEffect** — constructor-compatible with our usage (`brightness/contrast`, `hue/saturation` uniforms; World.vue drives uniforms directly). Behavior difference vs 6.3.2: B/C now runs on sRGB input (§5.3) while in the original *everything* ran on gamma — for B/C the modern library accidentally matches the original better than the rest of the chain does.
- **SMAAEffect** — preset/edge-detection API (`preset: SMAAPreset.MEDIUM`, `edgeDetectionMode: EdgeDetectionMode.COLOR`), `edgeDetectionMaterial.edgeDetectionThreshold` writable (World.vue:670-681 uses all of this; fine as-is). The 6.3.2-era `searchImage/areaImage` constructor arguments are handled via a legacy `arguments` shim (lines 10974–10986) — no longer needed.
- **EffectPass ordering caveat**: `setEffects()` sorts merged effects by `attributes` descending (line ~15546), so `GodRaysEffect` (DEPTH attribute) executes *before* the plain color-grading effects inside `beautyPass` regardless of constructor order. The listed order `hueSat, brightnessContrast, godRays, bloom` actually runs `godRays → hueSat → brightnessContrast → bloom`. (6.3.2 sorted the same way, so this is parity-neutral — just don't fight it.)

## 6. Corpus review — pmndrs v7 (branch `v7` @ 2026-08-24, = unreleased post-beta.16)

### 6.1 Architecture

`EffectComposer` → **`FrameGraph`** (`add()` not `addPass()`, `render(timestamp)`); `RenderPass` → **`GeometryPass`** (auto-clears; most composer options moved here); `EffectPass` no longer takes a camera; **`renderToScreen` removed** — "Passes whose output is not consumed by another pass render to the screen automatically"; passes wire explicitly (`effectPass.input.connect(geoPass.output)`); pass/effect instances can't be shared across graphs (v7 migration guide, `apps/manual/content/migration-guide.en.md`). Recommended renderer flags unchanged. `frameGraph.compile()` supports precompilation.

### 6.2 Buffers and color

Default G-buffer type is **`HalfFloatType`** (`src/core/io/GBufferResource.ts:69,123`), with compact `R11F_G11F_B10F` when alpha is off; `UnsignedByteType` sRGB buffers are the opt-in fallback via `new GeometryPass({ type: UnsignedByteType })` (v7 getting-started, "Color Space Considerations" — which repeats the dark-scene banding warning and the demofox citation). Encoding still rides three's chunk: `effect.frag` ends with `#ifdef COLOR_SPACE_CONVERSION / #include <colorspace_fragment>` (`src/materials/shaders/effect.frag:40-46`), per-effect conversion still emits `sRGBTransferOETF(color0)` / `sRGBTransferEOTF(color0)` (`src/utils/EffectShaderData.ts:274-276`), and `Effect.inputColorSpace` still exists (default now `NoColorSpace` = "don't care", `src/effects/Effect.ts:81`). **Our `sRGBTransferOETF` chunk patch therefore keeps working on v7** — same hook, same routing (the chunk still exists under that name in three r185, where our patch verifies its expected body before replacing it, World.vue:177-189). v7 also adds a real `OutputPass` (a terminal `CopyMaterial` blit with `COLOR_SPACE_CONVERSION` on by default, `src/passes/OutputPass.ts`, `src/materials/CopyMaterial.ts:26`).

### 6.3 Our five effects in v7 — the blocker in detail

Present: **BloomEffect** (`src/effects/BloomEffect.ts`) — mipmap-only (`luminanceThreshold, luminanceSmoothing, intensity, radius, levels, fullResolutionUpsampling, clampToBorder`); **no Kawase/kernelSize path at all**; default blend changed from SCREEN to **Add** (`AddBlendFunction`), and `BlendFunction` enums are replaced by blend-function *classes* with `blendMode.opacityUniform`. **SMAAEffect** — same preset/edge-detection design; enums renamed `SMAAEdgeDetectionMode`, `SMAAPredicationMode`; `edgeDetectionMaterial` still exposed. Its manual page adds: "**Anti-aliasing works best when applied after tone-mapping because it requires SDR input colors.**"

Absent: **GodRaysEffect, HueSaturationEffect, BrightnessContrastEffect** (full listing of `src/effects/` confirms; the manual's hue-saturation demo constructs only a `GeometryPass` with the `HueSaturationEffect` usage commented out — `apps/manual/assets/js/src/demos/hue-saturation.ts`; the VLS/god-rays demo page is an empty stub). Porting our three missing effects to v7's custom-effect API is possible (the 6.x shaders are small) but is real work with its own parity risk.

## 7. Buffer type + dithering: a coupled decision (all stacks)

Grounding (§4.7): 8-bit *linear* storage destroys shadows; 8-bit *sRGB* storage or ≥half-float linear storage are both fine; our scene (mean luminance ~20–40/255) is the worst case, which #81/#97 already demonstrated empirically — god-rays `dithering=true` on HalfFloat buffers produced the green/magenta speckle (dither noise designed to break up 8-bit quantization, injected into a float pipeline and then encoded). The pairs must not be mixed:

| Stack | Buffer pair | Dithering |
|---|---|---|
| pmndrs 6.39.4, 6.3.2-replica (current) | default `UnsignedByteType` (auto-tagged sRGB) | god-rays `dithering = true` (World.vue:586) — keep |
| pmndrs 6.39.4, modern HDR | `new EffectComposer(renderer, { frameBufferType: HalfFloatType })` | all dithering OFF |
| pmndrs v7 | default HalfFloat G-buffer | dithering OFF (8-bit only via `GeometryPass({type: UnsignedByteType})`, then dither) |
| three addons | composer default HalfFloat (r154+), `OutputPass` last | dithering OFF; `UnrealBloomPass` expects HDR + tone mapping |

## 8. Implications for the #97/#99 gamma-space parity fix (pmndrs 6.39.4)

### 8.1 What the library gives us

r104 truth to reproduce: effects saw gamma-encoded values; final pass was passthrough. Modern 6.39.4 default: effects see linear; final EffectPass encodes (patched OETF). Two library-supported mechanisms exist, and one structural workaround:

- **(A) Per-effect `inputColorSpace = SRGBColorSpace`** (the mechanism `BrightnessContrastEffect` itself uses, §5.3). Setting it on HueSaturation (and leaving B/C, which already has it) makes the *merged shader* convert to sRGB once before those effects and back to linear after (float-precision, no u8 loss), then encode for screen — r104-like input for the color-grading math with zero structural change. **Limitation:** it only affects each effect's `mainImage()` inside the merged EffectPass. Bloom's luminance/blur sub-passes and GodRays' light-scene render sample the (linear) input buffer *outside* the merged shader, so their generation pipelines stay linear — i.e. (A) alone fixes the olive/desaturation wash of hue/sat but not the "weaker bloom/halo".
- **(B) Neutralize the final encode**: `beautyPass.fullscreenMaterial.encodeOutput = false` (§5.2) — needed by any "encode early" design so gamma values pass through to screen untouched.
- **(C) Encode before effects (full r104 topology)**: insert an encode step right after `RenderPass` (e.g. a minimal `Effect` whose `mainImage` applies the patched OETF, in its own `EffectPass` with `encodeOutput=false`, or a `ShaderPass`), run all effects on the resulting gamma values, and apply (B) on the last pass. **Trap:** with default 8-bit buffers the composer tags them `SRGBColorSpace` (§5.1), so the hardware would decode our hand-encoded values back to linear on every sample. The buffers must be *linear-tagged* 8-bit — after constructing the composer, set `inputBuffer.texture.colorSpace = NoColorSpace` (ditto `outputBuffer`) and dispose both once so they re-upload, or construct the composer before assigning `renderer.outputColorSpace` (the tagging predicate checks `type === UnsignedByteType && renderer.outputColorSpace === SRGBColorSpace`, lines 996/1146). Storing gamma values in plain RGBA8 is exactly what r104 did, and per §4.7 gamma-encoded u8 storage is the banding-safe kind — keep god-rays dithering on. Bloom's luminance weighting then operates on gamma values, reproducing 6.3.2's `pow(l, 1.0)` weighting on the same input it originally saw.
- Under the relaxed "parity or better" criterion, the alternative to (C) is: stay linear, adopt HalfFloat buffers, and *retune* (bloom threshold/smoothing/intensity, god-rays weight/exposure, saturation) to taste against the harness. (A)+(B-off, keep encode) + retune is the lowest-risk "modern look" path; (C) is the highest-fidelity "old look" path. They are mutually exclusive topologies — pick per effect-chain, not per effect.

### 8.2 SMAA and gamma space — verified

The reference implementation is explicit: "color/luma edge detection requires **gamma-corrected colors**, and thus 'colorTex' should be a non-sRGB texture" (iryoku/smaa `SMAA.hlsl`, lines 686–687 and 745–746; integration note 5, lines 127–134: all reads non-sRGB except the neighborhood-blending input/output). three's OutputPass docs (§4.3) and pmndrs v7's SMAA page (§6.3, "requires SDR input colors") say the same. In our current chain the (disabled-by-default) `aaPass` runs *before* the beauty pass on **linear** values — technically wrong per the paper both now and in #81. Under topology (C), SMAA would receive gamma-space input and become paper-correct for free. Under the modern linear topology, the correct placement is a separate `EffectPass` *after* the encoding pass (pmndrs wiki "Antialiasing" recommends `antialias:false` + SMAA as the default AA for pipelines; MSAA via `multisampling` is the alternative but conflicts with depth-based effects).

## 9. The v7 + latest-three migration (decided direction) — what it takes today

three side first: **there is no three upgrade to do** — `~0.185.0` is the latest (0.185.1). If the migration must use *published* packages, `postprocessing@7.0.0-beta.16` forces `three@0.183` — a downgrade re-opening r184/r185 fixes; the sane variants are (a) wait for `7.0.0-beta.17`+ (the version its own migration guide names) which per v7 HEAD will accept `< 0.186`, or (b) pin the v7 branch as a git dependency (unversioned churn risk). Given §6.3, either way three effects must be ported by hand. Concrete breakages in `web/src/components/world/World.vue` when the upgrade happens:

1. Imports (lines 82–92): `EffectComposer` → `FrameGraph`; `RenderPass` → `GeometryPass`; `BlendFunction` enum → blend-function classes; `EdgeDetectionMode` → `SMAAEdgeDetectionMode`; `KernelSize` no longer applies to bloom.
2. Composer wiring (3662, 689–711): `new FrameGraph({ renderer, scene, camera })`; `add()`; explicit `input.connect(...)` between passes; delete every `renderToScreen`/`renderPass.clear` line (690–691, 697, 708) — autoclear and to-screen are automatic; `composer.render()` → `frameGraph.render(timestamp)` in the render loop.
3. `createBloomEffect` (528–544): `kernelSize`/`resolutionScale` options gone; `blendFunction: BlendFunction.SCREEN` → assign a `ScreenBlendFunction` instance if parity with SCREEN blending is wanted (v7 default is now Add); `blendMode.opacity.value` → `blendMode.opacityUniform.value` (verify exact member at port time).
4. `createGodRayEffect` (548–601), `createBrightnessContrastEffect` (604–633), `createHueSaturationEffect` (637–666): **no library class exists** — port the 6.x shaders as custom v7 `Effect`s (hue-saturation and brightness-contrast are ~10-line shaders; god-rays is the big one: light-scene render + radial blur material + blur pass), or hold the migration until upstream ships them.
5. `createSMAAEffect` (670–681): rename the enum; the rest carries over.
6. Buffer/dither pair (§7): v7 default HalfFloat → remove `godRaysEffect.dithering = true` (586), or opt into `GeometryPass({ type: UnsignedByteType })` and keep it. The OETF patch (164–189) keeps working (§6.2); re-verify the chunk body against whatever three version ships then.

Ordered checklist: (1) upgrade `postprocessing` (and adjust three only if the published peer range demands it) → (2) mechanical build fixes (items 1–2, 5) → (3) **verify base no-effects parity unchanged with the tools/parity-harness gates before wiring any effect** → (4) wire effects one at a time (bloom → SMAA → ported hue-sat → ported brightness-contrast → ported god-rays), gating each against the harness.

## 10. Per-effect recommendation table (parity-or-better weighted)

| Effect | Recommendation | Rationale |
|---|---|---|
| BloomEffect | **Keep pmndrs 6.39.4**; fix `mipmapBlur: false` for replica, or deliberately adopt mipmap bloom (retune radius/levels) for "better" | Kawase path intact in 6.x only; v7 dropped it entirely; UnrealBloomPass = additive HDR mip bloom, biggest retune of all options |
| GodRaysEffect | **Keep pmndrs 6.39.4** | Only drop-in radial sun-glow. three has no native pass (its example uses pmndrs + three-good-godrays, a different raymarched technique); v7 hasn't ported it |
| BrightnessContrastEffect | **Keep pmndrs 6.39.4** | Already gamma-space-correct via `inputColorSpace` (§5.3); three-addons shader is the same math minus the color-space handling; missing in v7 |
| HueSaturationEffect | **Keep pmndrs 6.39.4** (+ optional `inputColorSpace = SRGBColorSpace` for r104-like saturation, §8.1-A) | Missing in v7; three-addons version has no advantage |
| SMAAEffect | **Keep pmndrs 6.39.4**; move/keep it where it sees gamma-space input (§8.2) | Present and current in 6.x and v7 alike; enum rename is the only v7 delta |
| Final output | pmndrs `EffectPass` encode (no `OutputPass` needed) | The `colorspace_fragment` encode is where the legacy-gamma patch lands; three-addons `OutputPass` is only for the addons composer |

## 11. Composer best-practice checklist — three r185 + pmndrs 6.39.4

- Renderer: `antialias: false, stencil: false, depth: false, powerPreference: "high-performance"`; `outputColorSpace = SRGBColorSpace`; `toneMapping = NoToneMapping` (README; tone mapping, if ever wanted, as an effect at the end).
- Buffers + dithering as a pair (§7): replica = default 8-bit + god-rays dither ON; modern = `frameBufferType: HalfFloatType` + dither OFF. Never dither float buffers.
- Pass order: `RenderPass` first; convolution effects (bloom, SMAA) cannot share an `EffectPass`; within an `EffectPass`, execution order is attribute-sorted, not argument order (§5.4); AA belongs on perceptual input (§8.2); last pass `renderToScreen = true`; no `OutputPass` — `EffectPass` encodes via `ENCODE_OUTPUT`.
- The gamma-parity topology (#99) picks exactly one of §8.1 (A+retune) or (C): encode-early requires linear-tagged buffers + `encodeOutput=false` on the final pass.
- Keep the `sRGBTransferOETF` patch applied before any material compiles; it must keep verifying the shipped chunk body (World.vue:177-189) so a future three upgrade fails loudly instead of silently double-encoding.

## 12. Sources

Local:
- `web/package.json`; `web/src/components/world/World.vue` (chain: 528–711; renderer/composer: 3650–3662; OETF patch: 156–189)
- `web/node_modules/postprocessing/` — `package.json` (6.39.4, peers), `README.md` (Usage; Output Color Space, lines 50–68), `build/index.js` (buffer tagging 995–1001/1146–1149; Effect color spaces 2604–2646; KawaseBlurPass 3175; BloomEffect 4074–4131; BrightnessContrast `inputColorSpace` 4423; GodRaysEffect 6907–6990, dithering 7078; HueSaturation 7358; SMAA 10949; EffectMaterial `ENCODE_OUTPUT` ~14653/14679/14830; sRGBToLinear helper 14635; integrateEffect 15444–15451; final decode 15586; EffectPass encodeOutput 15517–15524)
- `src/libs/postprocessing_6.3.2/` — `src/materials/LuminanceMaterial.js:46` (`distinction`), `src/materials/glsl/luminance/shader.frag`, `src/effects/GammaCorrectionEffect.js`
- `src/libs/three_0.104.0/src/renderers/webgl/WebGLPrograms.js:80-140` (gammaOutput → GammaEncoding into render targets); original `src/components/world/World.vue:3568-3569`

Web (all fetched 2026-08-25):
- npm registry: `https://registry.npmjs.org/postprocessing` (dist-tags latest=6.39.4, beta=7.0.0-beta.16 w/ peers `>=0.179 <0.184`), `https://registry.npmjs.org/three` (latest=0.185.1)
- pmndrs repo: branches `main` (v6, package.json peers `<0.186`) and `v7` (package.json 7.0.0-beta.16 w/ peers `<0.186` at HEAD); v7 files: `apps/manual/content/getting-started.en.md`, `apps/manual/content/migration-guide.en.md`, `apps/manual/content/demos/{light-shadow/bloom,light-shadow/vls,color-grading/hue-saturation,color-grading/brightness-contrast,anti-aliasing/smaa}.en.md`, `apps/manual/assets/js/src/demos/hue-saturation.ts`, `src/effects/{BloomEffect,SMAAEffect,Effect}.ts`, `src/passes/{OutputPass,EffectPass,GeometryPass}.ts`, `src/materials/shaders/effect.frag`, `src/utils/EffectShaderData.ts`, `src/core/io/GBufferResource.ts`, `src/core/Pass.ts`
- pmndrs wiki: `https://github.com/pmndrs/postprocessing/wiki/Antialiasing`
- three.js r185: `manual/en/color-management.html`, `manual/en/post-processing.html`, `examples/jsm/postprocessing/OutputPass.js`, `examples/jsm/postprocessing/UnrealBloomPass.js`, `examples/webgl_postprocessing_godrays.html` (imports `postprocessing@6.39.1` + `three-good-godrays@0.12.0`), `examples/jsm/shaders/{HueSaturationShader,BrightnessContrastShader}.js`, `examples/jsm/postprocessing/{SMAAPass,FXAAPass}.js` (existence)
- `https://github.com/mrdoob/three.js/wiki/Migration-Guide` (r150–r156 color-management entries)
- SMAA reference: `https://raw.githubusercontent.com/iryoku/smaa/master/SMAA.hlsl` (lines 125–134, 684–688, 743–747)
- `https://blog.demofox.org/2018/03/10/dont-convert-srgb-u8-to-linear-u8/`
