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

## Comparing captures

Comparing dark-region crops numerically has been effective for spotting chroma-noise
artifacts — e.g. take the std-dev of the red-minus-green channel difference over a
dark crop of each image and compare the two runs. A clean scene shows near-zero
chroma variance in dark regions; noise artifacts raise it.
