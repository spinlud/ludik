// One-off smoke check for the ?nofx boot switch (issue #97 manual round).
// Loads a ?nofx URL, enters the world via the 3-click gate, then confirms the
// parity hook is present and a canvas renders, and takes one screenshot.
// Usage: node smoke-nofx.js <baseUrl> <outDir>

const { chromium } = require("playwright")
const fs = require("fs")
const path = require("path")

const baseUrl = process.argv[2]
const outDirArg = process.argv[3]

if (!baseUrl || !outDirArg) {
    console.error("Usage: node smoke-nofx.js <baseUrl> <outDir>")
    process.exit(1)
}

const outDir = path.isAbsolute(outDirArg) ? outDirArg : path.join(__dirname, "captures", outDirArg)
fs.mkdirSync(outDir, { recursive: true })

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
        await wait(9000)

        const center = { x: VIEWPORT.width / 2, y: VIEWPORT.height / 2 }
        for (let i = 0; i < 3; i++) {
            await page.bringToFront()
            await page.mouse.click(center.x, center.y)
            await wait(2500)
        }

        await wait(11000)
        await page.bringToFront()

        const ok = await page.evaluate(() => ({
            hook: !!window.__ludikParity,
            canvas: document.querySelector("canvas") !== null,
        }))
        console.log("SMOKE " + baseUrl + " -> " + JSON.stringify(ok))
        consoleLines.push("SMOKE " + JSON.stringify(ok))

        await page.screenshot({ path: path.join(outDir, "smoke.png") })
    } catch (e) {
        consoleLines.push(`[smoke] fatal: ${e.message}`)
        console.error(e)
    } finally {
        fs.writeFileSync(path.join(outDir, "console.txt"), consoleLines.join("\n"))
        await browser.close()
    }
})()
