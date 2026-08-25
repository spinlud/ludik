// Parity screenshot harness.
// Usage: node capture.js <baseUrl> <outDir>
// Runs HEADED chromium (pointer lock is denied to unfocused/headless windows,
// and the 3D scenes render black without it). Captures world.png, home.png, console.txt.
//
// <outDir> may be absolute or relative. A relative path is resolved under the
// tool's own "captures/" directory (which is gitignored), so captures never
// leak into the working tree.

const { chromium } = require("playwright")
const fs = require("fs")
const path = require("path")

const USAGE = "Usage: node capture.js <baseUrl> <outDir>"

const baseUrl = process.argv[2]
const outDirArg = process.argv[3]

if (baseUrl === "--help" || baseUrl === "-h") {
    console.log(USAGE)
    process.exit(0)
}

if (!baseUrl || !outDirArg) {
    console.error(USAGE)
    process.exit(1)
}

// Absolute paths are used as-is; relative paths land in the ignored captures/ dir.
const outDir = path.isAbsolute(outDirArg)
    ? outDirArg
    : path.join(__dirname, "captures", outDirArg)

fs.mkdirSync(outDir, { recursive: true })

const VIEWPORT = { width: 1600, height: 1000 }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {

    const consoleLines = []

    const browser = await chromium.launch({ headless: false })
    const context = await browser.newContext({ viewport: VIEWPORT })
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

        // The landing view after the gate is the spaceship corridor (world.png).
        // Wait for assets to stream in.
        await wait(11000)
        await page.bringToFront()

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
        fs.writeFileSync(path.join(outDir, "console.txt"), consoleLines.join("\n"))
        await browser.close()
    }

})()
