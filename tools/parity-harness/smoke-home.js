// Smoke checks for the Home view (albums, singles, DJ sets, intro console).
// Boots the app, passes the click-to-start gate, walks the player into the
// stargate so the World stops and Home is revealed, then runs named checks.
// Prints PASS/FAIL per check and exits non-zero on any failure.
// Usage: node smoke-home.js <baseUrl> [outDir]

const { chromium } = require("playwright")
const fs = require("fs")
const path = require("path")

const baseUrl = process.argv[2]
const outDirArg = process.argv[3] || "smoke-home"

if (!baseUrl) {
    console.error("Usage: node smoke-home.js <baseUrl> [outDir]")
    process.exit(1)
}

const outDir = path.isAbsolute(outDirArg) ? outDirArg : path.join(__dirname, "captures", outDirArg)
fs.mkdirSync(outDir, { recursive: true })

const VIEWPORT = { width: 1280, height: 800 }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------------------
// Boot: loading screen -> click-to-start gate -> World -> stargate -> Home
// ---------------------------------------------------------------------------

async function passGate (page) {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" })
    await page.bringToFront()
    await wait(9000)
    const center = { x: VIEWPORT.width / 2, y: VIEWPORT.height / 2 }
    for (let i = 0; i < 3; i++) {
        await page.bringToFront()
        await page.mouse.click(center.x, center.y)
        await wait(2500)
    }
    await page.waitForFunction(() => !!window.__ludikParity, null, { timeout: 30000 })
}

// World-space centre of a named scene object, read through the parity hook.
async function objectCentre (page, name) {
    return page.evaluate((objName) => {
        const { composer } = window.__ludikParity.getPostProcessing()
        const scene = composer.passes.map((p) => p.scene).find(Boolean)
        const obj = scene && scene.getObjectByName(objName)
        if (!obj) return null
        const v = obj.position.clone()
        obj.getWorldPosition(v)
        return { x: v.x, z: v.z }
    }, name)
}

// Zone detection only moves bridge -> stargate, so step onto the bridge first.
async function enterHomeViaStargate (page) {
    const bridge = await objectCentre(page, "PolyArea_Bridge")
    const stargate = await objectCentre(page, "PolyArea_Stargate")
    if (!bridge || !stargate) throw new Error("stargate/bridge areas not found in scene")
    const setXZ = (p) => page.evaluate(({ x, z }) => {
        const pose = window.__ludikParity.getPose()
        window.__ludikParity.setPose(x, pose.y, z, pose.pitch, pose.yaw)
    }, p)
    await page.bringToFront()
    await setXZ(bridge)
    await wait(1000)
    await setXZ(stargate)
    // Stargate load time is ~8s before the World stops.
    await page.waitForSelector("#homeContent", { state: "visible", timeout: 30000 })
    await wait(1500)
}

// ---------------------------------------------------------------------------
// Helpers for checks
// ---------------------------------------------------------------------------

const helpers = (page) => ({
    page,
    wait,
    // Navigate by clicking a menu ring (ScifiMenu) by its display name.
    async viaRing (displayName) {
        await page.locator("#scifiMenu li", { hasText: displayName }).first().click()
        await wait(2000)
    },
    // Navigate via the hamburger menu entry with the given label.
    async viaHamburger (label) {
        await page.click("#hamburger")
        await wait(1200)
        await page.locator("#menu-list li", { hasText: label }).first().click()
        await wait(2000)
    },
    // Client-side route change with ?scroll=true, keeping the app state.
    async gotoRoute (routePath) {
        await page.evaluate((p) => {
            const router = document.querySelector("#app").__vue_app__.config.globalProperties.$router
            return router.push({ path: p, query: { scroll: "true" } })
        }, routePath)
        await wait(2000)
    },
    // src attributes of iframes inside a container selector.
    async iframes (selector = "body") {
        return page.$$eval(`${selector} iframe`, (els) => els.map((e) => e.getAttribute("src") || ""))
    },
    async screenshot (name) {
        await page.screenshot({ path: path.join(outDir, `${name}.png`) })
    },
})

// ---------------------------------------------------------------------------
// Checks: each returns nothing on success and throws on failure.
// ---------------------------------------------------------------------------

const checks = {}

// --- check: homeVisible ---
checks.homeVisible = async (h) => {
    const visible = await h.page.isVisible("#homeContent")
    if (!visible) throw new Error("#homeContent is not visible")
    await h.screenshot("home")
}

// ---------------------------------------------------------------------------

;(async () => {
    const consoleLines = []
    const results = []
    const browser = await chromium.launch({ headless: false })
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 })
    const page = await context.newPage()
    page.on("console", (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`))
    page.on("pageerror", (err) => consoleLines.push(`[pageerror] ${err.message}`))

    try {
        await passGate(page)
        await enterHomeViaStargate(page)
        const h = helpers(page)
        for (const [name, fn] of Object.entries(checks)) {
            try {
                await page.bringToFront()
                await fn(h)
                results.push({ name, ok: true })
                console.log(`PASS ${name}`)
            } catch (e) {
                results.push({ name, ok: false })
                console.log(`FAIL ${name}: ${e.message}`)
            }
        }
    } catch (e) {
        results.push({ name: "boot", ok: false })
        console.log(`FAIL boot: ${e.message}`)
        await page.screenshot({ path: path.join(outDir, "boot-fail.png") }).catch(() => {})
    } finally {
        fs.writeFileSync(path.join(outDir, "console.txt"), consoleLines.join("\n"))
        await browser.close()
    }

    const failed = results.filter((r) => !r.ok).length
    console.log(failed ? `${failed} check(s) failed` : "ALL PASS")
    process.exit(failed ? 1 : 0)
})()
