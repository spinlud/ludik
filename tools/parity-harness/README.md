# Parity harness

A/B screenshot + browser-console capture of the Ludik World scene. Point it at two
running instances (for example the original app vs. a migrated build) and compare
the captured images and console logs to check for visual parity.

## What it captures

For a given base URL and output directory it produces:

- `world.png` — the spaceship-corridor landing view after the click-to-start gate.
- `home.png` — best-effort capture of the HomeHeader hero/menu page (via the hamburger).
- `console.txt` — every browser console message and page error seen during the run.

## Usage

```sh
npm install
npx playwright install chromium   # one-time: download the Chromium browser
node capture.js <baseUrl> <outDir>
```

- `<baseUrl>` — URL of a running instance, e.g. `http://localhost:5173`.
- `<outDir>` — where to write the capture. Absolute paths are used as-is; a
  relative path is resolved under this tool's `captures/` directory, which is
  gitignored so captures never enter the working tree.

`node capture.js --help` prints usage. Running with missing args also prints usage.

A typical A/B run:

```sh
node capture.js http://localhost:5173 original
node capture.js http://localhost:4173 migrated
# then diff captures/original/*.png against captures/migrated/*.png
```

## Capture-flow facts (hard-won — do not "simplify" these away)

- **Must run headed Chromium with the window focused.** The app requires the
  Pointer Lock API, which Chromium denies to unfocused or headless windows. Without
  pointer lock the 3D scene renders black, even against a production instance. The
  script launches `headless: false` and calls `page.bringToFront()` before every
  interaction and screenshot to keep the window focused.
- **The click-to-start gate needs real clicks, correctly timed.** Wait ~9s for the
  loading screen to finish, then issue real mouse clicks at screen center spaced
  ~2.5s apart. The first click is consumed by `AudioContext.resume()` (and the
  pointer-lock request), so a single click is not enough — several spaced clicks make
  it robust to loading-screen timing.
- **Wait ~10s+ after the gate before screenshotting** so streamed assets finish
  loading; otherwise the scene is incomplete.
- **`#pointerLockOverlay` is a 0x0 element**, so Playwright visibility checks on it
  are useless as a readiness signal — rely on the fixed waits above instead.

## Poses (`poses.json`)

Named camera poses for A/B parity captures, applied via the in-app
`window.__ludikParity` debug hook (`setPose(x, y, z, pitch, yaw)`). `pitch` is
`pitchObject.rotation.x` (positive = look up), `yaw` is `yawObject.rotation.y`.

The six poses were derived from the World scene's runtime state (read with
`node capture.js <url> --probe`, which prints `getPose()` and `getSun()`):

- **spawn** — the initial player pose. `getPose()` at world entry:
  position `(-25.38, 2.6, 11.83)`, yaw `-1.1345`, pitch `0`. The yaw is
  `-level.rotation.y`; eye height is `cameraOffsetY = 2.6`.
- **sun** — looks at the sun. The sun sits at
  `Vector3(0,0,1000).applyQuaternion(level.quaternion)` = `(906.3, 0, -422.6)`.
  From spawn the bearing to the sun is `atan2(-(sx-px), -(sz-pz)) ≈ -1.1345` —
  i.e. the player already faces the sun at spawn — so this pose reuses the spawn
  position/yaw and pitches up `0.15` rad to frame the sun disc / god-rays.
- **sky** — spawn position, pitch up `1.047` rad (~60°) so the frame is mostly
  skybox (good for comparing skybox brightness/tint).
- **interior** — the command-console rectangle. `COMMAND_CONSOLE_POLY` spans
  local x `[-1.75, 2.26]`, z `[32, 34]` (centre local `(0.25, 0, 33)`);
  transformed by the level's Y-rotation (θ=2.0 rad, the same rotation the sun
  vector reveals) the centre is world `(29.8, ·, -14.2)`. Placed at eye height
  `2.6`, pitch `0`, yaw turned into the interior (`spawn yaw + π ≈ 2.007`).
- **exterior** — outside the ship looking back at it. Camera lifted above and
  behind the hull (`(70, 25, -33)`), pitched down `-0.289` rad and yawed `2.011`
  toward the ship, so the frame shows the ship silhouette against the skybox
  (good for comparing hull shading and skybox tone together).
- **sun-clear** — an unobstructed view of the sun disc, clear of corridor
  geometry (`(60, 10, -28)`, pitch `-0.011`, yaw `-1.1345`, the spawn bearing to
  the sun). Isolates the sun disc size/brightness and god-rays without walls in
  the frame.

Because both apps are near-identical ports of the same level, the same
`poses.json` (world coordinates) applies to both.

## Comparing captures

`node compare.js <dirA> <dirB>` prints, per matching PNG pair: mean absolute
per-channel diff, RMSE, and per-quadrant mean luminance for each image so a
"darker by X%" gap is quantifiable.



Comparing dark-region crops numerically has been effective for spotting chroma-noise
artifacts — e.g. take the std-dev of the red-minus-green channel difference over a
dark crop of each image and compare the two runs. A clean scene shows near-zero
chroma variance in dark regions; noise artifacts raise it.
