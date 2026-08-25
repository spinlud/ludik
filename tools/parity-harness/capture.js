// Parity screenshot harness.
// Usage: node capture.js <baseUrl> <outDir> [--poses <file>] [--no-effects] [--probe]
// Runs HEADED chromium (pointer lock is denied to unfocused/headless windows,
// and the 3D scenes render black without it).
//
// Without flags it captures world.png, home.png, console.txt (original behavior).
//
// --poses <file>  after world entry, teleport the camera to each named pose in the
//                 JSON file (via window.__ludikParity.setPose) and screenshot each to
//                 <outDir>/<pose>.png.
// --no-effects    bypass the postprocessing composer (window.__ludikParity.setEffects(false))
//                 so the base pipeline (skybox, lights, materials) is captured with
//                 effects off.
// --probe         after world entry, print window.__ludikParity.getPose() and getSun()
//                 and exit. Used to derive pose coordinates empirically.
//
// Viewport is fixed at 1280x800 with deviceScaleFactor 1 so screenshots from two
// runs are pixel-comparable.
//
// <outDir> may be absolute or relative. A relative path is resolved under the
// tool's own "captures/" directory (which is gitignored), so captures never
// leak into the working tree.

const { chromium } = require("playwright")
const fs = require("fs")
const path = require("path")

const USAGE = "Usage: node capture.js <baseUrl> <outDir> [--poses <file>] [--no-effects] [--probe]"

const args = process.argv.slice(2)

if (args[0] === "--help" || args[0] === "-h") {
    console.log(USAGE)
    process.exit(0)
}

const positional = []
let posesFile = null
let noEffects = false
let probe = false

for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === "--poses") {
        posesFile = args[++i]
    } else if (a === "--no-effects") {
        noEffects = true
    } else if (a === "--probe") {
        probe = true
    } else {
        positional.push(a)
    }
}

const baseUrl = positional[0]
const outDirArg = positional[1]

if (!baseUrl || (!outDirArg && !probe)) {
    console.error(USAGE)
    process.exit(1)
}

// Absolute paths are used as-is; relative paths land in the ignored captures/ dir.
const outDir = outDirArg
    ? (path.isAbsolute(outDirArg) ? outDirArg : path.join(__dirname, "captures", outDirArg))
    : null

if (outDir) fs.mkdirSync(outDir, { recursive: true })

// Fixed viewport + deviceScaleFactor 1 keeps A/B screenshots pixel-comparable.
const VIEWPORT = { width: 1280, height: 800 }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {

    const consoleLines = []

    const browser = await chromium.launch({ headless: false })
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 })
    const page = await context.newPage()

    page.on("console", (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`))
    page.on("pageerror", (err) => consoleLines.push(`[pageerror] ${err.message}`))

    try {

        await page.goto(baseUrl, { waitUntil: "domcontentloaded" })
        await page.bringToFront()

        // Loading screen -> "CLICK TO START" gate.
        // Wait for the loading screen to finish and the gate to appear.
        await wait(9000)

        const center = { x: VIEWPORT.width / 2, y: VIEWPORT.height / 2 }

        // The gate needs real mouse gestures: the first click resumes the
        // AudioContext and requests pointer lock (#pointerLockOverlay). Pointer
        // lock is denied to unfocused windows, so bringToFront before each click.
        // Click a few times, spaced out, to be robust to loading-screen timing.
        for (let i = 0; i < 3; i++) {
            await page.bringToFront()
            await page.mouse.click(center.x, center.y)
            await wait(2500)
        }

        // Wait for streamed assets to finish loading; otherwise the scene is incomplete.
        await wait(11000)
        await page.bringToFront()

        // Probe mode: report the live pose + sun position and exit.
        if (probe) {
            const info = await page.evaluate(() => {
                const p = window.__ludikParity
                if (!p) return { error: "window.__ludikParity not found" }
                return { pose: p.getPose(), sun: p.getSun() }
            })
            console.log("PROBE " + JSON.stringify(info, null, 2))
            return
        }

        // Pose mode: teleport to each named pose and screenshot it.
        if (posesFile) {
            const poses = JSON.parse(fs.readFileSync(posesFile, "utf8"))

            // The app boots with effects off by default, so enable the composer explicitly
            // for fx captures.
            if (noEffects) {
                await page.evaluate(() => window.__ludikParity && window.__ludikParity.setEffects(false))
            } else {
                await page.evaluate(() => window.__ludikParity && window.__ludikParity.setEffects(true))
            }

            const hookOk = await page.evaluate(() => !!window.__ludikParity)
            if (!hookOk) consoleLines.push("[harness] window.__ludikParity not found; poses skipped")

            // Hide the dev-only axes helper so its red/green/blue rays don't pollute metrics.
            await page.evaluate(() => window.__ludikParity && window.__ludikParity.setAxes && window.__ludikParity.setAxes(false))

            for (const [name, pose] of Object.entries(poses)) {
                await page.bringToFront()
                await page.evaluate((p) => {
                    window.__ludikParity.setPose(p.x, p.y, p.z, p.pitch, p.yaw)
                }, pose)
                await wait(1500)
                await page.bringToFront()
                await page.screenshot({ path: path.join(outDir, `${name}.png`) })
                consoleLines.push(`[harness] captured pose ${name}`)
            }
            return
        }

        // Default behavior: world.png + home.png.
        await page.screenshot({ path: path.join(outDir, "world.png") })

        // home.png: HomeHeader hero is a separate menu page. Best effort via hamburger.
        try {
            await page.bringToFront()
            const hamburger = await page.$("#hamburger")
            if (hamburger) {
                await hamburger.click()
                await wait(1500)
                // Try a menu link that leads to the hero/home view.
                const link = await page.$("text=/spaceship|home|menu/i")
                if (link) {
                    await link.click()
                    await wait(4000)
                }
            }
            await page.bringToFront()
            await page.screenshot({ path: path.join(outDir, "home.png") })
        } catch (e) {
            consoleLines.push(`[harness] home.png capture failed: ${e.message}`)
        }

    } catch (e) {
        consoleLines.push(`[harness] fatal: ${e.message}`)
        console.error(e)
    } finally {
        if (outDir) fs.writeFileSync(path.join(outDir, "console.txt"), consoleLines.join("\n"))
        await browser.close()
    }

})()
